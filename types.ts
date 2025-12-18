
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
  degree: string;
  major: string;
  politicalStatus: string;
  experienceYears: number;
  hasGrassrootsExperience: boolean;
  certificates: string[];
}

export interface PublicServiceJobDB {
  id: number;
  dept_code?: string;
  dept_name: string;
  sub_dept?: string;
  org_nature?: string;
  job_code: string;
  job_name: string;
  job_desc?: string;
  job_attr?: string;
  recruit_count?: number;
  major_req: string;
  degree_req: string;
  degree_type?: string;
  politic_req?: string;
  exp_years?: string;
  exp_proj?: string;
  has_pro_test?: boolean;
  interview_ratio?: string;
  work_loc?: string;
  settle_loc?: string;
  remarks?: string;
  website?: string;
  phones?: string[];
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
