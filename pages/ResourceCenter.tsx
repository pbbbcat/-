
import React, { useEffect, useState } from 'react';
import { 
  Search, FileText, Newspaper, Download, ExternalLink, Filter, Loader2, 
  Bookmark, X, Printer, Bot, Sparkles, FileCheck, AlertTriangle, 
  CheckCircle2, XCircle, ChevronDown, ChevronUp, Eye, EyeOff, Calendar, 
  MapPin, Tag, Share2, Info, Database 
} from 'lucide-react';
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
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [selectedPaper, setSelectedPaper] = useState<ResourceItem | null>(null);
    const [examData, setExamData] = useState<MockExamData | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = activeTab === 'materials' ? await fetchStudyMaterials() : await fetchPolicyArticles();
                setItems(data);
            } catch (e) { console.error(e); } 
            finally { setLoading(false); }
        };
        load();
    }, [activeTab]);

    const handleGeneratePaper = async (item: ResourceItem) => {
        setSelectedPaper(item);
        setExamData(null);
        setIsGenerating(true);
        setUserAnswers({});
        setRevealedAnswers({});
        try {
            const data = await generateMockPaper(item.title);
            setExamData(data);
        } catch (err) {
            console.error(err);
        } finally { 
          setIsGenerating(false); 
        }
    };

    const handleDownloadRealFile = async (item: ResourceItem) => {
        if (item.storageBucket && item.storagePath) {
            setDownloadingId(item.id);
            const signedUrl = await getSignedFileUrl(item.storageBucket, item.storagePath);
            if (signedUrl) window.open(signedUrl, '_blank');
            else alert("链接生成失败，请刷新重试");
            setDownloadingId(null);
        } else { 
          alert("此资源仅支持 AI 在线组卷练习"); 
        }
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCat = filterCategory === 'all' || item.category === filterCategory;
        return matchesSearch && matchesCat;
    });

    const renderPaperModal = () => {
        if (!selectedPaper) return null;
        return (
            <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
                <div className="bg-white rounded-[3rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[92vh] border border-white/20">
                    <div className="flex justify-between items-center px-10 py-6 border-b border-gray-100 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <Bot className="w-8 h-8 text-primary" />
                            <div>
                              <h3 className="text-xl font-bold text-slate-800 line-clamp-1">{selectedPaper.title}</h3>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">AI 智能全解析试卷</p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedPaper(null)} className="p-3 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-all border border-slate-100 shadow-sm"><X className="w-6 h-6" /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-slate-50/30 p-8 md:p-12 custom-scrollbar">
                        {isGenerating ? (
                            <div className="h-full flex flex-col items-center justify-center space-y-6">
                                <div className="relative">
                                  <div className="w-20 h-20 border-[6px] border-slate-100 border-t-primary rounded-full animate-spin"></div>
                                  <Bot className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                </div>
                                <div className="text-center">
                                  <h4 className="font-black text-2xl text-slate-800 mb-2">AI 命题组正在组卷...</h4>
                                  <p className="text-slate-400 font-medium">正为您锁定 2026 最新考点与逻辑题库</p>
                                </div>
                            </div>
                        ) : examData ? (
                            <div className="max-w-3xl mx-auto space-y-10 pb-32">
                                <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-indigo-50 text-center relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                    <h2 className="text-3xl font-black text-slate-800 mb-2 relative z-10">{examData.title}</h2>
                                    <p className="text-slate-500 font-medium relative z-10 flex items-center justify-center gap-2">
                                      <FileCheck className="w-4 h-4 text-emerald-500" />
                                      行测 10 题 + 申论 2 题 · 专家级解析
                                    </p>
                                </div>

                                {examData.questions.map((q, idx) => (
                                    <div key={q.id || idx} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden transition-all hover:border-primary/10">
                                        <div className="p-10 border-b border-gray-50 bg-white">
                                            <div className="flex gap-6">
                                                <div className="w-10 h-10 bg-slate-800 text-white text-sm font-black rounded-2xl flex items-center justify-center shrink-0 shadow-xl shadow-slate-100">{idx + 1}</div>
                                                <div className="flex-1 space-y-5">
                                                    <div className="flex items-center gap-3">
                                                      <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest ${q.type === 'single_choice' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-purple-50 text-purple-600 border border-purple-100'}`}>
                                                        {q.type === 'single_choice' ? '行测/单选' : '申论/主观'}
                                                      </span>
                                                    </div>
                                                    {q.material && (
                                                      <div className="bg-slate-50/80 p-6 rounded-3xl text-slate-500 text-sm leading-relaxed italic border-l-4 border-indigo-300">
                                                        {q.material}
                                                      </div>
                                                    )}
                                                    <p className="text-slate-800 font-bold text-xl leading-relaxed">{q.stem}</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="p-10 bg-white/50">
                                            {q.type === 'single_choice' && q.options ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {q.options.map(opt => {
                                                        const optionKey = opt.trim().substring(0, 1).toUpperCase();
                                                        const isSelected = userAnswers[q.id] === optionKey;
                                                        return (
                                                            <div 
                                                                key={opt} 
                                                                onClick={() => !revealedAnswers[q.id] && setUserAnswers({...userAnswers, [q.id]: optionKey})} 
                                                                className={`p-6 border-2 rounded-3xl cursor-pointer transition-all flex items-center gap-4 text-base font-bold ${
                                                                    isSelected ? 'bg-primary/5 border-primary shadow-lg shadow-indigo-100' : 'bg-white border-slate-50 hover:border-slate-200'
                                                                } ${revealedAnswers[q.id] ? 'pointer-events-none' : ''}`}
                                                            >
                                                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                                                    isSelected ? 'border-primary bg-primary text-white' : 'border-slate-200 text-slate-300'
                                                                }`}>
                                                                    {optionKey}
                                                                </div>
                                                                <span className={isSelected ? 'text-primary' : 'text-slate-600'}>{opt.substring(2).trim()}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                   <textarea 
                                                     className="w-full p-8 bg-white border border-slate-100 rounded-[2rem] text-sm focus:ring-4 focus:ring-primary/5 outline-none transition-all h-52 shadow-inner" 
                                                     placeholder="请结合材料输入作答提纲或详细全文..." 
                                                   />
                                                   <p className="text-[10px] text-slate-300 font-bold text-center">输入即触发智能评分引擎（Beta）</p>
                                                </div>
                                            )}
                                            
                                            <div className="mt-10 flex justify-between items-center border-t border-slate-50 pt-8">
                                                <div className="flex items-center gap-2 text-[10px] text-slate-300 font-black uppercase tracking-widest">
                                                    AI 命题 · 智能辅助备考系统
                                                </div>
                                                <button 
                                                  onClick={() => setRevealedAnswers({...revealedAnswers, [q.id]: !revealedAnswers[q.id]})} 
                                                  className={`px-8 py-3 rounded-2xl text-xs font-black flex items-center gap-2 transition-all ${
                                                    revealedAnswers[q.id] ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                  }`}
                                                >
                                                    {revealedAnswers[q.id] ? <><EyeOff className="w-4 h-4" /> 隐藏答案</> : <><Eye className="w-4 h-4" /> 查看解析</>}
                                                </button>
                                            </div>
                                            
                                            {revealedAnswers[q.id] && (
                                                <div className="mt-8 pt-8 border-t border-indigo-50 animate-soft">
                                                    <div className="flex items-center gap-4 mb-6">
                                                        <div className="bg-emerald-100 text-emerald-700 px-6 py-2 rounded-2xl text-sm font-black shadow-sm border border-emerald-200">
                                                          正确选项：{q.correctAnswer}
                                                        </div>
                                                        {userAnswers[q.id] && (
                                                            <div className={`flex items-center gap-2 text-sm font-black ${userAnswers[q.id] === q.correctAnswer.toUpperCase() ? 'text-emerald-500' : 'text-red-500'}`}>
                                                                {userAnswers[q.id] === q.correctAnswer.toUpperCase() ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                                                {userAnswers[q.id] === q.correctAnswer.toUpperCase() ? '回答正确' : `回答错误 (选了 ${userAnswers[q.id]})`}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 text-sm text-slate-600 leading-relaxed text-justify shadow-inner">
                                                        <h5 className="font-black text-slate-800 mb-3 flex items-center gap-2 uppercase tracking-widest text-xs">
                                                          <Sparkles className="w-4 h-4 text-amber-500" /> AI 专家解析
                                                        </h5>
                                                        <div className="prose prose-sm max-w-none">
                                                            <ReactMarkdown>{q.analysis}</ReactMarkdown>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                
                                <div className="p-10 bg-indigo-600 text-white rounded-[2.5rem] text-center shadow-xl shadow-indigo-100">
                                   <h4 className="text-xl font-black mb-2">已完成本次模拟！</h4>
                                   <p className="opacity-80 text-sm font-medium mb-6">点击下方按钮保存本次练习报告或返回资源中心</p>
                                   <button onClick={() => setSelectedPaper(null)} className="px-10 py-4 bg-white text-indigo-600 font-black rounded-2xl hover:bg-indigo-50 transition-all">返回列表</button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-8 max-w-7xl mx-auto animate-soft pb-24 relative">
            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h1 className="text-4xl font-black text-slate-800 tracking-tight">资源与模拟中心</h1>
                  <p className="text-slate-400 mt-2 text-lg font-medium">官方原版真题下载与 AI 深度模拟，拒绝单一题库，让练习更有质感。</p>
                </div>
                <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex gap-4">
                  <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl flex items-center gap-2 text-xs font-bold">
                    <Database className="w-4 h-4" /> 数据库已对齐 2026 招考
                  </div>
                </div>
            </header>

            <div className="flex flex-col md:flex-row gap-6 mb-10 items-center justify-between">
                <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit shadow-inner">
                    <button onClick={() => setActiveTab('materials')} className={`flex items-center gap-3 px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'materials' ? 'bg-white text-primary shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}><FileText className="w-4 h-4" />真题组卷</button>
                    <button onClick={() => setActiveTab('news')} className={`flex items-center gap-3 px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === 'news' ? 'bg-white text-emerald-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}><Newspaper className="w-4 h-4" />政策解读</button>
                </div>
                <div className="relative flex-1 max-w-md w-full">
                    <Search className="absolute left-4 top-4 w-5 h-5 text-slate-300" />
                    <input 
                      type="text" 
                      placeholder="搜索关键词，如：2025国考、行测..." 
                      className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-sm font-bold text-slate-700" 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-40 flex-col items-center gap-6">
                    <div className="w-16 h-16 border-4 border-slate-100 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-bold animate-pulse">正在检索云端资源库与 AI 预测题...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {filteredItems.map((item) => (
                        <div key={item.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-primary/20 transition-all flex flex-col justify-between group h-full">
                            <div>
                                <div className="flex items-center gap-2 mb-5">
                                    <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-tighter border ${item.category === '真题' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : (item.category === '模拟' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100')}`}>
                                      {item.category || '解读'}
                                    </span>
                                    <span className="text-[10px] text-slate-300 font-bold ml-auto">{item.publishDate}</span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-4 line-clamp-2 leading-tight group-hover:text-primary transition-colors">{item.title}</h3>
                                {item.summary && <p className="text-sm text-slate-400 italic mb-8 line-clamp-2 leading-relaxed bg-slate-50 p-4 rounded-2xl">{item.summary}</p>}
                            </div>
                            <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
                                {item.isRealFile && (
                                    <button 
                                      onClick={() => handleDownloadRealFile(item)} 
                                      disabled={downloadingId === item.id}
                                      className="px-6 py-3 bg-slate-50 text-slate-600 font-bold rounded-2xl text-xs hover:bg-slate-100 transition-all flex items-center gap-2 border border-transparent hover:border-slate-200"
                                    >
                                      {downloadingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                      PDF 下载
                                    </button>
                                )}
                                
                                {activeTab === 'news' ? (
                                    <button 
                                      onClick={() => window.open(item.url, '_blank')} 
                                      className="px-8 py-3 bg-emerald-600 text-white font-black rounded-2xl text-xs shadow-xl shadow-emerald-100 hover:bg-emerald-700 flex items-center gap-2 active:scale-95 transition-all"
                                    >
                                      <ExternalLink className="w-4 h-4" /> 阅读原文
                                    </button>
                                ) : (
                                    <button 
                                      onClick={() => handleGeneratePaper(item)} 
                                      className="px-8 py-3 bg-primary text-white font-black rounded-2xl text-xs shadow-xl shadow-indigo-100 hover:bg-indigo-600 flex items-center gap-2 active:scale-95 transition-all"
                                    >
                                      <Bot className="w-4 h-4" /> AI 组卷练习
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {renderPaperModal()}
        </div>
    );
};

export default ResourceCenter;
