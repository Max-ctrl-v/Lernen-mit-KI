import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { useTimer } from '../hooks/useTimer';
import CardCarousel from '../components/CardCarousel';
import Timer from '../components/Timer';
import { UI } from '../utils/strings';

export default function MemorizePage() {
  const { session, cards, advancePhase } = useSession();
  const navigate = useNavigate();
  const isExam = session?.mode === 'EXAM';
  const duration = session?.memorizeDuration || 480;
  const handleNextRef = useRef(null);

  const { remaining, elapsed } = useTimer(
    duration,
    useCallback(() => { handleNextRef.current?.(); }, []),
    isExam
  );

  const handleNext = async () => {
    try {
      await advancePhase('DISTRACTION', elapsed);
      navigate(`/session/${session.id}/pause`);
    } catch (err) {
      console.error(err);
    }
  };
  handleNextRef.current = handleNext;

  if (!session || cards.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-[3px] border-brand-200 border-t-brand-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-gray-900 tracking-heading">{UI.memorizePhase}</h2>
        {isExam && <Timer remaining={remaining} total={duration} />}
      </div>

      {/* Cards */}
      <CardCarousel cards={cards} />

      {/* Next button */}
      <div className="text-center">
        <button onClick={handleNext} className="btn-brand text-lg px-8 py-3.5">
          {UI.next} &rarr; {UI.distractionPhase}
        </button>
      </div>
    </div>
  );
}
