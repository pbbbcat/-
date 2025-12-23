
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

export interface User {
  id: string;
  nickname: string;
  avatar: string;
  isVip: boolean;
  loginTime: string;
}

export interface UserProfile {
  gender: string;          // Gender (男/女)
  degree: string;          // Highest Degree
  major: string;           // Major
  politicalStatus: string; // Political Status
  isFreshGrad: boolean;    // Is Fresh Graduate (2026届)
  experienceYears: number;
  hasGrassrootsExperience: boolean;
  certificates: string[];
}

export interface PublicServiceJobDB {
  id: number;
  // --- 部门信息 ---
  dept_code?: string;       // 部门代码
  dept_name: string;        // 部门名称
  sub_dept?: string;        // 用人司局
  org_nature?: string;      // 机构性质
  org_level?: string;       // 机构层级 (new)
  
  // --- 职位基本信息 ---
  job_code: string;         // 职位代码
  job_name: string;         // 招考职位/职位名称
  job_desc?: string;        // 职位简介
  job_attr?: string;        // 职位属性
  job_dist?: string;        // 职位分布 (new)
  exam_cat?: string;        // 考试类别 (new)
  recruit_count?: number;   // 招考人数

  // --- 报考门槛 ---
  major_req: string;        // 专业
  degree_req: string;       // 学历
  degree_type?: string;     // 学位
  politic_req?: string;     // 政治面貌
  exp_years?: string;       // 基层工作最低年限
  service_proj?: string;    // 服务基层项目工作经历 (new)
  
  // --- 考试与录用 ---
  has_pro_test?: boolean;   // 是否在面试阶段组织专业能力测试
  interview_ratio?: string; // 面试人员比例
  
  // --- 其他 ---
  work_loc?: string;        // 工作地点
  settle_loc?: string;      // 落户地点
  remarks?: string;         // 备注
  website?: string;         // 官网
  phones?: string[];        // 咨询电话
  
  // --- 前端计算字段 ---
  similarity?: number;
}

// Added missing interface for Job Matching results
export interface RecommendedJob {
  department: string;
  position: string;
  matchScore: number;
  reason: string;
  originalData?: PublicServiceJobDB;
}

// Added missing interface for policy/matching constraints
export interface Constraint {
  name: string;
  passed: boolean;
  details: string;
  suggestion?: string;
}

// Added missing interface for MatchResult
export interface MatchResult {
  score: number;
  eligible: boolean;
  hardConstraints: Constraint[];
  softConstraints: Constraint[];
  analysis: string;
  otherRecommendedJobs: RecommendedJob[];
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

export interface ExamEvent {
  id: string;
  title: string;
  dateStr: string;
  type: 'national' | 'provincial' | 'institution';
  status: 'upcoming' | 'registering' | 'ongoing' | 'ended';
  month: number;
  year?: number;
  tags: string[];
  isEstimated?: boolean;
  description?: string;
}

export interface ResourceItem {
  id: string;
  title: string;
  source: string;
  type: 'paper' | 'policy';
  publishDate: string;
  tags: string[];
  url?: string;
  summary?: string;
  category?: string;
  downloadCount?: number;
  isRealFile?: boolean; 
  storageBucket?: string;
  storagePath?: string;
}

export interface CommunityNote {
  id: string;
  title: string;
  author: string;
  avatar?: string;
  summary: string;
  fileType: 'pdf' | 'doc' | 'xmind' | 'zip';
  size: string;
  downloads: number;
  likes: number;
  uploadDate: string;
  category: '行测' | '申论' | '面试' | '综合';
  tags: string[];
  storagePath?: string;
}

// Added missing interface for Mock Questions
export interface MockQuestion {
  id: number;
  type: 'single_choice' | 'essay';
  stem: string;
  options?: string[];
  material?: string;
  correctAnswer: string;
  analysis: string;
}

export interface MockExamData {
  title: string;
  description: string;
  // Updated to use the new MockQuestion type
  questions: MockQuestion[];
}

export interface StudyPlanPhase {
  phaseName: string;
  duration: string;
  focus: string;
  tasks: string[];
}
