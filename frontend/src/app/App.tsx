import { useState } from 'react';
import { NewLanding } from './pages/NewLanding';
import { NewAuth } from './pages/NewAuth';
import { LanguageSelector } from './pages/LanguageSelector';
import { AdaptiveAssessment } from './pages/AdaptiveAssessment';
import { AIAnalysis } from './pages/AIAnalysis';
import { Dashboard } from './pages/Dashboard';
import { CareerMatches } from './pages/CareerMatches';
import { CareerDashboard } from './pages/CareerDashboard';
import { SmartProfile } from './pages/SmartProfile';

type Page = 'landing' | 'login' | 'register' | 'language' | 'assessment' | 'analysis' | 'dashboard' | 'matches' | 'career-detail' | 'profile';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [userName, setUserName] = useState('');
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, any>>({});
  const [selectedCareerId, setSelectedCareerId] = useState('');

  const handleLogin = (email: string) => {
    setUserName(email.split('@')[0]);
    setCurrentPage('dashboard');
  };

  const handleRegister = (name: string, email: string) => {
    setUserName(name);
    setCurrentPage('language');
  };

  const handleAssessmentComplete = (answers: Record<string, any>) => {
    setAssessmentAnswers(answers);
    setCurrentPage('analysis');
  };

  const handleAnalysisComplete = () => {
    setCurrentPage('dashboard');
  };

  const handleSelectCareer = (careerId: string) => {
    setSelectedCareerId(careerId);
    setCurrentPage('career-detail');
  };

  return (
    <div className="size-full">
      {currentPage === 'landing' && (
        <NewLanding
          onGetStarted={() => setCurrentPage('register')}
          onLogin={() => setCurrentPage('login')}
        />
      )}

      {currentPage === 'login' && (
        <NewAuth
          mode="login"
          onLogin={handleLogin}
          onRegister={handleRegister}
          onToggleMode={() => setCurrentPage('register')}
          onBack={() => setCurrentPage('landing')}
        />
      )}

      {currentPage === 'register' && (
        <NewAuth
          mode="register"
          onLogin={handleLogin}
          onRegister={handleRegister}
          onToggleMode={() => setCurrentPage('login')}
          onBack={() => setCurrentPage('landing')}
        />
      )}

      {currentPage === 'language' && (
        <LanguageSelector onContinue={() => setCurrentPage('assessment')} />
      )}

      {currentPage === 'assessment' && (
        <AdaptiveAssessment
          onComplete={handleAssessmentComplete}
          onBack={() => setCurrentPage('language')}
        />
      )}

      {currentPage === 'analysis' && (
        <AIAnalysis onComplete={handleAnalysisComplete} />
      )}

      {currentPage === 'dashboard' && (
        <Dashboard
          userName={userName || 'User'}
          assessmentAnswers={assessmentAnswers}
          onViewMatches={() => setCurrentPage('matches')}
          onViewProfile={() => setCurrentPage('profile')}
          onRetakeAssessment={() => setCurrentPage('language')}
        />
      )}

      {currentPage === 'matches' && (
        <CareerMatches
          onSelectCareer={handleSelectCareer}
          onBack={() => setCurrentPage('dashboard')}
          onProfile={() => setCurrentPage('profile')}
        />
      )}

      {currentPage === 'career-detail' && (
        <CareerDashboard
          careerId={selectedCareerId}
          onBack={() => setCurrentPage('matches')}
        />
      )}

      {currentPage === 'profile' && (
        <SmartProfile
          userName={userName || 'User'}
          onBack={() => setCurrentPage('dashboard')}
        />
      )}
    </div>
  );
}