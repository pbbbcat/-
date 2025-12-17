

import React, { useEffect, useState } from 'react';
import { CalendarDays, Clock, MapPin, CheckCircle2, Circle, Timer, Calendar, BarChart3, TrendingUp, AlertCircle, ArrowRight, Flag, Target, Zap, BookOpen, ChevronRight, X, Loader2, PlayCircle } from 'lucide-react';
import { ExamEvent, StudyPlanPhase } from '../types';
import { fetchExamCalendar } from '../services/resourceService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { generateStudyPlan } from '../services/geminiService';

const ExamCalendar: React.FC = () => {
    const [events, setEvents] = useState<ExamEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<'all' | 'national' | 'provincial' | 'institution'>('all');
    
    // --- REAL SYSTEM TIME ---
    // The date will now reflect the actual user's system date.
    const [today, setToday] = useState(new Date());

    // --- SPRINT PLANNER STATE ---
    const [isPlannerOpen, setIsPlannerOpen] = useState(false);
    const [planStep, setPlanStep] = useState<'config' | 'generating' | 'result'>('config');
    const [planConfig, setPlanConfig] = useState({
        targetExam: '2025年多省公务员联考',
        targetDate: '2025-03-29', // Updated to the correct 2025 Joint Exam Date
        dailyHours: 4,
        weakness: '数量关系'
    });
    const [studyPlan, setStudyPlan] = useState<StudyPlanPhase[]>([]);

    useEffect(() => {
        // Update time every minute to keep it "alive" if the user keeps the tab open
        const timer = setInterval(() => setToday(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Calculate Days until next big exam (Joint Exam - Est. March 29, 2025)
    // Dynamic countdown based on real 'today'
    const nextBigExamDate = new Date(planConfig.targetDate + 'T00:00:00');
    const diffTime = nextBigExamDate.getTime() - today.getTime();
    const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const displayDays = daysUntil > 0 ? daysUntil : 0;

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await fetchExamCalendar();
                // Sort by date ascending
                const sorted = data.sort((a, b) => {
                     const dateA = a.year! * 100 + a.month;
                     const dateB = b.year! * 100 + b.month;
                     return dateA - dateB;
                });
                setEvents(sorted);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleGeneratePlan = async () => {
        setPlanStep('generating');
        const plan = await generateStudyPlan(
            planConfig.targetExam,
            displayDays,
            planConfig.dailyHours,
            planConfig.weakness
        );
        setStudyPlan(plan);
        setPlanStep('result');
    };

    // When exam selection changes, update the date
    const handleExamSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = e.target.value;
        let date = '2025-03-29'; // Default
        
        if (selected.includes('联考')) {
            if (selected.includes('事业单位')) date = '2025-05-24';
            else date = '2025-03-29';
        } else if (selected.includes('广东省考')) {
            date = '2025-03-16'; // Approximate
        } else if (selected.includes('2026年国考')) {
            date = '2025-11-30'; // Approximate
        }

        setPlanConfig({
            ...planConfig,
            targetExam: selected,
            targetDate: date
        });
    };

    const filteredEvents = events.filter(e => filterType === 'all' || e.type === filterType);

    // Stats for Charts
    const statusStats = [
        { name: '已结束', value: events.filter(e => e.status === 'ended').length, color: '#94A3B8' },
        { name: '进行中', value: events.filter(e => e.status === 'ongoing' || e.status === 'registering').length, color: '#F59E0B' },
        { name: '未开始', value: events.filter(e => e.status === 'upcoming').length, color: '#3B82F6' },
    ].filter(i => i.value > 0);

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'upcoming': return 'text-blue-600 bg-blue-50 border-blue-100';
            case 'registering': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
            case 'ongoing': return 'text-amber-600 bg-amber-50 border-amber-100';
            case 'ended': return 'text-slate-400 bg-slate-50 border-slate-100 grayscale';
            default: return 'text-gray-500';
        }
    };

    const getStatusText = (status: string) => {
         switch(status) {
            case 'upcoming': return '即将开始';
            case 'registering': return '报名中';
            case 'ongoing': return '进行中';
            case 'ended': return '已结束';
            default: return '未知';
        }
    };

    // Helper to determine if an event is in the past relative to the real "today"
    const isPast = (event: ExamEvent) => {
        // Strict logic based on real date
        if (event.status === 'ended') return true;
        if (event.year) {
            // Assume event happens on the 1st of the month if no specific day parsed (simplified)
            // Ideally we'd parse dateStr, but month/year is sufficient for visual timeline
            const evtDate = new Date(event.year, event.month - 1, 28); // End of month check
            return evtDate < today;
        }
        return false;
    };

    const renderPlannerModal = () => {
        if (!isPlannerOpen) return null;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-slate-50">
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-amber-500" />
                            AI 智能冲刺计划生成器
                        </h3>
                        <button onClick={() => setIsPlannerOpen(false)} className="text-slate-400 hover:text-slate-600">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                        {planStep === 'config' && (
                            <div className="space-y-6 animate-fade-in">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">目标考试</label>
                                    <select 
                                        className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 outline-none"
                                        value={planConfig.targetExam}
                                        onChange={handleExamSelect}
                                    >
                                        <option value="2025年多省公务员联考">2025年多省公务员联考 (3月29日)</option>
                                        <option value="2025年广东省考">2025年广东省考 (预计3月)</option>
                                        <option value="2025年上半年事业单位联考">2025年事业单位联考 (5月24日)</option>
                                        <option value="2026年国家公务员考试">2026年国考 (预计11月)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">每日可投入学习时长</label>
                                    <div className="flex items-center gap-4">
                                        <input 
                                            type="range" 
                                            min="1" max="12" step="0.5"
                                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                            value={planConfig.dailyHours}
                                            onChange={(e) => setPlanConfig({...planConfig, dailyHours: parseFloat(e.target.value)})}
                                        />
                                        <span className="w-20 text-center font-bold text-primary bg-blue-50 py-1 rounded-lg">
                                            {planConfig.dailyHours} 小时
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">最薄弱/急需提升的模块</label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {['言语理解', '数量关系', '判断推理', '资料分析', '常识判断', '申论写作'].map(mod => (
                                            <button
                                                key={mod}
                                                onClick={() => setPlanConfig({...planConfig, weakness: mod})}
                                                className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all ${
                                                    planConfig.weakness === mod 
                                                    ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-sm' 
                                                    : 'bg-white border-gray-200 text-slate-600 hover:border-gray-300'
                                                }`}
                                            >
                                                {mod}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                                    <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-blue-800 text-sm">剩余备考时间：{displayDays} 天</p>
                                        <p className="text-xs text-blue-600 mt-1">AI 将根据您的时间余额，自动平衡基础复习与刷题冲刺的比例。</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {planStep === 'generating' && (
                            <div className="flex flex-col items-center justify-center py-10 space-y-6">
                                <div className="relative">
                                    <div className="w-20 h-20 border-4 border-gray-100 rounded-full"></div>
                                    <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                                    <Zap className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                                </div>
                                <div className="text-center">
                                    <h4 className="text-lg font-bold text-slate-800">正在生成冲刺方案...</h4>
                                    <p className="text-slate-500 text-sm mt-2">分析时间进度 • 匹配弱项策略 • 规划每日任务</p>
                                </div>
                            </div>
                        )}

                        {planStep === 'result' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="flex items-center gap-2 mb-4">
                                    <Target className="w-5 h-5 text-red-500" />
                                    <h4 className="font-bold text-slate-800">您的专属备考路线图</h4>
                                </div>
                                <div className="relative pl-6 space-y-8 border-l-2 border-dashed border-gray-200 ml-3">
                                    {studyPlan.map((phase, idx) => (
                                        <div key={idx} className="relative">
                                            <div className="absolute -left-[33px] w-8 h-8 rounded-full bg-white border-2 border-indigo-500 flex items-center justify-center text-xs font-bold text-indigo-600 shadow-sm">
                                                {idx + 1}
                                            </div>
                                            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h5 className="font-bold text-slate-800">{phase.phaseName}</h5>
                                                    <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded">
                                                        {phase.duration}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600 mb-3 font-medium flex items-center gap-2">
                                                    <Target className="w-3 h-3 text-amber-500" /> 
                                                    重点：{phase.focus}
                                                </p>
                                                <div className="space-y-2">
                                                    {phase.tasks.map((task, tIdx) => (
                                                        <div key={tIdx} className="flex items-start gap-2 text-xs text-slate-500 bg-gray-50 p-2 rounded">
                                                            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                                                            {task}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                        {planStep === 'result' ? (
                            <>
                                <button 
                                    onClick={() => setPlanStep('config')}
                                    className="px-5 py-2.5 text-slate-600 font-bold hover:bg-gray-200 rounded-xl transition-colors"
                                >
                                    调整参数
                                </button>
                                <button 
                                    onClick={() => setIsPlannerOpen(false)}
                                    className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-600 transition-colors"
                                >
                                    保存计划
                                </button>
                            </>
                        ) : planStep === 'config' ? (
                            <button 
                                onClick={handleGeneratePlan}
                                className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-600 transition-colors flex items-center gap-2"
                            >
                                <Zap className="w-4 h-4" />
                                生成计划
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in pb-20">
            {/* Header Section with Date & Countdown */}
            <header className="mb-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary rounded-lg text-white">
                            <CalendarDays className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-800">2025公考日历 (实时)</h1>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 mb-6 pl-1">
                         <Clock className="w-4 h-4 text-primary" />
                         <span className="font-medium">当前系统时间：</span>
                         <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-lg">
                            {today.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                         </span>
                    </div>
                    
                    {/* Progress Bar for the Year */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                                2025 省考联考周期
                            </span>
                            <span className="text-xs font-bold text-slate-400">进行中</span>
                        </div>
                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
                            {/* Visual representation mostly static for layout, but contextually correct */}
                            <div className="h-full bg-slate-400 w-[20%]" title="国考已结束"></div>
                            <div className="h-full bg-primary w-[30%] animate-pulse" title="省考备考黄金期"></div>
                            <div className="h-full bg-blue-100 w-[50%]" title="事业单位/下半年国考"></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 mt-2">
                            <span>2024.12 (国考笔试)</span>
                            <span className="text-primary font-bold">Today</span>
                            <span>2025.06 (统考结束)</span>
                        </div>
                    </div>
                </div>

                {/* Countdown Card - INTERACTIVE NOW */}
                <div className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200 relative overflow-hidden flex flex-col justify-center">
                    <div className="relative z-10">
                        <h3 className="text-indigo-100 text-sm font-medium mb-1 flex items-center gap-2">
                            <Flag className="w-4 h-4" />
                            距离目标考试
                        </h3>
                        <div className="flex items-baseline gap-1 mt-2">
                            <span className="text-5xl font-bold tracking-tight">{displayDays}</span>
                            <span className="text-lg opacity-80">天</span>
                        </div>
                        <p className="text-xs text-indigo-200 mt-3 opacity-80">
                            目标日期：{planConfig.targetDate} ({planConfig.targetExam.split(' ')[0]})
                        </p>
                        <button 
                            onClick={() => { setPlanStep('config'); setIsPlannerOpen(true); }}
                            className="mt-4 w-full py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-sm font-bold transition-all border border-white/10 flex items-center justify-center gap-2"
                        >
                            <Zap className="w-4 h-4" />
                            制定冲刺计划
                        </button>
                    </div>
                    {/* Decorative Circles */}
                    <div className="absolute top-[-20px] right-[-20px] w-24 h-24 rounded-full border-[6px] border-white/10"></div>
                    <div className="absolute bottom-[-20px] left-[-10px] w-16 h-16 rounded-full bg-white/10 blur-xl"></div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Timeline Column */}
                <div className="lg:col-span-3">
                    {/* Filter Tabs */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                        {[
                            { id: 'all', label: '全部日程' },
                            { id: 'national', label: '国考' },
                            { id: 'provincial', label: '省考/联考' },
                            { id: 'institution', label: '事业单位' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setFilterType(tab.id as any)}
                                className={`px-5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${
                                    filterType === tab.id 
                                    ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                                    : 'bg-white text-slate-500 border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                         <div className="space-y-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex gap-4 animate-pulse">
                                    <div className="w-16 h-16 bg-gray-200 rounded-xl shrink-0"></div>
                                    <div className="flex-1 h-32 bg-gray-100 rounded-xl"></div>
                                </div>
                            ))}
                         </div>
                    ) : (
                        <div className="relative space-y-0">
                            {/* Vertical Line */}
                            <div className="absolute left-[31px] top-4 bottom-4 w-0.5 bg-gray-200"></div>

                            {filteredEvents.map((event, idx) => {
                                const finished = isPast(event);
                                const isNext = !finished && (idx === 0 || isPast(filteredEvents[idx-1]));

                                return (
                                    <div key={event.id} className="relative pl-20 pb-8 group">
                                        {/* Timeline Node */}
                                        <div className={`absolute left-0 top-0 w-16 flex flex-col items-center justify-center py-2 bg-slate-50 rounded-xl border-2 z-10 transition-colors ${finished ? 'border-gray-200 text-slate-400' : 'border-primary text-primary bg-white shadow-sm'}`}>
                                            <span className="text-xl font-bold leading-none">{event.month}</span>
                                            <span className="text-[10px] font-medium leading-none mt-1">月</span>
                                            <div className="text-[9px] scale-75 opacity-60 mt-0.5">{event.year}</div>
                                        </div>

                                        {/* Today Line Indicator - Logic adjusted for dynamic Today */}
                                        {isNext && (
                                            <div className="absolute left-[20px] -top-6 flex items-center gap-2 z-20">
                                                <div className="w-6 h-6 rounded-full bg-red-500 border-4 border-white shadow-md flex items-center justify-center">
                                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                                                </div>
                                                <div className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded border border-red-100">
                                                    当前 (Real Time)
                                                </div>
                                                <div className="h-[1px] w-full bg-red-200 absolute left-8 -z-10"></div>
                                            </div>
                                        )}

                                        {/* Card */}
                                        <div className={`bg-white rounded-2xl p-5 border transition-all ${
                                            finished 
                                            ? 'border-gray-100 opacity-70 hover:opacity-100 grayscale-[0.5] hover:grayscale-0' 
                                            : 'border-gray-200 shadow-sm hover:shadow-md hover:border-primary/30'
                                        }`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${getStatusColor(event.status)}`}>
                                                    {getStatusText(event.status)}
                                                </span>
                                                {event.type === 'national' && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">国考</span>}
                                                {event.type === 'provincial' && <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">省考</span>}
                                                {event.type === 'institution' && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">事业单位</span>}
                                            </div>

                                            <h3 className={`text-lg font-bold mb-2 ${finished ? 'text-slate-500' : 'text-slate-800'}`}>
                                                {event.title}
                                            </h3>

                                            <div className="flex flex-col gap-2 mb-3">
                                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                                    <Calendar className="w-4 h-4 text-slate-400" />
                                                    <span className="font-medium">{event.dateStr}</span>
                                                </div>
                                                <p className="text-xs text-slate-400 leading-relaxed bg-slate-50 p-2 rounded">
                                                    {event.description}
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50">
                                                {event.tags.map(tag => (
                                                    <span key={tag} className="text-[10px] text-slate-500 bg-slate-100 px-2 py-1 rounded">#{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Sidebar Stats Column */}
                <div className="hidden lg:block space-y-6">
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm sticky top-6">
                        <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-slate-400" />
                            日程状态概览
                        </h4>
                        
                        <div className="h-48 w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusStats}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={60}
                                        dataKey="value"
                                        paddingAngle={5}
                                    >
                                        {statusStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{fontSize: '12px'}}/>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                                <span className="text-2xl font-bold text-slate-700">{events.length}</span>
                                <span className="text-[10px] text-slate-400">Total</span>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-50">
                            <p className="text-xs text-slate-400 mb-2 font-bold">小贴士</p>
                            <div className="text-xs text-slate-500 bg-blue-50 p-3 rounded-lg border border-blue-100 leading-relaxed">
                                <span className="font-bold text-blue-600">当前阶段：</span>
                                2025年省考联考公告发布密集期，请重点关注本省人事考试网，利用“冲刺计划”合理分配时间。
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Render the modal */}
            {renderPlannerModal()}
        </div>
    );
};

export default ExamCalendar;