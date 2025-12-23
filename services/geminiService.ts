
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Message, MessageRole, UserProfile, MatchResult, RecommendedJob, PublicServiceJobDB, ExamEvent, MockExamData, StudyPlanPhase } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";
import { supabase } from "./supabaseClient";

// 修复构建报错 TS2353：baseUrl 不是 GoogleGenAI 的有效配置项，必须移除
// 仅保留 apiKey
const ai = new GoogleGenAI({ 
  apiKey: process.env.API_KEY
});

const cleanJsonOutput = (text: string): string => {
  if (!text) return "{}";
  let cleaned = text.trim();
  // 移除 markdown 代码块标记
  cleaned = cleaned.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
  return cleaned;
};

// 统一错误处理辅助函数
const handleGeminiError = (error: any, context: string): string => {
    const errorMsg = error.message || JSON.stringify(error);
    console.error(`Gemini API Error [${context}]:`, error);

    if (errorMsg.includes('403') || errorMsg.includes('Region not supported')) {
        return "🌏 地域限制：Google Gemini 服务在当前地区不可用 (403)。\n💡 建议：\n1. 请开启 VPN 并切换至美国/新加坡节点。";
    }

    if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
        return "⚠️ 服务繁忙：API 调用次数超限（429）。\n原因：当前使用的 API Key 触发了 Google 的频率限制。\n建议：请等待 1-2 分钟后再试，避免频繁点击生成。";
    }
    return `服务暂时不可用：${errorMsg.substring(0, 50)}...`;
};

/**
 * 核心逻辑：从数据库检索真实岗位，并进行精准的 JS 过滤
 * 优化点：不再完全依赖简单的 SQL 模糊查询，而是获取后在前端/Service层进行严格的逻辑匹配（学历层级、性别限制、政治面貌）。
 */
export const searchSimilarJobs = async (userProfile: UserProfile): Promise<PublicServiceJobDB[]> => {
  const { major, degree, politicalStatus, gender, isFreshGrad, hasGrassrootsExperience, experienceYears, certificates } = userProfile;
  const majorTerm = major.replace(/专业|类|大类/g, '').trim();
  
  if (!majorTerm) return [];

  // 1. Broad Search from DB based on Major (Primary Key for matching)
  // We fetch a larger pool (limit 200) to allow for stricter filtering downstream
  let query = supabase.from('public_service_jobs')
    .select('*')
    .or(`major_req.ilike.%${majorTerm}%,job_name.ilike.%${majorTerm}%`)
    .limit(200);

  const { data, error } = await query;
  if (error || !data) {
      console.error("Supabase search error:", error);
      return [];
  }

  // 2. Strict Filtering Logic (simulating specific DB columns if they don't explicitly exist)
  
  // Helpers for Hierarchy
  const degreeLevels = ['大专', '本科', '硕士', '博士'];
  const userDegreeLevel = degreeLevels.findIndex(l => degree.includes(l)); // e.g. "硕士研究生" matches "硕士"

  const processedJobs = data.filter(job => {
      const remarks = (job.remarks || '').toLowerCase();
      const jobName = (job.job_name || '').toLowerCase();
      const jobMajor = (job.major_req || '').toLowerCase();
      const jobDegree = (job.degree_req || '').toLowerCase();
      const jobPolitic = (job.politic_req || '').toLowerCase();
      
      // --- FILTER 1: GENDER ---
      // If user is Male, reject "Female Only". If Female, reject "Male Only".
      if (gender === '男') {
          if (remarks.includes('限女性') || remarks.includes('只招女性') || remarks.includes('适合女性') || jobName.includes('女子')) return false;
      } else if (gender === '女') {
          if (remarks.includes('限男性') || remarks.includes('只招男性') || remarks.includes('适合男性') || jobName.includes('男子')) return false;
      }

      // --- FILTER 2: FRESH GRADUATE ---
      // If job strictly requires fresh grad ("仅限应届"), and user is NOT, reject.
      // If user IS fresh grad, they can apply to both fresh and non-fresh.
      const requiresFresh = remarks.includes('应届') || remarks.includes('2026') || jobName.includes('应届');
      if (requiresFresh && !isFreshGrad) return false;

      // --- FILTER 3: POLITICAL STATUS ---
      // Hierarchy: CPM (Party Member) > Probationary > League Member > Mass
      // If job requires CPM, simple Mass or League members cannot apply.
      if (jobPolitic.includes('中共党员')) {
          if (!politicalStatus.includes('党员')) return false; // Reject if user is not a Party member
      }
      if (jobPolitic.includes('共青团员') && politicalStatus === '群众') return false;

      // --- FILTER 4: DEGREE HIERARCHY ---
      // If job requires Master, Bachelor cannot apply.
      // Assuming simple string matching for now.
      let jobDegreeLevel = -1;
      if (jobDegree.includes('博士')) jobDegreeLevel = 3;
      else if (jobDegree.includes('硕士') || jobDegree.includes('研究生')) jobDegreeLevel = 2;
      else if (jobDegree.includes('本科')) jobDegreeLevel = 1;
      else if (jobDegree.includes('大专')) jobDegreeLevel = 0;

      // If user degree level is lower than job requirement, reject.
      // Note: "本科及以上" means level 1 is OK.
      if (userDegreeLevel < jobDegreeLevel) return false;

      // --- FILTER 5: GRASSROOTS EXPERIENCE ---
      // Strict Check: If remarks say "2年基层", user must have >= 2 years.
      const reqExpMatch = remarks.match(/(\d+)年.*基层/);
      if (reqExpMatch) {
          const yearsRequired = parseInt(reqExpMatch[1]);
          const userExp = hasGrassrootsExperience ? (experienceYears || 0) : 0;
          if (userExp < yearsRequired) return false;
      } else if ((remarks.includes('基层工作') || remarks.includes('基层经历')) && !hasGrassrootsExperience) {
           // General requirement without specific years often implies at least some experience (usually 2 years in policy, but strictly checking bool here)
           // But sometimes it says "无基层工作经历限制".
           if (!remarks.includes('无限制') && !remarks.includes('不限')) {
               // To be safe, if we don't have exp and it mentions it, we flag it. 
               // However, text matching is tricky. Let's assume if it says "具有...基层工作经历" it's a requirement.
               if (remarks.includes('具有') && remarks.includes('基层')) return false;
           }
      }

      // --- FILTER 6: PREDEFINED CERTIFICATES ---
      const userCerts = certificates || [];
      if ((remarks.includes('四级') || remarks.includes('cet-4') || remarks.includes('cet4')) && !userCerts.some(c => c.includes('四级') || c.includes('六级'))) return false;
      if ((remarks.includes('六级') || remarks.includes('cet-6') || remarks.includes('cet6')) && !userCerts.some(c => c.includes('六级'))) return false;
      if (remarks.includes('计算机二级') && !userCerts.some(c => c.includes('计算机二级'))) return false;
      if ((remarks.includes('法律职业') || remarks.includes('司考') || remarks.includes('a证')) && !userCerts.some(c => c.includes('法律职业'))) return false;

      return true;
  }).map(job => {
      // Calculate Similarity Score based on remaining matches
      let score = 75; // Base score for passing hard filters

      // Major Exactness
      if (job.major_req.includes(majorTerm)) score += 10;
      if (job.major_req === major) score += 5;

      // Fresh Grad Bonus (if job prefers it)
      const remarks = (job.remarks || '');
      if (isFreshGrad && remarks.includes('应届')) score += 5;

      // Political Bonus
      if (politicalStatus.includes('党员') && (job.politic_req || '').includes('党员')) score += 5;
      
      // Certificate Bonus (Dynamic check for ANY user certificate in remarks)
      if (certificates && certificates.length > 0) {
          // Check if any held certificate string (e.g. "教师资格", "驾驶证") is present in remarks
          // This allows custom certificates to boost score even if not hardcoded in filter
          const hasRelevantCert = certificates.some(cert => {
              const cleanCert = cert.replace('证', ''); // simple normalization
              return remarks.includes(cleanCert);
          });
          
          if (hasRelevantCert) score += 8;
          else if (remarks.includes('证书') || remarks.includes('资格')) score += 2; // Small bonus if job mentions certs generally
      }

      return { ...job, similarity: Math.min(score, 99) / 100 };
  });

  // Sort by similarity descending
  return processedJobs.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
};

/**
 * 深度匹配分析：文本模式
 * 升级为使用 responseSchema，确保百分百 JSON 格式输出
 */
export const analyzeJobMatch = async (
  jobText: string,
  userProfile: UserProfile,
  dbCandidates: any[] = [] 
): Promise<MatchResult> => {
  if (!process.env.API_KEY) return { score: 0, eligible: false, hardConstraints: [], softConstraints: [], analysis: "API Key 配置缺失。", otherRecommendedJobs: [] };

  const prompt = `
    Candidate Profile: ${JSON.stringify(userProfile)}
    Job Announcement: """${jobText}"""
    
    Analyze compatibility. Check Hard Constraints (Degree, Major, Political, Gender, Grad Year) and Soft Constraints (Skills, Experience).
    Provide a match score (0-100) and detailed analysis.
  `;

  const matchSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.INTEGER },
      eligible: { type: Type.BOOLEAN },
      analysis: { type: Type.STRING },
      hardConstraints: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            passed: { type: Type.BOOLEAN },
            details: { type: Type.STRING }
          },
          required: ["name", "passed", "details"]
        }
      },
      softConstraints: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            passed: { type: Type.BOOLEAN },
            details: { type: Type.STRING }
          },
          required: ["name", "passed", "details"]
        }
      }
    },
    required: ["score", "eligible", "analysis", "hardConstraints", "softConstraints"]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        responseSchema: matchSchema
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("Empty response");
    
    const result = JSON.parse(cleanJsonOutput(text));
    return { ...result, otherRecommendedJobs: [] };
  } catch (error: any) {
    const friendlyMsg = handleGeminiError(error, "Analyze Match");
    return { 
        score: 0, 
        eligible: false, 
        hardConstraints: [], 
        softConstraints: [], 
        analysis: friendlyMsg, 
        otherRecommendedJobs: [] 
    };
  }
};

/**
 * 新增功能：图片 OCR 结构化提取
 * 目的：让用户确认识别内容，而不是直接匹配，提高容错率
 */
export const extractJobFromImage = async (base64Data: string, mimeType: string): Promise<Partial<PublicServiceJobDB>> => {
    if (!process.env.API_KEY) throw new Error("API Key Missing");

    const prompt = `
      Task: OCR and Structure Extraction.
      Extract job details from the image. Use empty string if missing.
    `;
    
    // Schema specifically for OCR extraction
    const ocrSchema: Schema = {
        type: Type.OBJECT,
        properties: {
            job_name: { type: Type.STRING },
            dept_name: { type: Type.STRING },
            major_req: { type: Type.STRING },
            degree_req: { type: Type.STRING },
            politic_req: { type: Type.STRING },
            remarks: { type: Type.STRING },
            recruit_count: { type: Type.NUMBER }
        },
        required: ["job_name", "dept_name", "major_req"]
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64Data } },
                    { text: prompt }
                ]
            },
            config: { 
                responseMimeType: "application/json",
                responseSchema: ocrSchema
            }
        });
        
        return JSON.parse(cleanJsonOutput(response.text || "{}"));
    } catch (error) {
        console.error("OCR Extraction Failed", error);
        throw error;
    }
};

/**
 * 深度匹配分析：图片 OCR 模式 (Legacy / Shortcut)
 * 仅保留用于向后兼容，建议使用 extractJobFromImage -> analyzeJobMatch 流程
 */
export const analyzeImageJobMatch = async (
    base64Data: string, 
    mimeType: string, 
    userProfile: UserProfile
): Promise<MatchResult> => {
    // Re-use extraction + text analysis logic to ensure consistency
    try {
        const extracted = await extractJobFromImage(base64Data, mimeType);
        const textRepresentation = `
            职位: ${extracted.job_name}
            部门: ${extracted.dept_name}
            专业: ${extracted.major_req}
            学历: ${extracted.degree_req}
            政治面貌: ${extracted.politic_req}
            备注/其他要求: ${extracted.remarks}
        `;
        return await analyzeJobMatch(textRepresentation, userProfile);
    } catch (error: any) {
        const friendlyMsg = handleGeminiError(error, "Image Analysis");
        return { 
            score: 0, 
            eligible: false, 
            hardConstraints: [], 
            softConstraints: [], 
            analysis: friendlyMsg, 
            otherRecommendedJobs: [] 
        };
    }
};

export const sendMessageToGemini = async (history: Message[], userMessage: string): Promise<string> => {
    if (!process.env.API_KEY) return "系统错误：未配置 API Key。请联系管理员在 Vercel 后台添加 VITE_API_KEY。";

    try {
        // 1. 将前端消息历史映射为 Gemini API 所需的 Context 格式
        // 这里实现了“上下文管理”的核心：保持多轮对话的连贯性
        const historyContent = history.map(msg => ({
            role: msg.role === MessageRole.USER ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        // 2. 创建带记忆和 System Instruction 的 Chat 会话
        // systemInstruction 确保了 AI 的“人设”和“回答规范”
        const chat = ai.chats.create({ 
            model: 'gemini-3-flash-preview', 
            config: { systemInstruction: SYSTEM_INSTRUCTION },
            history: historyContent 
        });
        
        // 3. 发送新消息并等待流式/非流式响应
        const result = await chat.sendMessage({ message: userMessage });
        return result.text || "";
    } catch (error: any) {
        return handleGeminiError(error, "Chat");
    }
};

/**
 * 升级版：生成具有真实考感的完整模拟卷
 */
export const generateMockPaper = async (title: string): Promise<MockExamData> => {
  if (!process.env.API_KEY) {
      alert("未检测到 API Key，无法生成试卷。");
      return { title: "配置错误", description: "请在 Vercel 环境变量中配置 VITE_API_KEY", questions: [] };
  }

  const prompt = `基于"${title}"主题，生成一份具有实战性质的公考模拟卷。要求：
  1. 生成 5 道单选题 (type: 'single_choice')，必须包含 options 数组，格式为 ["A. 内容", "B. 内容", "C. 内容", "D. 内容"]。
  2. 生成 1 道申论主观大题 (type: 'essay')。
  3. 考点需涵盖常识、言语或申论热点。
  4. 每道题必须有详细的解析。
  5. 返回严格符合 Schema 的 JSON 对象。`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  type: { type: Type.STRING },
                  stem: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  material: { type: Type.STRING },
                  correctAnswer: { type: Type.STRING },
                  analysis: { type: Type.STRING }
                },
                required: ["id", "type", "stem", "correctAnswer", "analysis"]
              }
            }
          },
          required: ["title", "description", "questions"]
        }
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("Empty response");
    
    return JSON.parse(text) as MockExamData;
  } catch (error: any) {
    const friendlyMsg = handleGeminiError(error, "Mock Paper");
    return { 
        title: "生成失败：服务繁忙", 
        description: friendlyMsg, 
        questions: [] 
    };
  }
};

export const generateStudyPlan = async (targetExam: string, daysLeft: number, dailyHours: number, weakness: string): Promise<StudyPlanPhase[]> => {
  if (!process.env.API_KEY) return [];
  const prompt = `为${targetExam}考生生成计划，剩余${daysLeft}天，重点${weakness}。`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(cleanJsonOutput(response.text || "[]"));
  } catch (error) { 
      console.error("Study Plan Error:", error);
      return []; 
  }
};
