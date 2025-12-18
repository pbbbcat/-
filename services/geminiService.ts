
import { GoogleGenAI, Type } from "@google/genai";
import { Message, MessageRole, UserProfile, MatchResult, RecommendedJob, PublicServiceJobDB, ExamEvent, MockExamData, StudyPlanPhase } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";
import { supabase } from "./supabaseClient";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const cleanJsonOutput = (text: string): string => {
  if (!text) return "{}";
  let cleaned = text.trim();
  // 移除 markdown 代码块标记
  cleaned = cleaned.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
  return cleaned;
};

/**
 * 核心逻辑：从数据库检索真实岗位，并进行精准的 JS 过滤
 * 优化点：不再完全依赖简单的 SQL 模糊查询，而是获取后在前端/Service层进行严格的逻辑匹配（学历层级、性别限制、政治面貌）。
 */
export const searchSimilarJobs = async (userProfile: UserProfile): Promise<PublicServiceJobDB[]> => {
  const { major, degree, politicalStatus, gender, isFreshGrad, hasGrassrootsExperience } = userProfile;
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
      if (remarks.includes('基层工作经历') && !hasGrassrootsExperience) return false;

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

      return { ...job, similarity: Math.min(score, 99) / 100 };
  });

  // Sort by similarity descending
  return processedJobs.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
};

export const analyzeJobMatch = async (
  jobText: string,
  userProfile: UserProfile,
  dbCandidates: any[] = [] 
): Promise<MatchResult> => {
  if (!process.env.API_KEY) return { score: 0, eligible: false, hardConstraints: [], softConstraints: [], analysis: "API Key 配置缺失，无法分析。", otherRecommendedJobs: [] };

  const prompt = `分析画像 ${JSON.stringify(userProfile)} 与文本 """${jobText}""" 的匹配度。返回 JSON。`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // 使用推荐的 3.0 Flash 模型
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(cleanJsonOutput(response.text || ""));
  } catch (error) {
    console.error("Analyze Match Failed:", error);
    return { score: 0, eligible: false, hardConstraints: [], softConstraints: [], analysis: "分析失败", otherRecommendedJobs: [] };
  }
};

export const sendMessageToGemini = async (history: Message[], userMessage: string): Promise<string> => {
    if (!process.env.API_KEY) return "系统错误：未配置 API Key。请联系管理员在 Vercel 后台添加 VITE_API_KEY。";

    try {
        const chat = ai.chats.create({ 
            model: 'gemini-3-flash-preview', // 使用推荐的 3.0 Flash 模型
            config: { systemInstruction: SYSTEM_INSTRUCTION } 
        });
        
        // 构造历史消息上下文 (Gemini API 格式)
        // 实际应用中应正确转换 history 格式，这里简化处理直接发送新消息
        const result = await chat.sendMessage({ message: userMessage });
        return result.text || "";
    } catch (error: any) {
        console.error("Gemini Chat Error:", error);
        return `对话服务暂时不可用 (${error.message || '未知错误'})。请稍后再试。`;
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
      model: 'gemini-3-flash-preview', // 使用推荐的 3.0 Flash 模型以获得更快的 JSON 生成速度
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
  } catch (error) {
    console.error("组卷失败详情:", error);
    return { 
        title: "生成失败", 
        description: "AI 服务响应异常，请检查网络或 API Key 配额。", 
        questions: [] 
    };
  }
};

export const generateStudyPlan = async (targetExam: string, daysLeft: number, dailyHours: number, weakness: string): Promise<StudyPlanPhase[]> => {
  if (!process.env.API_KEY) return [];
  const prompt = `为${targetExam}考生生成计划，剩余${daysLeft}天，重点${weakness}。`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // 使用推荐的 3.0 Flash 模型
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(cleanJsonOutput(response.text || "[]"));
  } catch (error) { return []; }
};
