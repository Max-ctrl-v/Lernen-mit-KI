import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';
import { QuizProvider } from './context/QuizContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';

// Lazy load all pages — only downloaded when navigated to
const StartPage = lazy(() => import('./pages/StartPage'));
const MemorizePage = lazy(() => import('./pages/MemorizePage'));
const DistractionPage = lazy(() => import('./pages/DistractionPage'));
const RecallPage = lazy(() => import('./pages/RecallPage'));
const ResultsPage = lazy(() => import('./pages/ResultsPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const QuizUploadPage = lazy(() => import('./pages/QuizUploadPage'));
const QuizPlayPage = lazy(() => import('./pages/QuizPlayPage'));
const QuizResultsPage = lazy(() => import('./pages/QuizResultsPage'));
const QuizHistoryPage = lazy(() => import('./pages/QuizHistoryPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 rounded-full border-[3px] border-brand-200 border-t-brand-600 animate-spin" />
    </div>
  );
}

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
          <Suspense fallback={<PageLoader />}>
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
          </Suspense>
        </Layout>
      </QuizProvider>
    </SessionProvider>
  );
}
