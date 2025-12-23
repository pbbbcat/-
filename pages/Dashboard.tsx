
import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Bell, 
  Clock, 
  ArrowRight, 
  User, 
  Loader2, 
  Database, 
  Briefcase, 
  Building2, 
  Users, 
  MapPin, 
  AlertTriangle, 
  Phone, 
  ExternalLink, 
  X, 
  GraduationCap, 
  ClipboardList, 
  Sparkles, 
  Search, 
  ShieldCheck,
  FileText,
  Landmark,
  Scale,
  Award,
  BookOpen
} from 'lucide-react';
import { Page, UserProfile, PublicServiceJobDB } from '../types';
import { supabase } from '../services/supabaseClient';
import { searchSimilarJobs } from '../services/geminiService';

interface DashboardProps {
    onNavigate: (page: Page) => void;
    userProfile: UserProfile;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, userProfile }) => {
  const [recommendedJobs, setRecommendedJobs] = useState<PublicServiceJobDB[]>([]);
  const [latestJobs, setLatestJobs] = useState<PublicServiceJobDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<PublicServiceJobDB | null>(null);
  const [stats, setStats] = useState({ totalJobs: 0 });

  useEffect(() => {
    const fetchRealData = async () => {
        setLoading(true);
        try {
            if (userProfile.major) {
                const jobs = await searchSimilarJobs(userProfile);
                setRecommendedJobs(jobs.slice(0, 4)); 
            }
            const { count } = await supabase.from('public_service_jobs').select('*', { count: 'exact', head: true });
            setStats({ totalJobs: count || 0 });
            // Fetch latest jobs
            const { data: latestData } = await supabase
                .from('public_service_jobs')
                .select('*')
                .order('id', { ascending: false })
                .limit(5);
            if (latestData) setLatestJobs(latestData);
        } catch (error) {
            console.error("Dashboard data fetch failed:", error);
        } finally {
            setLoading(false);
        }
    };
    fetchRealData();
  }, [userProfile]);

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

  const renderJobModal = () => {
    if (!selectedJob) return null;
    const job = selectedJob;

    const DetailItem = ({ label, value, full = false }: { label: string, value?: string | number, full?: boolean }) => (
        <div className={`p-4 bg-slate-50 rounded-2xl border border-slate-100 ${full ? 'col-span-2 md:col-span-3' : ''}`}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-sm font-bold text-slate-700 break-words">{value || '无'}</p>
        </div>
    );

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
        <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl border border-white/20 overflow-hidden max-h-[92vh] flex flex-col animate-soft">
             {/* Header */}
             <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-start bg-slate-50/50">
                <div className="flex-1 mr-4">
                     <div className="flex flex-wrap gap-2 mb-2">
                        <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter">职位代码: {job.job_code}</span>
                        <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-md">部门代码: {job.dept_code || '-'}</span>
                     </div>
                     <h3 className="text-2xl font-bold text-slate-800 leading-tight">{job.job_name}</h3>
                     <p className="text-slate-500 font-bold flex items-center gap-2 mt-2 text-sm">
                        <Building2 className="w-4 h-4" /> 
                        {job.dept_name} 
                        <span className="text-slate-300">|</span> 
                        <span className="text-primary">{job.sub_dept}</span>
                     </p>
                </div>
                <button onClick={() => setSelectedJob(null)} className="p-3 bg-white hover:bg-slate-100 text-slate-400 rounded-full transition-all shadow-sm border border-slate-100 shrink-0">
                    <X className="w-5 h-5" />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
                {/* 1. 职位属性概览 */}
                <section>
                    <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Landmark className="w-4 h-4 text-primary" /> 机构与职位属性
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <DetailItem label="机构性质" value={job.org_nature} />
                        <DetailItem label="机构层级" value={job.org_level} />
                        <DetailItem label="职位属性" value={job.job_attr} />
                        <DetailItem label="考试类别" value={job.exam_cat} />
                        <DetailItem label="职位分布" value={job.job_dist} full />
                        <DetailItem label="职位简介" value={job.job_desc} full />
                    </div>
                </section>

                {/* 2. 报考硬性门槛 (Highlighted) */}
                <section className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100">
                    <h4 className="text-sm font-bold text-indigo-900 mb-4 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-indigo-600" /> 报考硬性门槛
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-white rounded-2xl border border-indigo-50 md:col-span-3">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">专业要求</p>
                            <p className="text-base font-black text-indigo-600 leading-relaxed">{job.major_req}</p>
                        </div>
                        <div className="p-4 bg-white rounded-2xl border border-indigo-50">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">学历要求</p>
                            <p className="text-sm font-bold text-slate-700">{job.degree_req}</p>
                        </div>
                        <div className="p-4 bg-white rounded-2xl border border-indigo-50">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">学位要求</p>
                            <p className="text-sm font-bold text-slate-700">{job.degree_type}</p>
                        </div>
                        <div className="p-4 bg-white rounded-2xl border border-indigo-50">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">政治面貌</p>
                            <p className="text-sm font-bold text-slate-700">{job.politic_req}</p>
                        </div>
                        <div className="p-4 bg-white rounded-2xl border border-indigo-50 md:col-span-3">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">基层工作经历 / 服务项目</p>
                            <div className="flex gap-4 text-sm font-bold text-slate-700">
                                <span>最低年限：{job.exp_years || '无限制'}</span>
                                <span className="text-slate-300">|</span>
                                <span>服务项目：{job.service_proj || '无限制'}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. 考试与录用信息 */}
                <section>
                    <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Scale className="w-4 h-4 text-emerald-600" /> 考试与录用情报
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <p className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest mb-1">招考人数</p>
                            <p className="text-xl font-black text-emerald-600">{job.recruit_count} 人</p>
                        </div>
                        <DetailItem label="面试人员比例" value={job.interview_ratio} />
                        <DetailItem label="专业能力测试" value={job.has_pro_test ? '是' : '否'} />
                        <DetailItem label="工作地点" value={job.work_loc} />
                        <DetailItem label="落户地点" value={job.settle_loc} full />
                    </div>
                </section>

                {/* 4. 备注与咨询 */}
                <section>
                    {job.remarks && (
                        <div className="bg-red-50 p-5 rounded-2xl border border-red-100 mb-4">
                            <h4 className="text-red-600 font-bold text-xs mb-2 flex items-center gap-2 uppercase tracking-widest">
                                <AlertTriangle className="w-3.5 h-3.5" /> 重要备注
                            </h4>
                            <p className="text-sm text-red-500 leading-relaxed font-medium">{job.remarks}</p>
                        </div>
                    )}
                    <div className="flex items-center gap-3 text-xs text-slate-400 font-bold bg-slate-50 p-4 rounded-2xl">
                        <Phone className="w-4 h-4" /> 
                        咨询电话：{Array.isArray(job.phones) ? job.phones.join('、') : (job.phones || '详见公告')}
                    </div>
                </section>
             </div>

             <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-50 flex justify-end gap-3">
                <button onClick={() => setSelectedJob(null)} className="px-6 py-3 text-slate-500 font-bold hover:bg-white rounded-2xl transition-all">
                    关闭
                </button>
                <button 
                    className="px-8 py-3 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-600 transition-all active:scale-95 flex items-center gap-2"
                    onClick={() => handleApplyUrl(job.website)}
                >
                    前往报名官网
                    <ExternalLink className="w-4 h-4" />
                </button>
             </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-12 animate-soft pb-24">
      <header className="flex justify-between items-end">
        <div>
            <h1 className="text-4xl font-bold text-slate-800 tracking-tight">
                你好，{userProfile.major || '考生'} <span className="text-primary/40 inline-block animate-bounce ml-1">👋</span>
            </h1>
            <p className="text-slate-400 mt-3 text-lg font-medium">
                今天是 2025 年 12 月 18 日，离省考联考预计还有 <span className="text-primary font-bold">93</span> 天。
            </p>
        </div>
        <div className="flex gap-4">
            <div className="px-6 py-3 bg-white rounded-full shadow-sm border border-slate-100 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-success" />
                <span className="text-sm font-bold text-slate-600">账户状态：实名已核验</span>
            </div>
        </div>
      </header>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {[
          { label: '库内岗位总数', value: stats.totalJobs.toLocaleString(), icon: Database, color: 'indigo' },
          { label: '匹配专业热度', value: '4.2k', icon: TrendingUp, color: 'emerald' },
          { label: '今日新增岗位', value: latestJobs.length, icon: Bell, color: 'amber' },
          { label: '备考资料库存', value: '56', icon: Briefcase, color: 'blue' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-indigo-50/50 transition-all group">
            <div className={`w-12 h-12 rounded-2xl mb-6 flex items-center justify-center bg-slate-50 text-indigo-600 group-hover:scale-110 transition-transform`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <p className="text-3xl font-bold text-slate-800 mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Recommended Area */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-amber-500" />
                画像精准推荐
            </h2>
            <button onClick={() => onNavigate(Page.MATCHING)} className="px-6 py-2 bg-soft-bg hover:bg-slate-100 text-slate-500 rounded-full text-sm font-bold transition-all flex items-center gap-2">
                管理我的画像 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          {loading ? (
             <div className="py-20 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recommendedJobs.length > 0 ? recommendedJobs.map((job) => (
                    <div 
                        key={job.id} 
                        onClick={() => setSelectedJob(job)}
                        className="p-6 rounded-3xl bg-slate-50/50 hover:bg-white border border-transparent hover:border-slate-100 hover:shadow-lg transition-all cursor-pointer group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-[10px] font-black bg-primary text-white px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm">
                                匹配 {job.similarity ? Math.round(job.similarity * 100) : 88}%
                            </span>
                            <Building2 className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                        </div>
                        <h3 className="font-bold text-slate-700 text-lg mb-1 group-hover:text-primary transition-colors truncate">{job.job_name}</h3>
                        <p className="text-sm text-slate-400 font-medium mb-4 line-clamp-1">{job.dept_name}</p>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-white text-[10px] font-bold text-slate-500 rounded-lg border border-slate-100">{job.degree_req}</span>
                            <span className="px-3 py-1 bg-white text-[10px] font-bold text-slate-500 rounded-lg border border-slate-100 truncate max-w-[120px]">{job.major_req}</span>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-2 py-20 bg-slate-50 rounded-3xl text-center">
                        <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold">配置专业画像后开启精准推荐</p>
                    </div>
                )}
            </div>
          )}
        </div>

        {/* Info Column */}
        <div className="space-y-8">
            <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-[2.5rem] p-10 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-3">AI 政策实时咨询</h3>
                    <p className="text-indigo-100 text-sm leading-relaxed mb-8 font-medium">
                        如果您对公告中的“基层经历认定”或“专业限制”有疑问，即刻连线 15 年资深审核专家模型。
                    </p>
                    <button 
                        onClick={() => onNavigate(Page.POLICY_CHAT)}
                        className="w-full py-4 bg-white text-primary font-bold rounded-2xl hover:shadow-lg transition-all"
                    >
                        开启深度咨询
                    </button>
                </div>
                <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 h-[400px] flex flex-col">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center justify-between">
                    <span>最新入库公告</span>
                    <span className="text-[10px] text-slate-400 font-black tracking-widest uppercase">Latest</span>
                </h3>
                <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                    {latestJobs.map((job) => (
                        <div key={job.id} onClick={() => setSelectedJob(job)} className="group cursor-pointer p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                            {/* 优先显示用人司局（sub_dept），如果没有则显示职位名称。防止出现全是“一级主任科员”的情况 */}
                            <h4 className="font-bold text-slate-700 text-sm mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                                {job.sub_dept || job.job_name}
                            </h4>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                                <Building2 className="w-3 h-3" /> 
                                {job.dept_name}
                                {/* 如果显示了sub_dept，则把job_name放在副标题 */}
                                {job.sub_dept && <span className="opacity-60"> · {job.job_name}</span>}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
      
      {renderJobModal()}
    </div>
  );
};

export default Dashboard;
