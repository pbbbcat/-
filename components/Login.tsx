
import React, { useState } from 'react';
import { ShieldCheck, Sparkles, Loader2, User, Lock, Mail, ArrowRight, UserPlus, LogIn } from 'lucide-react';
import { User as UserType } from '../types';

interface LoginProps {
  onLogin: (user: UserType) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: ''
  });
  const [error, setError] = useState('');

  const handleAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      setError('请填写完整信息');
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    // Simulate Network Request
    setTimeout(() => {
      const mockUser: UserType = {
        id: 'user_' + Math.random().toString(36).substring(7),
        nickname: formData.username,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.username}`,
        isVip: mode === 'register', // New registered users get a trial VIP
        loginTime: new Date().toLocaleString('zh-CN')
      };
      setIsSubmitting(false);
      onLogin(mockUser);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary opacity-20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-indigo-600 opacity-20 blur-[100px] rounded-full"></div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-white/5 backdrop-blur-xl rounded-[40px] border border-white/10 shadow-2xl overflow-hidden relative z-10">
        
        {/* Left: Branding */}
        <div className="p-12 lg:p-16 flex flex-col justify-between bg-gradient-to-br from-primary/10 to-transparent">
          <div>
            <div className="flex items-center gap-3 mb-10">
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Sparkles className="w-7 h-7 text-white" />
                </div>
                <span className="text-2xl font-black text-white tracking-tight">公考智辅</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
                开启您的<br/><span className="text-primary">智慧公考</span>之旅
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-md">
                集成 RAG 政策引擎与真实岗位库，让备考回归专业与高效。
            </p>
          </div>

          <div className="mt-12 space-y-4">
             {[
                '实时比对 10,000+ 招考岗位',
                '深度解读最新公考政策',
                '高分上岸笔记社区共享'
             ].map((text, i) => (
               <div key={i} className="flex items-center gap-3 text-slate-300">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">{text}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Right: Auth Form */}
        <div className="p-12 lg:p-16 bg-white flex flex-col justify-center">
            <div className="w-full max-w-sm mx-auto animate-fade-in">
                <div className="mb-10 text-center lg:text-left">
                    <h2 className="text-3xl font-bold text-slate-800 mb-2">
                        {mode === 'login' ? '欢迎回来' : '创建新账户'}
                    </h2>
                    <p className="text-slate-500">
                        {mode === 'login' ? '输入您的凭据以访问系统' : '加入我们，开启智能上岸之路'}
                    </p>
                </div>
                
                <form onSubmit={handleAction} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">用户名</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                required
                                value={formData.username}
                                onChange={e => setFormData({...formData, username: e.target.value})}
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                                placeholder="请输入账号"
                            />
                        </div>
                    </div>

                    {mode === 'register' && (
                        <div className="space-y-1 animate-slide-up">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">电子邮箱</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="email" 
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                                    placeholder="name@example.com"
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">密码</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="password" 
                                required
                                value={formData.password}
                                onChange={e => setFormData({...formData, password: e.target.value})}
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-xs font-bold text-red-500 ml-1 animate-pulse">{error}</p>
                    )}

                    <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-600 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70 mt-4"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                {mode === 'login' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                                {mode === 'login' ? '立即登录' : '注册并开始'}
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <button 
                        onClick={() => {
                            setMode(mode === 'login' ? 'register' : 'login');
                            setError('');
                        }}
                        className="text-sm font-medium text-slate-500 hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto"
                    >
                        {mode === 'login' ? '没有账号? 立即注册' : '已有账号? 返回登录'}
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <p className="mt-12 text-[10px] text-slate-400 leading-relaxed text-center">
                继续操作即代表您已同意<br/>
                <span className="underline cursor-pointer">《用户协议》</span>、<span className="underline cursor-pointer">《隐私政策》</span>
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
