
import React from 'react';
import { LayoutDashboard, FileText, MessageSquareText, BookOpen, Settings, LogOut, CalendarDays, Library, Users, ShieldCheck, ChevronRight } from 'lucide-react';
import { Page, User } from '../types';

interface SidebarProps {
  currentPage: Page;
  user: User | null;
  onNavigate: (page: Page) => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, user, onNavigate, onOpenSettings, onLogout }) => {
  const menuGroups = [
    {
      title: '核心动力',
      items: [
        { id: Page.DASHBOARD, label: '概览工作台', icon: LayoutDashboard },
        { id: Page.MATCHING, label: '智能岗匹', icon: FileText },
        { id: Page.POLICY_CHAT, label: 'AI 政策专家', icon: MessageSquareText },
      ]
    },
    {
      title: '备考辅助',
      items: [
        { id: Page.MAJOR_ANALYSIS, label: '专业透视', icon: BookOpen },
        { id: Page.EXAM_CALENDAR, label: '招考日程', icon: CalendarDays },
        { id: Page.RESOURCE_CENTER, label: '资料中心', icon: Library },
        { id: Page.COMMUNITY, label: '高分社区', icon: Users },
      ]
    }
  ];

  return (
    <div className="w-64 h-screen flex flex-col fixed left-0 top-0 z-40 px-4 py-6">
      <div className="bg-white/80 backdrop-blur-xl h-full rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
        {/* Logo */}
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-primary to-indigo-400 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-800 tracking-tight">公考智辅</span>
        </div>

        {/* User Quick View */}
        {user && (
          <div className="mx-4 mb-6 p-4 rounded-3xl bg-slate-50/50 border border-slate-100 flex items-center gap-3">
            <img src={user.avatar} className="w-10 h-10 rounded-xl shadow-sm border border-white" alt="Avatar" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{user.nickname}</p>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div>
                <span className="text-[10px] font-medium text-slate-400">研习中...</span>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar">
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx}>
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-4 ml-4">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group ${
                      currentPage === item.id
                        ? 'bg-primary text-white shadow-lg shadow-indigo-100 translate-x-1'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-primary'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${currentPage === item.id ? 'text-white' : 'text-slate-400 group-hover:text-primary'}`} />
                      <span className="text-sm font-bold">{item.label}</span>
                    </div>
                    {currentPage === item.id && <ChevronRight className="w-4 h-4 opacity-50" />}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-50 space-y-2">
          <button 
            onClick={onOpenSettings}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-2xl transition-colors text-sm font-medium"
          >
            <Settings className="w-4 h-4" />
            偏好设置
          </button>
          <button 
            onClick={() => window.confirm("确定要退出当前账号吗？") && onLogout()}
            className="w-full flex items-center gap-3 px-4 py-3 text-danger/70 hover:bg-red-50 hover:text-danger rounded-2xl transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            安全退出
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
