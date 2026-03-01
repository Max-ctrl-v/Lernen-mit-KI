import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UI } from '../utils/strings';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.error || 'Anmeldung fehlgeschlagen.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-base relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #14bd6e, transparent 70%)' }} />
        <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #ff8010, transparent 70%)' }} />
      </div>

      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-950 via-brand-900 to-brand-800" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse at 20% 50%, rgba(20,189,110,0.4) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(255,128,16,0.2) 0%, transparent 60%)',
          }}
        />
        <div className="absolute inset-0 opacity-[0.04]" style={{ filter: 'url(#grain)' }} />
        <div className="relative max-w-5xl mx-auto px-6 py-4 flex items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-brand-500/20 border border-brand-400/30 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-brand-300">
                <path d="M9 12h6M12 9v6M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <span className="font-display text-lg sm:text-xl text-white tracking-heading">
              <span className="sm:hidden">MedAT Trainer</span>
              <span className="hidden sm:inline">{UI.appTitle}</span>
            </span>
          </div>
        </div>
      </header>

      {/* Login form */}
      <main className="flex-1 flex items-center justify-center px-6 py-16 relative">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center mb-5"
              style={{ boxShadow: '0 4px 20px rgba(20,189,110,0.3), 0 0 0 1px rgba(20,189,110,0.1)' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <h1 className="font-display text-3xl text-gray-900 tracking-heading">
              Anmelden
            </h1>
            <p className="text-gray-500 font-body text-sm mt-1">
              Melde dich an, um fortzufahren.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="surface-elevated p-7 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5 font-body">E-Mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full px-4 py-3 border-2 border-border rounded-xl font-body text-base
                  focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 outline-none
                  transition-colors duration-200 bg-white"
                placeholder="deine@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5 font-body">Passwort</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-border rounded-xl font-body text-base
                  focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 outline-none
                  transition-colors duration-200 bg-white"
                placeholder="Passwort eingeben"
              />
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 font-body flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0">
                  <path d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-brand w-full py-3.5 text-base disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Anmelden...
                </span>
              ) : (
                'Anmelden'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6 font-body">
            Geschützt durch verschlüsselte Authentifizierung
          </p>
        </div>
      </main>

      <div className="h-1 bg-gradient-to-r from-brand-500 via-accent-400 to-brand-500 opacity-40" />
    </div>
  );
}
