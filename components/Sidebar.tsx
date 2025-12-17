
import React from 'react';
import { LayoutDashboard, FileText, MessageSquareText, BookOpen, Settings, LogOut, CalendarDays, Library, Users } from 'lucide-react';
import { Page } from '../types';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const menuItems = [
    { id: Page.DASHBOARD, label: '工作台', icon: LayoutDashboard },
    { id: Page.MATCHING, label: '智能岗匹', icon: FileText },
    { id: Page.POLICY_CHAT, label: '政策解读', icon: MessageSquareText },
    { id: Page.MAJOR_ANALYSIS, label: '专业图谱', icon: BookOpen },
  ];

  const extItems = [
    { id: Page.EXAM_CALENDAR, label: '考试日历', icon: CalendarDays },
    { id: Page.RESOURCE_CENTER, label: '备考资源', icon: Library },
    { id: Page.COMMUNITY, label: '高分社区', icon: Users },
  ];

  const handleSettings = () => {
    alert("设置功能正在开发中...");
  };

  const handleLogout = () => {
    const confirm = window.confirm("确定要退出登录吗？");
    if(confirm) {
        window.location.reload();
    }
  };

  return (
    <div className="w-64 bg-white h-screen border-r border-gray-100 flex flex-col fixed left-0 top-0 z-10 shadow-sm">
      <div className="p-6 flex items-center space-x-3 border-b border-gray-50">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <span className="text-xl font-bold text-slate-800 tracking-tight">公考智囊</span>
      </div>

      <nav className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar">
        <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">核心功能</div>
            <div className="space-y-1">
                {menuItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                    currentPage === item.id
                        ? 'bg-primary text-white shadow-md shadow-blue-100'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-primary'
                    }`}
                >
                    <item.icon className={`w-5 h-5 ${currentPage === item.id ? 'text-white' : 'text-slate-400 group-hover:text-primary'}`} />
                    <span className="font-medium">{item.label}</span>
                </button>
                ))}
            </div>
        </div>

        <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">资源与服务</div>
            <div className="space-y-1">
                {extItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                    currentPage === item.id
                        ? 'bg-primary text-white shadow-md shadow-blue-100'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-primary'
                    }`}
                >
                    <item.icon className={`w-5 h-5 ${currentPage === item.id ? 'text-white' : 'text-slate-400 group-hover:text-primary'}`} />
                    <span className="font-medium">{item.label}</span>
                </button>
                ))}
            </div>
        </div>
      </nav>

      <div className="p-4 border-t border-gray-50 bg-gray-50/50">
        <button 
            onClick={handleSettings}
            className="w-full flex items-center space-x-3 px-4 py-2.5 text-slate-500 hover:bg-white rounded-xl transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span className="font-medium text-sm">设置</span>
        </button>
        <button 
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors mt-1"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-medium text-sm">退出登录</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
