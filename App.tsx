
import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import JobMatching from './pages/JobMatching';
import PolicyChat from './pages/PolicyChat';
import MajorAnalysis from './pages/MajorAnalysis';
import ExamCalendar from './pages/ExamCalendar';
import ResourceCenter from './pages/ResourceCenter';
import Community from './pages/Community';
import { Page, UserProfile } from './types';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.DASHBOARD);
  
  // Reset User Profile to defaults. No hardcoded persona.
  const [userProfile, setUserProfile] = useState<UserProfile>({
    degree: '本科', // Default common degree
    major: '',      // Empty: User must input
    politicalStatus: '群众',
    experienceYears: 0,
    hasGrassrootsExperience: false,
    certificates: []
  });

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

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
};

export default App;
