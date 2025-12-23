
import React, { useEffect, useState, useRef } from 'react';
import { 
  Users, 
  Upload, 
  FileText, 
  Download, 
  Heart, 
  MessageSquare, 
  Search, 
  Filter, 
  FolderOpen, 
  CheckCircle2, 
  TrendingUp, 
  User, 
  Tag, 
  Sparkles, 
  X, 
  FileCheck, 
  FileCode, 
  FileImage, 
  Trash2, 
  Plus, 
  ArrowRight, 
  Eye, 
  Bookmark, 
  BookmarkCheck, 
  Loader2, 
  Info 
} from 'lucide-react';
import { CommunityNote } from '../types';
import { fetchDBCommunityNotes, shareNoteToDB, toggleLikeInDB } from '../services/communityService';
import { getSignedFileUrl } from '../services/supabaseClient';

const Community: React.FC = () => {
    const [notes, setNotes] = useState<CommunityNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'all' | 'favorites'>('all');
    
    // Persistence for favorites (likes)
    const [favorites, setFavorites] = useState<string[]>(() => {
        const saved = localStorage.getItem('user_fav_notes');
        return saved ? JSON.parse(saved) : [];
    });

    // Upload State
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [newNote, setNewNote] = useState({ title: '', category: '行测', desc: '' });
    
    // Selection for Preview
    const [selectedNote, setSelectedNote] = useState<CommunityNote | null>(null);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    // File Handling
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadNotes();
    }, []);

    useEffect(() => {
        localStorage.setItem('user_fav_notes', JSON.stringify(favorites));
    }, [favorites]);

    const loadNotes = async () => {
        setLoading(true);
        const data = await fetchDBCommunityNotes();
        setNotes(data);
        setLoading(false);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if(!newNote.title || !selectedFile) return;

        setIsUploading(true);
        const result = await shareNoteToDB(newNote.title, newNote.category, newNote.desc, selectedFile);
        
        if (result) {
            setNotes(prev => [result, ...prev]);
            setUploadSuccess(true);
            setTimeout(() => {
                setUploadModalOpen(false);
                setUploadSuccess(false);
                setSelectedFile(null);
                setNewNote({ title: '', category: '行测', desc: '' });
                setIsUploading(false);
            }, 1500);
        } else {
            alert("分享失败，请检查网络连接");
            setIsUploading(false);
        }
    };

    const toggleLike = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const isFav = favorites.includes(id);
        
        if (!isFav) {
            // Add to favorites
            setFavorites(prev => [...prev, id]);
            // Optimistic UI update for likes
            setNotes(prev => prev.map(n => n.id === id ? { ...n, likes: n.likes + 1 } : n));
            // Update DB (assuming toggleLikeInDB handles increment)
            const note = notes.find(n => n.id === id);
            if (note) toggleLikeInDB(id, note.likes);
        } else {
            // Remove from favorites
            setFavorites(prev => prev.filter(favId => favId !== id));
        }
    };

    const handleDownload = async (note: CommunityNote) => {
        if (!note.storagePath) {
            alert("该资料暂不支持下载");
            return;
        }
        setDownloadingId(note.id);
        try {
            const url = await getSignedFileUrl('exam-pdfs', note.storagePath);
            if (url) {
                window.open(url, '_blank');
            } else {
                alert("文件链接已失效");
            }
        } catch (e) {
            alert("下载失败");
        } finally {
            setDownloadingId(null);
        }
    };

    const filteredNotes = notes.filter(note => {
        const matchesMode = viewMode === 'all' || favorites.includes(note.id);
        const matchesCat = filterCategory === 'all' || note.category === filterCategory;
        const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              note.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesMode && matchesCat && matchesSearch;
    });

    const getFileIcon = (type: string) => {
        const t = type.toLowerCase();
        if (t === 'pdf') return <FileText className="w-8 h-8 text-red-400" />;
        if (t.includes('doc')) return <FileText className="w-8 h-8 text-blue-400" />;
        if (t === 'xmind') return <FileCode className="w-8 h-8 text-orange-400" />;
        return <FileText className="w-8 h-8 text-gray-400" />;
    };

    const renderPreviewModal = () => {
        if (!selectedNote) return null;
        const isFav = favorites.includes(selectedNote.id);
        return (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
                <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-slate-50">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white rounded-2xl shadow-sm">
                                {getFileIcon(selectedNote.fileType)}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">{selectedNote.title}</h3>
                                <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                                    <User className="w-3.5 h-3.5" /> {selectedNote.author} · {selectedNote.size}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedNote(null)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-600">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="p-8 overflow-y-auto space-y-6 custom-scrollbar">
                        <section>
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                资料简介
                            </h4>
                            <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                {selectedNote.summary || "作者比较懒，没有提供详细介绍。"}
                            </p>
                        </section>
                        <section className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                             <div className="flex items-center gap-2 text-blue-800 font-bold mb-2">
                                <Info className="w-4 h-4" /> 共享提示
                             </div>
                             <p className="text-sm text-blue-600 leading-relaxed">
                                本资料由考生自发上传至公考智辅社区，版权归原作者所有。下载后请仅用于个人学习备考。
                             </p>
                        </section>
                    </div>
                    <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                        <button 
                            onClick={(e) => toggleLike(selectedNote.id, e)} 
                            className={`px-6 py-3 bg-white border rounded-2xl font-bold transition-all flex items-center gap-2 ${isFav ? 'border-red-200 text-red-500 bg-red-50' : 'border-gray-200 text-slate-600 hover:bg-gray-100'}`}
                        >
                            {isFav ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                            {isFav ? '已收藏' : '收藏资料'}
                        </button>
                        <button 
                            disabled={downloadingId === selectedNote.id}
                            onClick={() => handleDownload(selectedNote)}
                            className="px-8 py-3 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                        >
                            {downloadingId === selectedNote.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            立即下载
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in pb-20">
            {/* Hero Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-8 text-white mb-8 shadow-xl shadow-indigo-200 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Sparkles className="w-8 h-8 text-yellow-300" />
                            2026 届高分经验社区
                        </h1>
                        <p className="text-indigo-100 mt-2 max-w-xl">
                            已有 <span className="font-bold text-white">{notes.length.toLocaleString()}</span> 份考生笔记在此共享。
                            <br/>在这里，你可以找到真实的备考战友和一手资料。
                        </p>
                    </div>
                    <button 
                        onClick={() => setUploadModalOpen(true)}
                        className="px-6 py-3 bg-white text-indigo-600 font-bold rounded-xl shadow-lg hover:bg-indigo-50 transition-transform active:scale-95 flex items-center gap-2"
                    >
                        <Upload className="w-5 h-5" />
                        分享我的资料
                    </button>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left: Filters */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Filter className="w-4 h-4 text-slate-400" />
                            浏览模式
                        </h3>
                        <div className="space-y-1">
                            <button
                                onClick={() => setViewMode('all')}
                                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors flex justify-between items-center ${viewMode === 'all' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-gray-50'}`}
                            >
                                全员共享中心
                                {viewMode === 'all' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>}
                            </button>
                            <button
                                onClick={() => setViewMode('favorites')}
                                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors flex justify-between items-center ${viewMode === 'favorites' ? 'bg-red-50 text-red-600' : 'text-slate-600 hover:bg-gray-50'}`}
                            >
                                我的收藏
                                {viewMode === 'favorites' && <BookmarkCheck className="w-4 h-4" />}
                            </button>
                        </div>
                        
                        <div className="mt-8 pt-6 border-t border-gray-50">
                            <h3 className="font-bold text-slate-800 mb-4 text-sm px-2">分类</h3>
                            <div className="space-y-1">
                                {['all', '行测', '申论', '面试', '综合'].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setFilterCategory(cat)}
                                        className={`w-full text-left px-4 py-2 rounded-lg text-xs font-medium transition-colors ${filterCategory === cat ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:bg-gray-50'}`}
                                    >
                                        {cat === 'all' ? '全部领域' : `${cat}专区`}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Main Content */}
                <div className="lg:col-span-3">
                    <div className="mb-6 relative">
                        <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="搜索共享资料、大纲、关键词..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100">
                             <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20 mb-4" />
                             <p className="text-slate-400">正在同步云端共享资料...</p>
                        </div>
                    ) : filteredNotes.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {filteredNotes.map(note => (
                                <div 
                                    key={note.id} 
                                    onClick={() => setSelectedNote(note)}
                                    className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all group flex flex-col relative overflow-hidden cursor-pointer"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <img src={note.avatar} alt={note.author} className="w-8 h-8 rounded-full bg-gray-100" />
                                            <div>
                                                <p className="text-xs font-bold text-slate-700">{note.author}</p>
                                                <p className="text-[10px] text-slate-400">{note.uploadDate}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {note.id.startsWith('user-') && <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-bold border border-emerald-100">我的上传</span>}
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                                                note.category === '行测' ? 'bg-blue-50 text-blue-600' : 
                                                note.category === '申论' ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-600'
                                            }`}>
                                                {note.category}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 mb-4 flex-1">
                                        <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-center w-16 h-16 shrink-0 group-hover:bg-white transition-colors border border-gray-100">
                                            {getFileIcon(note.fileType)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-sm mb-1 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                                {note.title}
                                            </h3>
                                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed italic">
                                                {note.summary || "暂无简介"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-auto">
                                        <div className="flex items-center gap-4">
                                            <button 
                                                onClick={(e) => toggleLike(note.id, e)} 
                                                className={`flex items-center gap-1 text-xs transition-colors ${favorites.includes(note.id) ? 'text-red-500 font-bold' : 'text-slate-400 hover:text-red-500'}`}
                                            >
                                                <Heart className={`w-3.5 h-3.5 ${favorites.includes(note.id) ? 'fill-red-500 text-red-500' : ''}`} />
                                                {note.likes}
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-primary font-bold">
                                            点击预览 <ArrowRight className="w-3 h-3" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <div className="py-20 flex flex-col items-center justify-center text-slate-400 bg-white rounded-3xl border border-dashed border-gray-200 shadow-inner">
                            <FolderOpen className="w-12 h-12 mb-3 opacity-20" />
                            <p className="text-lg font-medium">{viewMode === 'favorites' ? '您的收藏夹空空如也' : '未找到相关资料'}</p>
                            <p className="text-sm">去“全员共享中心”看看吧？</p>
                            {viewMode === 'favorites' && <button onClick={() => setViewMode('all')} className="mt-4 text-primary font-bold hover:underline">返回共享中心</button>}
                         </div>
                    )}
                </div>
            </div>

            {/* Upload Modal */}
            {uploadModalOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Upload className="w-5 h-5 text-indigo-600" />
                                分享我的上岸资料 (实时入库)
                            </h3>
                            <button onClick={() => setUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6">
                            {!isUploading && !uploadSuccess ? (
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">资料标题</label>
                                        <input 
                                            type="text" 
                                            className="w-full p-3 bg-slate-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                                            placeholder="例如：2025国考申论考前金句汇总"
                                            value={newNote.title}
                                            onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">分类</label>
                                            <select 
                                                className="w-full p-3 bg-slate-50 border border-gray-100 rounded-2xl text-sm outline-none"
                                                value={newNote.category}
                                                onChange={(e) => setNewNote({...newNote, category: e.target.value})}
                                            >
                                                <option>行测</option>
                                                <option>申论</option>
                                                <option>面试</option>
                                                <option>综合</option>
                                            </select>
                                        </div>
                                        <div className="flex flex-col">
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">文件</label>
                                            <button 
                                                onClick={() => fileInputRef.current?.click()}
                                                className="w-full h-[46px] bg-white border-2 border-dashed border-gray-200 rounded-2xl text-xs text-slate-500 flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                                {selectedFile ? '已选择' : '上传 PDF/DOC'}
                                            </button>
                                            <input 
                                                type="file" 
                                                ref={fileInputRef} 
                                                className="hidden" 
                                                onChange={handleFileSelect}
                                                accept=".pdf,.doc,.docx,.xmind"
                                            />
                                        </div>
                                    </div>

                                    {selectedFile && (
                                        <div className="w-full p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <FileCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                                                <span className="text-[10px] font-bold text-slate-700 truncate">{selectedFile.name}</span>
                                            </div>
                                            <button onClick={() => setSelectedFile(null)}><Trash2 className="w-3.5 h-3.5 text-slate-400" /></button>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">资料简介</label>
                                        <textarea 
                                            className="w-full p-3 bg-slate-50 border border-gray-100 rounded-2xl text-sm h-20 resize-none outline-none"
                                            placeholder="简单描述一下内容，方便他人检索..."
                                            value={newNote.desc}
                                            onChange={(e) => setNewNote({...newNote, desc: e.target.value})}
                                        />
                                    </div>

                                    <button 
                                        onClick={handleUpload}
                                        className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
                                        disabled={!selectedFile || !newNote.title}
                                    >
                                        上传并发布到共享社区
                                    </button>
                                </div>
                            ) : (
                                <div className="py-10 text-center">
                                    {uploadSuccess ? (
                                        <div className="flex flex-col items-center animate-in zoom-in duration-500">
                                            <CheckCircle2 className="w-16 h-16 text-green-600 mb-4" />
                                            <h4 className="text-xl font-bold text-slate-800">资料已同步云端！</h4>
                                            <p className="text-sm text-slate-500 mt-2">感谢您的分享，全员用户现在都可查阅了</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                                            <p className="text-sm text-slate-600 font-bold">正在上传文件并更新数据库...</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {renderPreviewModal()}
        </div>
    );
};

export default Community;
