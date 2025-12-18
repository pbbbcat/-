
import { GoogleGenAI } from "@google/genai";
import { Message, MessageRole, UserProfile, MatchResult, RecommendedJob, PublicServiceJobDB, ExamEvent, MockExamData, StudyPlanPhase } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";
import { supabase } from "./supabaseClient";

// Fix: Always use process.env.API_KEY directly for GoogleGenAI initialization as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to clean JSON output from LLM to prevent parsing errors
const cleanJsonOutput = (text: string): string => {
  if (!text) return "{}";
  let cleaned = text.trim();
  // Remove markdown code blocks if present
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  return cleaned;
};

// --- LOCAL HEURISTIC FALLBACK ENGINE ---
const localHeuristicAnalyze = (jobText: string, profile: UserProfile, dbCandidates: any[] = []): MatchResult => {
  console.log("Using Local Heuristic Analysis on " + dbCandidates.length + " real candidates");
  
  let score = 100;
  const hardConstraints = [];
  const softConstraints = [];
  let analysisText = `由于网络连接不稳定，系统无法调用云端 AI 模型进行深度分析。但系统已成功连接至 Supabase 数据库。`;
  let eligible = true;

  // Simple Logic check
  const isPartyMemberReq = jobText.includes('党员');
  const userIsPartyMember = profile.politicalStatus.includes('党员');
  
  if (isPartyMemberReq && !userIsPartyMember) {
      score -= 30; eligible = false;
      hardConstraints.push({ name: '政治面貌', passed: false, details: '岗位要求党员，您不符合。' });
  } else {
      hardConstraints.push({ name: '政治面貌', passed: true, details: '符合政治面貌要求（或岗位不限）。' });
  }

  // Use only real candidates
  const recommendations: RecommendedJob[] = dbCandidates.slice(0, 3).map(job => ({
      department: job.dept_name || '未知部门',
      position: job.job_name || '未知职位',
      matchScore: 80, 
      reason: `【离线匹配】根据您的专业【${profile.major}】与数据库真实岗位【${job.major_req}】进行的关键词匹配。`,
      originalData: job
  }));

  if (dbCandidates.length === 0) {
      analysisText += " 且未能从数据库检索到相似岗位，请检查网络连接。";
  } else {
      analysisText += ` 已为您从数据库结果中筛选出 ${recommendations.length} 个相关岗位。`;
  }

  return {
    score,
    eligible,
    hardConstraints,
    softConstraints,
    analysis: analysisText,
    otherRecommendedJobs: recommendations
  };
};

/**
 * Perform Vector Search (RAG) to find relevant jobs from Supabase
 * ROBUST VERSION: Gets IDs from RPC, then fetches FULL details from table.
 */
const performVectorSearch = async (queryText: string, limit: number = 10): Promise<PublicServiceJobDB[]> => {
    try {
        // 1. Generate Embedding
        const result = await ai.models.embedContent({
            model: "text-embedding-004", 
            contents: { parts: [{ text: queryText }] }
        });

        if (!result.embeddings || !result.embeddings[0] || !result.embeddings[0].values) {
            console.error("Embedding generation failed");
            return [];
        }
        
        const queryVector = result.embeddings[0].values;

        // 2. Call Supabase RPC 'match_jobs'
        // We use a moderate threshold (0.6) to allow semantic matches, but will filter strictly later
        const { data: rpcData, error } = await supabase.rpc('match_jobs', {
            query_embedding: queryVector,
            match_threshold: 0.6, 
            match_count: limit 
        });

        if (error) {
            console.error("Supabase RPC Error (Vector Search Failed):", JSON.stringify(error));
            console.warn("Falling back to text search due to RPC error...");
            const { data: fallbackData } = await supabase
                .from('public_service_jobs')
                .select('*')
                .or(`major_req.ilike.%${queryText.split(' ')[0]}%,job_name.ilike.%${queryText.split(' ')[0]}%`)
                .limit(limit);
            return fallbackData as PublicServiceJobDB[] || [];
        }

        if (!rpcData || rpcData.length === 0) {
            return [];
        }

        // 3. Hydrate with FULL Data
        const ids = rpcData.map((job: any) => job.id);
        const { data: fullData, error: fetchError } = await supabase
            .from('public_service_jobs')
            .select('*')
            .in('id', ids);

        if (fetchError || !fullData) {
            console.error("Failed to fetch full details:", fetchError);
            return rpcData as PublicServiceJobDB[]; 
        }

        const mergedData = fullData.map(job => {
            const rpcEntry = rpcData.find((r: any) => r.id === job.id);
            return {
                ...job,
                similarity: rpcEntry?.similarity || 0
            };
        });
        
        return mergedData.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));

    } catch (e) {
        console.error("Vector Search Exception:", e);
        return [];
    }
}

export const sendMessageToGemini = async (
  history: Message[],
  userMessage: string
): Promise<string> => {
  try {
    // --- RAG STEP: Retrieve Context from DB ---
    const retrievedJobs = await performVectorSearch(userMessage, 5);
    
    let contextString = "";
    if (retrievedJobs.length > 0) {
        contextString = "\n\n【知识库 - 真实招考岗位数据（仅供参考）】：\n" + 
        retrievedJobs.map(job => 
            `- 部门：${job.dept_name} | 职位：${job.job_name}\n  专业要求：${job.major_req}\n  备注：${job.remarks || '无'}\n  招考人数: ${job.recruit_count || '未说明'}`
        ).join("\n\n");
        contextString += "\n\n(指令：请根据以上数据库中的真实岗位信息回答用户。如果用户询问推荐，请优先推荐 these 岗位。)";
    } else {
        contextString = "\n\n(指令：知识库中暂无高度相关的特定岗位，请基于通用公考政策回答。)";
    }
    // -------------------------------------------

    // Fix: Using gemini-3-flash-preview for basic Q&A as per guidelines
    const modelId = 'gemini-3-flash-preview';
    const recentHistory = history.slice(-6).map(msg => ({
      role: msg.role === MessageRole.USER ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const chat = ai.chats.create({
      model: modelId,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION + contextString,
        temperature: 0.7,
      },
      history: recentHistory,
    });

    const result = await chat.sendMessage({
      message: userMessage
    });

    // Fix: Access .text property directly (do not call as function)
    return result.text || "抱歉，我暂时无法回答这个问题。";

  } catch (error) {
    console.error("Gemini API Error (Chat):", error);
    return "系统繁忙，请稍后再试。";
  }
};

/**
 * Enhanced Search: Hybrid Approach (Keyword Match + Vector Search)
 */
export const searchSimilarJobs = async (userProfile: UserProfile): Promise<PublicServiceJobDB[]> => {
  let keywordMatches: PublicServiceJobDB[] = [];
  
  const rawMajor = userProfile.major || '';
  const majorTerm = rawMajor
    .replace(/科学与技术|科学|技术|工程|专业|门类|类|大类|硕士|研究生|博士|学位|学术|型|全日制|学历|学位|文学/g, '')
    .replace(/学$/g, '')
    .trim();

  console.log(`Core Major Extraction: "${rawMajor}" -> "${majorTerm}"`);

  if (majorTerm.length >= 1) {
    const { data, error } = await supabase
        .from('public_service_jobs')
        .select('*')
        .ilike('major_req', `%${majorTerm}%`)
        .limit(20);
    
    if (!error && data) {
        keywordMatches = data as PublicServiceJobDB[];
    }
  }

  const queryText = `${userProfile.major} 专业 ${userProfile.degree} 学历 ${userProfile.politicalStatus} 公务员岗位`;
  const vectorMatches = await performVectorSearch(queryText, 50);

  let filteredVectorMatches: PublicServiceJobDB[] = [];

  if (majorTerm.length >= 1) {
      filteredVectorMatches = vectorMatches.filter(job => {
          if (!job.major_req) return false;
          return job.major_req.includes(majorTerm) || majorTerm.includes(job.major_req);
      });
  } else {
      filteredVectorMatches = vectorMatches;
  }

  const combined = [...keywordMatches, ...filteredVectorMatches];
  const uniqueMap = new Map();
  combined.forEach(job => {
      if (!uniqueMap.has(job.id)) {
          uniqueMap.set(job.id, job);
      }
  });

  return Array.from(uniqueMap.values()).slice(0, 20);
};

export const analyzeJobMatch = async (
  jobText: string,
  userProfile: UserProfile,
  dbCandidates: any[] = [] 
): Promise<MatchResult> => {
  if (!jobText || jobText.length < 5) {
      throw new Error("岗位文本内容过少，无法分析");
  }

  const candidateListStr = JSON.stringify(dbCandidates.slice(0, 10).map(j => ({
      id: j.id,
      dept: j.dept_name,
      pos: j.job_name,
      req_major: j.major_req, 
      req_degree: j.degree_req,
      remarks: j.remarks || '无',
      loc: j.work_loc,
      count: j.recruit_count
  })));

  const prompt = `
    Role: Senior Public Service Exam Auditor.
    Input Data: 1. User Profile: ${JSON.stringify(userProfile)}, 2. Job Text: """${jobText}""", 3. DB Candidates: ${candidateListStr}
    Task: Analyze match, compare major strictness, select 3 best alternatives.
    Output JSON: { "score": number, "eligible": boolean, "hardConstraints": [], "softConstraints": [], "analysis": "string", "otherRecommendedJobs": [] }
  `;

  try {
    // Fix: Using gemini-3-pro-preview for complex reasoning tasks as per guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    // Fix: Access .text property directly
    const text = cleanJsonOutput(response.text || "");
    if (!text) throw new Error("Empty response");
    const parsed = JSON.parse(text) as MatchResult;

    if (parsed.otherRecommendedJobs) {
        parsed.otherRecommendedJobs = parsed.otherRecommendedJobs.map(rec => {
            const original = dbCandidates.find(db => 
                (db.dept_name === rec.department && db.job_name === rec.position) ||
                (db.dept_name.includes(rec.department) && db.job_name.includes(rec.position))
            );
            return { ...rec, originalData: original };
        });
    }
    return parsed;
  } catch (error) {
    console.error("Match Analysis API Error:", error);
    return localHeuristicAnalyze(jobText, userProfile, dbCandidates);
  }
};

export const fetchAIExamCalendar = async (): Promise<ExamEvent[]> => {
    return [];
};

// --- Generate Study Plan ---
export const generateStudyPlan = async (
    examName: string,
    daysRemaining: number,
    dailyHours: number,
    weakness: string
): Promise<StudyPlanPhase[]> => {
    const prompt = `
    Role: Professional Civil Service Exam Coach.
    Task: Create a sprint study plan.
    Context:
    - Target Exam: ${examName}
    - Days Remaining: ${daysRemaining}
    - Daily Study Time: ${dailyHours} hours
    - Weakness Area: ${weakness}

    Output Requirement:
    Return a JSON array of 3-4 distinct phases (e.g., Foundation, Strengthening, Sprint).
    Format:
    [
        {
            "phaseName": "string",
            "duration": "string (e.g., 'Day 1-10')",
            "focus": "string (key focus area)",
            "tasks": ["string", "string", "string"] (3 specific daily tasks)
        }
    ]
    `;

    try {
        // Fix: Using gemini-3-pro-preview for complex planning tasks
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        const text = cleanJsonOutput(response.text || "");
        return JSON.parse(text) as StudyPlanPhase[];
    } catch (e) {
        console.error("Plan Generation Error:", e);
        // Fallback plan
        return [
            {
                phaseName: "基础夯实阶段",
                duration: "第1-10天",
                focus: `全面复习，重点突破${weakness}`,
                tasks: ["每天一套行测模块刷题", "申论规范词积累", `针对${weakness}观看专项视频`]
            },
            {
                phaseName: "冲刺提升阶段",
                duration: "第11-20天",
                focus: "全真模拟，控制做题节奏",
                tasks: ["上午全真模拟考试", "下午深度复盘错题", "背诵时政热点"]
            }
        ];
    }
}

// --- NEW: Generate Mock Exam Paper (Structured JSON) ---
export const generateMockPaper = async (paperTitle: string): Promise<MockExamData | null> => {
    const prompt = `
    Role: Senior Civil Service Exam Question Setter (Official Standard).
    Task: Generate a high-quality MOCK EXAM based on the title "${paperTitle}".
    
    Requirements:
    1. Language: Chinese (Simplified).
    2. Format: Return STRICT JSON.
    3. Content:
       - 10 Single Choice Questions (Real exam difficulty).
         * Mix of Logic (判断), Verbal (言语), Quantitative (数量), and General Knowledge (常识).
       - 1 Essay/Material Analysis Question (Shenlun style).
       - Total: 11 Questions.
    
    JSON Schema:
    {
      "title": "Exam Title",
      "description": "Brief instructions",
      "questions": [
         {
           "id": 1,
           "type": "single_choice",
           "stem": "Question text...",
           "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
           "correctAnswer": "A", 
           "analysis": "Detailed explanation..."
         },
         {
           "id": 11,
           "type": "essay",
           "stem": "Question text...",
           "material": "Context material (approx 100-200 words)...",
           "correctAnswer": "Reference answer points...",
           "analysis": "Scoring key points..."
         }
      ]
    }
    `;

    try {
        // Fix: Using gemini-3-pro-preview for creative/structured generation tasks
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        
        const text = cleanJsonOutput(response.text || "");
        return JSON.parse(text) as MockExamData;
    } catch (e) {
        console.error("Paper Generation Error:", e);
        return null;
    }
}
