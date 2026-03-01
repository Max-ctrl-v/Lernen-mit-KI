import { Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';
import { QuizProvider } from './context/QuizContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import StartPage from './pages/StartPage';
import MemorizePage from './pages/MemorizePage';
import DistractionPage from './pages/DistractionPage';
import RecallPage from './pages/RecallPage';
import ResultsPage from './pages/ResultsPage';
import HistoryPage from './pages/HistoryPage';
import QuizUploadPage from './pages/QuizUploadPage';
import QuizPlayPage from './pages/QuizPlayPage';
import QuizResultsPage from './pages/QuizResultsPage';
import QuizHistoryPage from './pages/QuizHistoryPage';

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

function AuthGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-base">
        <div className="w-8 h-8 rounded-full border-[3px] border-brand-200 border-t-brand-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <SessionProvider>
      <QuizProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<StartPage />} />
            <Route path="/session/:id/memorize" element={<MemorizePage />} />
            <Route path="/session/:id/pause" element={<DistractionPage />} />
            <Route path="/session/:id/recall" element={<RecallPage />} />
            <Route path="/session/:id/results" element={<ResultsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/quiz" element={<QuizUploadPage />} />
            <Route path="/quiz/:id/play" element={<QuizPlayPage />} />
            <Route path="/quiz/:id/results" element={<QuizResultsPage />} />
            <Route path="/quiz/history" element={<QuizHistoryPage />} />
            <Route path="*" element={<StartPage />} />
          </Routes>
        </Layout>
      </QuizProvider>
    </SessionProvider>
  );
}
