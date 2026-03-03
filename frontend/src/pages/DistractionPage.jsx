import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { useTimer } from '../hooks/useTimer';
import Timer from '../components/Timer';
import NumberSequenceGame from '../components/NumberSequenceGame';
import WordFluencyGame from '../components/WordFluencyGame';
import { UI } from '../utils/strings';

export default function DistractionPage() {
  const { session, advancePhase } = useSession();
  const navigate = useNavigate();
  const duration = session?.distractionDuration || 2400;
  const [activeGame, setActiveGame] = useState(null);
  const handleSkipRef = useRef(null);

  const { remaining } = useTimer(
    duration,
    useCallback(() => { handleSkipRef.current?.(); }, []),
    true
  );

  const handleSkip = async () => {
    try {
      await advancePhase('RECALL');
      navigate(`/session/${session.id}/recall`);
    } catch (err) {
      console.error(err);
    }
  };
  handleSkipRef.current = handleSkip;

  if (!session) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-[3px] border-brand-200 border-t-brand-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-gray-900 tracking-heading">{UI.distractionPhase}</h2>
        <Timer remaining={remaining} total={duration} />
      </div>

      <p className="text-gray-500 text-center font-body leading-body">{UI.distractionMsg}</p>

      {/* Mini-game selector */}
      {!activeGame && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <GameCard
            onClick={() => setActiveGame('numbers')}
            title={UI.numberSequences}
            desc="Finde das nächste Glied in der Zahlenfolge."
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5"/></svg>
            }
          />
          <GameCard
            onClick={() => setActiveGame('words')}
            title={UI.wordFluency}
            desc="Nenne so viele Wörter wie möglich in 30 Sekunden."
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"/></svg>
            }
          />
        </div>
      )}

      {/* Active game */}
      {activeGame === 'numbers' && (
        <div>
          <button
            onClick={() => setActiveGame(null)}
            className="text-sm text-brand-600 hover:text-brand-700 font-medium mb-4
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded
              active:scale-95 transition-transform duration-150"
          >
            &larr; Zurück zur Auswahl
          </button>
          <NumberSequenceGame />
        </div>
      )}
      {activeGame === 'words' && (
        <div>
          <button
            onClick={() => setActiveGame(null)}
            className="text-sm text-brand-600 hover:text-brand-700 font-medium mb-4
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded
              active:scale-95 transition-transform duration-150"
          >
            &larr; Zurück zur Auswahl
          </button>
          <WordFluencyGame />
        </div>
      )}

      {/* Skip button */}
      <div className="text-center pt-4">
        <button onClick={handleSkip} className="btn-brand text-lg px-8 py-3.5">
          {UI.skip} &rarr; {UI.recallPhase}
        </button>
      </div>
    </div>
  );
}

function GameCard({ onClick, title, desc, icon }) {
  return (
    <button
      onClick={onClick}
      className="text-left p-6 rounded-2xl border-2 border-border bg-white shadow-raised
        hover:border-brand-300 hover:shadow-elevated
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400
        active:scale-[0.98] transition-transform duration-150 group"
    >
      <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3 group-hover:bg-brand-100 transition-colors">
        {icon}
      </div>
      <h3 className="font-display text-lg text-gray-800 tracking-heading">{title}</h3>
      <p className="text-sm text-gray-500 mt-1 leading-body">{desc}</p>
    </button>
  );
}
