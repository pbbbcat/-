
import React, { useState, useEffect, useRef } from 'react';
import { 
  UploadCloud, CheckCircle, AlertTriangle, XCircle, FileText, ArrowRight, Edit3, 
  RotateCcw, Loader2, Sparkles, Building2, X, ExternalLink, MapPin, Phone, 
  Users, Database, Search, ListFilter, Briefcase, GraduationCap, ClipboardList, 
  ChevronRight, Info, Award, Calendar, CheckSquare, Square, Target, FileImage, Medal, Plus, ScanLine
} from 'lucide-react';
import { analyzeJobMatch, searchSimilarJobs, extractJobFromImage } from '../services/geminiService';
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
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [loadingText, setLoadingText] = useState<string>("AI 专家已就绪");
  const [selectedJob, setSelectedJob] = useState<PublicServiceJobDB | null>(null);
  
  // Custom Cert Input State
  const [customCert, setCustomCert] = useState<string>('');

  // File Upload & OCR State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedJob, setExtractedJob] = useState<Partial<PublicServiceJobDB> | null>(null);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);

  // Available Certificates Options
  const CERTIFICATE_OPTIONS = ['英语四级', '英语六级', '计算机二级', '法律职业资格A证', 'CPA/会计证'];

  useEffect(() => {
    if (selectedJob) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [selectedJob]);

  // 工具函数：文件转 Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // 移除前缀 (data:image/png;base64,)
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleStartAnalysis = async () => {
    if (activeTab === 'text') {
        if (!jobText.trim()) { setError("请先输入或粘贴岗位要求文本"); return; }
        setStep(2); 
        setLoadingText("正在深度分析岗位契合度并排雷..."); 
        setError('');
        
        try {
          const result = await analyzeJobMatch(jobText, userProfile);
          setMatchResult(result);
          setStep(3); 
        } catch (err) { 
          setError("分析失败，请稍后重试。"); 
          setStep(1); 
        }
    } else {
        // OCR Image Analysis Flow
        if (!selectedFile) { setError("请先上传图片"); return; }
        
        // Phase 1: OCR Extraction
        setIsOcrProcessing(true);
        setError('');
        
        try {
            const base64 = await fileToBase64(selectedFile);
            const extracted = await extractJobFromImage(base64, selectedFile.type);
            setExtractedJob(extracted);
            setIsOcrProcessing(false);
            // Don't change main 'step' yet, we show the edit UI in step 1 context or overlay
        } catch (err) {
            setError("图片识别失败，请确保图片清晰或使用文本模式。");
            setIsOcrProcessing(false);
        }
    }
  };

  const handleConfirmExtractedData = async () => {
      if (!extractedJob) return;
      
      // Phase 2: Deep Match using verified data
      setStep(2);
      setLoadingText("正在基于您确认的岗位信息进行深度匹配...");
      setExtractedJob(null); // Clear extraction UI

      try {
          // Convert structured object back to descriptive string for the analysis prompt
          const textRepresentation = `
            职位: ${extractedJob.job_name || '未识别'}
            部门: ${extractedJob.dept_name || '未识别'}
            专业要求: ${extractedJob.major_req || '不限'}
            学历要求: ${extractedJob.degree_req || '不限'}
            政治面貌: ${extractedJob.politic_req || '不限'}
            备注/其他要求: ${extractedJob.remarks || '无'}
          `;
          
          const result = await analyzeJobMatch(textRepresentation, userProfile);
          setMatchResult(result);
          setStep(3);
      } catch (err) {
          setError("分析失败，请重试。");
          setStep(1);
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setSelectedFile(e.target.files[0]);
          setError('');
          setExtractedJob(null); // Reset previous extraction
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
            setError(`未找到相关岗位。请核对您的专业【${userProfile.major}】或调整筛选条件。`); 
            setStep(1); 
          }
      } catch (err) { 
        setError("系统忙，请稍后再试。"); 
        setStep(1); 
      }
  };

  const toggleCertificate = (cert: string) => {
      const current = userProfile.certificates || [];
      if (current.includes(cert)) {
          onProfileChange({ ...userProfile, certificates: current.filter(c => c !== cert) });
      } else {
          onProfileChange({ ...userProfile, certificates: [...current, cert] });
      }
  };
  
  const handleAddCustomCert = () => {
      if (!customCert.trim()) return;
      const cert = customCert.trim();
      const current = userProfile.certificates || [];
      if (!current.includes(cert)) {
          onProfileChange({ ...userProfile, certificates: [...current, cert] });
      }
      setCustomCert('');
  };

  // 智能跳转逻辑
  const handleApplyUrl = (url?: string) => {
    const FALLBACK_URL = 'http://bm.scs.gov.cn/pp/gkweb/core/web/ui/business/home/gkhome.html';
    if (!url || url.trim() === '#' || url.trim().length < 5) {
      window.open(FALLBACK_URL, '_blank');
      return;
    }
    let targetUrl = url.trim();
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
          {/* ... keeping existing modal content structure ... */}
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
              <button onClick={() => setSelectedJob(null)} className="px-8 py-4 text-slate-500 font-bold hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-200">取消</button>
              <button className="px-10 py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-600 transition-all flex items-center gap-3 active:scale-95" onClick={() => handleApplyUrl(job.website)}>立即去报名 <ExternalLink className="w-5 h-5" /></button>
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
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8 sticky top-10 max-h-[85vh] overflow-y-auto custom-scrollbar">
                      <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                        <Edit3 className="w-6 h-6 text-primary" /> 完善报考画像
                      </h2>
                      <div className="space-y-6">
                          {/* Grid for compact fields */}
                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2 text-left">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block text-left">性别</label>
                                  <select 
                                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none appearance-none" 
                                    value={userProfile.gender} 
                                    onChange={e => onProfileChange({...userProfile, gender: e.target.value})}
                                  >
                                    <option>男</option><option>女</option>
                                  </select>
                              </div>
                              <div className="space-y-2 text-left">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block text-left">身份</label>
                                  <select 
                                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none appearance-none" 
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
                                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none appearance-none" 
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
                                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/10 transition-all" 
                                value={userProfile.major} 
                                onChange={e => onProfileChange({...userProfile, major: e.target.value})} 
                                placeholder="例如：法学、计算机科学与技术" 
                              />
                          </div>

                          <div className="space-y-2 text-left">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block text-left">政治面貌</label>
                              <select 
                                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" 
                                value={userProfile.politicalStatus} 
                                onChange={e => onProfileChange({...userProfile, politicalStatus: e.target.value})}
                              >
                                <option>群众</option><option>共青团员</option><option>预备党员</option><option>中共党员</option>
                              </select>
                          </div>

                          <div className="space-y-2 text-left">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block text-left">基层工作经历</label>
                              <select 
                                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" 
                                value={userProfile.experienceYears} 
                                onChange={e => {
                                    const val = parseInt(e.target.value);
                                    onProfileChange({...userProfile, experienceYears: val, hasGrassrootsExperience: val > 0});
                                }}
                              >
                                <option value={0}>无基层工作经历</option>
                                <option value={1}>1 年</option>
                                <option value={2}>2 年及以上</option>
                                <option value={5}>5 年及以上</option>
                              </select>
                          </div>

                          <div className="space-y-2 text-left">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block text-left">拥有证书 (多选 & 自填)</label>
                              <div className="flex flex-wrap gap-2">
                                  {CERTIFICATE_OPTIONS.map(cert => {
                                      const active = (userProfile.certificates || []).includes(cert);
                                      return (
                                          <button
                                              key={cert}
                                              onClick={() => toggleCertificate(cert)}
                                              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                                                  active 
                                                  ? 'bg-indigo-50 text-indigo-600 border-indigo-200' 
                                                  : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'
                                              }`}
                                          >
                                              {cert}
                                          </button>
                                      );
                                  })}
                                  {(userProfile.certificates || []).filter(c => !CERTIFICATE_OPTIONS.includes(c)).map(cert => (
                                      <button
                                          key={cert}
                                          onClick={() => toggleCertificate(cert)}
                                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all bg-indigo-50 text-indigo-600 border-indigo-200 flex items-center gap-1 group"
                                      >
                                          {cert}
                                          <X className="w-3 h-3 group-hover:text-red-500" />
                                      </button>
                                  ))}
                              </div>
                              <div className="relative mt-2">
                                <input 
                                    type="text" 
                                    className="w-full p-3 pr-10 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-slate-300" 
                                    placeholder="输入其他证书 (如: 教师资格证)" 
                                    value={customCert}
                                    onChange={e => setCustomCert(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddCustomCert()}
                                />
                                <button 
                                    onClick={handleAddCustomCert}
                                    disabled={!customCert.trim()}
                                    className="absolute right-2 top-2 p-1.5 bg-white text-primary border border-slate-100 rounded-xl hover:bg-primary hover:text-white transition-all disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-primary"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                              </div>
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
                          <div className="p-10 min-h-[420px] flex flex-col">
                              {activeTab === 'text' ? (
                                <textarea 
                                  className="w-full h-full min-h-[300px] p-8 bg-slate-50/50 border border-slate-100 rounded-[2rem] focus:bg-white focus:ring-4 focus:ring-primary/5 resize-none font-medium text-sm leading-relaxed outline-none transition-all" 
                                  placeholder="您可以粘贴职位表中的一行，或者某个岗位的具体要求文本。AI 将帮您分析该岗位是否适合您（包含对备注栏中性别、应届生、四六级要求的语义分析）。" 
                                  value={jobText} 
                                  onChange={(e) => setJobText(e.target.value)} 
                                />
                              ) : extractedJob ? (
                                  <div className="space-y-6 animate-fade-in flex-1">
                                      <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                            <ScanLine className="w-5 h-5 text-emerald-500" />
                                            识别结果确认 (OCR)
                                        </h3>
                                        <button onClick={() => setExtractedJob(null)} className="text-xs text-slate-400 hover:text-primary font-bold">重新上传</button>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-4">
                                          <div>
                                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">职位名称</label>
                                              <input 
                                                className="w-full p-3 bg-slate-50 rounded-xl border border-transparent focus:bg-white focus:border-indigo-100 outline-none text-sm font-bold text-slate-700"
                                                value={extractedJob.job_name || ''}
                                                onChange={e => setExtractedJob({...extractedJob, job_name: e.target.value})}
                                              />
                                          </div>
                                          <div>
                                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">用人司局</label>
                                              <input 
                                                className="w-full p-3 bg-slate-50 rounded-xl border border-transparent focus:bg-white focus:border-indigo-100 outline-none text-sm font-bold text-slate-700"
                                                value={extractedJob.dept_name || ''}
                                                onChange={e => setExtractedJob({...extractedJob, dept_name: e.target.value})}
                                              />
                                          </div>
                                          <div className="col-span-2">
                                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">专业要求</label>
                                              <input 
                                                className="w-full p-3 bg-slate-50 rounded-xl border border-transparent focus:bg-white focus:border-indigo-100 outline-none text-sm font-bold text-slate-700"
                                                value={extractedJob.major_req || ''}
                                                onChange={e => setExtractedJob({...extractedJob, major_req: e.target.value})}
                                              />
                                          </div>
                                          <div>
                                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">学历要求</label>
                                              <input 
                                                className="w-full p-3 bg-slate-50 rounded-xl border border-transparent focus:bg-white focus:border-indigo-100 outline-none text-sm font-bold text-slate-700"
                                                value={extractedJob.degree_req || ''}
                                                onChange={e => setExtractedJob({...extractedJob, degree_req: e.target.value})}
                                              />
                                          </div>
                                          <div>
                                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">政治面貌</label>
                                              <input 
                                                className="w-full p-3 bg-slate-50 rounded-xl border border-transparent focus:bg-white focus:border-indigo-100 outline-none text-sm font-bold text-slate-700"
                                                value={extractedJob.politic_req || ''}
                                                onChange={e => setExtractedJob({...extractedJob, politic_req: e.target.value})}
                                              />
                                          </div>
                                          <div className="col-span-2">
                                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">其他备注 (含四六级/基层经历等)</label>
                                              <textarea 
                                                className="w-full p-3 bg-slate-50 rounded-xl border border-transparent focus:bg-white focus:border-indigo-100 outline-none text-sm font-medium text-slate-600 h-20 resize-none"
                                                value={extractedJob.remarks || ''}
                                                onChange={e => setExtractedJob({...extractedJob, remarks: e.target.value})}
                                              />
                                          </div>
                                      </div>
                                  </div>
                              ) : (
                                  <div 
                                      className="h-full border-4 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/30 flex flex-col items-center justify-center group hover:bg-slate-50 transition-all cursor-pointer relative min-h-[300px]"
                                      onClick={() => !isOcrProcessing && fileInputRef.current?.click()}
                                  >
                                      {isOcrProcessing ? (
                                        <div className="flex flex-col items-center animate-pulse">
                                            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                                            <p className="font-bold text-slate-600">正在进行 AI 结构化提取...</p>
                                            <p className="text-xs text-slate-400 mt-2">智能识别职位表关键信息字段</p>
                                        </div>
                                      ) : (
                                        <>
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                className="hidden" 
                                                ref={fileInputRef} 
                                                onChange={handleFileChange}
                                            />
                                            {selectedFile ? (
                                                <div className="flex flex-col items-center">
                                                    <FileImage className="w-16 h-16 text-primary mb-4" />
                                                    <p className="font-bold text-slate-700">{selectedFile.name}</p>
                                                    <p className="text-xs text-slate-400 mt-2">点击更换图片</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <UploadCloud className="w-16 h-16 text-slate-200 group-hover:text-primary transition-all" />
                                                    <p className="mt-4 text-slate-400 font-bold group-hover:text-primary transition-colors">点击上传招考公告/职位表截图</p>
                                                    <p className="mt-2 text-xs text-slate-300">支持手机拍照、截图自动结构化</p>
                                                </>
                                            )}
                                        </>
                                      )}
                                  </div>
                              )}
                          </div>
                          
                          <div className="px-10 pb-10 pt-2">
                             {activeTab === 'file' && extractedJob ? (
                                <button 
                                  onClick={handleConfirmExtractedData} 
                                  className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] shadow-2xl shadow-emerald-200 hover:bg-emerald-700 active:scale-[0.98] transition-all font-bold text-lg flex items-center justify-center gap-3"
                                >
                                  <CheckCircle className="w-6 h-6" /> 确认信息并深度匹配
                                </button>
                             ) : (
                                <button 
                                  onClick={handleStartAnalysis} 
                                  disabled={isOcrProcessing}
                                  className={`w-full py-5 rounded-[2rem] shadow-2xl transition-all font-bold text-lg flex items-center justify-center gap-3 ${
                                      isOcrProcessing 
                                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                                      : 'bg-primary text-white shadow-indigo-200 hover:bg-indigo-600 active:scale-[0.98]'
                                  }`}
                                >
                                  {activeTab === 'file' ? <ScanLine className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />} 
                                  {activeTab === 'file' ? '开始结构化识别 (OCR)' : '开始深度匹配'}
                                </button>
                             )}
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {step === 2 && (
              <div className="py-40 flex flex-col items-center justify-center animate-soft">
                  <div className="w-24 h-24 border-[12px] border-slate-100 border-t-primary rounded-full animate-spin"></div>
                  <p className="mt-10 text-2xl font-black text-slate-700 tracking-tight">{loadingText}</p>
                  <p className="text-slate-400 mt-2 font-medium">AI 引擎正在极速运算中...</p>
              </div>
          )}
          
          {/* Steps 3 and 4 remain unchanged in layout, but will use updated userProfile */}
          {/* ... (rest of the file remains similar) ... */}

          {/* STEP 3: Single Analysis Result (MatchResult) */}
          {step === 3 && matchResult && (
              <div className="animate-soft space-y-10">
                  <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                          <CheckSquare className="w-6 h-6 text-primary" />
                          深度匹配报告
                        </h2>
                        <p className="text-slate-400 mt-1 font-medium ml-1">基于您的画像与提供的岗位信息深度比对</p>
                      </div>
                      <button onClick={() => setStep(1)} className="px-8 py-3 bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 rounded-2xl text-slate-500 font-bold text-sm transition-all flex items-center gap-2">
                        <RotateCcw className="w-4 h-4" /> 重新分析
                      </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {/* Score Card */}
                      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 text-center flex flex-col items-center justify-center shadow-sm">
                          <div className="relative w-40 h-40 flex items-center justify-center">
                              <div className="absolute inset-0 rounded-full border-[12px] border-slate-50"></div>
                              <div 
                                className={`absolute inset-0 rounded-full border-[12px] border-l-transparent border-b-transparent rotate-45 ${matchResult.score >= 80 ? 'border-emerald-500' : matchResult.score >= 60 ? 'border-amber-500' : 'border-red-500'}`}
                                style={{ transform: `rotate(${matchResult.score * 3.6 - 180}deg)` }}
                              ></div>
                              <div className="text-center">
                                  <span className={`text-4xl font-black ${matchResult.score >= 80 ? 'text-emerald-600' : matchResult.score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{matchResult.score}</span>
                                  <span className="block text-xs font-bold text-slate-300 uppercase tracking-widest mt-1">匹配指数</span>
                              </div>
                          </div>
                          <div className={`mt-6 px-6 py-2 rounded-xl text-sm font-bold ${matchResult.eligible ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                              {matchResult.eligible ? '建议报考' : '建议谨慎报考'}
                          </div>
                      </div>

                      {/* Analysis Content */}
                      <div className="md:col-span-2 space-y-6">
                          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                  <Sparkles className="w-5 h-5 text-amber-500" /> AI 专家综合评语
                              </h3>
                              <p className="text-slate-600 leading-relaxed text-sm bg-slate-50 p-6 rounded-3xl border border-slate-50">
                                  {matchResult.analysis}
                              </p>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              {/* Hard Constraints */}
                              <div className="bg-white p-6 rounded-[2rem] border border-slate-100">
                                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                      <Target className="w-4 h-4 text-primary" /> 硬性门槛核查
                                  </h4>
                                  <div className="space-y-3">
                                      {matchResult.hardConstraints.map((item, i) => (
                                          <div key={i} className="flex items-start gap-3 text-xs">
                                              {item.passed ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> : <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                                              <div>
                                                  <span className="font-bold text-slate-700">{item.name}</span>
                                                  <p className="text-slate-400 mt-0.5">{item.details}</p>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </div>

                              {/* Soft Constraints */}
                              <div className="bg-white p-6 rounded-[2rem] border border-slate-100">
                                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                      <Info className="w-4 h-4 text-blue-500" /> 软性加分/避坑
                                  </h4>
                                  <div className="space-y-3">
                                      {matchResult.softConstraints.map((item, i) => (
                                          <div key={i} className="flex items-start gap-3 text-xs">
                                              {item.passed ? <CheckCircle className="w-4 h-4 text-blue-500 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
                                              <div>
                                                  <span className="font-bold text-slate-700">{item.name}</span>
                                                  <p className="text-slate-400 mt-0.5">{item.details}</p>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {/* STEP 4: Profile Search Result List (unchanged layout, just step logic) */}
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
