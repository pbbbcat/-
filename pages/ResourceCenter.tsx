
import React, { useEffect, useState } from 'react';
import { Search, FileText, Newspaper, Download, ExternalLink, Filter, Loader2, Bookmark, X, Printer, Bot, Sparkles, FileCheck, AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronUp, Eye, EyeOff, Edit3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ResourceItem, MockExamData, MockQuestion } from '../types';
import { fetchStudyMaterials, fetchPolicyArticles } from '../services/resourceService';
import { generateMockPaper } from '../services/geminiService';
import { getSignedFileUrl } from '../services/supabaseClient';

const ResourceCenter: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'materials' | 'news'>('materials');
    const [items, setItems] = useState<ResourceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Download States
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    // --- Modal States for Paper Generation ---
    const [selectedPaper, setSelectedPaper] = useState<ResourceItem | null>(null);
    const [examData, setExamData] = useState<MockExamData | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Interactive Exam State
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                if (activeTab === 'materials') {
                    const data = await fetchStudyMaterials();
                    setItems(data);
                } else {
                    const data = await fetchPolicyArticles();
                    setItems(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [activeTab]);

    const handleGeneratePaper = async (item: ResourceItem) => {
        setSelectedPaper(item);
        setExamData(null);
        setIsGenerating(true);
        setUserAnswers({});
        setRevealedAnswers({});

        // Call Gemini to generate the structured JSON content
        const data = await generateMockPaper(item.title);
        
        setExamData(data);
        setIsGenerating(false);
    };

    const handleViewPolicy = (url?: string) => {
        if (url) {
            window.open(url, '_blank');
        } else {
            alert("该链接暂时无法访问");
        }
    };

    const handleDownloadRealFile = async (item: ResourceItem) => {
        if (item.storageBucket && item.storagePath) {
            setDownloadingId(item.id);
            try {
                const signedUrl = await getSignedFileUrl(item.storageBucket, item.storagePath);
                if (signedUrl) {
                    window.open(signedUrl, '_blank');
                } else {
                    alert("无法获取文件链接，请确认数据库中文件是否存在 (Bucket: " + item.storageBucket + ")");
                }
            } catch (e) {
                console.error("Download failed", e);
                alert("下载请求失败");
            } finally {
                setDownloadingId(null);
            }
        } else if (item.url) {
            window.open(item.url, '_blank');
        } else {
            alert("文件链接无效");
        }
    };

    // --- Interactive Exam Logic ---
    const handleOptionSelect = (qId: number, optionLabel: string) => {
        // Only allow changing answer if not revealed yet? Or allow anytime. Let's allow anytime but UI shows correct status if revealed.
        setUserAnswers(prev => ({...prev, [qId]: optionLabel}));
    };

    const toggleReveal = (qId: number) => {
        setRevealedAnswers(prev => ({...prev, [qId]: !prev[qId]}));
    };

    const handleEssayInput = (qId: number, text: string) => {
        setUserAnswers(prev => ({...prev, [qId]: text}));
    };

    const filteredItems = items.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Modal Component for Generated Paper
    const renderPaperModal = () => {
        if (!selectedPaper) return null;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
                    {/* Modal Header */}
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{selectedPaper.title}</h3>
                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-amber-500" />
                                    AI 智能出题 • 仿真模拟系统
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedPaper(null)} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full text-slate-400 transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Modal Content */}
                    <div className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8 custom-scrollbar">
                        {isGenerating ? (
                            <div className="h-full flex flex-col items-center justify-center space-y-6">
                                <div className="relative">
                                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
                                    <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                                    <Bot className="w-8 h-8 text-indigo-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                                </div>
                                <div className="text-center">
                                    <h4 className="font-bold text-slate-700 text-lg">AI 考官正在出题中...</h4>
                                    <p className="text-sm text-slate-400 mt-2">正在梳理考点 • 编写解析 • 格式化排版</p>
                                </div>
                            </div>
                        ) : examData ? (
                            <div className="max-w-3xl mx-auto space-y-6">
                                {/* Exam Info Card */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-50 text-center">
                                    <h2 className="text-2xl font-bold text-slate-800 mb-2">{examData.title}</h2>
                                    <p className="text-slate-500 text-sm">{examData.description}</p>
                                    <div className="flex justify-center gap-4 mt-4 text-xs font-medium text-slate-400">
                                        <span>共 {examData.questions.length} 题</span>
                                        <span>•</span>
                                        <span>建议用时 15 分钟</span>
                                    </div>
                                </div>

                                {/* Questions Loop */}
                                {examData.questions.map((q, idx) => (
                                    <div key={q.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md">
                                        {/* Question Stem */}
                                        <div className="p-6 border-b border-gray-50">
                                            <div className="flex items-start gap-3">
                                                <span className="flex items-center justify-center w-6 h-6 rounded bg-slate-100 text-slate-600 text-xs font-bold shrink-0 mt-0.5">
                                                    {idx + 1}
                                                </span>
                                                <div className="flex-1">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded mr-2 align-middle ${q.type === 'single_choice' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                                        {q.type === 'single_choice' ? '单选题' : '主观题'}
                                                    </span>
                                                    <span className="text-slate-800 font-medium text-lg leading-relaxed align-middle">
                                                        {q.stem}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            {q.material && (
                                                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-gray-100 text-sm text-slate-600 leading-relaxed italic">
                                                    <span className="font-bold text-slate-400 text-xs block mb-1">【背景材料】</span>
                                                    {q.material}
                                                </div>
                                            )}
                                        </div>

                                        {/* Interaction Area */}
                                        <div className="p-6 bg-white">
                                            {q.type === 'single_choice' ? (
                                                <div className="space-y-3">
                                                    {q.options?.map((opt) => {
                                                        const optLabel = opt.substring(0, 1); // "A"
                                                        const isSelected = userAnswers[q.id] === optLabel;
                                                        const isRevealed = revealedAnswers[q.id];
                                                        const isCorrect = q.correctAnswer === optLabel;
                                                        
                                                        // Style Logic
                                                        let containerClass = "border-gray-200 hover:bg-gray-50 hover:border-gray-300";
                                                        let icon = <div className={`w-5 h-5 rounded-full border-2 ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'}`}></div>;

                                                        if (isRevealed) {
                                                            if (isCorrect) {
                                                                containerClass = "bg-green-50 border-green-200 ring-1 ring-green-300";
                                                                icon = <CheckCircle2 className="w-5 h-5 text-green-600" />;
                                                            } else if (isSelected && !isCorrect) {
                                                                containerClass = "bg-red-50 border-red-200 ring-1 ring-red-300";
                                                                icon = <XCircle className="w-5 h-5 text-red-600" />;
                                                            } else if (!isSelected && !isCorrect) {
                                                                 containerClass = "opacity-60 border-gray-100";
                                                            }
                                                        } else if (isSelected) {
                                                            containerClass = "bg-indigo-50 border-indigo-200 ring-1 ring-indigo-300";
                                                        }

                                                        return (
                                                            <div 
                                                                key={opt}
                                                                onClick={() => !isRevealed && handleOptionSelect(q.id, optLabel)}
                                                                className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${containerClass}`}
                                                            >
                                                                {icon}
                                                                <span className={`text-sm ${isSelected || (isRevealed && isCorrect) ? 'text-slate-800 font-medium' : 'text-slate-600'}`}>{opt}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div>
                                                    <textarea 
                                                        className="w-full p-4 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none resize-none bg-slate-50"
                                                        rows={4}
                                                        placeholder="请在此输入您的作答思路（仅供自测，AI不进行评分）..."
                                                        value={userAnswers[q.id] || ''}
                                                        onChange={(e) => handleEssayInput(q.id, e.target.value)}
                                                    />
                                                </div>
                                            )}

                                            {/* Action Bar */}
                                            <div className="mt-6 flex justify-end">
                                                <button 
                                                    onClick={() => toggleReveal(q.id)}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                                        revealedAnswers[q.id] 
                                                        ? 'bg-gray-100 text-slate-500 hover:bg-gray-200' 
                                                        : 'bg-primary text-white hover:bg-blue-600 shadow-md shadow-blue-100'
                                                    }`}
                                                >
                                                    {revealedAnswers[q.id] ? (
                                                        <>
                                                            <EyeOff className="w-4 h-4" /> 收起解析
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Eye className="w-4 h-4" /> 查看解析
                                                        </>
                                                    )}
                                                </button>
                                            </div>

                                            {/* Analysis Section (Hidden by default) */}
                                            {revealedAnswers[q.id] && (
                                                <div className="mt-6 pt-6 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <span className="text-xs font-bold text-white bg-slate-800 px-2 py-1 rounded">正确答案</span>
                                                        <span className="text-lg font-bold text-green-600 font-mono tracking-wider">
                                                            {q.correctAnswer}
                                                        </span>
                                                        {q.type === 'single_choice' && (
                                                            <span className={`text-xs ml-2 ${userAnswers[q.id] === q.correctAnswer ? 'text-green-600' : 'text-red-500'}`}>
                                                                {userAnswers[q.id] ? (userAnswers[q.id] === q.correctAnswer ? '（回答正确）' : '（回答错误）') : '（未作答）'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-50">
                                                        <h4 className="text-xs font-bold text-blue-600 mb-2 flex items-center gap-1">
                                                            <Sparkles className="w-3 h-3" /> 
                                                            名师解析
                                                        </h4>
                                                        <div className="text-sm text-slate-700 leading-relaxed text-justify">
                                                            <ReactMarkdown>{q.analysis}</ReactMarkdown>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                <div className="text-center py-8 pb-12">
                                    <p className="text-sm text-slate-400 mb-4">—— 已加载全部试题 ——</p>
                                    <button 
                                        onClick={() => setSelectedPaper(null)}
                                        className="px-8 py-3 bg-white border border-gray-200 text-slate-600 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                                    >
                                        结束练习
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-red-500 py-20">
                                数据解析失败，请重试。
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in pb-20">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                    备考资源中心
                </h1>
                <p className="text-slate-500 mt-2">聚合全网优质真题与权威政策资讯，支持 AI 实时生成仿真试卷与下载 Supabase 原件。</p>
            </header>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between">
                <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                    <button 
                        onClick={() => setActiveTab('materials')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'materials' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <FileText className="w-4 h-4" />
                        真题模拟
                    </button>
                    <button 
                        onClick={() => setActiveTab('news')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'news' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Newspaper className="w-4 h-4" />
                        政策资讯 (Real)
                    </button>
                </div>

                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder={activeTab === 'materials' ? "搜索真题、模拟卷、知识点..." : "搜索政策解读、公告..."}
                        className="w-full pl-9 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Content List */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                </div>
            ) : filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredItems.map((item) => (
                        <div key={item.id} className={`bg-white p-5 rounded-2xl border ${item.isRealFile ? 'border-indigo-100 shadow-md ring-1 ring-indigo-50' : 'border-gray-100 shadow-sm'} hover:shadow-md transition-all group flex flex-col justify-between h-full`}>
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${activeTab === 'materials' ? (item.isRealFile ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-blue-50 text-blue-600 border-blue-100') : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                        {item.source}
                                    </span>
                                    <span className="text-xs text-slate-400">{item.publishDate}</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-primary transition-colors cursor-pointer line-clamp-2 min-h-[3.5rem]">
                                    {item.title}
                                </h3>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {item.tags.map((tag, idx) => (
                                        <span key={idx} className="text-xs bg-gray-50 text-slate-500 px-2 py-1 rounded">#{tag}</span>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                {activeTab === 'materials' ? (
                                    item.isRealFile ? (
                                        <button 
                                            onClick={() => handleDownloadRealFile(item)}
                                            disabled={downloadingId === item.id}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {downloadingId === item.id ? (
                                                <>
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                    请求中...
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="w-3 h-3" />
                                                    下载原件 PDF
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => handleGeneratePaper(item)}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-100"
                                        >
                                            <Bot className="w-3 h-3" />
                                            AI 生成试卷
                                        </button>
                                    )
                                ) : (
                                    <>
                                        <div className="text-xs text-slate-400 flex items-center gap-1">
                                            <ExternalLink className="w-3 h-3" />
                                            外部链接
                                        </div>
                                        <button 
                                            onClick={() => handleViewPolicy(item.url)}
                                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-gray-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors"
                                        >
                                            阅读原文
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <Filter className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">未找到相关资源</p>
                </div>
            )}
            
            <div className="mt-8 text-center text-xs text-slate-400">
                数据来源说明：Supabase 存储提供真题原件；Gemini AI 提供仿真生成；政策资讯链接至官方网站。
            </div>

            {/* Render Modal */}
            {renderPaperModal()}
        </div>
    );
};

export default ResourceCenter;
