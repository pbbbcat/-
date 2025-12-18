
import React, { useState, useEffect } from 'react';
import { 
  Search, Database, PieChart as PieIcon, Building2, Loader2, ArrowLeft, 
  TrendingUp, ChevronRight, ExternalLink, MapPin, Phone, X, AlertTriangle,
  Info, Target, ClipboardList, Users
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { PublicServiceJobDB } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface MajorTrend { name: string; count: number; }
interface MajorDeepDive {
    majorName: string;
    totalJobs: number;
    degreeStats: { name: string; value: number }[];
    politicStats: { name: string; value: number }[];
    topDepts: { name: string; value: number }[];
    sampleJobs: PublicServiceJobDB[];
}

const SOFT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const MajorAnalysis: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [view, setView] = useState<'overview' | 'detail'>('overview');
  const [trends, setTrends] = useState<MajorTrend[]>([]);
  const [detailData, setDetailData] = useState<MajorDeepDive | null>(null);
  const [selectedJob, setSelectedJob] = useState<PublicServiceJobDB | null>(null);
  const [filterDept, setFilterDept] = useState<string | null>(null);

  useEffect(() => { fetchMarketTrends(); }, []);

  const fetchMarketTrends = async () => {
      setLoading(true);
      try {
          const { data } = await supabase.from('public_service_jobs').select('major_req').not('major_req', 'is', null).limit(3000); 
          if (!data) return;
          const counts: Record<string, number> = {};
          data.forEach(row => {
              if (!row.major_req) return;
              const parts = row.major_req.split(/[,，、]/).map(s => s.trim());
              parts.forEach(p => {
                  if (p.length > 1 && !['不限', '无限制', '专业'].includes(p)) {
                      const key = p.replace(/[（(].*[)）]/, '').substring(0, 8); 
                      counts[key] = (counts[key] || 0) + 1;
                  }
              });
          });
          setTrends(Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10));
      } finally { setLoading(false); }
  };

  const analyzeMajor = async (majorName: string) => {
      if (!majorName) return;
      setAnalyzing(true); setView('detail'); setSearchTerm(majorName); setFilterDept(null);
      try {
          const { data } = await supabase.from('public_service_jobs').select('*').ilike('major_req', `%${majorName}%`).limit(200);
          if (!data || data.length === 0) { setDetailData(null); return; }
          const degreeMap: Record<string, number> = {};
          const politicMap: Record<string, number> = {};
          const deptMap: Record<string, number> = {};
          data.forEach(j => {
              const d = j.degree_req || '本科'; degreeMap[d] = (degreeMap[d] || 0) + 1;
              const p = j.politic_req || '不限'; politicMap[p] = (politicMap[p] || 0) + 1;
              const dt = j.dept_name || '其他'; deptMap[dt] = (deptMap[dt] || 0) + 1;
          });
          setDetailData({
              majorName, totalJobs: data.length,
              degreeStats: Object.entries(degreeMap).map(([name, value]) => ({ name, value })),
              politicStats: Object.entries(politicMap).map(([name, value]) => ({ name, value })),
              topDepts: Object.entries(deptMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5),
              sampleJobs: data as PublicServiceJobDB[]
          });
      } finally { setAnalyzing(false); }
  };

  const filteredSamples = detailData?.sampleJobs.filter(j => !filterDept || j.dept_name === filterDept) || [];

  const renderJobDetailModal = (job: PublicServiceJobDB) => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-soft border border-white/20">
        <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-start bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 mb-2">
                <span className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">知识库录入岗位</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 leading-tight mb-2">{job.job_name}</h3>
            <p className="text-primary font-bold flex items-center gap-2 text-lg">
              <Building2 className="w-5 h-5" /> {job.dept_name}
            </p>
          </div>
          <button onClick={() => setSelectedJob(null)} className="p-3 bg-white hover:bg-slate-100 rounded-full text-slate-400 transition-all border border-slate-100 shadow-sm"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-10 overflow-y-auto custom-scrollbar space-y-10 flex-1">
            <section>
                <h4 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2"><div className="w-1.5 h-4 bg-primary rounded-full"></div> 机构与职位概况</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                        <p className="text-[11px] text-slate-400 font-bold mb-1 uppercase tracking-wider">机构性质</p>
                        <p className="text-base font-bold text-slate-700">{job.org_nature || '行政机关'}</p>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                        <p className="text-[11px] text-slate-400 font-bold mb-1 uppercase tracking-wider">职位属性</p>
                        <p className="text-base font-bold text-slate-700">{job.job_attr || '普通职位'}</p>
                    </div>
                    <div className="bg-emerald-50/50 p-5 rounded-3xl border border-emerald-100 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] text-emerald-600/60 font-bold mb-1 uppercase tracking-wider">招考人数</p>
                            <p className="text-xl font-black text-emerald-600">共 {job.recruit_count || 1} 人</p>
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <h4 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2"><div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div> 报考硬性门槛</h4>
                <div className="bg-slate-50/80 p-8 rounded-[2rem] border border-slate-100 space-y-6">
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-1 block">学历要求</span>
                            <p className="text-base font-bold text-slate-700">{job.degree_req}</p>
                        </div>
                        <div>
                            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-1 block">学位要求</span>
                            <p className="text-base font-bold text-slate-700">{job.degree_type || '学士及以上'}</p>
                        </div>
                    </div>
                    <div className="pt-6 border-t border-slate-200">
                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-3 block">专业要求原文</span>
                        <p className="text-base font-bold text-primary leading-relaxed bg-white p-5 rounded-2xl border border-indigo-50 shadow-sm">{job.major_req}</p>
                    </div>
                </div>
            </section>

            <section>
                <h4 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2"><div className="w-1.5 h-4 bg-amber-500 rounded-full"></div> 考试核心情报</h4>
                <div className="grid grid-cols-2 gap-6">
                    <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100 flex justify-between items-center shadow-sm">
                        <span className="text-sm text-amber-700 font-bold">面试人员比例</span>
                        <span className="text-2xl font-black text-amber-600">{job.interview_ratio || '3:1'}</span>
                    </div>
                    <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100 flex justify-between items-center shadow-sm">
                        <span className="text-sm text-amber-700 font-bold">专业能力测试</span>
                        <span className="text-sm font-black text-amber-600 bg-white px-3 py-1 rounded-xl">{job.has_pro_test ? '是' : '否'}</span>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                    <MapPin className="w-4 h-4 text-primary" /> 工作地点: {job.work_loc || '详见公告'}
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                    <MapPin className="w-4 h-4 text-indigo-400" /> 落户地点: {job.settle_loc || '详见公告'}
                </div>
            </div>

            {job.remarks && (
              <div className="bg-red-50 p-6 rounded-3xl border border-red-100 shadow-sm">
                <h5 className="text-red-600 font-bold text-xs mb-3 flex items-center gap-2 uppercase tracking-widest">
                  <AlertTriangle className="w-4 h-4" /> 重要备注
                </h5>
                <p className="text-sm text-red-500 leading-relaxed font-medium">{job.remarks}</p>
              </div>
            )}
        </div>

        <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4 items-center">
            <div className="flex-1 text-xs text-slate-400 font-bold flex items-center gap-2">
               <Phone className="w-4 h-4 text-primary" /> 咨询方式：{job.phones?.[0] || '详见官网公告'}
            </div>
            <button 
              className="px-10 py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-600 transition-all flex items-center gap-3 active:scale-95"
              onClick={() => window.open(job.website || 'https://www.scs.gov.cn/', '_blank')}
            >
              去报名 <ExternalLink className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-10 animate-soft pb-24">
       <header>
          <div className="flex items-center gap-3 mb-2">
             <PieIcon className="w-6 h-6 text-primary" />
             <h1 className="text-3xl font-bold text-slate-800 tracking-tight">专业数据透视</h1>
          </div>
          <p className="text-slate-400 text-lg font-medium">基于 Supabase 知识库的全量数据分析，为您揭示专业的真实招考行情。</p>
       </header>

       <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex gap-4 max-w-2xl mx-auto md:mx-0">
          <div className="relative flex-1">
             <Search className="absolute left-4 top-4 text-slate-300 w-5 h-5" />
             <input type="text" placeholder="输入任意专业（如：法学、统计学），查看深度分析..." className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-[1.5rem] focus:ring-4 focus:ring-primary/5 outline-none font-bold text-slate-700" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && analyzeMajor(searchTerm)} />
          </div>
          <button onClick={() => analyzeMajor(searchTerm)} disabled={analyzing} className="px-8 py-4 bg-primary text-white font-bold rounded-[1.5rem] shadow-lg shadow-indigo-100 transition-all">深度分析</button>
       </div>

       {loading ? (
          <div className="py-40 flex flex-col items-center justify-center"><Loader2 className="animate-spin text-primary opacity-20 w-12 h-12" /></div>
       ) : view === 'overview' ? (
          <div className="space-y-12 animate-soft">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-primary p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100">
                   <Database className="w-8 h-8 opacity-60 mb-6" />
                   <p className="text-sm font-bold opacity-80 mb-2">知识库岗位样本</p>
                   <p className="text-4xl font-black">1,000+</p>
                   <p className="text-[10px] font-bold opacity-40 mt-4 uppercase tracking-widest">Based on latest real data</p>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-center">
                   <p className="text-slate-400 font-bold flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-emerald-400" /> 热门专业 Top 1</p>
                   <p className="text-3xl font-black text-slate-800">财务管理</p>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-center">
                   <p className="text-slate-400 font-bold flex items-center gap-2 mb-2"><Target className="w-4 h-4 text-amber-400" /> 覆盖专业领域</p>
                   <p className="text-3xl font-black text-slate-800">50+ 类</p>
                </div>
             </div>
             <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                <h2 className="text-xl font-bold text-slate-800 mb-10 flex items-center gap-3"><TrendingUp className="w-6 h-6 text-primary" /> 热门招考专业排行榜 (Top 10)</h2>
                <div className="w-full h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trends}>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700, fill: '#94A3B8'}} />
                            <YAxis hide />
                            <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                            <Bar dataKey="count" fill="#3B82F6" radius={[12, 12, 12, 12]} barSize={40} className="cursor-pointer" onClick={(d) => analyzeMajor(d.name)} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
             </div>
          </div>
       ) : detailData && (
          <div className="space-y-10 animate-soft">
             <button onClick={() => setView('overview')} className="text-slate-400 font-bold flex items-center gap-2 hover:text-primary transition-colors">
                <ArrowLeft className="w-4 h-4" /> 返回热门排行
             </button>
             <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                   <h2 className="text-4xl font-bold text-slate-800">{detailData.majorName}</h2>
                   <p className="text-slate-400 mt-2 font-medium flex items-center gap-2"><Database className="w-4 h-4" /> 在当前样本中检索到 {detailData.totalJobs}+ 个相关岗位</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                   <h3 className="text-sm font-bold text-slate-800 mb-8 flex items-center gap-2 text-emerald-600"><ClipboardList className="w-4 h-4" /> 学历门槛分析</h3>
                   <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                            <Pie data={detailData.degreeStats} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                               {detailData.degreeStats.map((_, i) => <Cell key={i} fill={SOFT_COLORS[i % SOFT_COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                         </PieChart>
                      </ResponsiveContainer>
                   </div>
                </div>
                <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                   <h3 className="text-sm font-bold text-slate-800 mb-8 flex items-center gap-2 text-red-600"><Users className="w-4 h-4" /> 政治面貌要求</h3>
                   <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                            <Pie data={detailData.politicStats} outerRadius={90} dataKey="value">
                               {detailData.politicStats.map((_, i) => <Cell key={i} fill={SOFT_COLORS[(i+2) % SOFT_COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                         </PieChart>
                      </ResponsiveContainer>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                   <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center justify-between">
                      <span className="flex items-center gap-2 text-blue-600"><Building2 className="w-4 h-4" /> 招录大户 (Top 5)</span>
                      {filterDept && <button onClick={() => setFilterDept(null)} className="text-[10px] text-primary hover:underline">清除筛选</button>}
                   </h3>
                   <p className="text-[10px] text-slate-400 mb-4 font-bold">点击部门名称筛选右侧岗位</p>
                   <div className="space-y-3">
                      {detailData.topDepts.map((dept, i) => (
                         <div key={i} onClick={() => setFilterDept(dept.name)} className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${filterDept === dept.name ? 'bg-primary text-white border-primary shadow-lg' : 'bg-slate-50 border-slate-50 hover:bg-white hover:border-slate-100'}`}>
                            <span className="text-sm font-bold truncate pr-4">{dept.name}</span>
                            <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${filterDept === dept.name ? 'bg-white/20' : 'bg-white'}`}>{dept.value} 岗位</span>
                         </div>
                      ))}
                   </div>
                </div>
                <div className="lg:col-span-3 bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                   <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2"><Database className="w-4 h-4 text-primary" /> 真实岗位示例</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[500px] overflow-y-auto custom-scrollbar pr-2">
                      {filteredSamples.length > 0 ? filteredSamples.map((job, i) => (
                         <div key={i} onClick={() => setSelectedJob(job)} className="p-5 bg-slate-50/50 rounded-[2rem] border border-transparent hover:border-slate-100 hover:bg-white hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between">
                            <div>
                               <h4 className="font-bold text-slate-800 text-sm mb-1 truncate group-hover:text-primary transition-colors">{job.job_name}</h4>
                               <p className="text-[10px] text-slate-400 flex items-center gap-1 font-bold mb-3"><Building2 className="w-3 h-3" /> {job.dept_name}</p>
                               <div className="space-y-1">
                                  <p className="text-[10px] text-slate-400 font-medium line-clamp-2">专业要求: {job.major_req}</p>
                               </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center">
                               <span className="text-[9px] bg-white px-2 py-0.5 rounded-lg border border-slate-100 text-slate-500 font-bold">{job.degree_req}</span>
                               <ChevronRight className="w-3 h-3 text-slate-200 group-hover:text-primary transition-all" />
                            </div>
                         </div>
                      )) : (
                         <div className="col-span-full h-full flex flex-col items-center justify-center text-slate-300">
                            <Database className="w-12 h-12 opacity-20 mb-2" />
                            <p className="text-sm font-bold">该筛选下暂无示例岗位</p>
                         </div>
                      )}
                   </div>
                </div>
             </div>
          </div>
       )}
       {selectedJob && renderJobDetailModal(selectedJob)}
    </div>
  );
};

export default MajorAnalysis;
