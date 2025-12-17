
import React, { useState, useEffect } from 'react';
import { Search, Database, PieChart as PieIcon, BarChart3, Building2, Loader2, ArrowLeft, GraduationCap, Users, X, MapPin, AlertTriangle, Phone, ExternalLink, Briefcase, ClipboardList, Filter } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { PublicServiceJobDB } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

// Statistics Interfaces
interface MajorTrend {
    name: string;
    count: number;
}

interface MajorDeepDive {
    majorName: string;
    totalJobs: number;
    degreeStats: { name: string; value: number }[];
    politicStats: { name: string; value: number }[];
    topDepts: { name: string; value: number }[];
    sampleJobs: PublicServiceJobDB[];
}

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const MajorAnalysis: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  
  // View State: 'overview' or 'detail'
  const [view, setView] = useState<'overview' | 'detail'>('overview');
  
  // Data States
  const [trends, setTrends] = useState<MajorTrend[]>([]);
  const [detailData, setDetailData] = useState<MajorDeepDive | null>(null);
  const [selectedJob, setSelectedJob] = useState<PublicServiceJobDB | null>(null);
  const [activeDeptFilter, setActiveDeptFilter] = useState<string | null>(null);

  // 1. Initial Load: Fetch Market Overview (Top Majors)
  useEffect(() => {
    fetchMarketTrends();
  }, []);

  const fetchMarketTrends = async () => {
      setLoading(true);
      try {
          // Fetch a large sample to calculate trends
          // Optimized: Filter out nulls explicitly and check errors
          const { data, error } = await supabase
            .from('public_service_jobs')
            .select('major_req')
            .not('major_req', 'is', null)
            .limit(1000); 

          if (error) {
              throw error;
          }
          
          if (!data) {
              setTrends([]);
              return;
          }

          const counts: Record<string, number> = {};
          data.forEach(row => {
              if (!row.major_req) return;
              const parts = row.major_req.split(/[,，、]/).map(s => s.trim());
              parts.forEach(p => {
                  if (p.length > 2 && !['不限', '无限制', '相关专业'].includes(p)) {
                      const key = p.replace(/[（(].*[)）]/, ''); 
                      counts[key] = (counts[key] || 0) + 1;
                  }
              });
          });

          const sorted = Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
          
          setTrends(sorted);
      } catch (err: any) {
          console.error("Trend fetch failed:", err.message || JSON.stringify(err));
          setTrends([]);
      } finally {
          setLoading(false);
      }
  };

  // 2. Deep Dive Analysis: Analyze specific major
  const analyzeMajor = async (majorName: string) => {
      setAnalyzing(true);
      setView('detail');
      setSearchTerm(majorName); 
      setActiveDeptFilter(null); // Reset filter

      try {
          const { data, error } = await supabase
            .from('public_service_jobs')
            .select('*')
            .ilike('major_req', `%${majorName}%`)
            .limit(500); // Increased limit for better stats

          if (error || !data || data.length === 0) {
             setDetailData(null);
             return;
          }

          // A. Degree Stats
          const degreeMap: Record<string, number> = {};
          data.forEach(j => {
              const d = j.degree_req || '未说明';
              degreeMap[d] = (degreeMap[d] || 0) + 1;
          });
          const degreeStats = Object.entries(degreeMap).map(([name, value]) => ({ name, value }));

          // B. Political Status Stats
          const politicMap: Record<string, number> = {};
          data.forEach(j => {
              const p = j.politic_req || '不限';
              politicMap[p] = (politicMap[p] || 0) + 1;
          });
          const politicStats = Object.entries(politicMap).map(([name, value]) => ({ name, value }));

          // C. Top Departments
          const deptMap: Record<string, number> = {};
          data.forEach(j => {
              const d = j.dept_name || '未知部门';
              deptMap[d] = (deptMap[d] || 0) + 1;
          });
          const topDepts = Object.entries(deptMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

          setDetailData({
              majorName,
              totalJobs: data.length, 
              degreeStats,
              politicStats,
              topDepts,
              sampleJobs: data
          });

      } catch (err) {
          console.error("Analysis failed:", err);
          setDetailData(null);
      } finally {
          setAnalyzing(false);
      }
  };

  const handleSearch = () => {
      if(searchTerm.trim()) {
          analyzeMajor(searchTerm.trim());
      }
  };

  // Filter sample jobs by department
  const filterJobsByDept = (deptName: string) => {
      setActiveDeptFilter(deptName);
  };

  const clearFilter = () => {
      setActiveDeptFilter(null);
  };

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

  const renderOverview = () => (
      <div className="space-y-8 animate-fade-in">
          {/* Hero Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
                <Database className="w-8 h-8 mb-4 opacity-80" />
                <h3 className="text-lg font-medium opacity-90">知识库岗位样本</h3>
                <p className="text-3xl font-bold mt-1">1,000+</p>
                <p className="text-xs mt-2 opacity-70">基于最新入库数据实时分析</p>
             </div>
             <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-center">
                <h3 className="text-slate-500 font-medium flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-emerald-500" />
                    热门专业 Top 1
                </h3>
                <p className="text-2xl font-bold text-slate-800 mt-2">
                    {trends.length > 0 ? trends[0].name : '...'}
                </p>
             </div>
             <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-center">
                <h3 className="text-slate-500 font-medium flex items-center gap-2">
                    <PieIcon className="w-5 h-5 text-amber-500" />
                    覆盖专业领域
                </h3>
                <p className="text-2xl font-bold text-slate-800 mt-2">
                    {trends.length > 0 ? '50+' : '...'} 类
                </p>
             </div>
          </div>

          {/* Trend Chart */}
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm min-w-0">
             <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                 <BarChart3 className="w-6 h-6 text-primary" />
                 热门招考专业排行榜 (Top 10)
             </h2>
             <div className="w-full h-[400px]" style={{ width: '100%', height: 400 }}>
                {trends.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trends} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                            <XAxis 
                                dataKey="name" 
                                angle={-45} 
                                textAnchor="end" 
                                interval={0} 
                                height={80} 
                                tick={{fontSize: 12}}
                            />
                            <YAxis />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                cursor={{fill: '#F1F5F9'}}
                            />
                            <Bar 
                                dataKey="count" 
                                fill="#3B82F6" 
                                radius={[8, 8, 0, 0]} 
                                name="岗位数量"
                                onClick={(data) => analyzeMajor(data.name)}
                                cursor="pointer"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">
                        暂无趋势数据，正在收集...
                    </div>
                )}
             </div>
             <p className="text-center text-sm text-slate-400 mt-4">
                 点击柱状图可查看该专业的详细透视报告
             </p>
          </div>
      </div>
  );

  const renderDetail = () => {
      if (!detailData) {
          return (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 border-dashed">
                  <Database className="w-12 h-12 text-slate-200 mb-4" />
                  <p className="text-slate-500">未找到关于“{searchTerm}”的详细数据。</p>
                  <button onClick={() => setView('overview')} className="mt-4 text-primary hover:underline">返回概览</button>
              </div>
          );
      }

      // Filter sample jobs if department filter is active
      const displayJobs = activeDeptFilter 
        ? detailData.sampleJobs.filter(j => j.dept_name === activeDeptFilter)
        : detailData.sampleJobs.slice(0, 8); // Default show top 8

      return (
          <div className="space-y-6 animate-fade-in">
              <button 
                onClick={() => setView('overview')}
                className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors"
              >
                  <ArrowLeft className="w-4 h-4" /> 返回热门排行
              </button>

              <header className="flex justify-between items-end">
                  <div>
                      <h2 className="text-3xl font-bold text-slate-800">
                          {detailData.majorName}
                      </h2>
                      <p className="text-slate-500 mt-2 flex items-center gap-2">
                          <Database className="w-4 h-4" />
                          在当前样本中检索到 {detailData.totalJobs}+ 个相关岗位
                      </p>
                  </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Chart 1: Degree */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-w-0">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <GraduationCap className="w-5 h-5 text-emerald-500" /> 学历门槛分析
                      </h3>
                      <div className="h-[250px] w-full" style={{ width: '100%', height: 250 }}>
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie
                                      data={detailData.degreeStats}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={60}
                                      outerRadius={80}
                                      paddingAngle={5}
                                      dataKey="value"
                                  >
                                      {detailData.degreeStats.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                  </Pie>
                                  <Tooltip />
                                  <Legend />
                              </PieChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  {/* Chart 2: Politics */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-w-0">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <Users className="w-5 h-5 text-red-500" /> 政治面貌要求
                      </h3>
                      <div className="h-[250px] w-full" style={{ width: '100%', height: 250 }}>
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie
                                      data={detailData.politicStats}
                                      cx="50%"
                                      cy="50%"
                                      outerRadius={80}
                                      dataKey="value"
                                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                                  >
                                      {detailData.politicStats.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={index === 0 ? '#EF4444' : '#94A3B8'} />
                                      ))}
                                  </Pie>
                                  <Tooltip />
                              </PieChart>
                          </ResponsiveContainer>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Top Departments */}
                  <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-primary" /> 招录大户 (Top 5)
                      </h3>
                      <p className="text-xs text-slate-400 mb-3">点击部门名称筛选右侧岗位</p>
                      <div className="space-y-4">
                          {detailData.topDepts.map((d, i) => (
                              <div 
                                key={i} 
                                onClick={() => filterJobsByDept(d.name)}
                                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors border ${
                                    activeDeptFilter === d.name 
                                    ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300' 
                                    : 'bg-slate-50 border-transparent hover:bg-slate-100 hover:border-slate-200'
                                }`}
                              >
                                  <span className={`text-sm font-medium truncate max-w-[160px] ${activeDeptFilter === d.name ? 'text-primary' : 'text-slate-700'}`}>{d.name}</span>
                                  <span className={`text-xs font-bold px-2 py-1 rounded border ${activeDeptFilter === d.name ? 'bg-white border-blue-100 text-primary' : 'bg-white border-gray-100 text-slate-500'}`}>
                                      {d.value} 岗位
                                  </span>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Sample Jobs List */}
                  <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Database className="w-5 h-5 text-slate-500" /> 
                            {activeDeptFilter ? `${activeDeptFilter} - 相关岗位` : '真实岗位示例'}
                        </h3>
                        {activeDeptFilter && (
                            <button onClick={clearFilter} className="text-xs flex items-center gap-1 text-slate-400 hover:text-slate-600">
                                <X className="w-3 h-3" /> 清除筛选
                            </button>
                        )}
                      </div>
                      
                      {displayJobs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {displayJobs.map((job) => (
                                <div 
                                    key={job.id} 
                                    onClick={() => setSelectedJob(job)}
                                    className="p-4 border border-gray-100 rounded-xl hover:bg-slate-50 hover:shadow-md hover:border-blue-100 transition-all cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-slate-800 text-sm line-clamp-1 group-hover:text-primary transition-colors">{job.job_name}</h4>
                                        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded shrink-0">{job.degree_req}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                                        <Building2 className="w-3 h-3" />
                                        {job.dept_name}
                                    </p>
                                    <div className="text-[10px] text-slate-400 bg-gray-50 p-2 rounded line-clamp-1">
                                        专业要求: {job.major_req}
                                    </div>
                                </div>
                            ))}
                        </div>
                      ) : (
                          <div className="flex flex-col items-center justify-center py-10 text-slate-400 border border-dashed border-gray-200 rounded-xl">
                              <Filter className="w-8 h-8 mb-2 opacity-20" />
                              <p>该筛选条件下暂无数据</p>
                              <button onClick={clearFilter} className="text-primary text-sm mt-2 hover:underline">查看全部</button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
       <header>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                <PieIcon className="w-8 h-8 text-primary" />
                专业数据透视
            </h1>
            <p className="text-slate-500 mt-2">基于 Supabase 知识库的全量数据分析，为您揭示专业的真实招考行情。</p>
        </header>

        {/* Global Search */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-3 max-w-2xl">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
                <input 
                    type="text" 
                    placeholder="输入任意专业（如：法学、统计学），查看深度分析..." 
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
             </div>
             <button 
                onClick={handleSearch}
                disabled={analyzing}
                className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-70 flex items-center gap-2"
            >
                {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : '深度分析'}
            </button>
        </div>

        {loading ? (
             <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p>正在从数据库聚合数据...</p>
             </div>
        ) : (
            view === 'overview' ? renderOverview() : renderDetail()
        )}
        
        {renderJobModal()}
    </div>
  );
};

export default MajorAnalysis;
