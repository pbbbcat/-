
import { GoogleGenAI, Type } from "@google/genai";
import { Message, MessageRole, UserProfile, MatchResult, RecommendedJob, PublicServiceJobDB, ExamEvent, MockExamData, StudyPlanPhase } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";
import { supabase } from "./supabaseClient";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const cleanJsonOutput = (text: string): string => {
  if (!text) return "{}";
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  return cleaned;
};

/**
 * 核心逻辑：从数据库检索真实岗位
 */
export const searchSimilarJobs = async (userProfile: UserProfile): Promise<PublicServiceJobDB[]> => {
  const { major, degree, politicalStatus, experienceYears, hasGrassrootsExperience } = userProfile;
  const majorTerm = major.replace(/专业|类|大类/g, '').trim();
  if (!majorTerm) return [];

  let query = supabase.from('public_service_jobs').select('*');
  if (degree) query = query.ilike('degree_req', `%${degree}%`);
  query = query.or(`major_req.ilike.%${majorTerm}%,job_name.ilike.%${majorTerm}%`);

  const { data, error } = await query.limit(100);
  if (error || !data) return [];

  const processedJobs = data.map(job => {
    let score = 70; 
    if (job.major_req?.includes(majorTerm)) score += 15;
    if (politicalStatus && job.politic_req?.includes(politicalStatus)) score += 5;
    if (hasGrassrootsExperience && job.exp_proj?.includes('基层')) score += 5;
    return { ...job, similarity: Math.min(score, 98) / 100 };
  });

  return processedJobs.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
};

export const analyzeJobMatch = async (
  jobText: string,
  userProfile: UserProfile,
  dbCandidates: any[] = [] 
): Promise<MatchResult> => {
  const prompt = `分析画像 ${JSON.stringify(userProfile)} 与文本 """${jobText}""" 的匹配度。返回 JSON。`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { responseMimeType: "application/json", thinkingConfig: { thinkingBudget: 1000 } }
    });
    return JSON.parse(cleanJsonOutput(response.text || ""));
  } catch (error) {
    return { score: 0, eligible: false, hardConstraints: [], softConstraints: [], analysis: "分析失败", otherRecommendedJobs: [] };
  }
};

export const sendMessageToGemini = async (history: Message[], userMessage: string): Promise<string> => {
    const chat = ai.chats.create({ model: 'gemini-3-flash-preview', config: { systemInstruction: SYSTEM_INSTRUCTION } });
    const result = await chat.sendMessage({ message: userMessage });
    return result.text || "";
};

/**
 * 升级版：生成具有真实考感的完整模拟卷
 * 包含 10 道选择题和 2 道主观题
 */
export const generateMockPaper = async (title: string): Promise<MockExamData> => {
  const prompt = `基于"${title}"主题，生成一份具有实战性质的公考模拟卷。要求：
  1. 生成 10 道单选题 (type: 'single_choice')，必须包含 options 数组，格式为 ["A. 内容", "B. 内容", "C. 内容", "D. 内容"]。
  2. 生成 2 道申论主观大题 (type: 'essay')。
  3. 考点需涵盖常识、言语或申论热点。
  4. 每道题必须有详细的解析。
  5. 返回严格符合 Schema 的 JSON 对象。`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
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
    return JSON.parse(response.text || "{}") as MockExamData;
  } catch (error) {
    console.error("组卷失败:", error);
    return { title: "生成失败", description: "网络连接不稳定，请重新尝试组卷", questions: [] };
  }
};

export const generateStudyPlan = async (targetExam: string, daysLeft: number, dailyHours: number, weakness: string): Promise<StudyPlanPhase[]> => {
  const prompt = `为${targetExam}考生生成计划，剩余${daysLeft}天，重点${weakness}。`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(cleanJsonOutput(response.text || "[]"));
  } catch (error) { return []; }
};
