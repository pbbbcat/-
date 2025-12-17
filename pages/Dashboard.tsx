
import React, { useEffect, useState } from 'react';
import { TrendingUp, Bell, Clock, ArrowRight, User, Loader2, Database, Briefcase, Building2, Users, MapPin, AlertTriangle, Phone, ExternalLink, X, GraduationCap, ClipboardList, Sparkles, Search } from 'lucide-react';
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
  const [stats, setStats] = useState({
      totalJobs: 0
  });

  useEffect(() => {
    const fetchRealData = async () => {
        setLoading(true);
        try {
            // 1. Get Real Recommendations using Vector Search (only if major is set)
            if (userProfile.major) {
                const jobs = await searchSimilarJobs(userProfile);
                setRecommendedJobs(jobs.slice(0, 5)); 
            } else {
                setRecommendedJobs([]);
            }

            // 2. Get Real Stats (Count total jobs in DB)
            const { count } = await supabase
                .from('public_service_jobs')
                .select('*', { count: 'exact', head: true });
            
            setStats({
                totalJobs: count || 0
            });

            // 3. Get Latest 5 Jobs from DB
            const { data: latestData } = await supabase
                .from('public_service_jobs')
                .select('*')
                .order('id', { ascending: false })
                .limit(5);
            
            if (latestData) {
                setLatestJobs(latestData);
            }

        } catch (error) {
            console.error("Dashboard data fetch failed:", error);
        } finally {
            setLoading(false);
        }
    };

    fetchRealData();
  }, [userProfile]);

  // Helper for rendering values in modal
  const val = (v: any) => v || '无';
  const boolVal = (v: boolean | undefined) => v === true ? '是' : '否';

  const renderJobModal = () => {
    if (!selectedJob) return null;
    const applyUrl = selectedJob.website || 'http://bm.scs.gov.cn/pp/gkweb/core/web/ui/business/home/gkhome.html';
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl transform transition-all animate-in zoom-in-95 duration-200 overflow-hidden max-h-[90vh] flex flex-col">
             {/* Header */}
             <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-start bg-slate-50/50 shrink-0">
                <div>
                     <h3 className="text-xl font-bold text-slate-800 pr-4">{selectedJob.job_name}</h3>
                     <div className="flex flex-col gap-1 mt-1 text-slate-500 text-sm">
                        <span className="flex items-center gap-2 font-medium text-primary"><Building2 className="w-4 h-4" /> {selectedJob.dept_name}</span>
                        <div className="flex gap-2 mt-1 flex-wrap">
                            <span className="text-xs bg-slate-200 px-2 py-0.5 rounded text-slate-600">职位代码: {selectedJob.job_code || '无'}</span>
                            {selectedJob.dept_code && (
                                <span className="text-xs bg-slate-200 px-2 py-0.5 rounded text-slate-600">部门代码: {selectedJob.dept_code}</span>
                            )}
                            {selectedJob.sub_dept && (
                                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">用人司局: {selectedJob.sub_dept}</span>
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
                {/* 1. 概况 */}
                <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2 border-l-4 border-primary pl-2">
                        <Briefcase className="w-4 h-4 text-primary" />
                        机构与职位概况
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 rounded-xl p-4 border border-gray-100 text-sm">
                         <div>
                             <p className="text-xs text-slate-400 mb-1">机构性质</p>
                             <p className="font-medium text-slate-700">{val(selectedJob.org_nature)}</p>
                         </div>
                         <div>
                             <p className="text-xs text-slate-400 mb-1">职位属性</p>
                             <p className="font-medium text-slate-700">{val(selectedJob.job_attr)}</p>
                         </div>
                         <div>
                             <p className="text-xs text-slate-400 mb-1">招考人数</p>
                             <p className="font-bold text-emerald-600 flex items-center gap-1">
                                <Users className="w-3 h-3" /> {selectedJob.recruit_count || 1} 人
                             </p>
                         </div>
                         <div className="col-span-2 md:col-span-3">
                             <p className="text-xs text-slate-400 mb-1">职位简介</p>
                             <p className="text-slate-600 leading-relaxed">{val(selectedJob.job_desc)}</p>
                         </div>
                    </div>
                </div>

                {/* 2. 门槛 */}
                <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2 border-l-4 border-emerald-500 pl-2">
                        <GraduationCap className="w-4 h-4 text-emerald-500" />
                        报考硬性门槛
                    </h4>
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden text-sm">
                         <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100">
                             <div className="p-3">
                                 <p className="text-xs text-slate-400">学历要求</p>
                                 <p className="font-medium text-slate-700 mt-0.5">{val(selectedJob.degree_req)}</p>
                             </div>
                             <div className="p-3">
                                 <p className="text-xs text-slate-400">学位要求</p>
                                 <p className="font-medium text-slate-700 mt-0.5">{val(selectedJob.degree_type)}</p>
                             </div>
                         </div>
                         <div className="p-3 border-b border-gray-100">
                             <p className="text-xs text-slate-400">专业要求</p>
                             <p className="font-medium text-primary mt-0.5">{val(selectedJob.major_req)}</p>
                         </div>
                         <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100">
                             <div className="p-3">
                                 <p className="text-xs text-slate-400">政治面貌</p>
                                 <p className="font-medium text-slate-700 mt-0.5">{val(selectedJob.politic_req)}</p>
                             </div>
                             <div className="p-3">
                                 <p className="text-xs text-slate-400">基层工作最低年限</p>
                                 <p className="font-medium text-slate-700 mt-0.5">{val(selectedJob.exp_years)}</p>
                             </div>
                         </div>
                         <div className="p-3 bg-emerald-50/50">
                             <p className="text-xs text-slate-400">服务基层项目工作经历</p>
                             <p className="font-medium text-emerald-700 mt-0.5">{val(selectedJob.exp_proj)}</p>
                         </div>
                    </div>
                </div>

                {/* 3. 考试 */}
                <div>
                     <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2 border-l-4 border-amber-500 pl-2">
                        <ClipboardList className="w-4 h-4 text-amber-500" />
                        考试核心情报
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex justify-between items-center">
                             <span className="text-sm text-amber-800 font-medium">面试人员比例</span>
                             <span className="text-lg font-bold text-amber-600">{val(selectedJob.interview_ratio)}</span>
                         </div>
                         <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex justify-between items-center">
                             <span className="text-sm text-amber-800 font-medium">专业能力测试</span>
                             <span className={`text-sm font-bold px-2 py-0.5 rounded ${selectedJob.has_pro_test ? 'bg-amber-200 text-amber-800' : 'bg-white text-slate-400'}`}>
                                 {boolVal(selectedJob.has_pro_test)}
                             </span>
                         </div>
                    </div>
                </div>

                {/* 4. 地点与备注 */}
                <div>
                     <div className="flex gap-6 text-sm mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        {selectedJob.work_loc && <p className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> <span className="text-slate-500">工作地点:</span> <span className="font-medium text-slate-700">{selectedJob.work_loc}</span></p>}
                        {selectedJob.settle_loc && <p className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> <span className="text-slate-500">落户地点:</span> <span className="font-medium text-slate-700">{selectedJob.settle_loc}</span></p>}
                     </div>
                     <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                        <p className="text-xs font-bold text-red-600 mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> 重要备注</p>
                        <p className="text-sm text-red-800 leading-relaxed">{val(selectedJob.remarks)}</p>
                     </div>
                </div>

                {/* 5. 咨询 */}
                <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2 border-l-4 border-blue-500 pl-2">
                        <Phone className="w-4 h-4 text-blue-500" />
                        咨询方式
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         {selectedJob.phones && selectedJob.phones.length > 0 ? (
                             selectedJob.phones.map((phone, idx) => (
                                <div key={idx} className="flex items-center gap-2 p-3 bg-blue-50/50 rounded-lg border border-blue-50 text-sm text-blue-700 font-mono">
                                    <Phone className="w-3 h-3" /> {phone}
                                </div>
                             ))
                         ) : (
                             <div className="text-sm text-slate-400 p-2">暂无咨询电话信息</div>
                         )}
                    </div>
                     {selectedJob.website && (
                         <div className="mt-2 text-sm">
                             <span className="text-slate-500 mr-2">部门网站:</span>
                             <a href={selectedJob.website} target="_blank" rel="noreferrer" className="text-blue-600 underline truncate hover:text-blue-800">
                                 {selectedJob.website}
                             </a>
                         </div>
                     )}
                </div>

             </div>

             {/* Footer */}
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

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <header className="mb-8 flex justify-between items-end">
        <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                早安，{userProfile.degree === '博士研究生' || userProfile.degree === '硕士研究生' ? '未来的' : ''} {userProfile.major || '考生'}
            </h1>
            <p className="text-slate-500 mt-2">
                系统当前已接入 <span className="text-primary font-bold">{stats.totalJobs > 0 ? stats.totalJobs.toLocaleString() : '...'}</span> 个真实公考岗位数据。
            </p>
        </div>
        <div className="hidden md:block">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                <div className={`w-2 h-2 rounded-full ${userProfile.politicalStatus.includes('党员') ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                <span className="text-xs font-medium text-slate-600">{userProfile.politicalStatus || '政治面貌未填'} | {userProfile.degree}</span>
            </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: '知识库岗位总数', value: stats.totalJobs > 0 ? stats.totalJobs.toLocaleString() : '连接中...', icon: Database, color: 'bg-blue-50 text-blue-600' },
          { label: '当前匹配画像', value: userProfile.major || '未设置', icon: User, color: 'bg-indigo-50 text-indigo-600' },
          { label: '本周新增', value: latestJobs.length > 0 ? '+'+latestJobs.length : '0', icon: Clock, color: 'bg-emerald-50 text-emerald-600' },
          { label: '系统状态', value: '运行中', icon: TrendingUp, color: 'bg-orange-50 text-orange-600' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-default">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-800 mt-1 truncate max-w-[150px]" title={stat.value}>{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recommended Jobs */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                为您推荐 (基于 {userProfile.major || '画像'})
            </h2>
            <button 
                onClick={() => onNavigate(Page.MATCHING)}
                className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
            >
                去匹配更多
                <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          {loading ? (
             <div className="flex flex-col items-center justify-center py-10 text-slate-400 flex-1">
                <Loader2 className="w-8 h-8 animate-spin mb-2 text-primary" />
                <p>正在检索实时数据库...</p>
             </div>
          ) : (
            <div className="space-y-4 flex-1">
                {!userProfile.major ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-xl">
                        <User className="w-10 h-10 text-slate-300 mb-2" />
                        <p className="text-slate-500 mb-2">请先设置您的专业画像，以便为您推荐岗位。</p>
                        <button 
                            onClick={() => onNavigate(Page.MATCHING)}
                            className="text-primary font-bold hover:underline"
                        >
                            前往设置 &rarr;
                        </button>
                    </div>
                ) : recommendedJobs.length > 0 ? recommendedJobs.map((job, idx) => (
                <div 
                    key={job.id} 
                    onClick={() => setSelectedJob(job)}
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 cursor-pointer group"
                >
                    <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                             <h3 className="font-bold text-slate-700 group-hover:text-primary transition-colors truncate" title={job.job_name}>
                                {job.job_name}
                             </h3>
                             {idx === 0 && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 rounded font-bold">Hot</span>}
                        </div>
                        <p className="text-sm text-slate-400 flex items-center gap-1 truncate">
                            <span className="font-medium text-slate-500 truncate">{job.dept_name}</span>
                            {job.sub_dept && <span className="text-xs bg-slate-100 px-1.5 rounded text-slate-400 shrink-0">{job.sub_dept}</span>}
                        </p>
                        <div className="flex gap-2 mt-2">
                            <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-500 rounded-md border border-blue-100 shrink-0">
                                {job.degree_req}
                            </span>
                            {job.politic_req && (
                                <span className="text-[10px] px-2 py-0.5 bg-red-50 text-red-500 rounded-md border border-red-100 shrink-0">
                                    {job.politic_req}
                                </span>
                            )}
                            <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md truncate max-w-[200px]">
                                {job.major_req}
                            </span>
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <div className="text-xl font-bold text-primary">
                            {job.similarity ? Math.round(job.similarity * 100) : 85}%
                        </div>
                        <div className="text-xs text-slate-400">匹配度</div>
                    </div>
                </div>
                )) : (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-xl">
                        <Search className="w-10 h-10 text-slate-300 mb-2" />
                        <p className="text-slate-500">暂无高度匹配的推荐，请尝试在“智能岗匹”中调整专业关键词。</p>
                    </div>
                )}
            </div>
          )}
        </div>

        {/* Latest Jobs (Enhanced Interaction) */}
        <div className="space-y-6">
            <div className="bg-gradient-to-br from-primary to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-300" />
                        遇到报考难题？
                    </h3>
                    <p className="text-blue-100 text-sm mb-4">无论是专业分类模糊，还是基层经历认定，AI 政策专家随时为您解答。</p>
                    <button 
                        onClick={() => onNavigate(Page.POLICY_CHAT)}
                        className="w-full py-2 bg-white text-primary font-bold rounded-lg hover:bg-blue-50 transition-colors text-sm"
                    >
                        立即咨询专家
                    </button>
                </div>
                <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
                <div className="absolute bottom-0 left-0 -ml-4 -mb-4 w-16 h-16 bg-blue-300 opacity-20 rounded-full blur-xl"></div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-[400px]">
                <div className="flex items-center justify-between mb-4 shrink-0">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Bell className="w-4 h-4 text-orange-500" />
                        最新入库岗位
                    </h3>
                    <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">Top 5</span>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                    {latestJobs.length > 0 ? (
                        <ul className="space-y-3">
                            {latestJobs.map((job, index) => (
                                <li 
                                    key={job.id} 
                                    onClick={() => setSelectedJob(job)}
                                    className="group relative bg-slate-50/50 hover:bg-white border border-transparent hover:border-blue-100 hover:shadow-md rounded-xl p-3 transition-all cursor-pointer"
                                >
                                    {/* New Indicator for the first item */}
                                    {index === 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                        </span>
                                    )}
                                    
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-slate-700 text-sm line-clamp-1 group-hover:text-primary transition-colors">
                                            {job.job_name}
                                        </h4>
                                        <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2 bg-white px-1.5 rounded border border-gray-100">
                                            {job.recruit_count ? `招${job.recruit_count}人` : '人数未知'}
                                        </span>
                                    </div>
                                    
                                    <p className="text-xs text-slate-500 mb-2 line-clamp-1 flex items-center gap-1">
                                        <Building2 className="w-3 h-3" />
                                        {job.dept_name}
                                    </p>
                                    
                                    <div className="flex items-center gap-2 text-[10px]">
                                        <span className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-slate-500 group-hover:border-blue-200 group-hover:text-blue-500 transition-colors">
                                            {job.degree_req}
                                        </span>
                                         <span className="bg-white border border-gray-200 px-1.5 py-0.5 rounded text-slate-500 group-hover:border-blue-200 group-hover:text-blue-500 transition-colors line-clamp-1 max-w-[120px]">
                                            {job.major_req}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm gap-2">
                             <Database className="w-8 h-8 opacity-20" />
                            <p>暂无新岗位数据</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
      
      {/* Full Detail Modal */}
      {renderJobModal()}
    </div>
  );
};

export default Dashboard;
    