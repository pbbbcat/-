
import React, { useState } from 'react';
import { UploadCloud, CheckCircle, AlertTriangle, XCircle, FileText, ArrowRight, Edit3, RotateCcw, Loader2, Sparkles, Building2, X, ExternalLink, MapPin, Phone, Users, Database, Search, ListFilter, Briefcase, GraduationCap, ClipboardList } from 'lucide-react';
import { analyzeJobMatch, searchSimilarJobs } from '../services/geminiService';
import { supabase } from '../services/supabaseClient'; 
import { MatchResult, UserProfile, RecommendedJob, PublicServiceJobDB } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface JobMatchingProps {
  userProfile: UserProfile;
  onProfileChange: (profile: UserProfile) => void;
}

const JobMatching: React.FC<JobMatchingProps> = ({ userProfile, onProfileChange }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); 
  const [activeTab, setActiveTab] = useState<'upload' | 'text'>('text');
  const [jobText, setJobText] = useState<string>('');
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string>('');
  const [selectedJob, setSelectedJob] = useState<RecommendedJob | null>(null);
  const [detailedDbJob, setDetailedDbJob] = useState<PublicServiceJobDB | null>(null);
  const [dbCount, setDbCount] = useState<number>(0); 
  const [recommendationList, setRecommendationList] = useState<PublicServiceJobDB[]>([]);
  const [loadingText, setLoadingText] = useState<string>("AI 专家已就绪");

  const handleAnalysis = async () => {
    if (!jobText.trim()) { setError("请先输入或上传岗位要求文本"); return; }
    setStep(2);
    setLoadingText("正在连接 Supabase 知识库检索相似岗位...");
    setError('');
    try {
      const dbCandidates = await searchSimilarJobs(userProfile);
      setDbCount(dbCandidates.length);
      setLoadingText(`已分析 ${dbCandidates.length} 个基准样本，正在生成报告...`);
      const analysisResult = await analyzeJobMatch(jobText, userProfile, dbCandidates);
      setResult(analysisResult);
      setStep(3);
    } catch (err) {
      setError("分析服务暂时不可用，请检查网络。");
      setStep(1);
    }
  };

  const handleProfileSearch = async () => {
      setStep(2);
      setLoadingText("正在检索匹配岗位");
      try {
          const jobs = await searchSimilarJobs(userProfile);
          if (jobs && jobs.length > 0) {
              setRecommendationList(jobs);
              setStep(4);
          } else {
              setError(`未找到相关岗位。请尝试简化专业名称。`);
              setStep(1);
          }
      } catch (err) {
          setError("检索服务不可用");
          setStep(1);
      }
  };

  const renderInput = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-soft">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 h-fit">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3 mb-8">
             <Edit3 className="w-6 h-6 text-primary" />
             报考画像配置
        </h2>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">最高学历</label>
            <select 
              className="w-full p-4 bg-slate-50 border border-slate-50 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-primary/5 outline-none transition-all"
              value={userProfile.degree}
              onChange={e => onProfileChange({...userProfile, degree: e.target.value})}
            >
              <option>大专</option><option>本科</option><option>硕士研究生</option><option>博士研究生</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">具体专业</label>
            <input 
              type="text" 
              className="w-full p-4 bg-slate-50 border border-slate-50 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all"
              value={userProfile.major}
              onChange={e => onProfileChange({...userProfile, major: e.target.value})}
              placeholder="如：电子信息工程"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">政治面貌</label>
            <select 
              className="w-full p-4 bg-slate-50 border border-slate-50 rounded-2xl text-sm font-medium outline-none transition-all"
              value={userProfile.politicalStatus}
              onChange={e => onProfileChange({...userProfile, politicalStatus: e.target.value})}
            >
              <option>群众</option><option>共青团员</option><option>预备党员</option><option>中共党员</option>
            </select>
          </div>
          <button 
            onClick={handleProfileSearch}
            className="w-full py-4 bg-emerald-50 text-emerald-600 font-bold rounded-2xl hover:bg-emerald-100 transition-all text-sm flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" /> 一键按画像找岗
          </button>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex bg-slate-50/50 p-2 border-b border-slate-50">
            {['text', 'upload'].map(tab => (
              <button 
                key={tab}
                className={`flex-1 py-4 text-sm font-bold rounded-2xl transition-all ${activeTab === tab ? 'bg-white text-primary shadow-sm shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
                onClick={() => setActiveTab(tab as any)}
              >
                {tab === 'text' ? '粘贴岗位要求文本' : '上传附件资料'}
              </button>
            ))}
          </div>

          <div className="p-8 h-[360px]">
            {activeTab === 'text' ? (
              <textarea 
                className="w-full h-full p-6 bg-slate-50/50 border border-slate-100 rounded-[2rem] focus:ring-4 focus:ring-primary/5 focus:bg-white resize-none font-medium text-sm leading-relaxed outline-none transition-all"
                placeholder="请粘贴目标岗位的招考要求详情，AI 专家将立即开始多维度比对..."
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full border-4 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer">
                <UploadCloud className="w-16 h-16 text-slate-200 mb-4" />
                <p className="text-slate-500 font-bold">拖拽 TXT 文件至此</p>
              </div>
            )}
          </div>
          <div className="px-8 pb-8">
             <button 
                onClick={handleAnalysis}
                className="w-full py-5 bg-primary text-white rounded-[2rem] shadow-xl shadow-indigo-100 hover:bg-indigo-600 active:scale-[0.98] transition-all font-bold text-lg flex items-center justify-center gap-3"
              >
                <Sparkles className="w-6 h-6" />
                开始 AI 精准比对报告
              </button>
          </div>
        </div>
        {error && <div className="p-6 bg-red-50 text-danger text-sm font-bold rounded-3xl border border-red-100 flex items-center gap-3"><AlertTriangle /> {error}</div>}
      </div>
    </div>
  );

  const renderResult = (res: MatchResult) => {
    const chartData = [{ name: 'M', value: res.score }, { name: 'G', value: 100 - res.score }];
    const COLORS = ['#5A67D8', '#F1F5F9'];

    return (
      <div className="animate-soft space-y-10 pb-20">
        <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-12 items-center">
            <div className="w-56 h-56 relative flex items-center justify-center bg-slate-50 rounded-full shadow-inner">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={chartData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                            {chartData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-4xl font-black text-slate-800">{res.score}%</span>
                    <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Match</span>
                </div>
            </div>
            
            <div className="flex-1 space-y-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">岗位契合度分析</h2>
                    <div className={`inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full text-sm font-bold ${res.eligible ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {res.eligible ? '✅ 强烈推荐报考' : '⚠️ 报考风险较大'}
                    </div>
                </div>
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-50 text-slate-600 leading-relaxed text-sm font-medium">
                    {res.analysis}
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-8 flex items-center gap-3">
                    <div className="w-2 h-6 bg-emerald-400 rounded-full"></div> 硬性资格校验
                </h3>
                <div className="space-y-6">
                    {res.hardConstraints.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-4">
                            <div className={`p-2 rounded-xl shrink-0 ${item.passed ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                                {item.passed ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                            </div>
                            <div>
                                <p className="font-bold text-slate-700">{item.name}</p>
                                <p className="text-xs text-slate-400 mt-1">{item.details}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-8 flex items-center gap-3">
                    <div className="w-2 h-6 bg-amber-400 rounded-full"></div> 竞争优劣评估
                </h3>
                <div className="space-y-4">
                    {res.softConstraints.map((item, idx) => (
                        <div key={idx} className="p-5 rounded-3xl bg-slate-50/50 border border-slate-50">
                            <p className="font-bold text-slate-700 text-sm mb-1">{item.name}</p>
                            <p className="text-xs text-slate-500">{item.details}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        
        <div className="flex justify-center">
            <button onClick={() => setStep(1)} className="px-10 py-4 bg-white border border-slate-200 text-slate-500 font-bold rounded-[2rem] hover:bg-slate-50 transition-all flex items-center gap-2">
                <RotateCcw className="w-4 h-4" /> 重新匹配其他岗位
            </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-10 max-w-6xl mx-auto space-y-12">
        <header>
            <h1 className="text-4xl font-bold text-slate-800 tracking-tight">智能岗检中心</h1>
            <p className="text-slate-400 mt-3 text-lg font-medium">利用大规模语言模型和真实岗位知识库，为您实时排雷并寻找最优选。</p>
        </header>

        {step === 1 && renderInput()}
        {step === 2 && (
            <div className="py-40 flex flex-col items-center justify-center animate-soft">
                <div className="w-20 h-20 border-8 border-slate-100 border-t-primary rounded-full animate-spin"></div>
                <p className="mt-8 text-xl font-bold text-slate-700">{loadingText}</p>
            </div>
        )}
        {step === 3 && result && renderResult(result)}
        {step === 4 && (
            <div className="animate-soft space-y-8">
                <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">匹配结果列表</h2>
                        <p className="text-slate-400 mt-1 font-medium">基于您的专业与学历筛选出的高契合度岗位</p>
                    </div>
                    <button onClick={() => setStep(1)} className="px-6 py-2 bg-slate-50 rounded-full text-slate-500 font-bold text-sm">返回修改画像</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {recommendationList.map((job, idx) => (
                        <div key={idx} onClick={() => { setDetailedDbJob(job); setSelectedJob({ department: job.dept_name, position: job.job_name, matchScore: 90, reason: "推荐" }); }} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 hover:shadow-xl transition-all cursor-pointer group">
                            <h3 className="font-bold text-slate-800 text-lg group-hover:text-primary mb-2 truncate">{job.job_name}</h3>
                            <p className="text-sm font-bold text-primary mb-4">{job.dept_name}</p>
                            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-50">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{job.degree_req}</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-50">|</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[150px]">{job.major_req}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
        {(selectedJob || detailedDbJob) && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-fade-in">
                <div className="bg-white rounded-[2.5rem] w-full max-w-2xl p-10 shadow-2xl relative animate-soft">
                    <button onClick={() => { setSelectedJob(null); setDetailedDbJob(null); }} className="absolute top-8 right-8 p-3 bg-slate-50 rounded-full text-slate-400"><X /></button>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">{selectedJob?.position || detailedDbJob?.job_name}</h3>
                    <p className="text-primary font-bold mb-8">{selectedJob?.department || detailedDbJob?.dept_name}</p>
                    <div className="space-y-6">
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-50">
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">专业要求</h4>
                            <p className="text-slate-700 font-medium">{detailedDbJob?.major_req || "根据该岗位详情比对"}</p>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-50">
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">录用计划</h4>
                            <p className="text-slate-700 font-medium">拟招录 {detailedDbJob?.recruit_count || 1} 人 · 面试比 {detailedDbJob?.interview_ratio || "3:1"}</p>
                        </div>
                    </div>
                    <button className="w-full py-5 bg-primary text-white font-bold rounded-[2rem] mt-10 shadow-lg shadow-indigo-100">访问官方招考页</button>
                </div>
             </div>
        )}
    </div>
  );
};

export default JobMatching;
