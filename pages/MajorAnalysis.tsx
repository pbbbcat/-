
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Database, 
  PieChart as PieIcon, 
  BarChart3, 
  Building2, 
  Loader2, 
  ArrowLeft, 
  GraduationCap, 
  Users, 
  X, 
  MapPin, 
  AlertTriangle, 
  Phone, 
  ExternalLink, 
  Briefcase, 
  ClipboardList, 
  Filter, 
  TrendingUp 
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { PublicServiceJobDB } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface MajorTrend { name: string; count: number; }
interface MajorDeepDive {
    majorName: string;
    totalJobs: number;
    degreeStats: { name: string; value: number }[];
    politicStats: { name: string; value: number }[];
    topDepts: { name: string; value: number }[];
    sampleJobs: PublicServiceJobDB[];
}

const SOFT_COLORS = ['#818CF8', '#34D399', '#FBBF24', '#F87171', '#A78BFA', '#F472B6'];

const MajorAnalysis: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [view, setView] = useState<'overview' | 'detail'>('overview');
  const [trends, setTrends] = useState<MajorTrend[]>([]);
  const [detailData, setDetailData] = useState<MajorDeepDive | null>(null);
  const [selectedJob, setSelectedJob] = useState<PublicServiceJobDB | null>(null);

  useEffect(() => { fetchMarketTrends(); }, []);

  const fetchMarketTrends = async () => {
      setLoading(true);
      try {
          const { data } = await supabase.from('public_service_jobs').select('major_req').not('major_req', 'is', null).limit(1000); 
          if (!data) return;
          const counts: Record<string, number> = {};
          data.forEach(row => {
              if (!row.major_req) return;
              const parts = row.major_req.split(/[,，、]/).map(s => s.trim());
              parts.forEach(p => {
                  if (p.length > 2 && !['不限', '无限制'].includes(p)) {
                      const key = p.replace(/[（(].*[)）]/, ''); 
                      counts[key] = (counts[key] || 0) + 1;
                  }
              });
          });
          setTrends(Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10));
      } finally { setLoading(false); }
  };

  const analyzeMajor = async (majorName: string) => {
      setAnalyzing(true); setView('detail'); setSearchTerm(majorName);
      try {
          const { data } = await supabase.from('public_service_jobs').select('*').ilike('major_req', `%${majorName}%`).limit(300);
          if (!data || data.length === 0) { setDetailData(null); return; }
          const degreeMap: Record<string, number> = {};
          const politicMap: Record<string, number> = {};
          const deptMap: Record<string, number> = {};
          data.forEach(j => {
              degreeMap[j.degree_req || '本科'] = (degreeMap[j.degree_req || '本科'] || 0) + 1;
              politicMap[j.politic_req || '不限'] = (politicMap[j.politic_req || '不限'] || 0) + 1;
              deptMap[j.dept_name || '未知'] = (deptMap[j.dept_name || '未知'] || 0) + 1;
          });
          setDetailData({
              majorName, totalJobs: data.length,
              degreeStats: Object.entries(degreeMap).map(([name, value]) => ({ name, value })),
              politicStats: Object.entries(politicMap).map(([name, value]) => ({ name, value })),
              topDepts: Object.entries(deptMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5),
              sampleJobs: data
          });
      } finally { setAnalyzing(false); }
  };

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-12 animate-soft pb-24">
       <header>
            <h1 className="text-4xl font-bold text-slate-800 tracking-tight flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                    <PieIcon className="w-6 h-6 text-primary" />
                </div>
                专业行情透视
            </h1>
            <p className="text-slate-400 mt-3 text-lg font-medium">穿透 10,000+ 数据维度，揭示不同专业的真实报考蓝海与竞争情况。</p>
        </header>

        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex gap-4 max-w-2xl mx-auto md:mx-0">
             <div className="relative flex-1">
                <Search className="absolute left-4 top-4 text-slate-300 w-5 h-5" />
                <input 
                    type="text" 
                    placeholder="输入专业名称，如“应用数学”..." 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all outline-none font-bold text-slate-700"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && analyzeMajor(searchTerm)}
                />
             </div>
             <button onClick={() => analyzeMajor(searchTerm)} disabled={analyzing} className="px-8 py-4 bg-primary text-white font-bold rounded-[1.5rem] shadow-lg shadow-indigo-100 transition-all flex items-center gap-2">
                {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : '立即透视'}
            </button>
        </div>

        {loading ? (
             <div className="py-40 flex flex-col items-center justify-center"><Loader2 className="animate-spin text-primary opacity-20 w-10 h-10" /></div>
        ) : view === 'overview' ? (
            <div className="space-y-12">
                <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm">
                   <h2 className="text-2xl font-bold text-slate-800 mb-10 flex items-center gap-3">
                       <TrendingUp className="w-6 h-6 text-emerald-500" /> 热门招考专业 Top 10
                   </h2>
                   <div className="w-full h-[450px]">
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={trends}>
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700, fill: '#94A3B8'}} />
                              <YAxis hide />
                              <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                              <Bar dataKey="count" fill="#818CF8" radius={[15, 15, 15, 15]} barSize={40} onClick={(d) => analyzeMajor(d.name)} />
                          </BarChart>
                      </ResponsiveContainer>
                   </div>
                </div>
            </div>
        ) : (
            detailData && (
                <div className="space-y-10 animate-soft">
                    <button onClick={() => setView('overview')} className="text-slate-400 font-bold flex items-center gap-2 hover:text-primary transition-colors">
                        <ArrowLeft className="w-4 h-4" /> 返回数据大盘
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800 mb-8">学历偏好分布</h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={detailData.degreeStats} innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value">
                                            {detailData.degreeStats.map((_, i) => <Cell key={i} fill={SOFT_COLORS[i % SOFT_COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800 mb-8">政治面貌要求比重</h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={detailData.politicStats} outerRadius={110} dataKey="value" label={({name}) => name}>
                                            {detailData.politicStats.map((_, i) => <Cell key={i} fill={SOFT_COLORS[(i+2) % SOFT_COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )
        )}
    </div>
  );
};

export default MajorAnalysis;
