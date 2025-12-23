
import React, { useEffect, useState } from 'react';
import { CalendarDays, Clock, MapPin, CheckCircle2, Circle, Timer, Calendar, BarChart3, TrendingUp, AlertCircle, ArrowRight, Flag, Target, Zap, BookOpen, ChevronRight, X, Loader2, PlayCircle, Rocket, BrainCircuit } from 'lucide-react';
import { ExamEvent, StudyPlanPhase } from '../types';
import { fetchExamCalendar } from '../services/resourceService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { generateStudyPlan } from '../services/geminiService';

const ExamCalendar: React.FC = () => {
    const [events, setEvents] = useState<ExamEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<'all' | 'national' | 'provincial' | 'institution'>('all');
    
    // Updated: Use real-time system date instead of hardcoded date
    const [today, setToday] = useState(new Date());

    // --- SPRINT PLANNER STATE ---
    const [isPlannerOpen, setIsPlannerOpen] = useState(false);
    const [planStep, setPlanStep] = useState<'config' | 'generating' | 'result'>('config');
    const [planConfig, setPlanConfig] = useState({
        targetExam: '2026年多省公务员联考',
        targetDate: '2026-03-21',
        dailyHours: 4,
        weakness: '数量关系与资料分析'
    });
    const [studyPlan, setStudyPlan] = useState<StudyPlanPhase[]>([]);

    useEffect(() => {
        // Optional: Update timer every minute to keep date fresh if page stays open long
        const timer = setInterval(() => setToday(new Date()), 60000);

        const load = async () => {
            setLoading(true);
            try {
                const data = await fetchExamCalendar();
                // Sort by date chronologically
                const sorted = data.sort((a, b) => {
                     const dateA = (a.year || 2025) * 100 + a.month;
                     const dateB = (b.year || 2025) * 100 + b.month;
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
        return () => clearInterval(timer);
    }, []);

    const handleGeneratePlan = async () => {
        setPlanStep('generating');
        const nextBigExamDate = new Date(planConfig.targetDate);
        const diffTime = nextBigExamDate.getTime() - today.getTime();
        const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const displayDays = daysUntil > 0 ? daysUntil : 30; // Default to 30 if date passed or invalid

        const plan = await generateStudyPlan(
            planConfig.targetExam,
            displayDays,
            planConfig.dailyHours,
            planConfig.weakness
        );
        setStudyPlan(plan);
        setPlanStep('result');
    };

    const handleClosePlanner = () => {
        setIsPlannerOpen(false);
        setPlanStep('config'); // Reset to config for next time
    };

    const nextBigExamDate = new Date(planConfig.targetDate + 'T00:00:00');
    // Safe calculation for display in header
    const diffTime = nextBigExamDate.getTime() - today.getTime();
    const daysUntilHeader = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const displayDaysHeader = daysUntilHeader > 0 ? daysUntilHeader : 0;

    const filteredEvents = events.filter(e => filterType === 'all' || e.type === filterType);

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
            case 'upcoming': return '即将发布';
            case 'registering': return '报名进行中';
            case 'ongoing': return '考察/面试中';
            case 'ended': return '笔试已结束';
            default: return '未知';
        }
    };

    // Helper to render the Sprint Planner Modal
    const renderPlannerModal = () => {
        if (!isPlannerOpen) return null;

        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-amber-500" />
                            智能备考冲刺规划
                        </h3>
                        <button onClick={handleClosePlanner} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                        {planStep === 'config' && (
                            <div className="space-y-6 animate-fade-in">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">目标考试</label>
                                    <input 
                                        type="text" 
                                        value={planConfig.targetExam}
                                        onChange={e => setPlanConfig({...planConfig, targetExam: e.target.value})}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">目标日期</label>
                                        <input 
                                            type="date" 
                                            value={planConfig.targetDate}
                                            onChange={e => setPlanConfig({...planConfig, targetDate: e.target.value})}
                                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">日均投入 (小时)</label>
                                        <input 
                                            type="number" 
                                            value={planConfig.dailyHours}
                                            onChange={e => setPlanConfig({...planConfig, dailyHours: parseInt(e.target.value)})}
                                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">薄弱模块 (AI 将重点强化)</label>
                                    <input 
                                        type="text" 
                                        value={planConfig.weakness}
                                        onChange={e => setPlanConfig({...planConfig, weakness: e.target.value})}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="例如：数量关系、申论大作文..."
                                    />
                                </div>
                                <button 
                                    onClick={handleGeneratePlan}
                                    className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 mt-4"
                                >
                                    <BrainCircuit className="w-5 h-5" /> 生成 AI 冲刺方案
                                </button>
                            </div>
                        )}

                        {planStep === 'generating' && (
                            <div className="flex flex-col items-center justify-center py-20 space-y-6">
                                <div className="w-20 h-20 border-[6px] border-slate-100 border-t-primary rounded-full animate-spin"></div>
                                <div className="text-center">
                                    <h4 className="text-xl font-bold text-slate-800">AI 正在规划路径...</h4>
                                    <p className="text-slate-400 mt-2">分析剩余天数与薄弱项，拆解学习任务</p>
                                </div>
                            </div>
                        )}

                        {planStep === 'result' && (
                            <div className="space-y-8 animate-fade-in">
                                <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 text-center">
                                    <p className="text-emerald-800 font-bold text-lg">🚀 您的专属上岸计划已生成</p>
                                    <p className="text-emerald-600/80 text-sm mt-1">请严格执行，祝您一举成“公”！</p>
                                </div>
                                <div className="relative pl-4 space-y-8 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
                                    {studyPlan.map((phase, idx) => (
                                        <div key={idx} className="relative pl-8">
                                            <div className="absolute left-[-5px] top-0 w-3 h-3 bg-white border-2 border-primary rounded-full"></div>
                                            <h4 className="font-bold text-lg text-slate-800">{phase.phaseName} <span className="text-sm font-normal text-slate-500 ml-2">({phase.duration})</span></h4>
                                            <p className="text-primary font-bold text-sm mt-1 mb-3 flex items-center gap-2">
                                                <Target className="w-4 h-4" /> 核心目标：{phase.focus}
                                            </p>
                                            <ul className="space-y-2">
                                                {phase.tasks.map((task, tIdx) => (
                                                    <li key={tIdx} className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-sm text-slate-600">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                                        {task}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                                <button 
                                    onClick={handleClosePlanner}
                                    className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                                >
                                    保存并关闭
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in pb-20">
            <header className="mb-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary rounded-2xl text-white shadow-lg shadow-blue-100">
                            <CalendarDays className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-800">2026 年度招考日程</h1>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 mb-6 pl-1">
                         <Clock className="w-4 h-4 text-primary" />
                         <span className="font-medium">当前基准：</span>
                         <span className="font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-xl">
                            {today.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                         </span>
                         <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">时间同步中</span>
                    </div>
                    
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                                年度招录活跃度
                            </span>
                        </div>
                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
                            <div className="h-full bg-slate-400 w-[20%]" title="国考笔试已完成"></div>
                            <div className="h-full bg-primary w-[45%] animate-pulse" title="省考/联考预热中"></div>
                            <div className="h-full bg-blue-100 w-[35%]" title="春招/事业单位"></div>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden flex flex-col justify-center">
                    <div className="relative z-10">
                        <h3 className="text-indigo-100 text-sm font-bold mb-1 flex items-center gap-2">
                            <Flag className="w-4 h-4" />
                            2026年多省联考
                        </h3>
                        <div className="flex items-baseline gap-1 mt-2">
                            <span className="text-5xl font-bold tracking-tight">{displayDaysHeader}</span>
                            <span className="text-lg opacity-80 font-bold ml-1">天</span>
                        </div>
                        <p className="text-xs text-indigo-200 mt-3 opacity-80 font-medium">
                            预计笔试：{planConfig.targetDate}
                        </p>
                        <button 
                            onClick={() => setIsPlannerOpen(true)}
                            className="mt-5 w-full py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-2xl text-sm font-bold transition-all border border-white/10 flex items-center justify-center gap-2"
                        >
                            <Zap className="w-4 h-4" /> 开启冲刺规划
                        </button>
                    </div>
                    <div className="absolute top-[-20px] right-[-20px] w-24 h-24 rounded-full border-[8px] border-white/10"></div>
                </div>
            </header>

            <div className="lg:col-span-3">
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                    {['all', 'national', 'provincial', 'institution'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setFilterType(tab as any)}
                            className={`px-6 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all border ${
                                filterType === tab 
                                ? 'bg-slate-800 text-white border-slate-800 shadow-lg' 
                                : 'bg-white text-slate-500 border-gray-100 hover:bg-gray-50'
                            }`}
                        >
                            {tab === 'all' ? '全部周期' : tab === 'national' ? '国考' : tab === 'provincial' ? '省考' : '军队文职/事业单位'}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
                    </div>
                ) : (
                    <div className="relative space-y-0 pl-10">
                        <div className="absolute left-[39px] top-4 bottom-4 w-[2px] bg-slate-100"></div>

                        {filteredEvents.map((event) => {
                            const isFinished = event.status === 'ended';
                            return (
                                <div key={event.id} className="relative pl-12 pb-10 group">
                                    <div className={`absolute left-0 top-0 w-16 h-16 rounded-2xl border-2 z-10 flex flex-col items-center justify-center transition-all ${
                                        isFinished ? 'bg-slate-50 border-slate-100 text-slate-400' : 'bg-white border-primary text-primary shadow-lg shadow-blue-50'
                                    }`}>
                                        <span className="text-xl font-black">{event.month}</span>
                                        <span className="text-[10px] font-bold uppercase">MONTH</span>
                                    </div>

                                    <div className={`bg-white rounded-3xl p-6 border transition-all ${
                                        isFinished ? 'border-gray-50 opacity-60' : 'border-gray-100 shadow-sm hover:shadow-xl hover:border-primary/20'
                                    }`}>
                                        <div className="flex justify-between items-center mb-4">
                                            <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border ${getStatusColor(event.status)}`}>
                                                {getStatusText(event.status)}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400">{event.year} 年度招录</span>
                                        </div>

                                        <h3 className="text-lg font-bold text-slate-800 mb-2">{event.title}</h3>
                                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-4 font-medium">
                                            <Calendar className="w-4 h-4 text-primary" />
                                            {event.dateStr}
                                        </div>
                                        <p className="text-xs text-slate-400 leading-relaxed bg-slate-50 p-4 rounded-2xl">
                                            {event.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Render the Sprint Planner Modal */}
            {renderPlannerModal()}
        </div>
    );
};

export default ExamCalendar;
