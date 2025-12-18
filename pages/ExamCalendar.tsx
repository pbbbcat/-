
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
    
    // Set baseline date to User's specific "now" for accurate countdowns
    const [today, setToday] = useState(new Date('2025-12-18T10:00:00'));

    // --- SPRINT PLANNER STATE ---
    const [isPlannerOpen, setIsPlannerOpen] = useState(false);
    const [planStep, setPlanStep] = useState<'config' | 'generating' | 'result'>('config');
    const [planConfig, setPlanConfig] = useState({
        targetExam: '2026年多省公务员联考',
        targetDate: '2026-03-21',
        dailyHours: 4,
        weakness: '数量关系'
    });
    const [studyPlan, setStudyPlan] = useState<StudyPlanPhase[]>([]);

    useEffect(() => {
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

    const nextBigExamDate = new Date(planConfig.targetDate + 'T00:00:00');
    const diffTime = nextBigExamDate.getTime() - today.getTime();
    const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const displayDays = daysUntil > 0 ? daysUntil : 0;

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
                            2025年12月18日
                         </span>
                         <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">2026省考倒计时开启</span>
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
                            <span className="text-5xl font-bold tracking-tight">{displayDays}</span>
                            <span className="text-lg opacity-80 font-bold ml-1">天</span>
                        </div>
                        <p className="text-xs text-indigo-200 mt-3 opacity-80 font-medium">
                            预计笔试：2026年3月21日
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
        </div>
    );
};

export default ExamCalendar;
