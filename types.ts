

export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  citations?: string[];
  timestamp: Date;
}

// Interface for the UI display (Simplified view)
export interface JobPosition {
  id: string;
  title: string;
  department: string;
  degree: string;
  major: string;
  experience: string;
  otherRequirements: string[];
}

// Interface strictly matching the 'public_service_jobs' Supabase table schema
export interface PublicServiceJobDB {
  id: number;
  
  // Basic Info
  dept_code?: string;
  dept_name: string;
  sub_dept?: string;       // 用人司局
  org_nature?: string;     // 机构性质
  
  // Job Info
  job_code: string;
  job_name: string;
  job_desc?: string;       // 职位简介
  job_attr?: string;       // 职位属性
  
  // Requirements
  recruit_count?: number;  // 招考人数
  major_req: string;
  degree_req: string;
  degree_type?: string;    // 学位要求
  politic_req?: string;
  exp_years?: string;      // 基层工作最低年限
  exp_proj?: string;       // 服务基层项目经历
  
  // Exam Info
  has_pro_test?: boolean;
  interview_ratio?: string;
  
  // Location & Contact
  work_loc?: string;
  settle_loc?: string;
  remarks?: string;
  website?: string;
  phones?: string[];
  
  // Search
  similarity?: number;     // From vector search RPC
}

export interface UserProfile {
  degree: string;
  major: string;
  politicalStatus: string;
  experienceYears: number;
  hasGrassrootsExperience: boolean;
  certificates: string[];
}

export interface RecommendedJob {
  department: string;
  position: string;
  matchScore: number;
  reason: string;
  // Metadata for linking back to DB
  originalData?: PublicServiceJobDB;
}

export interface MatchResult {
  score: number; // 0-100
  eligible: boolean;
  hardConstraints: {
    name: string;
    passed: boolean;
    details: string;
  }[];
  softConstraints: {
    name: string;
    passed: boolean;
    details: string;
    suggestion?: string;
  }[];
  analysis: string;
  otherRecommendedJobs?: RecommendedJob[];
}

export enum Page {
  DASHBOARD = 'dashboard',
  MATCHING = 'matching',
  POLICY_CHAT = 'policy_chat',
  MAJOR_ANALYSIS = 'major_analysis',
  EXAM_CALENDAR = 'exam_calendar',
  RESOURCE_CENTER = 'resource_center',
  COMMUNITY = 'community'
}

// --- New Types for Enhanced Features ---

export interface ExamEvent {
  id: string;
  title: string;
  dateStr: string;
  type: 'national' | 'provincial' | 'institution';
  status: 'upcoming' | 'registering' | 'ongoing' | 'ended';
  month: number; // 1-12
  year?: number; // Added year
  tags: string[];
  isEstimated?: boolean; // New: indicates if the date is predicted by AI
  description?: string; // New: brief description
}

export interface ResourceItem {
  id: string;
  title: string;
  source: string; // e.g., "粉笔题库", "官方发布"
  type: 'paper' | 'policy';
  publishDate: string;
  tags: string[];
  url?: string;
  downloadCount?: number;
  isRealFile?: boolean; 
  storageBucket?: string; // New: For dynamic download
  storagePath?: string;   // New: For dynamic download
}

export interface CommunityNote {
  id: string;
  title: string;
  author: string;
  avatar?: string; // URL or Initials
  summary: string;
  fileType: 'pdf' | 'doc' | 'xmind' | 'zip';
  size: string;
  downloads: number;
  likes: number;
  uploadDate: string;
  category: '行测' | '申论' | '面试' | '综合';
  tags: string[];
}

// --- NEW: Structured Mock Exam Types ---
export interface MockQuestion {
  id: number;
  type: 'single_choice' | 'essay'; // 单选 or 申论/主观题
  stem: string; // 题干
  options?: string[]; // 选项 (Only for choice)
  correctAnswer: string; // 正确答案 (e.g. "A" or text)
  analysis: string; // 解析
  material?: string; // 材料 (Optional)
}

export interface MockExamData {
  title: string;
  description: string;
  questions: MockQuestion[];
}

export interface StudyPlanPhase {
  phaseName: string;
  duration: string;
  focus: string;
  tasks: string[];
}