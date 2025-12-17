
import React, { useEffect, useState, useRef } from 'react';
import { Users, Upload, FileText, Download, Heart, MessageSquare, Search, Filter, FolderOpen, CheckCircle2, TrendingUp, User, Tag, Sparkles, X, FileCheck, FileCode, FileImage, Trash2, Plus } from 'lucide-react';
import { CommunityNote } from '../types';
import { fetchCommunityNotes } from '../services/resourceService';

const Community: React.FC = () => {
    const [notes, setNotes] = useState<CommunityNote[]>([]);
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Upload State
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [newNote, setNewNote] = useState({ title: '', category: '行测', desc: '' });
    
    // File Handling
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const load = async () => {
            const data = await fetchCommunityNotes();
            setNotes(data);
        };
        load();
    }, []);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setSelectedFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = () => {
        if(!newNote.title) {
            alert("请输入资料标题");
            return;
        }
        if(!selectedFile) {
            alert("请上传文件");
            return;
        }

        setIsUploading(true);
        // Simulate realistic upload progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 15) + 5;
            if(progress > 100) progress = 100;
            setUploadProgress(progress);
            
            if (progress >= 100) {
                clearInterval(interval);
                setIsUploading(false);
                setUploadSuccess(true);
                
                // Add new mock note locally
                const fileExt = selectedFile.name.split('.').pop()?.toLowerCase() || 'pdf';
                const fileSize = (selectedFile.size / 1024 / 1024).toFixed(1) + 'MB';

                const mockNote: CommunityNote = {
                    id: `new-${Date.now()}`,
                    title: newNote.title,
                    author: '我 (当前用户)',
                    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Me',
                    summary: newNote.desc || '暂无描述',
                    fileType: (['pdf', 'doc', 'docx', 'xmind', 'zip'].includes(fileExt) ? fileExt : 'pdf') as any,
                    size: fileSize,
                    downloads: 0,
                    likes: 0,
                    uploadDate: new Date().toLocaleDateString(),
                    category: newNote.category as any,
                    tags: ['新上传', '原创']
                };
                
                setNotes(prev => [mockNote, ...prev]);

                setTimeout(() => {
                    setUploadModalOpen(false);
                    setUploadSuccess(false);
                    setUploadProgress(0);
                    setSelectedFile(null);
                    setNewNote({ title: '', category: '行测', desc: '' });
                }, 2000);
            }
        }, 300);
    };

    const toggleLike = (id: string) => {
        setNotes(prev => prev.map(note => {
            if (note.id === id) {
                // Toggle logic (mock)
                return { ...note, likes: note.likes + 1 }; 
            }
            return note;
        }));
    };

    const filteredNotes = notes.filter(note => {
        const matchesCat = filterCategory === 'all' || note.category === filterCategory;
        const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              note.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesCat && matchesSearch;
    });

    const getFileIcon = (type: string) => {
        switch(type) {
            case 'pdf': return <FileText className="w-8 h-8 text-red-400" />;
            case 'doc': 
            case 'docx': return <FileText className="w-8 h-8 text-blue-400" />;
            case 'xmind': return <FileCode className="w-8 h-8 text-orange-400" />;
            default: return <FileText className="w-8 h-8 text-gray-400" />;
        }
    };

    const getCategoryColor = (cat: string) => {
        switch(cat) {
            case '行测': return 'bg-blue-100 text-blue-700';
            case '申论': return 'bg-amber-100 text-amber-700';
            case '面试': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in pb-20">
            {/* Hero Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-8 text-white mb-8 shadow-xl shadow-indigo-200 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Sparkles className="w-8 h-8 text-yellow-300" />
                            高分经验社区
                        </h1>
                        <p className="text-indigo-100 mt-2 max-w-xl">
                            已有 <span className="font-bold text-white">12,504</span> 位上岸考生在这里分享了他们的独家笔记。
                            <br/>打破信息差，共享知识库。
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
                {/* Decorative */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500 opacity-20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left: Filters */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Filter className="w-4 h-4 text-slate-400" />
                            分类筛选
                        </h3>
                        <div className="space-y-1">
                            {['all', '行测', '申论', '面试', '综合'].map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setFilterCategory(cat)}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors flex justify-between items-center ${
                                        filterCategory === cat 
                                        ? 'bg-indigo-50 text-indigo-600' 
                                        : 'text-slate-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {cat === 'all' ? '全部资料' : `${cat}专区`}
                                    {filterCategory === cat && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-red-500" />
                            本周下载飙升
                        </h3>
                        <div className="space-y-4">
                            {notes.slice(0, 3).map((note, idx) => (
                                <div key={note.id} className="flex items-start gap-3">
                                    <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0 ${
                                        idx === 0 ? 'bg-red-100 text-red-600' : 
                                        idx === 1 ? 'bg-orange-100 text-orange-600' : 
                                        'bg-gray-100 text-gray-500'
                                    }`}>
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-700 line-clamp-1 hover:text-indigo-600 cursor-pointer">{note.title}</h4>
                                        <p className="text-[10px] text-slate-400 mt-0.5">{note.downloads} 次下载</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Main Content */}
                <div className="lg:col-span-3">
                    {/* Search Bar */}
                    <div className="mb-6 relative">
                        <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="搜索笔记、真题、思维导图..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Note Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {filteredNotes.length > 0 ? filteredNotes.map(note => (
                            <div key={note.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-lg transition-all group flex flex-col relative overflow-hidden">
                                {/* Top: User & Date */}
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <img src={note.avatar} alt={note.author} className="w-8 h-8 rounded-full bg-gray-100" />
                                        <div>
                                            <p className="text-xs font-bold text-slate-700">{note.author}</p>
                                            <p className="text-[10px] text-slate-400">{note.uploadDate} 发布</p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded ${getCategoryColor(note.category)}`}>
                                        {note.category}
                                    </span>
                                </div>

                                {/* Middle: Content */}
                                <div className="flex gap-4 mb-4 flex-1">
                                    <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-center w-16 h-16 shrink-0">
                                        {getFileIcon(note.fileType)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-sm mb-1 line-clamp-2 group-hover:text-indigo-600 transition-colors cursor-pointer">
                                            {note.title}
                                        </h3>
                                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                            {note.summary}
                                        </p>
                                    </div>
                                </div>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {note.tags.map((tag, i) => (
                                        <span key={i} className="text-[10px] text-slate-500 bg-slate-50 px-2 py-1 rounded flex items-center gap-1">
                                            <Tag className="w-2.5 h-2.5" /> {tag}
                                        </span>
                                    ))}
                                </div>

                                {/* Bottom: Stats & Action */}
                                <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-auto">
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => toggleLike(note.id)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors">
                                            <Heart className={`w-3.5 h-3.5 ${note.likes > 0 ? 'fill-red-50 text-red-500' : ''}`} />
                                            {note.likes}
                                        </button>
                                        <div className="flex items-center gap-1 text-xs text-slate-400">
                                            <Download className="w-3.5 h-3.5" />
                                            {note.downloads}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 bg-gray-50 px-2 py-1 rounded uppercase font-bold">
                                        {note.fileType} · {note.size}
                                    </div>
                                </div>
                            </div>
                        )) : (
                             <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-gray-100 rounded-2xl">
                                <Search className="w-10 h-10 mb-2 opacity-20" />
                                <p>没有找到相关笔记，试着换个关键词？</p>
                             </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Upload Modal */}
            {uploadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Upload className="w-5 h-5 text-indigo-600" />
                                上传我的资料
                            </h3>
                            <button onClick={() => setUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            {!isUploading && !uploadSuccess ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">资料标题 <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text" 
                                            className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
                                            placeholder="例如：2025省考言语理解易错题集"
                                            value={newNote.title}
                                            onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 mb-1.5">分类</label>
                                            <select 
                                                className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none"
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
                                            <label className="block text-xs font-bold text-slate-600 mb-1.5">文件 <span className="text-red-500">*</span></label>
                                            <button 
                                                onClick={() => fileInputRef.current?.click()}
                                                className="flex-1 w-full bg-white border border-gray-200 border-dashed rounded-xl text-xs text-slate-500 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                                            >
                                                <Plus className="w-3 h-3" />
                                                选择文件
                                            </button>
                                            <input 
                                                type="file" 
                                                ref={fileInputRef} 
                                                className="hidden" 
                                                onChange={handleFileSelect}
                                            />
                                        </div>
                                    </div>

                                    {/* Drag & Drop Area / File Preview */}
                                    {!selectedFile ? (
                                        <div 
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            className={`w-full p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all ${
                                                isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-gray-50'
                                            }`}
                                        >
                                            <div className="bg-white p-2 rounded-full shadow-sm mb-2">
                                                <Upload className={`w-5 h-5 ${isDragging ? 'text-indigo-600' : 'text-slate-400'}`} />
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium">点击上方选择，或将文件拖拽至此</p>
                                            <p className="text-[10px] text-slate-400 mt-1">支持 PDF, Word, XMind (最大 20MB)</p>
                                        </div>
                                    ) : (
                                        <div className="w-full p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0 text-indigo-600">
                                                    <FileCheck className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-slate-700 truncate">{selectedFile.name}</p>
                                                    <p className="text-[10px] text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => setSelectedFile(null)}
                                                className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">简短描述</label>
                                        <textarea 
                                            className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none h-20 resize-none"
                                            placeholder="介绍一下这份资料的亮点..."
                                            value={newNote.desc}
                                            onChange={(e) => setNewNote({...newNote, desc: e.target.value})}
                                        />
                                    </div>

                                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3 rounded-xl flex items-start gap-2 border border-orange-100">
                                        <Sparkles className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                                        <p className="text-xs text-orange-800">
                                            上传优质原创资料，审核通过后将获得 <span className="font-bold text-orange-600">+20 积分</span> 奖励！
                                        </p>
                                    </div>

                                    <button 
                                        onClick={handleUpload}
                                        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all mt-2 active:scale-95"
                                    >
                                        确认发布
                                    </button>
                                </div>
                            ) : (
                                <div className="py-8 text-center">
                                    {uploadSuccess ? (
                                        <div className="flex flex-col items-center animate-in zoom-in duration-300">
                                            <div className="relative mb-4">
                                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                                                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                                                </div>
                                                <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce shadow-md border-2 border-white">
                                                    +20 积分
                                                </div>
                                            </div>
                                            <h4 className="text-lg font-bold text-slate-800">发布成功！</h4>
                                            <p className="text-sm text-slate-500 mt-2">感谢您为社区做出的贡献</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 px-8">
                                            <div className="flex justify-between text-xs font-bold text-slate-600">
                                                <span>正在上传文件...</span>
                                                <span>{uploadProgress}%</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-indigo-600 transition-all duration-300 ease-out" 
                                                    style={{ width: `${uploadProgress}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
                                                <Sparkles className="w-3 h-3" /> 
                                                正在进行安全扫描与病毒检测
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Community;
