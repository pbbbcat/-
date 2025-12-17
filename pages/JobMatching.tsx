
import React, { useState } from 'react';
import { UploadCloud, CheckCircle, AlertTriangle, XCircle, FileText, ArrowRight, Edit3, RotateCcw, Loader2, Sparkles, Building2, X, ExternalLink, MapPin, Phone, Users, Database, Search, ListFilter, Briefcase, GraduationCap, ClipboardList } from 'lucide-react';
import { analyzeJobMatch, searchSimilarJobs } from '../services/geminiService';
import { supabase } from '../services/supabaseClient'; 
import { MatchResult, UserProfile, RecommendedJob, PublicServiceJobDB } from '../types';
import { PieChart, Pie, Cell } from 'recharts';

interface JobMatchingProps {
  userProfile: UserProfile;
  onProfileChange: (profile: UserProfile) => void;
}

const JobMatching: React.FC<JobMatchingProps> = ({ userProfile, onProfileChange }) => {
  // Step 1: Input, Step 2: Loading, Step 3: Text Analysis Result, Step 4: Profile Search Result
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); 
  const [activeTab, setActiveTab] = useState<'upload' | 'text'>('text');
  const [jobText, setJobText] = useState<string>('');
  
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string>('');
  const [selectedJob, setSelectedJob] = useState<RecommendedJob | null>(null);
  const [detailedDbJob, setDetailedDbJob] = useState<PublicServiceJobDB | null>(null);
  const [dbCount, setDbCount] = useState<number>(0); 
  const [recommendationList, setRecommendationList] = useState<PublicServiceJobDB[]>([]);
  const [loadingText, setLoadingText] = useState<string>("AI 正在深度分析");

  // Mode 1: Analyze specific text match
  const handleAnalysis = async () => {
    if (!jobText.trim()) {
      setError("请先输入或上传岗位要求文本");
      return;
    }
    
    setStep(2);
    setLoadingText("正在连接 Supabase 知识库检索相似岗位...");
    setError('');
    setDbCount(0);

    try {
      // 1. Fetch Candidates using Hybrid Search (Keyword + Vector)
      console.log("Starting hybrid search...");
      const dbCandidates: PublicServiceJobDB[] = await searchSimilarJobs(userProfile);
      
      setDbCount(dbCandidates.length);
      setLoadingText(`已检索到 ${dbCandidates.length} 个相关岗位，正在生成分析报告...`);

      // 2. Call Gemini for Analysis
      const analysisResult = await analyzeJobMatch(jobText, userProfile, dbCandidates);
      setResult(analysisResult);
      setStep(3);
    } catch (err: any) {
      console.error(err);
      setError("分析服务出现异常，请检查网络或刷新后重试。");
      setStep(1);
    }
  };

  // Mode 2: Search based on profile only
  const handleProfileSearch = async () => {
      setStep(2);
      setLoadingText("正在检索知识库匹配岗位");
      setError('');
      setRecommendationList([]);

      try {
          const jobs = await searchSimilarJobs(userProfile);
          if (jobs && jobs.length > 0) {
              setRecommendationList(jobs);
              setStep(4);
          } else {
              // Extract the term used for searching to show user
              const term = userProfile.major.replace(/科学与技术|科学|技术|工程|专业|门类|类|大类|硕士|研究生|博士|学位|学术|型|全日制|学历|学位|学$/g, '').trim();
              setError(`知识库中未找到包含“${term}”相关关键词的岗位。请尝试简化专业名称（如将“汉语言文学”改为“汉语言”）。`);
              setStep(1);
          }
      } catch (err) {
          console.error(err);
          setError("检索服务暂时不可用");
          setStep(1);
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "text/plain") {
          const reader = new FileReader();
          reader.onload = (e) => setJobText(e.target?.result as string);
          reader.readAsText(file);
          setActiveTab('text');
      } else {
          setError("系统当前仅支持 .txt 文本文件直接读取，建议您直接复制岗位内容粘贴到左侧文本框。");
      }
    }
  };

  const openJobDetail = async (job: RecommendedJob) => {
      setSelectedJob(job);
      setDetailedDbJob(null);
      
      if (job.originalData && job.originalData.id) {
          // If we have an ID, try to fetch the absolute latest version from DB to be safe
          const { data, error } = await supabase
            .from('public_service_jobs')
            .select('*')
            .eq('id', job.originalData.id)
            .single();
          
          if (data) {
              setDetailedDbJob(data as PublicServiceJobDB);
          } else {
              setDetailedDbJob(job.originalData);
          }
          return;
      }
      
      // If we are in profile search mode (Step 4), originalData is usually fully populated from the list
      if (step === 4 && job.originalData) {
          setDetailedDbJob(job.originalData);
          return;
      }
  };

  const renderInput = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      {/* Left: User Profile Form */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
             <Edit3 className="w-5 h-5 text-primary" />
             您的报考画像
          </h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">最高学历</label>
            <select 
              className="w-full p-2 border rounded-lg bg-slate-50 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              value={userProfile.degree}
              onChange={e => onProfileChange({...userProfile, degree: e.target.value})}
            >
              <option>大专</option>
              <option>本科</option>
              <option>硕士研究生</option>
              <option>博士研究生</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">具体专业</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded-lg bg-slate-50 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              value={userProfile.major}
              onChange={e => onProfileChange({...userProfile, major: e.target.value})}
              placeholder="例如：汉语言文学"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">政治面貌</label>
            <select 
              className="w-full p-2 border rounded-lg bg-slate-50 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              value={userProfile.politicalStatus}
              onChange={e => onProfileChange({...userProfile, politicalStatus: e.target.value})}
            >
              <option>群众</option>
              <option>共青团员</option>
              <option>中共预备党员</option>
              <option>中共党员</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">工作年限</label>
              <input 
                type="number" 
                className="w-full p-2 border rounded-lg bg-slate-50 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                value={userProfile.experienceYears}
                onChange={e => onProfileChange({...userProfile, experienceYears: parseInt(e.target.value) || 0})}
              />
            </div>
            <div className="flex items-center pt-5">
               <input 
                 type="checkbox" 
                 id="grassroots"
                 className="mr-2 w-4 h-4 rounded text-primary focus:ring-primary"
                 checked={userProfile.hasGrassrootsExperience}
                 onChange={e => onProfileChange({...userProfile, hasGrassrootsExperience: e.target.checked})}
               />
               <label htmlFor="grassroots" className="text-xs text-slate-600 cursor-pointer">有基层工作经历</label>
            </div>
          </div>
          <div>
             <label className="block text-xs font-medium text-slate-500 mb-1">证书/技能 (逗号分隔)</label>
             <input 
                type="text" 
                className="w-full p-2 border rounded-lg bg-slate-50 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                value={userProfile.certificates.join(', ')}
                onChange={e => onProfileChange({...userProfile, certificates: e.target.value.split(/[,，]/).map(s => s.trim())})}
                placeholder="如：英语六级, 法律职业资格A证" 
             />
          </div>
        </div>
      </div>

      {/* Right: Job Input & Search */}
      <div className="lg:col-span-2 space-y-6">
        {/* Section 1: Target Match */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            <button 
              className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'text' ? 'bg-primary text-white' : 'bg-gray-50 text-slate-500 hover:bg-gray-100'}`}
              onClick={() => setActiveTab('text')}
            >
              粘贴文本
            </button>
            <button 
              className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'upload' ? 'bg-primary text-white' : 'bg-gray-50 text-slate-500 hover:bg-gray-100'}`}
              onClick={() => setActiveTab('upload')}
            >
              上传文件
            </button>
          </div>

          <div className="p-6 h-[320px]">
            {activeTab === 'text' ? (
              <textarea 
                className="w-full h-full p-4 bg-slate-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none font-mono text-sm leading-relaxed outline-none"
                placeholder="请在此粘贴职位表中的“岗位要求”一栏，或者直接复制整个公告段落..."
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 relative hover:bg-gray-100 transition-colors">
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileUpload}
                  accept=".txt" 
                />
                <UploadCloud className="w-10 h-10 text-slate-400 mb-3" />
                <p className="text-slate-600 font-medium">点击上传 .txt 文件</p>
                <p className="text-xs text-slate-400 mt-2">支持拖拽上传</p>
              </div>
            )}
          </div>
          <div className="p-6 pt-0">
             <button 
                onClick={handleAnalysis}
                className="w-full py-3 bg-primary text-white rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-600 active:scale-[0.99] transition-all font-bold text-lg flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                开始精准比对
              </button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">或者</span>
            <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {/* Section 2: Profile Search */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100 flex items-center justify-between">
            <div>
                <h3 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                    <Search className="w-5 h-5 text-emerald-600" />
                    暂无目标岗位？
                </h3>
                <p className="text-sm text-emerald-700 mt-1">根据您的画像（{userProfile.major} / {userProfile.degree}），一键检索知识库中适合的岗位。</p>
            </div>
            <button 
                onClick={handleProfileSearch}
                className="px-6 py-3 bg-white text-emerald-600 font-bold rounded-xl shadow-sm border border-emerald-200 hover:bg-emerald-50 hover:shadow-md transition-all flex items-center gap-2 whitespace-nowrap"
            >
                <ListFilter className="w-4 h-4" />
                按画像智能荐岗
            </button>
        </div>

        {error && (
            <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                {error}
            </div>
        )}
      </div>
    </div>
  );

  const renderParsing = () => (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-8 animate-fade-in">
      <div className="relative">
         <div className="w-24 h-24 border-4 border-gray-100 rounded-full"></div>
         <div className="w-24 h-24 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
         <div className="absolute inset-0 flex items-center justify-center">
             <Loader2 className="w-8 h-8 text-primary animate-pulse" />
         </div>
      </div>
      <div className="text-center space-y-3 max-w-md">
        <h3 className="text-xl font-bold text-slate-800">{loadingText}</h3>
        <p className="text-slate-500 text-sm flex flex-col gap-1">
            <span>正在检索真实数据库中的岗位信息...</span>
        </p>
      </div>
    </div>
  );

  // New View: Profile Search Results (Step 4)
  const renderProfileRecommendations = () => (
      <div className="animate-fade-in space-y-8 pb-12">
          <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div>
                  <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                      <ListFilter className="w-6 h-6 text-emerald-600" />
                      为您找到的匹配岗位
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">
                      基于您的专业 <span className="font-bold text-slate-700">{userProfile.major}</span> 和学历 <span className="font-bold text-slate-700">{userProfile.degree}</span> 检索到的 Top {recommendationList.length} 个结果。
                  </p>
              </div>
              <button 
                onClick={() => { setStep(1); setRecommendationList([]); }}
                className="px-5 py-2.5 bg-gray-50 border border-gray-200 text-slate-600 font-medium rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                重新搜索
              </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recommendationList.map((job, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => openJobDetail({
                        department: job.dept_name,
                        position: job.job_name,
                        matchScore: Math.round((job.similarity || 0.8) * 100),
                        reason: "基于专业和学历要求的匹配",
                        originalData: job
                    })}
                    className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all cursor-pointer group"
                  >
                      <div className="flex justify-between items-start mb-3">
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                              匹配度 {Math.round((job.similarity || 0.8) * 100)}%
                          </span>
                          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 mb-1">{job.job_name}</h3>
                      <p className="text-sm text-slate-500 mb-4 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {job.dept_name} {job.sub_dept ? ` · ${job.sub_dept}` : ''}
                      </p>
                      
                      <div className="space-y-2 text-sm bg-slate-50 p-3 rounded-lg border border-gray-50">
                          <p className="line-clamp-1"><span className="text-slate-400">专业：</span>{job.major_req}</p>
                          <p><span className="text-slate-400">学历：</span>{job.degree_req}</p>
                          <p className="line-clamp-1"><span className="text-slate-400">备注：</span>{job.remarks || '无'}</p>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderJobModal = () => {
    if (!selectedJob) return null;
    const applyUrl = detailedDbJob?.website || 'http://bm.scs.gov.cn/pp/gkweb/core/web/ui/business/home/gkhome.html';
    
    // Helper to render text or 'None'
    const val = (v: any) => v || '无';
    // Helper for boolean
    const boolVal = (v: boolean | undefined) => v === true ? '是' : '否';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl transform transition-all animate-in zoom-in-95 duration-200 overflow-hidden max-h-[90vh] flex flex-col">
             {/* Header */}
             <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-start bg-slate-50/50 shrink-0">
                <div>
                     <h3 className="text-xl font-bold text-slate-800 pr-4">{selectedJob.position}</h3>
                     <div className="flex flex-col gap-1 mt-1 text-slate-500 text-sm">
                        <span className="flex items-center gap-2 font-medium text-primary"><Building2 className="w-4 h-4" /> {selectedJob.department}</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                            <span className="text-xs bg-slate-200 px-2 py-0.5 rounded text-slate-600">职位代码: {detailedDbJob?.job_code || '无'}</span>
                            {detailedDbJob?.dept_code && (
                                <span className="text-xs bg-slate-200 px-2 py-0.5 rounded text-slate-600">部门代码: {detailedDbJob.dept_code}</span>
                            )}
                            {detailedDbJob?.sub_dept && (
                                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">用人司局: {detailedDbJob.sub_dept}</span>
                            )}
                        </div>
                     </div>
                </div>
                <button 
                    onClick={() => setSelectedJob(null)}
                    className="p-2 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors border border-gray-100 shadow-sm"
                >
                    <X className="w-5 h-5" />
                </button>
             </div>

             {/* Content - Scrollable */}
             <div className="p-6 space-y-8 overflow-y-auto">
                {/* 1. 机构与职位概况 */}
                <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2 border-l-4 border-primary pl-2">
                        <Briefcase className="w-4 h-4 text-primary" />
                        机构与职位概况
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 rounded-xl p-4 border border-gray-100 text-sm">
                         <div>
                             <p className="text-xs text-slate-400 mb-1">机构性质</p>
                             <p className="font-medium text-slate-700">{val(detailedDbJob?.org_nature)}</p>
                         </div>
                         <div>
                             <p className="text-xs text-slate-400 mb-1">职位属性</p>
                             <p className="font-medium text-slate-700">{val(detailedDbJob?.job_attr)}</p>
                         </div>
                         <div>
                             <p className="text-xs text-slate-400 mb-1">招考人数</p>
                             <p className="font-bold text-emerald-600 flex items-center gap-1">
                                <Users className="w-3 h-3" /> {detailedDbJob?.recruit_count || 1} 人
                             </p>
                         </div>
                         <div className="col-span-2">
                             <p className="text-xs text-slate-400 mb-1">职位简介</p>
                             <p className="text-slate-600 leading-relaxed">{val(detailedDbJob?.job_desc)}</p>
                         </div>
                    </div>
                </div>

                {/* 2. 报考门槛 (Hard Constraints) */}
                <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2 border-l-4 border-emerald-500 pl-2">
                        <GraduationCap className="w-4 h-4 text-emerald-500" />
                        报考硬性门槛
                    </h4>
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden text-sm">
                         <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100">
                             <div className="p-3">
                                 <p className="text-xs text-slate-400">学历要求</p>
                                 <p className="font-medium text-slate-700 mt-0.5">{val(detailedDbJob?.degree_req)}</p>
                             </div>
                             <div className="p-3">
                                 <p className="text-xs text-slate-400">学位要求</p>
                                 <p className="font-medium text-slate-700 mt-0.5">{val(detailedDbJob?.degree_type)}</p>
                             </div>
                         </div>
                         <div className="p-3 border-b border-gray-100">
                             <p className="text-xs text-slate-400">专业要求</p>
                             <p className="font-medium text-primary mt-0.5">{val(detailedDbJob?.major_req)}</p>
                         </div>
                         <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100">
                             <div className="p-3">
                                 <p className="text-xs text-slate-400">政治面貌</p>
                                 <p className="font-medium text-slate-700 mt-0.5">{val(detailedDbJob?.politic_req)}</p>
                             </div>
                             <div className="p-3">
                                 <p className="text-xs text-slate-400">基层工作最低年限</p>
                                 <p className="font-medium text-slate-700 mt-0.5">{val(detailedDbJob?.exp_years)}</p>
                             </div>
                         </div>
                         <div className="p-3 bg-emerald-50/50">
                             <p className="text-xs text-slate-400">服务基层项目工作经历</p>
                             <p className="font-medium text-emerald-700 mt-0.5">{val(detailedDbJob?.exp_proj)}</p>
                         </div>
                    </div>
                </div>

                {/* 3. 考试与录用 (Exam Info) */}
                <div>
                     <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2 border-l-4 border-amber-500 pl-2">
                        <ClipboardList className="w-4 h-4 text-amber-500" />
                        考试核心情报
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex justify-between items-center">
                             <span className="text-sm text-amber-800 font-medium">面试人员比例</span>
                             <span className="text-lg font-bold text-amber-600">{val(detailedDbJob?.interview_ratio)}</span>
                         </div>
                         <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex justify-between items-center">
                             <span className="text-sm text-amber-800 font-medium">专业能力测试</span>
                             <span className={`text-sm font-bold px-2 py-0.5 rounded ${detailedDbJob?.has_pro_test ? 'bg-amber-200 text-amber-800' : 'bg-white text-slate-400'}`}>
                                 {boolVal(detailedDbJob?.has_pro_test)}
                             </span>
                         </div>
                    </div>
                </div>

                {/* 4. 工作地点与备注 */}
                <div>
                     <div className="flex gap-6 text-sm mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        {detailedDbJob?.work_loc && <p className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> <span className="text-slate-500">工作地点:</span> <span className="font-medium text-slate-700">{detailedDbJob.work_loc}</span></p>}
                        {detailedDbJob?.settle_loc && <p className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> <span className="text-slate-500">落户地点:</span> <span className="font-medium text-slate-700">{detailedDbJob.settle_loc}</span></p>}
                     </div>
                     <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                        <p className="text-xs font-bold text-red-600 mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> 重要备注</p>
                        <p className="text-sm text-red-800 leading-relaxed">{val(detailedDbJob?.remarks)}</p>
                     </div>
                </div>

                {/* 5. 咨询方式 */}
                <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2 border-l-4 border-blue-500 pl-2">
                        <Phone className="w-4 h-4 text-blue-500" />
                        咨询方式
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         {detailedDbJob?.phones && detailedDbJob.phones.length > 0 ? (
                             detailedDbJob.phones.map((phone, idx) => (
                                <div key={idx} className="flex items-center gap-2 p-3 bg-blue-50/50 rounded-lg border border-blue-50 text-sm text-blue-700 font-mono">
                                    <Phone className="w-3 h-3" /> {phone}
                                </div>
                             ))
                         ) : (
                             <div className="text-sm text-slate-400 p-2">暂无咨询电话信息</div>
                         )}
                    </div>
                     {detailedDbJob?.website && (
                         <div className="mt-2 text-sm">
                             <span className="text-slate-500 mr-2">部门网站:</span>
                             <a href={detailedDbJob.website} target="_blank" rel="noreferrer" className="text-blue-600 underline truncate hover:text-blue-800">
                                 {detailedDbJob.website}
                             </a>
                         </div>
                     )}
                </div>

             </div>

             {/* Footer - Fixed */}
             <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                <button 
                    onClick={() => setSelectedJob(null)}
                    className="px-5 py-2.5 text-slate-500 font-medium hover:bg-white hover:shadow-sm rounded-xl transition-all"
                >
                    关闭
                </button>
                <button 
                    className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-600 hover:shadow-blue-300 transition-all active:scale-95 flex items-center gap-2"
                    onClick={() => window.open(applyUrl, '_blank')}
                >
                    去报名
                    <ExternalLink className="w-4 h-4" />
                </button>
             </div>
        </div>
      </div>
    );
  };

  const renderResult = (res: MatchResult) => {
    const chartData = [
        { name: 'Match', value: res.score },
        { name: 'Gap', value: 100 - res.score }
    ];
    const COLORS = ['#2563EB', '#E2E8F0'];

    return (
      <div className="animate-fade-in space-y-8 pb-12">
        {/* Main Report Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="w-48 h-48 relative shrink-0 flex items-center justify-center">
                    <PieChart width={192} height={192}>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                            stroke="none"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                    </PieChart>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className={`text-3xl font-bold ${res.score >= 80 ? 'text-primary' : res.score >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                            {res.score}%
                        </span>
                        <span className="text-xs text-slate-400 font-medium">AI 匹配度</span>
                    </div>
                </div>
                
                <div className="flex-1 space-y-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                            岗位评估报告
                            <span className={`text-sm font-bold px-3 py-1 rounded-full border ${res.eligible ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                {res.eligible ? '✅ 建议报考' : '❌ 不建议报考'}
                            </span>
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="bg-blue-50 text-blue-600 text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                <Database className="w-3 h-3" /> 数据来源: Supabase 实时数据库
                            </span>
                            <span className="text-slate-400 text-sm">已对比 {dbCount} 个相似岗位</span>
                        </div>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <h4 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            智能综合评价
                        </h4>
                        <p className="text-sm text-blue-700 leading-relaxed text-justify">{res.analysis}</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hard Constraints */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 pb-2 border-b border-gray-50">
                    <CheckCircle className="w-5 h-5 text-emerald-500" /> 硬性条件核验
                </h3>
                <div className="space-y-4">
                    {res.hardConstraints.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            {item.passed ? (
                                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            ) : (
                                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            )}
                            <div>
                                <p className="font-medium text-slate-700">{item.name}</p>
                                <p className="text-sm text-slate-500 leading-snug">{item.details}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Soft Constraints & Suggestions */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 pb-2 border-b border-gray-50">
                    <AlertTriangle className="w-5 h-5 text-amber-500" /> 软性指标与提升建议
                </h3>
                <div className="space-y-4">
                    {res.softConstraints.map((item, idx) => (
                        <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${item.passed ? 'border-emerald-500 bg-emerald-50/30' : 'border-amber-500 bg-amber-50/30'}`}>
                            <div className="w-full">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="font-medium text-slate-700">{item.name}</p>
                                    {!item.passed && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">注意</span>}
                                </div>
                                <p className="text-sm text-slate-600 mb-1">{item.details}</p>
                                {item.suggestion && (
                                    <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-black/5 italic flex items-center gap-1">
                                        💡 建议：{item.suggestion}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                     {res.softConstraints.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 py-4">
                            <span className="text-sm">暂无特别的优先或限制条件</span>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* New Feature: Recommended Jobs */}
        {res.otherRecommendedJobs && res.otherRecommendedJobs.length > 0 && (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 shadow-sm border border-indigo-100">
                <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                    <Database className="w-5 h-5 text-indigo-600" /> 
                    AI 精选：知识库高匹配岗位推荐
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {res.otherRecommendedJobs.map((job, idx) => (
                        <div 
                            key={idx} 
                            onClick={() => openJobDetail(job)}
                            className="bg-white p-4 rounded-xl border border-indigo-50 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group relative"
                        >
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div className="flex justify-between items-start mb-2 pr-6">
                                <div className="text-xs font-bold text-white bg-indigo-500 px-2 py-0.5 rounded">
                                    推荐 {idx + 1}
                                </div>
                                <div className="text-lg font-bold text-emerald-600">{job.matchScore}%</div>
                            </div>
                            <h4 className="font-bold text-slate-800 text-sm mb-1 line-clamp-1" title={job.position}>{job.position}</h4>
                            <p className="text-xs text-slate-500 mb-3 line-clamp-1" title={job.department}>{job.department}</p>
                            <div className="pt-3 border-t border-gray-50 text-xs text-slate-600 leading-relaxed bg-gray-50 p-2 rounded">
                                <span className="text-indigo-500 font-bold">推荐理由：</span>
                                <span className="line-clamp-2">{job.reason}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        <div className="flex justify-center pt-4">
            <button 
                onClick={() => { setStep(1); setResult(null); }}
                className="px-8 py-3 bg-white border border-gray-200 shadow-sm rounded-xl text-slate-600 font-medium hover:bg-gray-50 hover:text-primary hover:border-blue-200 transition-all flex items-center gap-2"
            >
                <RotateCcw className="w-4 h-4" />
                重新分析其他岗位
            </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
        <header className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">智能岗位资格匹配</h1>
            <p className="text-slate-500 mt-2">请确认您的个人画像，并输入目标岗位要求。AI 专家将从 Supabase 知识库中为您进行深度比对并推荐相似岗位。</p>
        </header>

        {step === 1 && renderInput()}
        {step === 2 && renderParsing()}
        {step === 3 && result && renderResult(result)}
        {step === 4 && renderProfileRecommendations()}
        {renderJobModal()}
    </div>
  );
};

export default JobMatching;
