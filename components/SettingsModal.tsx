
import React, { useState } from 'react';
import { X, User, Bell, Shield, Trash2, Smartphone, LogOut, CheckCircle2, ChevronRight, Moon, Globe, Loader2, ShieldCheck } from 'lucide-react';
import { User as UserType } from '../types';

interface SettingsModalProps {
  user: UserType | null;
  onClose: () => void;
  onLogout: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ user, onClose, onLogout }) => {
  const [activeSection, setActiveSection] = useState<'account' | 'prefs' | 'security'>('account');
  const [pushEnabled, setPushEnabled] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
        onLogout();
    }, 800);
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex h-[600px] overflow-hidden relative">
        {isLoggingOut && (
            <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="font-bold text-slate-800">正在安全注销...</p>
            </div>
        )}

        {/* Sidebar */}
        <div className="w-64 bg-slate-50 border-r border-gray-100 flex flex-col p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-8 px-2">设置中心</h2>
          <nav className="flex-1 space-y-2">
            {[
              { id: 'account', label: '账户信息', icon: User },
              { id: 'prefs', label: '系统偏好', icon: Bell },
              { id: 'security', label: '安全隐私', icon: Shield },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  activeSection === item.id ? 'bg-white text-primary shadow-sm border border-gray-100' : 'text-slate-500 hover:bg-white/50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-red-500 font-medium hover:bg-red-50 rounded-xl transition-colors mt-auto"
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center">
             <span className="font-bold text-slate-700">
                {activeSection === 'account' ? '个人资料管理' : activeSection === 'prefs' ? '偏好设置' : '安全选项'}
             </span>
             <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                <X className="w-5 h-5" />
             </button>
          </div>

          <div className="flex-1 p-8 overflow-y-auto">
             {activeSection === 'account' && (
               <div className="space-y-8 animate-fade-in">
                  <div className="flex items-center gap-6">
                    <img src={user.avatar} className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-white shadow-md" alt="Avatar" />
                    <div>
                      <h4 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        {user.nickname}
                        {user.isVip && <span className="bg-amber-100 text-amber-600 text-[10px] px-2 py-0.5 rounded-full font-bold">上岸尊享</span>}
                      </h4>
                      <p className="text-sm text-slate-400 mt-1">账户 ID: {user.id.substring(0, 8)}</p>
                      <p className="text-xs text-slate-400">上次活动: {user.loginTime}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-gray-50 flex justify-between items-center">
                        <div>
                            <p className="text-sm font-bold text-slate-700">账户状态</p>
                            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-emerald-500" /> 
                                标准账户 · 已实名
                            </p>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-gray-100 flex justify-between items-center">
                        <div>
                            <p className="text-sm font-bold text-slate-700">密码管理</p>
                            <p className="text-xs text-slate-400 mt-0.5">上次修改于 30 天前</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                  </div>
               </div>
             )}

             {activeSection === 'prefs' && (
               <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm"><Bell className="w-4 h-4 text-primary" /></div>
                        <div>
                            <p className="text-sm font-bold text-slate-700">报考公告推送</p>
                            <p className="text-xs text-slate-400">实时推送您所在省份的招考简章</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setPushEnabled(!pushEnabled)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${pushEnabled ? 'bg-primary' : 'bg-slate-200'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${pushEnabled ? 'left-7' : 'left-1'}`}></div>
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm"><Globe className="w-4 h-4 text-emerald-500" /></div>
                        <p className="text-sm font-bold text-slate-700">系统语言</p>
                    </div>
                    <span className="text-sm text-slate-500">简体中文</span>
                  </div>
               </div>
             )}

             {activeSection === 'security' && (
               <div className="space-y-6 animate-fade-in">
                  <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
                    <h5 className="text-red-600 font-bold mb-2 flex items-center gap-2">
                        <Trash2 className="w-4 h-4" /> 危险区域
                    </h5>
                    <p className="text-xs text-red-500 leading-relaxed mb-4">
                        一旦注销账户，您的所有备考资料、模拟考成绩及个性化画像将被永久删除且无法找回。
                    </p>
                    <button className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-colors">
                        注销我的账户
                    </button>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-3xl border border-gray-100 flex justify-between items-center">
                    <div>
                        <p className="text-sm font-bold text-slate-700">登录设备管理</p>
                        <p className="text-xs text-slate-400 mt-0.5">当前仅有此浏览器在线</p>
                    </div>
                    <Smartphone className="w-5 h-5 text-slate-300" />
                  </div>
               </div>
             )}
          </div>

          <div className="p-6 bg-slate-50 border-t border-gray-100 text-center">
             <p className="text-[10px] text-slate-400 font-medium">公考智辅 v2.2.0 · 专业助您一臂之力</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
