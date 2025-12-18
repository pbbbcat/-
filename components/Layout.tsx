
import React from 'react';
import Sidebar from './Sidebar';
import { Page, User } from '../types';

interface LayoutProps {
  currentPage: Page;
  user: User | null;
  onNavigate: (page: Page) => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentPage, user, onNavigate, onOpenSettings, onLogout, children }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar 
        currentPage={currentPage} 
        user={user}
        onNavigate={onNavigate} 
        onOpenSettings={onOpenSettings}
        onLogout={onLogout}
      />
      <main className="flex-1 ml-64 transition-all duration-300">
        {children}
      </main>
    </div>
  );
};

export default Layout;
