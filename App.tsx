
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import JobMatching from './pages/JobMatching';
import PolicyChat from './pages/PolicyChat';
import MajorAnalysis from './pages/MajorAnalysis';
import ExamCalendar from './pages/ExamCalendar';
import ResourceCenter from './pages/ResourceCenter';
import Community from './pages/Community';
import Login from './components/Login';
import SettingsModal from './components/SettingsModal';
import { Page, UserProfile, User } from './types';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.DASHBOARD);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('app_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('app_user_profile');
    const defaultProfile: UserProfile = {
        gender: '男',
        degree: '本科',
        major: '',
        politicalStatus: '群众',
        isFreshGrad: true,
        experienceYears: 0,
        hasGrassrootsExperience: false,
        certificates: []
    };
    
    if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with default to handle legacy data without new fields
        return { ...defaultProfile, ...parsed };
    }
    return defaultProfile;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('app_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('app_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('app_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentPage(Page.DASHBOARD);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsSettingsOpen(false);
    setCurrentPage(Page.DASHBOARD);
  };

  const renderPage = () => {
    switch (currentPage) {
      case Page.DASHBOARD:
        return <Dashboard onNavigate={setCurrentPage} userProfile={userProfile} />;
      case Page.MATCHING:
        return <JobMatching userProfile={userProfile} onProfileChange={setUserProfile} />;
      case Page.POLICY_CHAT:
        return <PolicyChat />;
      case Page.MAJOR_ANALYSIS:
        return <MajorAnalysis />;
      case Page.EXAM_CALENDAR:
        return <ExamCalendar />;
      case Page.RESOURCE_CENTER:
        return <ResourceCenter />;
      case Page.COMMUNITY:
        return <Community />;
      default:
        return <Dashboard onNavigate={setCurrentPage} userProfile={userProfile} />;
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="relative">
        <Layout 
            currentPage={currentPage} 
            onNavigate={setCurrentPage} 
            user={currentUser}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onLogout={handleLogout}
        >
          {renderPage()}
        </Layout>
        
        {isSettingsOpen && (
            <SettingsModal 
                user={currentUser} 
                onClose={() => setIsSettingsOpen(false)} 
                onLogout={handleLogout}
            />
        )}
    </div>
  );
};

export default App;
