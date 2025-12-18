
import React, { useEffect, useState } from 'react';
import { Search, FileText, Newspaper, Download, ExternalLink, Filter, Loader2, Bookmark, X, Printer, Bot, Sparkles, FileCheck, AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronUp, Eye, EyeOff, Calendar, MapPin, Tag, Share2, Info } from 'lucide-react';
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
    const [filterCategory, setFilterCategory] = useState<string>('all');
    
    // Download States
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    // Modal States
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
        const data = await generateMockPaper(item.title);
        setExamData(data);
        setIsGenerating(false);
    };

    const handleViewPolicy = (url?: string) => {
        if (!url || url === '#') return;
        window.open(url, '_blank');
    };

    const handleDownloadRealFile = async (item: ResourceItem) => {
        if (item.storageBucket && item.storagePath) {
            setDownloadingId(item.id);
            try {
                const signedUrl = await getSignedFileUrl(item.storageBucket, item.storagePath);
                if (signedUrl) {
                    window.open(signedUrl, '_blank');
                } else {
                    alert("该文件尚未在云端就绪，请联系管理员核对存储路径。");
                }
            } catch (e) {
                console.error(e);
                alert("下载请求失败，请检查网络或稍后重试。");
            } finally {
                setDownloadingId(null);
            }
        } else if (item.url && item.url !== '#') {
            window.open(item.url, '_blank');
        } else {
            alert("该资料暂未提供 PDF 下载，请通过‘AI 组卷’在线练习。");
        }
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             (item.summary?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                             item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesCat = filterCategory === 'all' || item.category === filterCategory;
        
        return matchesSearch && matchesCat;
    });

    const subCategories = activeTab === 'materials' 
        ? ['all', '真题', '模拟'] 
        : ['all', '公告', '解读', '指南'];

    const renderPaperModal = () => {
        if (!selectedPaper) return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600"><Bot className="w-5 h-5" /></div>
                            <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{selectedPaper.title}</h3>
                        </div>
                        <button onClick={() => setSelectedPaper(null)} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full text-slate-400"><X className="w-6 h-6" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8 custom-scrollbar">
                        {isGenerating ? (
                            <div className="h-full flex flex-col items-center justify-center space-y-4">
                                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                <h4 className="font-bold text-slate-700">AI 考官正在从海量官方真题库中组卷...</h4>
                            </div>
                        ) : examData ? (
                            <div className="max-w-3xl mx-auto space-y-6 pb-20">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-50 text-center">
                                    <h2 className="text-2xl font-bold text-slate-800 mb-2">{examData.title}</h2>
                                    <p className="text-slate-500 text-sm">{examData.description}</p>
                                </div>
                                {examData.questions.map((q, idx) => (
                                    <div key={q.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                        <div className="p-6 border-b border-gray-50">
                                            <div className="flex gap-3">
                                                <span className="w-6 h-6 bg-slate-100 text-slate-600 text-xs font-bold rounded flex items-center justify-center shrink-0">{idx + 1}</span>
                                                <div className="flex-1">
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mr-2 align-middle ${q.type === 'single_choice' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>{q.type === 'single_choice' ? '单选' : '主观'}</span>
                                                    <span className="text-slate-800 font-medium">{q.stem}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            {q.type === 'single_choice' ? (
                                                <div className="space-y-2">
                                                    {q.options?.map(opt => (
                                                        <div key={opt} onClick={() => !revealedAnswers[q.id] && setUserAnswers({...userAnswers, [q.id]: opt.substring(0, 1)})} className={`p-3 border rounded-xl cursor-pointer transition-all flex items-center gap-3 text-sm ${userAnswers[q.id] === opt.substring(0,1) ? 'bg-primary/5 border-primary ring-1 ring-primary' : 'bg-white border-gray-100 hover:bg-gray-50'}`}>
                                                            <div className={`w-4 h-4 rounded-full border-2 ${userAnswers[q.id] === opt.substring(0,1) ? 'border-primary bg-primary' : 'border-gray-200'}`}></div>
                                                            {opt}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <textarea className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" rows={4} placeholder="在此作答..." />
                                            )}
                                            <div className="mt-4 flex justify-end">
                                                <button onClick={() => setRevealedAnswers({...revealedAnswers, [q.id]: !revealedAnswers[q.id]})} className="text-xs font-bold text-primary flex items-center gap-1">
                                                    {revealedAnswers[q.id] ? <><EyeOff className="w-3 h-3" /> 隐藏解析</> : <><Eye className="w-3 h-3" /> 查看解析</>}
                                                </button>
                                            </div>
                                            {revealedAnswers[q.id] && (
                                                <div className="mt-4 pt-4 border-t border-gray-50 bg-blue-50/30 p-4 rounded-xl">
                                                    <p className="text-xs font-bold text-green-600 mb-1">正确答案：{q.correctAnswer}</p>
                                                    <div className="text-xs text-slate-600 text-justify leading-relaxed"><ReactMarkdown>{q.analysis}</ReactMarkdown></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in pb-20">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">备考资源中心</h1>
                <p className="text-slate-500 mt-2">同步国家公务员局权威资料，提供官方真题原件及 AI 深度组卷。</p>
            </header>

            <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-start">
                <div className="flex flex-col gap-4">
                    <div className="flex bg-gray-100 p-1 rounded-xl w-fit shadow-inner">
                        <button onClick={() => { setActiveTab('materials'); setFilterCategory('all'); }} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'materials' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <FileText className="w-4 h-4" />真题模拟
                        </button>
                        <button onClick={() => { setActiveTab('news'); setFilterCategory('all'); }} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'news' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            <Newspaper className="w-4 h-4" />政策咨询
                        </button>
                    </div>
                    
                    <div className="flex gap-2">
                        {subCategories.map(cat => (
                            <button key={cat} onClick={() => setFilterCategory(cat)} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${filterCategory === cat ? (activeTab === 'materials' ? 'bg-primary text-white' : 'bg-emerald-600 text-white') : 'bg-white text-slate-500 border border-gray-200 hover:bg-gray-50'}`}>
                                {cat === 'all' ? '全部' : cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="relative flex-1 max-w-md w-full">
                    <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder={activeTab === 'materials' ? "搜索真题年份、省份、专项模拟..." : "搜索政策关键词..."} className="w-full pl-9 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-32 flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-slate-200" />
                    <p className="text-slate-400 text-sm">正在检索云端数据库...</p>
                </div>
            ) : filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredItems.map((item) => (
                        <div key={item.id} className={`bg-white p-6 rounded-2xl border ${activeTab === 'news' ? 'border-emerald-50 hover:border-emerald-200' : 'border-indigo-50 hover:border-indigo-200'} shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full relative group`}>
                            {activeTab === 'materials' && item.category === '真题' && (
                                <span className="absolute top-4 right-4 text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded font-bold border border-red-100">官方真题</span>
                            )}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${activeTab === 'materials' ? (item.category === '真题' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-blue-50 text-blue-600 border-blue-100') : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                            {item.category || item.source}
                                        </span>
                                        <span className="text-[10px] text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" />{item.publishDate}</span>
                                    </div>
                                </div>
                                
                                <h3 className={`font-bold text-slate-800 mb-2 leading-snug group-hover:text-primary transition-colors cursor-pointer ${activeTab === 'news' ? 'text-lg line-clamp-2' : 'text-base line-clamp-2'}`}>
                                    {item.title}
                                </h3>

                                {activeTab === 'news' && (
                                    <p className="text-sm text-slate-500 line-clamp-3 mb-4 leading-relaxed text-justify italic">
                                        {item.summary}
                                    </p>
                                )}

                                <div className="flex flex-wrap gap-2 mb-4">
                                    {item.tags.map((tag, idx) => (
                                        <span key={idx} className="text-[10px] bg-gray-50 text-slate-500 px-2 py-0.5 rounded flex items-center gap-1 border border-gray-100"><Tag className="w-2.5 h-2.5" />{tag}</span>
                                    ))}
                                </div>
                            </div>
                            
                            <div className={`pt-4 border-t border-gray-50 flex items-center ${activeTab === 'news' ? 'justify-between' : 'justify-end'}`}>
                                {activeTab === 'news' && (
                                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                        <Info className="w-3 h-3" />
                                        来源：{item.source}
                                    </div>
                                )}
                                
                                {activeTab === 'materials' ? (
                                    <div className="flex gap-2">
                                        {item.isRealFile && (
                                            <button onClick={() => handleDownloadRealFile(item)} disabled={downloadingId === item.id} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all disabled:opacity-50">
                                                {downloadingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                                                下载真题 PDF
                                            </button>
                                        )}
                                        <button onClick={() => handleGeneratePaper(item)} className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-all shadow-md shadow-blue-100">
                                            <Bot className="w-3 h-3" />AI 组卷
                                        </button>
                                    </div>
                                ) : (
                                    <button onClick={() => handleViewPolicy(item.url)} className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100">
                                        <ExternalLink className="w-3 h-3" />阅读全文
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <Filter className="w-10 h-10 text-slate-300 mx-auto mb-3 opacity-20" />
                    <p className="text-slate-500">未找到相关资料</p>
                </div>
            )}
            
            <div className="mt-12 bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-center gap-6 shadow-sm">
                <div className="p-4 bg-white rounded-2xl shadow-sm"><Sparkles className="w-8 h-8 text-primary" /></div>
                <div>
                    <h4 className="text-base font-bold text-blue-800">权威资料保障</h4>
                    <p className="text-sm text-blue-600 mt-1">
                        系统仅提供官方渠道校验的真题文件。如遇下载失败，请尝试刷新页面。
                        “AI 组卷”基于官方题库逻辑，为您提供高质量的模拟。
                    </p>
                </div>
            </div>

            {renderPaperModal()}
        </div>
    );
};

export default ResourceCenter;
