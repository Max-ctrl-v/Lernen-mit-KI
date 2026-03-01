import { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';

const SessionContext = createContext();

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [cards, setCards] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});

  const createSession = useCallback(async (mode, distractionDuration) => {
    const res = await api.post('/sessions', { mode, distractionDuration });
    const data = res.data;
    setSession(data);
    setCards(data.cards || []);
    setQuestions([]);
    setAnswers({});
    return data;
  }, []);

  const advancePhase = useCallback(async (phase, timeSpent) => {
    if (!session) return;
    const res = await api.patch(`/sessions/${session.id}/phase`, { phase, timeSpent });
    setSession((prev) => ({ ...prev, ...res.data }));

    if (phase === 'RECALL') {
      const qRes = await api.get(`/sessions/${session.id}/questions`);
      setQuestions(qRes.data);
    }

    return res.data;
  }, [session]);

  const answerQuestion = useCallback((questionId, selectedIndex) => {
    setAnswers((prev) => ({ ...prev, [questionId]: selectedIndex }));
  }, []);

  const submitAll = useCallback(async (recallTimeSpent) => {
    if (!session) return;
    const answerList = Object.entries(answers).map(([questionId, selectedIndex]) => ({
      questionId,
      selectedIndex,
    }));
    const res = await api.post(`/sessions/${session.id}/submit`, {
      answers: answerList,
      recallTimeSpent,
    });
    setSession(res.data);
    setCards(res.data.cards || []);
    setQuestions(res.data.questions || []);
    return res.data;
  }, [session, answers]);

  const clearSession = useCallback(() => {
    setSession(null);
    setCards([]);
    setQuestions([]);
    setAnswers({});
  }, []);

  return (
    <SessionContext.Provider
      value={{
        session,
        cards,
        questions,
        answers,
        createSession,
        advancePhase,
        answerQuestion,
        submitAll,
        clearSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be inside SessionProvider');
  return ctx;
}
