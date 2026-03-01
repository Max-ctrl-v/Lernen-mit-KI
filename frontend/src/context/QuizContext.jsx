import { createContext, useContext, useState, useCallback, useRef } from 'react';
import api from '../services/api';

const QuizContext = createContext();

export function QuizProvider({ children }) {
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progressStep, setProgressStep] = useState(0);
  const [rateLimited, setRateLimited] = useState(false);
  const [rateLimitMsg, setRateLimitMsg] = useState('');
  const progressTimer = useRef(null);

  const startProgress = useCallback((skipImages) => {
    setProgressStep(0);
    // Delays between each step transition (in ms)
    const delays = skipImages
      ? [3000, 6000, 20000]       // analyzing -> extracting -> generating -> finalizing
      : [3000, 6000, 20000, 30000]; // + images step
    let step = 0;

    const scheduleNext = () => {
      if (step >= delays.length) return;
      progressTimer.current = setTimeout(() => {
        step++;
        setProgressStep(step);
        scheduleNext();
      }, delays[step]);
    };
    scheduleNext();
  }, []);

  const stopProgress = useCallback(() => {
    if (progressTimer.current) {
      clearTimeout(progressTimer.current);
      progressTimer.current = null;
    }
    setProgressStep(0);
  }, []);

  const createQuiz = useCallback(async (file, questionCount, skipImages = false, bypassCode = null) => {
    setLoading(true);
    setError(null);
    setRateLimited(false);
    startProgress(skipImages);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('questionCount', String(questionCount));
      formData.append('skipImages', String(skipImages));
      if (bypassCode) formData.append('bypassCode', bypassCode);

      const res = await api.post('/quiz', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 180000,
      });
      stopProgress();
      setQuiz(res.data);
      setQuestions(res.data.questions || []);
      setAnswers({});
      setLoading(false);
      return res.data;
    } catch (err) {
      stopProgress();
      if (err.response?.status === 429 && err.response?.data?.rateLimited) {
        setRateLimited(true);
        setRateLimitMsg(err.response.data.error);
        setLoading(false);
        throw err;
      }
      setError(err.response?.data?.error || 'Fehler beim Erstellen des Quiz.');
      setLoading(false);
      throw err;
    }
  }, [startProgress, stopProgress]);

  const loadQuiz = useCallback(async (id) => {
    const res = await api.get(`/quiz/${id}`);
    setQuiz(res.data);
    setQuestions(res.data.questions || []);
    const existing = {};
    for (const q of res.data.questions || []) {
      if (q.selectedIndex != null) existing[q.id] = q.selectedIndex;
    }
    setAnswers(existing);
    return res.data;
  }, []);

  const retakeQuiz = useCallback(async (id) => {
    const res = await api.post(`/quiz/${id}/retake`);
    setQuiz(res.data);
    setQuestions(res.data.questions || []);
    setAnswers({});
    return res.data;
  }, []);

  const answerQuestion = useCallback((questionId, selectedIndex) => {
    setAnswers((prev) => ({ ...prev, [questionId]: selectedIndex }));
  }, []);

  const submitQuiz = useCallback(async () => {
    if (!quiz) return;
    const answerList = Object.entries(answers).map(([questionId, selectedIndex]) => ({
      questionId,
      selectedIndex,
    }));
    const res = await api.post(`/quiz/${quiz.id}/submit`, { answers: answerList });
    setQuiz(res.data);
    setQuestions(res.data.questions || []);
    return res.data;
  }, [quiz, answers]);

  const clearQuiz = useCallback(() => {
    setQuiz(null);
    setQuestions([]);
    setAnswers({});
    setError(null);
    setRateLimited(false);
    setRateLimitMsg('');
  }, []);

  const clearRateLimit = useCallback(() => {
    setRateLimited(false);
    setRateLimitMsg('');
  }, []);

  return (
    <QuizContext.Provider
      value={{
        quiz, questions, answers, loading, error, progressStep,
        rateLimited, rateLimitMsg,
        createQuiz, loadQuiz, retakeQuiz, answerQuestion, submitQuiz,
        clearQuiz, clearRateLimit,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error('useQuiz must be inside QuizProvider');
  return ctx;
}
