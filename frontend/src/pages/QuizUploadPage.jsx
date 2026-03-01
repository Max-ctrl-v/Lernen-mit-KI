import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../context/QuizContext';
import { UI } from '../utils/strings';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const FILE_ICONS = {
  pdf: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-red-500">
      <path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  ),
  txt: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-blue-500">
      <path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  ),
  image: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-purple-500">
      <path d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm12.75-11.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
    </svg>
  ),
};

const PROGRESS_STEPS = [
  UI.progressAnalyzing,
  UI.progressExtracting,
  UI.progressGenerating,
  UI.progressImages,
  UI.progressFinalizing,
];

const PROGRESS_STEPS_NO_IMG = [
  UI.progressAnalyzing,
  UI.progressExtracting,
  UI.progressGenerating,
  UI.progressFinalizing,
];

export default function QuizUploadPage() {
  const [file, setFile] = useState(null);
  const [questionCount, setQuestionCount] = useState(10);
  const [skipImages, setSkipImages] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileSizeError, setFileSizeError] = useState(null);
  const [bypassCode, setBypassCode] = useState('');
  const inputRef = useRef(null);
  const { createQuiz, loading, error, progressStep, rateLimited, rateLimitMsg, clearRateLimit } = useQuiz();
  const navigate = useNavigate();

  const handleFile = (f) => {
    if (!f) return;
    setFileSizeError(null);
    if (f.size > MAX_FILE_SIZE) {
      setFileSizeError(UI.fileTooLarge);
      setFile(null);
      return;
    }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleGenerate = async (overrideBypassCode = null) => {
    if (!file) return;
    try {
      const quiz = await createQuiz(file, questionCount, skipImages, overrideBypassCode || null);
      navigate(`/quiz/${quiz.id}/play`);
    } catch {
      // error is set in context
    }
  };

  const handleBypassSubmit = (e) => {
    e.preventDefault();
    if (!bypassCode.trim()) return;
    clearRateLimit();
    handleGenerate(bypassCode.trim());
  };

  const getFileType = (name) => {
    if (!name) return null;
    const ext = name.split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (ext === 'txt') return 'txt';
    return 'image';
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const steps = skipImages ? PROGRESS_STEPS_NO_IMG : PROGRESS_STEPS;

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      {/* Hero */}
      <div className="text-center animate-fade-up">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center mb-5"
          style={{ boxShadow: '0 4px 20px rgba(255,128,16,0.3), 0 0 0 1px rgba(255,128,16,0.1)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl text-gray-900 tracking-heading mb-3">
          {UI.quizUploadTitle}
        </h1>
        <p className="text-gray-500 font-body text-lg max-w-md mx-auto leading-body">
          {UI.quizUploadDesc}
        </p>
      </div>

      {/* Upload zone */}
      <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`surface-elevated p-6 sm:p-10 text-center cursor-pointer transition-transform duration-200
            border-2 border-dashed rounded-2xl
            ${dragOver
              ? 'border-brand-400 bg-brand-50/50 scale-[1.01]'
              : file
              ? 'border-brand-300 bg-brand-50/30'
              : 'border-border hover:border-brand-300'
            }
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400
            active:scale-[0.99]`}
          tabIndex={0}
          role="button"
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.txt,.png,.jpg,.jpeg"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />

          {file ? (
            <div className="space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-50 border border-border-subtle flex items-center justify-center">
                {FILE_ICONS[getFileType(file.name)] || FILE_ICONS.image}
              </div>
              <p className="font-display text-lg text-gray-800 tracking-heading">{file.name}</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-xs text-gray-400 font-body">{formatSize(file.size)}</span>
                <span className="text-xs text-brand-600 font-semibold bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                  {UI.fileSelected}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-100 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-brand-500">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
              </div>
              <p className="font-body text-gray-600 font-medium">{UI.dragDropHint}</p>
              <div className="flex items-center justify-center gap-3">
                <FormatBadge label="PDF" color="red" />
                <FormatBadge label="TXT" color="blue" />
                <FormatBadge label="PNG" color="purple" />
                <FormatBadge label="JPG" color="purple" />
              </div>
              <p className="text-[11px] text-gray-400 font-body">Max. 10 MB</p>
            </div>
          )}
        </div>
      </div>

      {/* File size error */}
      {fileSizeError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 font-body animate-fade-up flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0">
            <path d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          {fileSizeError}
        </div>
      )}

      {/* Question count slider */}
      <div className="surface-raised p-6 animate-fade-up" style={{ animationDelay: '0.15s' }}>
        <label className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-600">{UI.questionCountLabel}</span>
          <span className="text-sm font-bold text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
            {questionCount} Fragen
          </span>
        </label>
        <input
          type="range"
          min={5}
          max={30}
          value={questionCount}
          onChange={(e) => setQuestionCount(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1.5">
          <span>5 Fragen</span>
          <span>30 Fragen</span>
        </div>
      </div>

      {/* Skip images toggle */}
      <div className="surface-raised p-5 animate-fade-up" style={{ animationDelay: '0.18s' }}>
        <label className="flex items-center gap-3 cursor-pointer group">
          <button
            type="button"
            role="switch"
            aria-checked={skipImages}
            onClick={() => setSkipImages(!skipImages)}
            className={`relative w-10 h-6 rounded-full flex-shrink-0 transition-colors duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400
              ${skipImages ? 'bg-accent-500' : 'bg-gray-200'}`}
          >
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm
              transition-transform duration-200 ${skipImages ? 'translate-x-4' : ''}`} />
          </button>
          <div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
              {UI.skipImages}
            </span>
            <p className="text-xs text-gray-400 mt-0.5">{UI.skipImagesDesc}</p>
          </div>
        </label>
      </div>

      {/* Info box */}
      <div className="flex items-start gap-3 px-5 py-4 rounded-xl bg-brand-50/50 border border-brand-200/50 animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-brand-500 flex-shrink-0 mt-0.5">
          <path d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
        </svg>
        <p className="text-xs text-brand-700 font-body leading-relaxed">
          Die KI erstellt automatisch Fragen mit Bildern und ausführlichen Erklärungen basierend auf deinem Material. Bei falschen Antworten erhältst du eine detaillierte Erklärung.
        </p>
      </div>

      {/* Error */}
      {error && !rateLimited && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 font-body animate-fade-up flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0">
            <path d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          {error}
        </div>
      )}

      {/* Rate limit bypass */}
      {rateLimited && (
        <div className="surface-elevated p-6 animate-fade-up space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-amber-600">
                <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126Z" />
              </svg>
            </div>
            <div>
              <h3 className="font-display text-lg text-gray-800 tracking-heading">{UI.rateLimitTitle}</h3>
              <p className="text-sm text-gray-500 font-body">{rateLimitMsg}</p>
            </div>
          </div>
          <form onSubmit={handleBypassSubmit} className="flex gap-3">
            <input
              type="password"
              value={bypassCode}
              onChange={(e) => setBypassCode(e.target.value)}
              placeholder={UI.bypassPlaceholder}
              className="flex-1 px-4 py-2.5 border-2 border-border rounded-xl font-body text-base
                focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 outline-none
                transition-colors duration-200 bg-white"
            />
            <button
              type="submit"
              className="btn-brand px-5 py-2.5 text-sm"
            >
              {UI.bypassSubmit}
            </button>
          </form>
        </div>
      )}

      {/* Generate button */}
      <div className="flex flex-col items-center gap-4 animate-fade-up" style={{ animationDelay: '0.24s' }}>
        {!rateLimited && (
          <button
            onClick={() => handleGenerate()}
            disabled={!file || loading}
            className="btn-brand text-lg px-10 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                {UI.generating}
              </span>
            ) : (
              UI.generateQuiz
            )}
          </button>
        )}

        {/* Multi-step progress */}
        {loading && (
          <div className="w-full max-w-sm space-y-3 animate-fade-up">
            {steps.map((label, i) => {
              const isActive = i === progressStep;
              const isDone = i < progressStep;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
                    isDone ? 'bg-brand-500' : isActive ? 'bg-brand-100' : 'bg-gray-100'
                  }`}>
                    {isDone ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    ) : isActive ? (
                      <div className="w-3 h-3 rounded-full border-2 border-brand-400 border-t-transparent animate-spin" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-gray-300" />
                    )}
                  </div>
                  <span className={`text-sm font-body transition-colors duration-300 ${
                    isDone ? 'text-brand-600 font-medium' : isActive ? 'text-gray-800 font-medium' : 'text-gray-400'
                  }`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function FormatBadge({ label, color }) {
  const colors = {
    red: 'bg-red-50 text-red-600 border-red-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${colors[color]}`}>
      {label}
    </span>
  );
}
