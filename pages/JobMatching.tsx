
import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, CheckCircle, AlertTriangle, XCircle, FileText, ArrowRight, Edit3, 
  RotateCcw, Loader2, Sparkles, Building2, X, ExternalLink, MapPin, Phone, 
  Users, Database, Search, ListFilter, Briefcase, GraduationCap, ClipboardList, 
  ChevronRight, Info, Award, Calendar, CheckSquare, Square, Target
} from 'lucide-react';
import { analyzeJobMatch, searchSimilarJobs } from '../services/geminiService';
import { MatchResult, UserProfile, PublicServiceJobDB } from '../types';

interface JobMatchingProps {
  userProfile: UserProfile;
  onProfileChange: (profile: UserProfile) => void;
}

const JobMatching: React.FC<JobMatchingProps> = ({ userProfile, onProfileChange }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); 
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  const [jobText, setJobText] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [recommendationList, setRecommendationList] = useState<PublicServiceJobDB[]>([]);
  const [loadingText, setLoadingText] = useState<string>("AI 专家已就绪");
  const [selectedJob, setSelectedJob] = useState<PublicServiceJobDB | null>(null);

  useEffect(() => {
    if (selectedJob) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [selectedJob]);

  const handleAnalysis = async () => {
    if (!jobText.trim()) { setError("请先输入或粘贴岗位要求文本"); return; }
    setStep(2); setLoadingText("正在深度分析岗位契合度并排雷..."); setError('');
    try {
      const dbCandidates = await searchSimilarJobs(userProfile);
      setStep(4); 
      setRecommendationList(dbCandidates);
    } catch (err) { 
      setError("分析失败，请稍后重试。"); 
      setStep(1); 
    }
  };

  const handleProfileSearch = async () => {
      setStep(2); setLoadingText("正在从全量知识库为您匹配真实岗位...");
      try {
          const jobs = await searchSimilarJobs(userProfile);
          if (jobs && jobs.length > 0) { 
            setRecommendationList(jobs); 
            setStep(4); 
          } else { 
            setError(`未找到相关岗位。请核对您的专业【${userProfile.major}】。`); 
            setStep(1); 
          }
      } catch (err) { 
        setError("系统忙，请稍后再试。"); 
        setStep(1); 
      }
  };

  // 智能跳转逻辑：处理不规范的 URL，提供官方兜底
  const handleApplyUrl = (url?: string) => {
    // 官方统一报名入口兜底
    const FALLBACK_URL = 'http://bm.scs.gov.cn/pp/gkweb/core/web/ui/business/home/gkhome.html';
    
    if (!url || url.trim() === '#' || url.trim().length < 5) {
      window.open(FALLBACK_URL, '_blank');
      return;
    }

    let targetUrl = url.trim();
    // 补全协议头，防止被识别为相对路径导致 404
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }
    
    window.open(targetUrl, '_blank');
  };

  const renderJobDetailModal = () => {
    if (!selectedJob) return null;
    const job = selectedJob;
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in">
        <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-white/20 animate-soft">
          <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-start bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2 mb-2">
                  <span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">官方录入岗位数据</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 leading-tight mb-2">{job.job_name || '职位名称未获取'}</h3>
              <p className="text-primary font-bold flex items-center gap-2 text-lg">
                <Building2 className="w-5 h-5" /> {job.dept_name || '招录部门未获取'}
              </p>
            </div>
            <button 
              onClick={() => setSelectedJob(null)} 
              className="p-3 bg-white hover:bg-slate-100 rounded-full text-slate-400 transition-all border border-slate-100 shadow-sm"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-10 overflow-y-auto custom-scrollbar space-y-10 flex-1 text-left">
              <section>
                  <h4 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-primary rounded-full"></div> 机构与职位概况
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 text-left">
                          <p className="text-[11px] text-slate-400 font-bold mb-1 uppercase tracking-wider text-left">机构性质</p>
                          <p className="text-base font-bold text-slate-700">{job.org_nature || '行政机关'}</p>
                      </div>
                      <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 text-left">
                          <p className="text-[11px] text-slate-400 font-bold mb-1 uppercase tracking-wider text-left">职位属性</p>
                          <p className="text-base font-bold text-slate-700">{job.job_attr || '普通职位'}</p>
                      </div>
                      <div className="bg-emerald-50/50 p-5 rounded-3xl border border-emerald-100 flex items-center justify-between">
                          <div className="text-left">
                              <p className="text-[11px] text-emerald-600/60 font-bold mb-1 uppercase tracking-wider text-left">招考人数</p>
                              <p className="text-xl font-black text-emerald-600">共 {job.recruit_count || 1} 人</p>
                          </div>
                      </div>
                  </div>
              </section>

              <section>
                  <h4 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2 text-left">
                    <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div> 报考硬性门槛
                  </h4>
                  <div className="bg-slate-50/80 p-8 rounded-[2rem] border border-slate-100 space-y-6 text-left">
                      <div className="grid grid-cols-2 gap-8 text-left">
                          <div className="text-left">
                              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-1 block text-left">学历要求</span>
                              <p className="text-base font-bold text-slate-700">{job.degree_req || '本科及以上'}</p>
                          </div>
                          <div className="text-left">
                              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-1 block text-left">学位要求</span>
                              <p className="text-base font-bold text-slate-700">{job.degree_type || '学士及以上'}</p>
                          </div>
                      </div>
                      <div className="pt-6 border-t border-slate-200 text-left">
                          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-3 block text-left">专业要求原文</span>
                          <p className="text-base font-bold text-primary leading-relaxed bg-white p-5 rounded-2xl border border-indigo-50 shadow-sm">
                            {job.major_req || '不限专业'}
                          </p>
                      </div>
                  </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                      <div className="p-2 bg-white rounded-lg shadow-sm"><MapPin className="w-4 h-4 text-primary" /></div>
                      工作地点: {job.work_loc || '详见公告'}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                      <div className="p-2 bg-white rounded-lg shadow-sm"><Phone className="w-4 h-4 text-indigo-400" /></div>
                      咨询方式: {Array.isArray(job.phones) ? job.phones[0] : (job.phones || '详见招录官网')}
                  </div>
              </div>

              {job.remarks && (
                <div className="bg-red-50 p-6 rounded-3xl border border-red-100 text-left">
                  <h5 className="text-red-600 font-bold text-xs mb-3 flex items-center gap-2 uppercase tracking-widest text-left">
                    <AlertTriangle className="w-4 h-4" /> 重要报考备注
                  </h5>
                  <p className="text-sm text-red-500 leading-relaxed font-medium">{job.remarks}</p>
                </div>
              )}
          </div>

          <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4 items-center shadow-inner">
              <button 
                onClick={() => setSelectedJob(null)} 
                className="px-8 py-4 text-slate-500 font-bold hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-200"
              >
                取消
              </button>
              <button 
                className="px-10 py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-600 transition-all flex items-center gap-3 active:scale-95"
                onClick={() => handleApplyUrl(job.website)}
              >
                立即去报名 <ExternalLink className="w-5 h-5" />
              </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      <div className="p-10 max-w-7xl mx-auto space-y-12 animate-soft pb-24">
          <header>
              <h1 className="text-4xl font-bold text-slate-800 tracking-tight text-left">智能岗位资格匹配</h1>
              <p className="text-slate-400 mt-3 text-lg font-medium leading-relaxed text-left">请确认您的报考画像，AI 专家将从知识库中为您进行“硬性门槛+软性备注”的深度比对。</p>
          </header>

          {step === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
                  <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8 sticky top-10">
                      <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                        <Edit3 className="w-6 h-6 text-primary" /> 完善报考画像
                      </h2>
                      <div className="space-y-6">
                          {/* Grid for compact fields */}
                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2 text-left">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block text-left">性别</label>
                                  <select 
                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none appearance-none" 
                                    value={userProfile.gender} 
                                    onChange={e => onProfileChange({...userProfile, gender: e.target.value})}
                                  >
                                    <option>男</option><option>女</option>
                                  </select>
                              </div>
                              <div className="space-y-2 text-left">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block text-left">身份</label>
                                  <select 
                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none appearance-none" 
                                    value={userProfile.isFreshGrad ? '应届' : '往届'} 
                                    onChange={e => onProfileChange({...userProfile, isFreshGrad: e.target.value === '应届'})}
                                  >
                                    <option value="应届">应届毕业生</option>
                                    <option value="往届">社会人员/往届</option>
                                  </select>
                              </div>
                          </div>

                          <div className="space-y-2 text-left">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block text-left">最高学历</label>
                              <select 
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none appearance-none" 
                                value={userProfile.degree} 
                                onChange={e => onProfileChange({...userProfile, degree: e.target.value})}
                              >
                                <option>大专</option><option>本科</option><option>硕士研究生</option><option>博士研究生</option>
                              </select>
                          </div>

                          <div className="space-y-2 text-left">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block text-left">具体专业 (关键)</label>
                              <input 
                                type="text" 
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/10 transition-all" 
                                value={userProfile.major} 
                                onChange={e => onProfileChange({...userProfile, major: e.target.value})} 
                                placeholder="例如：法学、计算机科学与技术" 
                              />
                          </div>

                          <div className="space-y-2 text-left">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block text-left">政治面貌</label>
                              <select 
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" 
                                value={userProfile.politicalStatus} 
                                onChange={e => onProfileChange({...userProfile, politicalStatus: e.target.value})}
                              >
                                <option>群众</option><option>共青团员</option><option>预备党员</option><option>中共党员</option>
                              </select>
                          </div>

                          <div className="pt-4 border-t border-slate-50">
                             <button 
                                onClick={handleProfileSearch} 
                                className="w-full py-4 bg-emerald-50 text-emerald-600 font-bold rounded-2xl hover:bg-emerald-100 transition-all text-sm flex items-center justify-center gap-2 border border-emerald-100 active:scale-95"
                             >
                                <Search className="w-4 h-4" /> 一键检索适配岗位
                             </button>
                          </div>
                      </div>
                  </div>

                  <div className="lg:col-span-2 space-y-8">
                      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                          <div className="flex bg-slate-50/50 p-2 border-b border-slate-100">
                             <button onClick={() => setActiveTab('text')} className={`flex-1 py-4 text-sm font-bold rounded-2xl transition-all ${activeTab === 'text' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>岗位匹配模式 (粘贴公告文本)</button>
                             <button onClick={() => setActiveTab('file')} className={`flex-1 py-4 text-sm font-bold rounded-2xl transition-all ${activeTab === 'file' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>上传图片识别 (OCR)</button>
                          </div>
                          <div className="p-10 h-[420px]">
                              {activeTab === 'text' ? (
                                <textarea 
                                  className="w-full h-full p-8 bg-slate-50/50 border border-slate-100 rounded-[2rem] focus:bg-white focus:ring-4 focus:ring-primary/5 resize-none font-medium text-sm leading-relaxed outline-none transition-all" 
                                  placeholder="您可以粘贴职位表中的一行，或者某个岗位的具体要求文本。AI 将帮您分析该岗位是否适合您（包含对备注栏中性别、应届生、四六级要求的语义分析）。" 
                                  value={jobText} 
                                  onChange={(e) => setJobText(e.target.value)} 
                                />
                              ) : (
                                  <div className="h-full border-4 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/30 flex flex-col items-center justify-center group hover:bg-slate-50 transition-all cursor-pointer">
                                      <UploadCloud className="w-16 h-16 text-slate-200 group-hover:text-primary transition-all" />
                                      <p className="mt-4 text-slate-400 font-bold">点击上传招考公告图片进行 OCR 识别</p>
                                  </div>
                              )}
                          </div>
                          <div className="px-10 pb-10">
                            <button 
                              onClick={handleAnalysis} 
                              className="w-full py-5 bg-primary text-white rounded-[2rem] shadow-2xl shadow-indigo-200 hover:bg-indigo-600 active:scale-[0.98] transition-all font-bold text-lg flex items-center justify-center gap-3"
                            >
                              <Sparkles className="w-6 h-6" /> 开始深度匹配
                            </button>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {step === 2 && (
              <div className="py-40 flex flex-col items-center justify-center animate-soft">
                  <div className="w-24 h-24 border-[12px] border-slate-100 border-t-primary rounded-full animate-spin"></div>
                  <p className="mt-10 text-2xl font-black text-slate-700 tracking-tight">{loadingText}</p>
                  <p className="text-slate-400 mt-2 font-medium">正为您锁定 2026 年度最新职位数据...</p>
              </div>
          )}

          {step === 4 && (
              <div className="animate-soft space-y-10">
                  <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="text-left">
                          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3 text-left">
                            <div className="p-3 bg-emerald-50 rounded-2xl"><ListFilter className="w-6 h-6 text-emerald-600" /></div>
                            匹配岗位结果
                          </h2>
                          <p className="text-slate-400 mt-2 font-medium ml-16 text-left">根据专业 <span className="text-slate-600 font-bold">{userProfile.major}</span> 和画像为您找到以下适配职位：</p>
                      </div>
                      <button onClick={() => setStep(1)} className="px-10 py-4 bg-slate-50 rounded-[1.5rem] text-slate-500 font-bold text-sm hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-slate-100 flex items-center gap-2">
                        <RotateCcw className="w-5 h-5" /> 重新搜索
                      </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      {recommendationList.map((job, idx) => (
                          <div 
                            key={idx} 
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedJob(job);
                            }} 
                            className="bg-white p-10 rounded-[3.5rem] border border-slate-100 hover:shadow-2xl hover:border-primary/20 transition-all cursor-pointer group flex flex-col h-full shadow-sm relative overflow-hidden text-left"
                          >
                              <div className="flex justify-between items-start mb-6">
                                 <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full uppercase tracking-tighter shadow-sm border border-emerald-100">匹配度 {Math.round((job.similarity || 0.65) * 100)}%</span>
                                 <ChevronRight className="w-6 h-6 text-slate-200 group-hover:text-primary transition-all translate-x-2" />
                              </div>
                              <h3 className="font-bold text-slate-800 text-xl group-hover:text-primary mb-3 line-clamp-2 leading-tight transition-colors text-left">{job.job_name}</h3>
                              <p className="text-sm text-slate-400 flex items-center gap-2 font-bold mb-8 italic text-left">
                                <Building2 className="w-4 h-4" /> {job.dept_name}
                              </p>
                              
                              <div className="bg-slate-50/50 p-8 rounded-[2.5rem] space-y-4 flex-1 border border-slate-50 group-hover:bg-white transition-colors text-left">
                                  <div className="flex gap-6 items-start text-left">
                                     <span className="text-[11px] font-black text-slate-300 uppercase shrink-0 pt-1 tracking-widest text-left">专业:</span>
                                     <p className="text-xs font-bold text-slate-500 line-clamp-2 leading-relaxed text-left">{job.major_req}</p>
                                  </div>
                                  <div className="flex gap-6 items-start text-left">
                                     <span className="text-[11px] font-black text-slate-300 uppercase shrink-0 pt-1 tracking-widest text-left">学历:</span>
                                     <p className="text-xs font-bold text-slate-500 text-left">{job.degree_req}</p>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {error && (
            <div className="p-8 bg-red-50 text-red-600 rounded-3xl border border-red-100 flex items-center gap-4 animate-soft max-w-2xl mx-auto">
               <AlertTriangle className="w-8 h-8 opacity-40" />
               <div className="flex-1 font-bold">{error}</div>
               <button onClick={() => setError('')} className="p-2 hover:bg-red-100 rounded-full"><X className="w-4 h-4" /></button>
            </div>
          )}
      </div>

      {/* 确保弹窗在最顶层渲染，不被动画容器包裹 */}
      {selectedJob && renderJobDetailModal()}
    </div>
  );
};

export default JobMatching;
