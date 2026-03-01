import { useState, useEffect, useRef, useCallback } from 'react';

const CATEGORIES = [
  { category: 'Tiere', letters: ['A', 'B', 'D', 'E', 'F', 'G', 'H', 'K', 'L', 'M', 'P', 'R', 'S', 'W', 'Z'] },
  { category: 'Berufe', letters: ['A', 'B', 'D', 'F', 'K', 'L', 'M', 'P', 'S', 'T', 'V'] },
  { category: 'Länder', letters: ['A', 'B', 'D', 'F', 'G', 'I', 'K', 'M', 'N', 'P', 'S', 'T'] },
  { category: 'Nahrungsmittel', letters: ['A', 'B', 'E', 'G', 'H', 'K', 'M', 'N', 'P', 'R', 'S', 'T', 'Z'] },
  { category: 'Sportarten', letters: ['B', 'F', 'G', 'H', 'K', 'L', 'R', 'S', 'T', 'V'] },
];

function generateChallenge() {
  const cat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  const letter = cat.letters[Math.floor(Math.random() * cat.letters.length)];
  return { category: cat.category, letter };
}

export default function WordFluencyGame() {
  const [challenge, setChallenge] = useState(() => generateChallenge());
  const [words, setWords] = useState([]);
  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [isActive, setIsActive] = useState(false);
  const [roundScore, setRoundScore] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setIsActive(false);
          setRoundScore(words.length);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isActive, timeLeft, words.length]);

  const startRound = useCallback(() => {
    setChallenge(generateChallenge());
    setWords([]);
    setInput('');
    setTimeLeft(30);
    setIsActive(true);
    setRoundScore(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSubmitWord = useCallback((e) => {
    e.preventDefault();
    const word = input.trim();
    if (word && word[0]?.toUpperCase() === challenge.letter && !words.includes(word)) {
      setWords((prev) => [...prev, word]);
    }
    setInput('');
  }, [input, challenge.letter, words]);

  return (
    <div className="surface-elevated p-6 max-w-md mx-auto">
      <h3 className="font-display text-lg text-gray-800 tracking-heading mb-5">Wortflüssigkeit</h3>

      {!isActive && roundScore == null && (
        <div className="text-center">
          <p className="text-gray-600 font-body mb-4 leading-body">
            Nenne so viele <strong>{challenge.category}</strong> wie möglich,
            die mit <strong className="text-brand-600 text-xl">{challenge.letter}</strong> beginnen.
          </p>
          <button
            onClick={startRound}
            className="btn-brand px-6 py-2.5"
          >
            Start (30 Sek.)
          </button>
        </div>
      )}

      {isActive && (
        <>
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600 font-body">
              <strong>{challenge.category}</strong> mit <strong className="text-brand-600">{challenge.letter}</strong>
            </span>
            <span className={`font-mono font-bold px-3 py-1 rounded-full text-sm ${
              timeLeft <= 5
                ? 'text-red-600 bg-red-50 border border-red-200'
                : 'text-gray-700 bg-gray-100 border border-border-subtle'
            }`}>
              {timeLeft}s
            </span>
          </div>

          <form onSubmit={handleSubmitWord} className="flex gap-2 mb-4">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`${challenge.letter}...`}
              className="flex-1 px-4 py-2.5 border-2 border-border rounded-xl font-body
                focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 outline-none
                transition-colors duration-200"
              autoFocus
            />
            <button
              type="submit"
              className="w-11 h-11 rounded-xl bg-brand-500 text-white font-bold text-lg
                hover:bg-brand-600 active:scale-95
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400
                transition-transform duration-200"
            >
              +
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            {words.map((w, i) => (
              <span key={i} className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-sm font-medium border border-brand-200">
                {w}
              </span>
            ))}
          </div>
        </>
      )}

      {roundScore != null && (
        <div className="text-center">
          <p className="text-3xl font-display text-brand-700 tracking-heading mb-3">{roundScore} Wörter!</p>
          <div className="flex flex-wrap gap-2 justify-center mb-5">
            {words.map((w, i) => (
              <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-body border border-border-subtle">
                {w}
              </span>
            ))}
          </div>
          <button
            onClick={startRound}
            className="btn-brand px-6 py-2.5"
          >
            Nächste Runde
          </button>
        </div>
      )}
    </div>
  );
}
