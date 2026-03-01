import { useState, useCallback } from 'react';

const PATTERNS = [
  { name: '+n', gen: () => { const s = rand(1,5); const d = rand(2,8); return seq(s, 6, (v,i) => v + d); }},
  { name: '*2', gen: () => { const s = rand(1,4); return seq(s, 6, (v) => v * 2); }},
  { name: '*2+1', gen: () => { const s = rand(1,3); return seq(s, 6, (v) => v * 2 + 1); }},
  { name: '+inc', gen: () => { const s = rand(1,5); let d = rand(1,3); return seq(s, 6, (v) => { d++; return v + d; }); }},
  { name: '*3-n', gen: () => { const s = rand(1,3); const sub = rand(1,4); return seq(s, 6, (v) => v * 3 - sub); }},
  { name: 'fib-like', gen: () => { const a = rand(1,4); const b = rand(1,4); const nums = [a, b]; for (let i = 2; i < 6; i++) nums.push(nums[i-1] + nums[i-2]); return nums; }},
];

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function seq(start, len, nextFn) {
  const nums = [start];
  for (let i = 1; i < len; i++) nums.push(nextFn(nums[i-1], i));
  return nums;
}

function generatePuzzle() {
  const pattern = PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
  const numbers = pattern.gen();
  const answer = numbers[numbers.length - 1];
  const visible = numbers.slice(0, -1);

  const options = new Set([answer]);
  while (options.size < 4) {
    options.add(answer + rand(-5, 5) || answer + rand(1, 10));
  }
  const shuffled = [...options].sort(() => Math.random() - 0.5);

  return { visible, answer, options: shuffled };
}

export default function NumberSequenceGame() {
  const [puzzle, setPuzzle] = useState(() => generatePuzzle());
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);

  const handleAnswer = useCallback((opt) => {
    setSelected(opt);
    setTotal((t) => t + 1);
    if (opt === puzzle.answer) setScore((s) => s + 1);
    setTimeout(() => {
      setPuzzle(generatePuzzle());
      setSelected(null);
    }, 800);
  }, [puzzle.answer]);

  return (
    <div className="surface-elevated p-6 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-5">
        <h3 className="font-display text-lg text-gray-800 tracking-heading">Zahlenfolgen</h3>
        <span className="text-sm font-semibold text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
          {score}/{total}
        </span>
      </div>

      <div className="text-center mb-6">
        <span className="text-2xl font-mono font-bold text-gray-900">
          {puzzle.visible.join(', ')}, <span className="text-brand-500">?</span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {puzzle.options.map((opt, i) => {
          let cls =
            'py-3 rounded-xl font-semibold text-lg border-2 transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400';
          if (selected != null) {
            if (opt === puzzle.answer)
              cls += ' border-emerald-500 bg-emerald-50 text-emerald-700';
            else if (opt === selected)
              cls += ' border-red-400 bg-red-50 text-red-600';
            else cls += ' border-border-subtle text-gray-400';
          } else {
            cls +=
              ' border-border hover:border-brand-400 hover:shadow-glow-brand text-gray-700 cursor-pointer active:scale-95';
          }
          return (
            <button
              key={i}
              onClick={() => selected == null && handleAnswer(opt)}
              className={cls}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
