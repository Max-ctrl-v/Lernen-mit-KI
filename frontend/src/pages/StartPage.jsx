import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { UI } from '../utils/strings';
import api from '../services/api';

export default function StartPage() {
  const [mode, setMode] = useState('PRACTICE');
  const [distractionMin, setDistractionMin] = useState(40);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const { createSession } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/stats').catch(() => ({ data: null })),
      api.get('/stats/history?limit=5').catch(() => ({ data: { sessions: [] } })),
    ]).then(([statsRes, histRes]) => {
      setStats(statsRes.data);
      setRecentSessions(histRes.data.sessions || []);
    });
  }, []);

  const handleStart = async () => {
    setLoading(true);
    try {
      const session = await createSession(mode, distractionMin * 60);
      navigate(`/session/${session.id}/memorize`);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const improvement = (() => {
    if (recentSessions.length < 2) return null;
    const scores = recentSessions.map((s) => s.score ?? 0);
    return scores[0] - scores[1];
  })();

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      {/* Hero */}
      <div className="text-center animate-fade-up">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center mb-5"
          style={{ boxShadow: '0 4px 20px rgba(20,189,110,0.3), 0 0 0 1px rgba(20,189,110,0.1)' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M9 12h6M12 9v6M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl text-gray-900 tracking-heading mb-3">
          {UI.appTitle}
        </h1>
        <p className="text-gray-500 font-body text-lg max-w-md mx-auto leading-body">
          Trainiere das Einprägen und Abrufen von 8 Allergieausweisen — wie im echten MedAT.
        </p>
      </div>

      {/* Quick access cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        {/* Allergy card training */}
        <div className="surface-elevated p-5 rounded-2xl flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-brand-600">
              <path d="M9 12h6M12 9v6M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div>
            <h3 className="font-display text-lg text-gray-800 tracking-heading">Allergieausweise</h3>
            <p className="text-xs text-gray-500 font-body mt-0.5 leading-body">8 Karten einprägen, 25 Fragen beantworten</p>
          </div>
        </div>

        {/* Quiz from upload */}
        <Link
          to="/quiz"
          className="surface-elevated p-5 rounded-2xl flex items-start gap-4 group
            hover:shadow-elevated hover:border-accent-200 border-2 border-transparent
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400
            active:scale-[0.98] transition-transform duration-200"
        >
          <div className="w-12 h-12 rounded-xl bg-accent-100 flex items-center justify-center flex-shrink-0 group-hover:bg-accent-200 transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-accent-600">
              <path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <div>
            <h3 className="font-display text-lg text-gray-800 tracking-heading group-hover:text-accent-700 transition-colors">
              {UI.quizUpload}
            </h3>
            <p className="text-xs text-gray-500 font-body mt-0.5 leading-body">Lernmaterial hochladen, Quiz erstellen lassen</p>
          </div>
        </Link>
      </div>

      {/* Scoreboard widget */}
      {stats && stats.totalSessions > 0 && (
        <div className="surface-elevated p-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2 mb-5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-600">
              <path d="M8 21h8m-4-4v4M6 4h12l1 7H5L6 4ZM3 11h18v2a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-2Z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h2 className="font-display text-xl text-gray-800 tracking-heading">Dein Fortschritt</h2>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatBubble label="Sitzungen" value={stats.totalSessions} />
            <StatBubble label="Durchschnitt" value={`${stats.averageScore}/25`} accent />
            <StatBubble label="Bestleistung" value={`${stats.bestScore}/25`} />
          </div>

          {stats.averageScore > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 font-medium">Gesamtleistung</span>
                <span className="font-semibold text-brand-700">
                  {Math.round((stats.averageScore / 25) * 100)}%
                </span>
              </div>
              <div className="h-3 rounded-full overflow-hidden relative"
                style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.03), rgba(0,0,0,0.06))' }}>
                <div
                  className="h-full rounded-full origin-left animate-score-fill"
                  style={{
                    width: `${(stats.averageScore / 25) * 100}%`,
                    background: 'linear-gradient(90deg, #14bd6e 0%, #3dd68e 60%, #ff9d37 100%)',
                  }}
                />
              </div>
            </div>
          )}

          {improvement !== null && (
            <div className="mt-4 flex items-center gap-2">
              {improvement > 0 && (
                <>
                  <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#099958" strokeWidth="3" strokeLinecap="round"><path d="M12 19V5m-7 7 7-7 7 7"/></svg>
                  </div>
                  <span className="text-sm font-semibold text-brand-700">+{improvement} Punkte</span>
                  <span className="text-xs text-gray-400">vs. letzte Sitzung</span>
                </>
              )}
              {improvement < 0 && (
                <>
                  <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14m7-7-7 7-7-7"/></svg>
                  </div>
                  <span className="text-sm font-semibold text-red-600">{improvement} Punkte</span>
                  <span className="text-xs text-gray-400">vs. letzte Sitzung</span>
                </>
              )}
              {improvement === 0 && (
                <>
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="3" strokeLinecap="round"><path d="M5 12h14"/></svg>
                  </div>
                  <span className="text-sm font-medium text-gray-500">Gleiche Punktzahl</span>
                </>
              )}
            </div>
          )}

          {recentSessions.length >= 2 && (
            <div className="mt-5 pt-4 border-t border-border-subtle">
              <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wide">Letzte Sitzungen</p>
              <div className="flex items-end gap-2 h-16">
                {[...recentSessions].reverse().map((s, i) => {
                  const pct = ((s.score ?? 0) / 25) * 100;
                  return (
                    <div key={s.id} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] font-semibold text-gray-500">{s.score}</span>
                      <div
                        className="w-full rounded-t-md"
                        style={{
                          height: `${Math.max(pct * 0.5, 4)}px`,
                          background: i === recentSessions.length - 1
                            ? 'linear-gradient(to top, #14bd6e, #3dd68e)'
                            : 'linear-gradient(to top, #e2e6eb, #cdd3db)',
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode selection */}
      <div className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
        <h2 className="font-display text-xl text-gray-800 tracking-heading mb-4">Modus wählen</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <ModeCard
            selected={mode === 'PRACTICE'}
            onClick={() => setMode('PRACTICE')}
            title={UI.practiceMode}
            desc={UI.practiceModeDesc}
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"/></svg>
            }
          />
          <ModeCard
            selected={mode === 'EXAM'}
            onClick={() => setMode('EXAM')}
            title={UI.examMode}
            desc={UI.examModeDesc}
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
            }
          />
        </div>
      </div>

      {/* Distraction timer */}
      <div className="surface-raised p-6 animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <label className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-600">{UI.distractionMinutes}</span>
          <span className="text-sm font-bold text-brand-700 bg-brand-50 px-3 py-1 rounded-full">
            {distractionMin} Min.
          </span>
        </label>
        <input
          type="range"
          min={0}
          max={60}
          value={distractionMin}
          onChange={(e) => setDistractionMin(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1.5">
          <span>0 Min.</span>
          <span>60 Min.</span>
        </div>
      </div>

      {/* Start button */}
      <div className="flex flex-col items-center gap-4 animate-fade-up" style={{ animationDelay: '0.25s' }}>
        <button onClick={handleStart} disabled={loading} className="btn-brand text-lg px-10 py-4 disabled:opacity-50">
          {loading ? (
            <span className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Wird geladen...
            </span>
          ) : (
            UI.startSession
          )}
        </button>
        <Link
          to="/history"
          className="text-brand-600 hover:text-brand-700 text-sm font-medium
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded
            active:scale-95 transition-transform duration-150"
        >
          {UI.showHistory} &rarr;
        </Link>
      </div>
    </div>
  );
}

function ModeCard({ selected, onClick, title, desc, icon }) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-6 rounded-2xl border-2 transition-transform duration-200 group
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400
        active:scale-[0.98] ${
        selected
          ? 'border-brand-400 bg-brand-50/60 shadow-glow-brand'
          : 'border-border bg-white shadow-raised hover:border-brand-200 hover:shadow-elevated'
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${
        selected ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-brand-100 group-hover:text-brand-600'
      }`}>
        {icon}
      </div>
      <h3 className={`font-display text-xl tracking-heading mb-1 ${selected ? 'text-brand-800' : 'text-gray-800'}`}>
        {title}
      </h3>
      <p className="text-sm text-gray-500 leading-body">{desc}</p>
    </button>
  );
}

function StatBubble({ label, value, accent }) {
  return (
    <div className={`text-center py-3 px-2 rounded-xl ${accent ? 'bg-brand-50 border border-brand-200' : 'bg-gray-50 border border-border-subtle'}`}>
      <div className={`text-2xl font-bold font-display tracking-heading ${accent ? 'text-brand-700' : 'text-gray-800'}`}>
        {value}
      </div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}
