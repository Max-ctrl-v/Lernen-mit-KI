/**
 * Zahlenfolgen (Number Sequences) Generator
 * Generates MedAT-style number sequence questions algorithmically.
 *
 * Official rules:
 * - 7 numbers shown, user must find the NEXT TWO
 * - Only +, -, *, / operations
 * - 5 answer options (A-E), where E = "Keine Antwort ist richtig"
 * - Difficulty levels: MEDIUM, HARD, VERY_HARD
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Check that every value in an array is a finite integer (no NaN/Infinity). */
function allFiniteIntegers(arr) {
  return arr.every((n) => Number.isFinite(n) && Number.isInteger(n));
}

/** Check that no value in the full sequence (7 shown + 2 answers) is absurdly large. */
function withinBounds(seq, answer, maxAbs = 100000) {
  return [...seq, ...answer].every((n) => Math.abs(n) <= maxAbs);
}

// ---------------------------------------------------------------------------
// Pattern generators
// Each returns { sequence: number[9], pattern: string, explanation: string }
// where sequence[0..6] are the shown values and sequence[7..8] the answers.
// ---------------------------------------------------------------------------

function generateArithmetic(difficulty) {
  const ranges = {
    MEDIUM: { startMin: 1, startMax: 20, diffMin: 2, diffMax: 8 },
    HARD: { startMin: -30, startMax: 50, diffMin: -15, diffMax: 15 },
    VERY_HARD: { startMin: -50, startMax: 100, diffMin: -25, diffMax: 25 },
  };
  const r = ranges[difficulty];
  let d = 0;
  while (d === 0) d = randInt(r.diffMin, r.diffMax);
  const start = randInt(r.startMin, r.startMax);
  const seq = [];
  for (let i = 0; i < 9; i++) seq.push(start + d * i);

  const sign = d > 0 ? '+' : '';
  return {
    sequence: seq,
    pattern: `Arithmetische Folge (${sign}${d})`,
    explanation: `Jede Zahl entsteht durch ${sign}${d}. Also: ${seq[6]} ${sign}${d === Math.abs(d) ? '' : ''}= ${seq[7]}, ${seq[7]} ${sign}${d === Math.abs(d) ? '' : ''}= ${seq[8]}.`,
  };
}

function generateGeometric(difficulty) {
  const factors =
    difficulty === 'MEDIUM'
      ? [2, 3]
      : difficulty === 'HARD'
      ? [2, 3, 4, 5, -2]
      : [2, 3, 4, 5, -2, -3];

  const factor = pick(factors);
  const absF = Math.abs(factor);

  // For positive factors, start can be small; for negative factors keep it small to avoid huge values
  let start;
  if (absF <= 3) {
    start = randInt(1, 5);
  } else {
    start = randInt(1, 3);
  }

  const seq = [start];
  for (let i = 1; i < 9; i++) seq.push(seq[i - 1] * factor);

  if (!allFiniteIntegers(seq) || !withinBounds(seq.slice(0, 7), seq.slice(7))) return null;

  const op = factor > 0 ? `\u00d7${factor}` : `\u00d7(${factor})`;
  return {
    sequence: seq,
    pattern: `Geometrische Folge (${op})`,
    explanation: `Jede Zahl wird mit ${factor} multipliziert. ${seq[6]} ${op} = ${seq[7]}, ${seq[7]} ${op} = ${seq[8]}.`,
  };
}

function generateAlternatingOps(difficulty) {
  // Two operations that alternate: op1, op2, op1, op2, ...
  // We apply op1 to get from index 0->1, op2 from 1->2, etc.
  const opSets =
    difficulty === 'MEDIUM'
      ? [
          { op1: '+', v1: 3, op2: '+', v2: 5 },
          { op1: '+', v1: 2, op2: '*', v2: 2 },
          { op1: '*', v1: 2, op2: '-', v2: 3 },
        ]
      : difficulty === 'HARD'
      ? [
          { op1: '*', v1: 2, op2: '+', v2: 5 },
          { op1: '+', v1: 7, op2: '-', v2: 3 },
          { op1: '*', v1: 3, op2: '/', v2: 2 },
          { op1: '*', v1: 2, op2: '-', v2: 5 },
        ]
      : [
          { op1: '*', v1: 3, op2: '-', v2: 7 },
          { op1: '+', v1: 11, op2: '*', v2: 2 },
          { op1: '*', v1: 2, op2: '+', v2: 13 },
          { op1: '-', v1: 4, op2: '*', v2: 3 },
        ];

  const ops = pick(opSets);
  const start = difficulty === 'MEDIUM' ? randInt(2, 10) : randInt(2, 20);

  function apply(val, op, v) {
    switch (op) {
      case '+': return val + v;
      case '-': return val - v;
      case '*': return val * v;
      case '/': return val / v;
      default: return val;
    }
  }

  function opStr(op, v) {
    switch (op) {
      case '+': return `+${v}`;
      case '-': return `-${v}`;
      case '*': return `\u00d7${v}`;
      case '/': return `\u00f7${v}`;
      default: return '';
    }
  }

  const seq = [start];
  for (let i = 1; i < 9; i++) {
    const isOp1 = (i - 1) % 2 === 0;
    const nextVal = isOp1 ? apply(seq[i - 1], ops.op1, ops.v1) : apply(seq[i - 1], ops.op2, ops.v2);
    seq.push(nextVal);
  }

  if (!allFiniteIntegers(seq) || !withinBounds(seq.slice(0, 7), seq.slice(7))) return null;

  const s1 = opStr(ops.op1, ops.v1);
  const s2 = opStr(ops.op2, ops.v2);

  return {
    sequence: seq,
    pattern: `Alternierende Operationen (${s1}, ${s2})`,
    explanation: `Es wechseln sich zwei Operationen ab: ${s1} und ${s2}. Schritt 1\u21923: ${s1}, Schritt 2\u21924: ${s2}, usw. Daraus folgt: ${seq[6]} ${s2} = ${seq[7]}, ${seq[7]} ${s1} = ${seq[8]}.`,
  };
}

function generateInterleaved(difficulty) {
  // Two independent subsequences at odd and even positions
  // seq: a0, b0, a1, b1, a2, b2, a3 -> answer: b3, a4
  // We need 9 total to get the 7 shown + 2 answers
  // Positions 0,2,4,6,8 = subsequence A (5 values)
  // Positions 1,3,5,7 = subsequence B (4 values)
  // Shown: positions 0-6 (a0,b0,a1,b1,a2,b2,a3)
  // Answers: positions 7,8 (b3, a4)

  const rangesA =
    difficulty === 'MEDIUM'
      ? { start: randInt(1, 10), diff: randInt(1, 5) }
      : difficulty === 'HARD'
      ? { start: randInt(1, 20), diff: randInt(2, 8) }
      : { start: randInt(5, 30), diff: randInt(3, 12) };

  const rangesB =
    difficulty === 'MEDIUM'
      ? { start: randInt(10, 30), diff: randInt(-5, -1) }
      : difficulty === 'HARD'
      ? { start: randInt(20, 50), diff: randInt(-10, -2) }
      : { start: randInt(30, 100), diff: randInt(-15, -3) };

  // Make sure diffs are nonzero
  if (rangesA.diff === 0) rangesA.diff = 3;
  if (rangesB.diff === 0) rangesB.diff = -3;

  // Subsequence A: 5 values (positions 0, 2, 4, 6, 8)
  const subA = [];
  for (let i = 0; i < 5; i++) subA.push(rangesA.start + rangesA.diff * i);

  // Subsequence B: 4 values (positions 1, 3, 5, 7)
  const subB = [];
  for (let i = 0; i < 4; i++) subB.push(rangesB.start + rangesB.diff * i);

  // Interleave: a0, b0, a1, b1, a2, b2, a3, b3, a4
  const seq = [];
  for (let i = 0; i < 5; i++) {
    seq.push(subA[i]);
    if (i < 4) seq.push(subB[i]);
  }

  if (!allFiniteIntegers(seq) || !withinBounds(seq.slice(0, 7), seq.slice(7))) return null;

  const signA = rangesA.diff > 0 ? '+' : '';
  const signB = rangesB.diff > 0 ? '+' : '';

  return {
    sequence: seq,
    pattern: 'Zwei verschachtelte Folgen',
    explanation: `Es sind zwei getrennte Folgen ineinander verschachtelt. Ungerade Positionen (1., 3., 5., 7.): ${subA.slice(0, 4).join(', ')} (${signA}${rangesA.diff}). Gerade Positionen (2., 4., 6.): ${subB.slice(0, 3).join(', ')} (${signB}${rangesB.diff}). Die n\u00e4chsten zwei Werte sind ${seq[7]} und ${seq[8]}.`,
  };
}

function generateFibonacciLike(difficulty) {
  let a, b;
  if (difficulty === 'MEDIUM') {
    a = randInt(1, 5);
    b = randInt(1, 5);
  } else if (difficulty === 'HARD') {
    a = randInt(1, 10);
    b = randInt(1, 10);
  } else {
    a = randInt(2, 15);
    b = randInt(2, 15);
  }

  const seq = [a, b];
  for (let i = 2; i < 9; i++) {
    seq.push(seq[i - 1] + seq[i - 2]);
  }

  if (!withinBounds(seq.slice(0, 7), seq.slice(7))) return null;

  return {
    sequence: seq,
    pattern: 'Fibonacci-artige Folge',
    explanation: `Jede Zahl ist die Summe der beiden vorherigen: ${seq[5]} + ${seq[6]} = ${seq[7]}, ${seq[6]} + ${seq[7]} = ${seq[8]}.`,
  };
}

function generateCombinedOps(difficulty) {
  // A repeating cycle of 2-3 operations applied in sequence.
  // E.g., *2, +3, *2, +3, ...
  const cycleSets =
    difficulty === 'MEDIUM'
      ? [
          [{ op: '*', v: 2 }, { op: '+', v: 1 }],
          [{ op: '+', v: 3 }, { op: '*', v: 2 }],
          [{ op: '*', v: 2 }, { op: '-', v: 1 }],
        ]
      : difficulty === 'HARD'
      ? [
          [{ op: '*', v: 2 }, { op: '+', v: 3 }, { op: '-', v: 1 }],
          [{ op: '+', v: 5 }, { op: '*', v: 2 }, { op: '-', v: 3 }],
          [{ op: '*', v: 3 }, { op: '-', v: 5 }],
          [{ op: '+', v: 4 }, { op: '*', v: 3 }],
        ]
      : [
          [{ op: '*', v: 2 }, { op: '+', v: 7 }, { op: '-', v: 3 }],
          [{ op: '+', v: 3 }, { op: '*', v: 2 }, { op: '-', v: 5 }],
          [{ op: '*', v: 3 }, { op: '-', v: 4 }, { op: '+', v: 7 }],
          [{ op: '*', v: 2 }, { op: '+', v: 11 }, { op: '-', v: 7 }],
        ];

  const cycle = pick(cycleSets);
  const start = difficulty === 'MEDIUM' ? randInt(1, 8) : randInt(1, 12);

  function apply(val, step) {
    switch (step.op) {
      case '+': return val + step.v;
      case '-': return val - step.v;
      case '*': return val * step.v;
      case '/': return val / step.v;
      default: return val;
    }
  }

  function opStr(step) {
    switch (step.op) {
      case '+': return `+${step.v}`;
      case '-': return `-${step.v}`;
      case '*': return `\u00d7${step.v}`;
      case '/': return `\u00f7${step.v}`;
      default: return '';
    }
  }

  const seq = [start];
  for (let i = 1; i < 9; i++) {
    const step = cycle[(i - 1) % cycle.length];
    seq.push(apply(seq[i - 1], step));
  }

  if (!allFiniteIntegers(seq) || !withinBounds(seq.slice(0, 7), seq.slice(7))) return null;

  const cycleStr = cycle.map(opStr).join(', ');
  const cycleLen = cycle.length;

  // Figure out which ops produce the last two
  const op7 = cycle[(8 - 1) % cycleLen]; // step from seq[7] to seq[8] -- we need step from seq[6]->seq[7]
  const stepFor7 = cycle[(7 - 1) % cycleLen]; // index 6 in cycle
  const stepFor8 = cycle[(8 - 1) % cycleLen]; // index 7 in cycle

  return {
    sequence: seq,
    pattern: `Kombinierte Operationen (${cycleStr})`,
    explanation: `Die Operationen wiederholen sich zyklisch: ${cycleStr}. Daraus: ${seq[6]} ${opStr(stepFor7)} = ${seq[7]}, ${seq[7]} ${opStr(stepFor8)} = ${seq[8]}.`,
  };
}

// ---------------------------------------------------------------------------
// Distractor generation
// ---------------------------------------------------------------------------

function generateDistractors(correctPair, count = 3) {
  const [a, b] = correctPair;
  const distractors = new Set();

  // Common mistakes: off-by-one, off-by-the-step, swapped, doubled, etc.
  const offsets = [
    [1, 1], [-1, -1], [1, 0], [0, 1], [-1, 0], [0, -1],
    [2, 2], [-2, -2], [1, -1], [-1, 1], [2, 0], [0, 2],
    [1, 2], [2, 1], [-1, -2], [-2, -1],
    [3, 3], [-3, -3], [0, 3], [3, 0],
    [Math.round(a * 0.1) || 1, Math.round(b * 0.1) || 1],
    [-(Math.round(a * 0.1) || 1), -(Math.round(b * 0.1) || 1)],
  ];

  const shuffledOffsets = shuffle(offsets);

  for (const [da, db] of shuffledOffsets) {
    if (distractors.size >= count) break;
    const na = a + da;
    const nb = b + db;
    // Must not equal correct answer
    if (na === a && nb === b) continue;
    const key = `${na},${nb}`;
    if (distractors.has(key)) continue;
    distractors.add(key);
  }

  // Fill remaining if needed
  let extra = 1;
  while (distractors.size < count) {
    const na = a + extra * (Math.random() > 0.5 ? 1 : -1);
    const nb = b + extra * (Math.random() > 0.5 ? 1 : -1);
    const key = `${na},${nb}`;
    if (key !== `${a},${b}` && !distractors.has(key)) {
      distractors.add(key);
    }
    extra++;
  }

  return [...distractors].map((s) => {
    const [x, y] = s.split(',').map(Number);
    return [x, y];
  });
}

function pairToString(pair) {
  return `${pair[0]}, ${pair[1]}`;
}

// ---------------------------------------------------------------------------
// Main question generator
// ---------------------------------------------------------------------------

const PATTERN_GENERATORS = {
  MEDIUM: [generateArithmetic, generateGeometric, generateFibonacciLike, generateCombinedOps],
  HARD: [generateArithmetic, generateGeometric, generateAlternatingOps, generateInterleaved, generateFibonacciLike, generateCombinedOps],
  VERY_HARD: [generateAlternatingOps, generateInterleaved, generateFibonacciLike, generateCombinedOps, generateGeometric],
};

const NONE_CORRECT_LABEL = 'Keine Antwort ist richtig';
const LABELS = ['A', 'B', 'C', 'D', 'E'];

/**
 * Generate a single Zahlenfolgen question.
 * @param {'MEDIUM'|'HARD'|'VERY_HARD'} difficulty
 * @returns {{ sequence: number[], correctAnswer: [number, number], options: Array<{label: string, value: [number, number]|null}>, correctOptionIndex: number, explanation: string, pattern: string }}
 */
export function generateZahlenfolgenQuestion(difficulty = 'MEDIUM') {
  const generators = PATTERN_GENERATORS[difficulty] || PATTERN_GENERATORS.MEDIUM;

  // Try generating until we get a valid sequence (no huge/NaN values)
  let result = null;
  let attempts = 0;
  while (!result && attempts < 50) {
    const gen = pick(generators);
    result = gen(difficulty);
    attempts++;
  }

  // Fallback to arithmetic if all else fails
  if (!result) {
    result = generateArithmetic('MEDIUM');
  }

  const shown = result.sequence.slice(0, 7);
  const correctPair = [result.sequence[7], result.sequence[8]];

  // Decide whether E ("none correct") should be the right answer (~15%)
  const noneIsCorrect = Math.random() < 0.15;

  // Generate 3 distractors (wrong pairs)
  const distractorPairs = generateDistractors(correctPair, 3);

  let options;
  let correctOptionIndex;

  if (noneIsCorrect) {
    // E is the correct answer. All A-D should be wrong.
    // We need 4 wrong pairs
    const extraDistractor = generateDistractors(correctPair, 4);
    const optionPairs = shuffle(extraDistractor).slice(0, 4);

    options = [
      ...optionPairs.map((p, i) => ({ label: LABELS[i], value: p, display: pairToString(p) })),
      { label: 'E', value: null, display: NONE_CORRECT_LABEL },
    ];
    correctOptionIndex = 4; // E
  } else {
    // Place correct answer randomly among A-D, E is "none correct" (wrong)
    const positionForCorrect = randInt(0, 3);
    const optionPairs = [];

    let distractorIdx = 0;
    for (let i = 0; i < 4; i++) {
      if (i === positionForCorrect) {
        optionPairs.push(correctPair);
      } else {
        optionPairs.push(distractorPairs[distractorIdx]);
        distractorIdx++;
      }
    }

    options = [
      ...optionPairs.map((p, i) => ({ label: LABELS[i], value: p, display: pairToString(p) })),
      { label: 'E', value: null, display: NONE_CORRECT_LABEL },
    ];
    correctOptionIndex = positionForCorrect;
  }

  return {
    sequence: shown,
    correctAnswer: correctPair,
    options,
    correctOptionIndex,
    explanation: result.explanation,
    pattern: result.pattern,
  };
}

/**
 * Generate a set of Zahlenfolgen questions.
 * @param {number} count
 * @param {'MEDIUM'|'HARD'|'VERY_HARD'} difficulty
 * @returns {Array}
 */
export function generateZahlenfolgenSet(count, difficulty = 'MEDIUM') {
  const questions = [];
  for (let i = 0; i < count; i++) {
    questions.push(generateZahlenfolgenQuestion(difficulty));
  }
  return questions;
}
