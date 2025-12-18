
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

// 自定义 X 轴标签组件，用于长文本换行显示
const CustomXAxisTick = (props: any) => {
  const { x, y, payload } = props;
  const value = payload.value;
  const maxLength = 5; // 每行最大字符数
  
  // 将长文本切分为多行
  const lines = [];
  for (let i = 0; i < value.length; i += maxLength) {
    lines.push(value.substring(i, i + maxLength));
  }

  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, index) => (
        <text
          key={index}
          x={0}
          y={0}
          dy={15 + index * 14} // 行高控制
          textAnchor="middle"
          fill="#94A3B8"
          fontSize={11}
          fontWeight={700}
        >
          {line}
        </text>
      ))}
    </g>
  );
};

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
          const { data } = await supabase
            .from('public_service_jobs')
            .select('major_req')
            .not('major_req', 'is', null)
            .range(0, 9999); 
            
          if (!data) return;
          const counts: Record<string, number> = {};
          data.forEach(row => {
              if (!row.major_req) return;
              const parts = row.major_req.split(/[,，、]/).map((s: string) => s.trim());
              parts.forEach((p: string) => {
                  if (p.length > 1 && !['不限', '无限制', '专业'].includes(p)) {
                      const key = p.replace(/[（(].*[)）]/, '').trim(); 
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

  const filteredSamples = detailData?.sampleJobs.filter(j => !filterDept || j.dept_name === filterDept) || [];

  const renderJobDetailModal = (job: PublicServiceJobDB) => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-white/20">
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

        <div className="p-10 overflow-y-auto custom-scrollbar space-y-10 flex-1 text-left">
            <section>
                <h4 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2"><div className="w-1.5 h-4 bg-primary rounded-full"></div> 机构与职位概况</h4>
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
                <h4 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2 text-left"><div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div> 报考硬性门槛</h4>
                <div className="bg-slate-50/80 p-8 rounded-[2rem] border border-slate-100 space-y-6 text-left">
                    <div className="grid grid-cols-2 gap-8 text-left">
                        <div className="text-left">
                            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-1 block text-left">学历要求</span>
                            <p className="text-base font-bold text-slate-700">{job.degree_req}</p>
                        </div>
                        <div className="text-left">
                            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-1 block text-left">学位要求</span>
                            <p className="text-base font-bold text-slate-700">{job.degree_type || '学士及以上'}</p>
                        </div>
                    </div>
                    <div className="pt-6 border-t border-slate-200 text-left">
                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-3 block text-left">专业要求原文</span>
                        <p className="text-base font-bold text-primary leading-relaxed bg-white p-5 rounded-2xl border border-indigo-50 shadow-sm text-left">{job.major_req}</p>
                    </div>
                </div>
            </section>

            <section>
                <h4 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2 text-left"><div className="w-1.5 h-4 bg-amber-500 rounded-full"></div> 考试核心情报</h4>
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
              <div className="bg-red-50 p-6 rounded-3xl border border-red-100 shadow-sm text-left">
                <h5 className="text-red-600 font-bold text-xs mb-3 flex items-center gap-2 uppercase tracking-widest text-left">
                  <AlertTriangle className="w-4 h-4" /> 重要备注
                </h5>
                <p className="text-sm text-red-500 leading-relaxed font-medium text-left">{job.remarks}</p>
              </div>
            )}
        </div>

        <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4 items-center">
            <div className="flex-1 text-xs text-slate-400 font-bold flex items-center gap-2">
               <Phone className="w-4 h-4 text-primary" /> 咨询方式：{job.phones?.[0] || '详见官网公告'}
            </div>
            <button 
              className="px-10 py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-600 transition-all flex items-center gap-3 active:scale-95"
              onClick={() => handleApplyUrl(job.website)}
            >
              去报名 <ExternalLink className="w-5 h-5" />
            </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
        <div className="p-8 max-w-7xl mx-auto animate-soft pb-24 relative">
            <header className="mb-10">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-800 tracking-tight">专业就业透视</h1>
                        <p className="text-slate-400 mt-2 text-lg font-medium">基于 2026 年度真实岗位数据的大数据画像。</p>
                    </div>
                    {view === 'detail' && (
                        <button onClick={() => setView('overview')} className="px-6 py-2 bg-white text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-sm flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" /> 返回全景概览
                        </button>
                    )}
                </div>

                <div className="relative max-w-2xl">
                    <Search className="absolute left-4 top-4 w-5 h-5 text-slate-300" />
                    <input 
                        type="text" 
                        placeholder="输入您的专业名称，例如：法学、汉语言文学..." 
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-sm font-bold text-slate-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && analyzeMajor(searchTerm)}
                    />
                    <button 
                        onClick={() => analyzeMajor(searchTerm)}
                        className="absolute right-2 top-2 px-6 py-2 bg-primary text-white font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-600 transition-all active:scale-95"
                    >
                        深度分析
                    </button>
                </div>
            </header>

            {loading || analyzing ? (
                <div className="py-40 flex flex-col items-center justify-center">
                    <Loader2 className="w-12 h-12 text-primary animate-spin opacity-20 mb-4" />
                    <p className="text-slate-400 font-bold">{analyzing ? '正在生成专业画像...' : '正在加载全网数据...'}</p>
                </div>
            ) : view === 'overview' ? (
                <div className="space-y-10 animate-fade-in">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                            2026 年度热门报考专业 TOP 10
                        </h3>
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={trends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <XAxis dataKey="name" tick={<CustomXAxisTick />} interval={0} height={60} axisLine={false} tickLine={false} />
                                    <Tooltip 
                                        cursor={{ fill: '#F1F5F9', radius: 8 }} 
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar 
                                        dataKey="count" 
                                        fill="#6366f1" 
                                        radius={[8, 8, 0, 0]} 
                                        barSize={40} 
                                        onClick={(data) => data && data.name && analyzeMajor(data.name)}
                                        cursor="pointer"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {trends.map((t, i) => (
                            <div 
                                key={t.name}
                                onClick={() => analyzeMajor(t.name)}
                                className="bg-white p-6 rounded-3xl border border-slate-100 hover:shadow-xl hover:border-primary/20 transition-all cursor-pointer group"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-2xl font-black text-slate-200 group-hover:text-primary/20 transition-colors">#{i+1}</span>
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                                </div>
                                <h4 className="font-bold text-slate-800 text-lg mb-1 truncate">{t.name}</h4>
                                <p className="text-xs text-slate-400 font-bold">岗位数：{t.count}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ) : detailData ? (
                <div className="space-y-8 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm md:col-span-2">
                            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Target className="w-5 h-5 text-primary" /> 学历与政治面貌要求分布
                            </h3>
                            <div className="grid grid-cols-2 gap-4 h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie 
                                            data={detailData.degreeStats} 
                                            cx="50%" cy="50%" 
                                            innerRadius={60} outerRadius={80} 
                                            paddingAngle={5} 
                                            dataKey="value"
                                        >
                                            {detailData.degreeStats.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={SOFT_COLORS[index % SOFT_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie 
                                            data={detailData.politicStats} 
                                            cx="50%" cy="50%" 
                                            innerRadius={60} outerRadius={80} 
                                            paddingAngle={5} 
                                            dataKey="value"
                                        >
                                            {detailData.politicStats.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={SOFT_COLORS[(index + 2) % SOFT_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex justify-around text-xs text-slate-400 font-bold mt-2">
                                <span>学历要求分布</span>
                                <span>政治面貌分布</span>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white p-8 rounded-[2.5rem] shadow-xl shadow-indigo-100 relative overflow-hidden flex flex-col justify-center">
                            <div className="relative z-10">
                                <h3 className="font-bold text-indigo-100 mb-2">专业热度指数</h3>
                                <div className="text-5xl font-black mb-4">{detailData.totalJobs} <span className="text-lg opacity-60 font-medium">个岗位</span></div>
                                <p className="text-sm opacity-80 leading-relaxed mb-6">
                                    库中共有 {detailData.totalJobs} 个岗位明确招收“{detailData.majorName}”及相关专业。
                                </p>
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold uppercase tracking-widest opacity-60">招录大户 (Top 3)</h4>
                                    {detailData.topDepts.slice(0, 3).map((dept, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm font-bold bg-white/10 px-4 py-2 rounded-xl">
                                            <span className="truncate max-w-[150px]">{dept.name}</span>
                                            <span className="bg-white/20 px-2 py-0.5 rounded-md text-xs">{dept.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Database className="w-5 h-5 text-slate-400" />
                                关联岗位样本 ({filteredSamples.length})
                            </h3>
                            <div className="flex gap-2">
                            {detailData.topDepts.slice(0, 3).map(d => (
                                <button 
                                    key={d.name} 
                                    onClick={() => setFilterDept(filterDept === d.name ? null : d.name)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filterDept === d.name ? 'bg-primary text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                                >
                                    {d.name}
                                </button>
                            ))}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredSamples.map(job => (
                                <div 
                                    key={job.id} 
                                    onClick={() => setSelectedJob(job)}
                                    className="p-5 rounded-3xl bg-slate-50 border border-transparent hover:border-slate-200 hover:bg-white hover:shadow-lg transition-all cursor-pointer group"
                                >
                                    <h4 className="font-bold text-slate-700 text-sm mb-1 truncate group-hover:text-primary">{job.job_name}</h4>
                                    <p className="text-xs text-slate-400 mb-3 truncate">{job.dept_name}</p>
                                    <div className="flex flex-wrap gap-1">
                                        <span className="bg-white border border-slate-100 px-2 py-0.5 rounded text-[10px] text-slate-500">{job.degree_req}</span>
                                        {(job.remarks?.includes('应届') || job.job_name.includes('应届')) && <span className="bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded text-[10px] text-emerald-600">应届</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="py-20 text-center">
                    <Search className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold text-lg">输入专业名称开始检索</p>
                    <p className="text-slate-300 text-sm mt-1">支持模糊搜索，如“计算机”、“会计”</p>
                </div>
            )}
        </div>
        
        {/* Render Modal outside the animated container to prevent transform stacking context issues */}
        {selectedJob && renderJobDetailModal(selectedJob)}
    </>
  );
};

export default MajorAnalysis;
