/**
 * figurenGenerator.js
 *
 * Generates "Figuren zusammensetzen" (figure assembly) questions for MedAT training.
 * All shapes are defined as SVG path data — no external images required.
 *
 * Rules (official MedAT):
 * - 3-6 cut geometric pieces (fragments) are shown
 * - The task is to determine which complete geometric figure they form when assembled
 * - 5 answer options (A-E), where E = "Keine Antwort ist richtig"
 * - Pieces may need mental rotation but CANNOT be flipped or scaled
 */

// ---------------------------------------------------------------------------
// Shape Definitions
// ---------------------------------------------------------------------------
// Each shape is defined with a name (German), an SVG path, and a viewBox.
// All paths are drawn within a 100x100 coordinate space.

const SHAPES = {
  triangle: {
    name: 'Dreieck',
    path: 'M 50 5 L 95 90 L 5 90 Z',
    viewBox: '0 0 100 100',
  },
  square: {
    name: 'Quadrat',
    path: 'M 10 10 L 90 10 L 90 90 L 10 90 Z',
    viewBox: '0 0 100 100',
  },
  rectangle: {
    name: 'Rechteck',
    path: 'M 5 20 L 95 20 L 95 80 L 5 80 Z',
    viewBox: '0 0 100 100',
  },
  pentagon: {
    name: 'Fünfeck',
    path: 'M 50 5 L 97 38 L 79 92 L 21 92 L 3 38 Z',
    viewBox: '0 0 100 100',
  },
  hexagon: {
    name: 'Sechseck',
    path: 'M 50 5 L 93 27.5 L 93 72.5 L 50 95 L 7 72.5 L 7 27.5 Z',
    viewBox: '0 0 100 100',
  },
  octagon: {
    name: 'Achteck',
    path: 'M 35 5 L 65 5 L 95 35 L 95 65 L 65 95 L 35 95 L 5 65 L 5 35 Z',
    viewBox: '0 0 100 100',
  },
  circle: {
    name: 'Kreis',
    path: 'M 50 5 A 45 45 0 1 1 49.99 5 Z',
    viewBox: '0 0 100 100',
  },
  semicircle: {
    name: 'Halbkreis',
    path: 'M 5 55 A 45 45 0 0 1 95 55 L 5 55 Z',
    viewBox: '0 0 100 100',
  },
  quarterCircle: {
    name: 'Viertelkreis',
    path: 'M 10 90 L 10 10 A 80 80 0 0 1 90 90 Z',
    viewBox: '0 0 100 100',
  },
  threeQuarterCircle: {
    name: 'Dreiviertelkreis',
    path: 'M 50 5 A 45 45 0 1 1 95 50 L 50 50 Z',
    viewBox: '0 0 100 100',
  },
  parallelogram: {
    name: 'Parallelogramm',
    path: 'M 25 20 L 95 20 L 75 80 L 5 80 Z',
    viewBox: '0 0 100 100',
  },
  rhombus: {
    name: 'Raute',
    path: 'M 50 5 L 95 50 L 50 95 L 5 50 Z',
    viewBox: '0 0 100 100',
  },
  trapezoid: {
    name: 'Trapez',
    path: 'M 25 20 L 75 20 L 95 80 L 5 80 Z',
    viewBox: '0 0 100 100',
  },
  lShape: {
    name: 'L-Form',
    path: 'M 10 10 L 50 10 L 50 50 L 90 50 L 90 90 L 10 90 Z',
    viewBox: '0 0 100 100',
  },
  tShape: {
    name: 'T-Form',
    path: 'M 10 10 L 90 10 L 90 40 L 65 40 L 65 90 L 35 90 L 35 40 L 10 40 Z',
    viewBox: '0 0 100 100',
  },
  cross: {
    name: 'Kreuz',
    path: 'M 35 10 L 65 10 L 65 35 L 90 35 L 90 65 L 65 65 L 65 90 L 35 90 L 35 65 L 10 65 L 10 35 L 35 35 Z',
    viewBox: '0 0 100 100',
  },
  arrow: {
    name: 'Pfeil',
    path: 'M 50 5 L 90 45 L 65 45 L 65 90 L 35 90 L 35 45 L 10 45 Z',
    viewBox: '0 0 100 100',
  },
  star: {
    name: 'Stern',
    path: 'M 50 5 L 61 35 L 95 35 L 68 55 L 79 90 L 50 68 L 21 90 L 32 55 L 5 35 L 39 35 Z',
    viewBox: '0 0 100 100',
  },
};

// ---------------------------------------------------------------------------
// Puzzle Library
// ---------------------------------------------------------------------------
// Each puzzle defines:
//   id         - unique identifier
//   targetKey  - key into SHAPES for the complete figure
//   pieceCount - number of pieces (must match pieces.length)
//   pieces     - array of {path} SVG fragments that tile the target shape

const PUZZLES = [
  // ── 3-piece puzzles (MEDIUM) ────────────────────────────────────────────

  {
    id: 'tri-3',
    targetKey: 'triangle',
    pieceCount: 3,
    pieces: [
      { path: 'M 50 5 L 72.5 47.5 L 27.5 47.5 Z' },
      { path: 'M 27.5 47.5 L 72.5 47.5 L 95 90 L 50 90 Z' },
      { path: 'M 27.5 47.5 L 50 90 L 5 90 Z' },
    ],
  },
  {
    id: 'sq-3',
    targetKey: 'square',
    pieceCount: 3,
    pieces: [
      { path: 'M 10 10 L 90 10 L 10 90 Z' },
      { path: 'M 90 10 L 90 55 L 45 55 Z' },
      { path: 'M 10 90 L 45 55 L 90 55 L 90 90 Z' },
    ],
  },
  {
    id: 'rect-3',
    targetKey: 'rectangle',
    pieceCount: 3,
    pieces: [
      { path: 'M 5 20 L 50 20 L 50 80 L 5 80 Z' },
      { path: 'M 50 20 L 95 20 L 95 50 L 50 50 Z' },
      { path: 'M 50 50 L 95 50 L 95 80 L 50 80 Z' },
    ],
  },
  {
    id: 'hex-3',
    targetKey: 'hexagon',
    pieceCount: 3,
    pieces: [
      { path: 'M 50 5 L 93 27.5 L 93 72.5 L 50 50 Z' },
      { path: 'M 50 5 L 50 50 L 50 95 L 7 72.5 L 7 27.5 Z' },
      { path: 'M 50 50 L 93 72.5 L 50 95 Z' },
    ],
  },
  {
    id: 'circ-3',
    targetKey: 'circle',
    pieceCount: 3,
    pieces: [
      { path: 'M 50 5 A 45 45 0 0 1 95 50 L 50 50 Z' },
      { path: 'M 95 50 A 45 45 0 0 1 5 50 L 50 50 Z' },
      { path: 'M 5 50 A 45 45 0 0 1 50 5 L 50 50 Z' },
    ],
  },
  {
    id: 'pent-3',
    targetKey: 'pentagon',
    pieceCount: 3,
    pieces: [
      { path: 'M 50 5 L 97 38 L 50 50 Z' },
      { path: 'M 50 5 L 50 50 L 21 92 L 3 38 Z' },
      { path: 'M 50 50 L 97 38 L 79 92 L 21 92 Z' },
    ],
  },
  {
    id: 'rhom-3',
    targetKey: 'rhombus',
    pieceCount: 3,
    pieces: [
      { path: 'M 50 5 L 95 50 L 50 50 Z' },
      { path: 'M 50 5 L 50 50 L 5 50 Z' },
      { path: 'M 5 50 L 95 50 L 50 95 Z' },
    ],
  },
  {
    id: 'para-3',
    targetKey: 'parallelogram',
    pieceCount: 3,
    pieces: [
      { path: 'M 25 20 L 60 20 L 50 50 L 15 50 Z' },
      { path: 'M 60 20 L 95 20 L 75 80 L 50 50 Z' },
      { path: 'M 15 50 L 50 50 L 75 80 L 5 80 Z' },
    ],
  },
  {
    id: 'trap-3',
    targetKey: 'trapezoid',
    pieceCount: 3,
    pieces: [
      { path: 'M 25 20 L 75 20 L 50 50 Z' },
      { path: 'M 25 20 L 50 50 L 5 80 Z' },
      { path: 'M 50 50 L 75 20 L 95 80 L 5 80 Z' },
    ],
  },

  // ── 4-piece puzzles (HARD) ──────────────────────────────────────────────

  {
    id: 'sq-4',
    targetKey: 'square',
    pieceCount: 4,
    pieces: [
      { path: 'M 10 10 L 50 10 L 50 50 L 10 50 Z' },
      { path: 'M 50 10 L 90 10 L 90 50 L 50 50 Z' },
      { path: 'M 10 50 L 50 50 L 50 90 L 10 90 Z' },
      { path: 'M 50 50 L 90 50 L 90 90 L 50 90 Z' },
    ],
  },
  {
    id: 'tri-4',
    targetKey: 'triangle',
    pieceCount: 4,
    pieces: [
      { path: 'M 50 5 L 61.25 26.25 L 38.75 26.25 Z' },
      { path: 'M 38.75 26.25 L 61.25 26.25 L 72.5 47.5 L 27.5 47.5 Z' },
      { path: 'M 27.5 47.5 L 50 47.5 L 5 90 Z' },
      { path: 'M 50 47.5 L 72.5 47.5 L 95 90 L 5 90 Z' },
    ],
  },
  {
    id: 'hex-4',
    targetKey: 'hexagon',
    pieceCount: 4,
    pieces: [
      { path: 'M 50 5 L 93 27.5 L 50 50 Z' },
      { path: 'M 93 27.5 L 93 72.5 L 50 50 Z' },
      { path: 'M 50 50 L 93 72.5 L 50 95 L 7 72.5 Z' },
      { path: 'M 50 5 L 50 50 L 7 72.5 L 7 27.5 Z' },
    ],
  },
  {
    id: 'oct-4',
    targetKey: 'octagon',
    pieceCount: 4,
    pieces: [
      { path: 'M 35 5 L 65 5 L 95 35 L 50 50 Z' },
      { path: 'M 95 35 L 95 65 L 50 50 Z' },
      { path: 'M 50 50 L 95 65 L 65 95 L 35 95 L 5 65 Z' },
      { path: 'M 35 5 L 50 50 L 5 65 L 5 35 Z' },
    ],
  },
  {
    id: 'circ-4',
    targetKey: 'circle',
    pieceCount: 4,
    pieces: [
      { path: 'M 50 5 A 45 45 0 0 1 95 50 L 50 50 Z' },
      { path: 'M 95 50 A 45 45 0 0 1 50 95 L 50 50 Z' },
      { path: 'M 50 95 A 45 45 0 0 1 5 50 L 50 50 Z' },
      { path: 'M 5 50 A 45 45 0 0 1 50 5 L 50 50 Z' },
    ],
  },
  {
    id: 'lshape-4',
    targetKey: 'lShape',
    pieceCount: 4,
    pieces: [
      { path: 'M 10 10 L 50 10 L 50 50 L 10 50 Z' },
      { path: 'M 10 50 L 50 50 L 50 90 L 10 90 Z' },
      { path: 'M 50 50 L 90 50 L 90 70 L 50 70 Z' },
      { path: 'M 50 70 L 90 70 L 90 90 L 50 90 Z' },
    ],
  },
  {
    id: 'tshape-4',
    targetKey: 'tShape',
    pieceCount: 4,
    pieces: [
      { path: 'M 10 10 L 50 10 L 50 40 L 10 40 Z' },
      { path: 'M 50 10 L 90 10 L 90 40 L 50 40 Z' },
      { path: 'M 35 40 L 65 40 L 65 65 L 35 65 Z' },
      { path: 'M 35 65 L 65 65 L 65 90 L 35 90 Z' },
    ],
  },
  {
    id: 'cross-4',
    targetKey: 'cross',
    pieceCount: 4,
    pieces: [
      { path: 'M 35 10 L 65 10 L 65 35 L 90 35 L 90 50 L 35 50 Z' },
      { path: 'M 90 50 L 90 65 L 65 65 L 65 90 L 35 90 L 35 50 Z' },
      { path: 'M 10 35 L 35 35 L 35 50 L 10 50 Z' },
      { path: 'M 10 50 L 35 50 L 35 65 L 10 65 Z' },
    ],
  },
  {
    id: 'arrow-4',
    targetKey: 'arrow',
    pieceCount: 4,
    pieces: [
      { path: 'M 50 5 L 90 45 L 65 45 L 35 45 L 10 45 Z' },
      { path: 'M 35 45 L 65 45 L 65 60 L 35 60 Z' },
      { path: 'M 35 60 L 65 60 L 65 75 L 35 75 Z' },
      { path: 'M 35 75 L 65 75 L 65 90 L 35 90 Z' },
    ],
  },
  {
    id: 'rect-4',
    targetKey: 'rectangle',
    pieceCount: 4,
    pieces: [
      { path: 'M 5 20 L 50 20 L 5 80 Z' },
      { path: 'M 50 20 L 95 20 L 50 80 Z' },
      { path: 'M 5 80 L 50 20 L 50 80 Z' },
      { path: 'M 50 80 L 95 20 L 95 80 L 5 80 Z' },
    ],
  },

  // ── 5-piece puzzles (HARD / VERY_HARD) ──────────────────────────────────

  {
    id: 'hex-5',
    targetKey: 'hexagon',
    pieceCount: 5,
    pieces: [
      { path: 'M 50 5 L 93 27.5 L 50 50 Z' },
      { path: 'M 93 27.5 L 93 72.5 L 50 50 Z' },
      { path: 'M 50 50 L 93 72.5 L 50 95 Z' },
      { path: 'M 50 50 L 50 95 L 7 72.5 Z' },
      { path: 'M 50 5 L 50 50 L 7 72.5 L 7 27.5 Z' },
    ],
  },
  {
    id: 'sq-5',
    targetKey: 'square',
    pieceCount: 5,
    pieces: [
      { path: 'M 10 10 L 50 10 L 50 50 L 10 50 Z' },
      { path: 'M 50 10 L 90 10 L 90 50 L 50 50 Z' },
      { path: 'M 10 50 L 50 50 L 50 90 Z' },
      { path: 'M 10 50 L 50 90 L 10 90 Z' },
      { path: 'M 50 50 L 90 50 L 90 90 L 50 90 Z' },
    ],
  },
  {
    id: 'oct-5',
    targetKey: 'octagon',
    pieceCount: 5,
    pieces: [
      { path: 'M 35 5 L 65 5 L 50 50 Z' },
      { path: 'M 65 5 L 95 35 L 95 65 L 50 50 Z' },
      { path: 'M 50 50 L 95 65 L 65 95 L 35 95 Z' },
      { path: 'M 50 50 L 35 95 L 5 65 Z' },
      { path: 'M 35 5 L 50 50 L 5 65 L 5 35 Z' },
    ],
  },
  {
    id: 'star-5',
    targetKey: 'star',
    pieceCount: 5,
    pieces: [
      { path: 'M 50 5 L 61 35 L 50 50 L 39 35 Z' },
      { path: 'M 61 35 L 95 35 L 68 55 L 50 50 Z' },
      { path: 'M 68 55 L 79 90 L 50 68 L 50 50 Z' },
      { path: 'M 50 68 L 21 90 L 32 55 L 50 50 Z' },
      { path: 'M 32 55 L 5 35 L 39 35 L 50 50 Z' },
    ],
  },
  {
    id: 'cross-5',
    targetKey: 'cross',
    pieceCount: 5,
    pieces: [
      { path: 'M 35 10 L 65 10 L 65 35 L 35 35 Z' },
      { path: 'M 10 35 L 35 35 L 35 65 L 10 65 Z' },
      { path: 'M 35 35 L 65 35 L 65 65 L 35 65 Z' },
      { path: 'M 65 35 L 90 35 L 90 65 L 65 65 Z' },
      { path: 'M 35 65 L 65 65 L 65 90 L 35 90 Z' },
    ],
  },
  {
    id: 'rhom-5',
    targetKey: 'rhombus',
    pieceCount: 5,
    pieces: [
      { path: 'M 50 5 L 72.5 27.5 L 50 50 Z' },
      { path: 'M 72.5 27.5 L 95 50 L 50 50 Z' },
      { path: 'M 50 50 L 95 50 L 50 95 Z' },
      { path: 'M 50 50 L 50 95 L 5 50 Z' },
      { path: 'M 50 5 L 50 50 L 5 50 Z' },
    ],
  },

  // ── 6-piece puzzles (VERY_HARD) ─────────────────────────────────────────

  {
    id: 'hex-6',
    targetKey: 'hexagon',
    pieceCount: 6,
    pieces: [
      { path: 'M 50 5 L 93 27.5 L 50 50 Z' },
      { path: 'M 93 27.5 L 93 72.5 L 50 50 Z' },
      { path: 'M 93 72.5 L 50 95 L 50 50 Z' },
      { path: 'M 50 95 L 7 72.5 L 50 50 Z' },
      { path: 'M 7 72.5 L 7 27.5 L 50 50 Z' },
      { path: 'M 7 27.5 L 50 5 L 50 50 Z' },
    ],
  },
  {
    id: 'circ-6',
    targetKey: 'circle',
    pieceCount: 6,
    pieces: [
      { path: 'M 50 5 A 45 45 0 0 1 88.97 27.5 L 50 50 Z' },
      { path: 'M 88.97 27.5 A 45 45 0 0 1 88.97 72.5 L 50 50 Z' },
      { path: 'M 88.97 72.5 A 45 45 0 0 1 50 95 L 50 50 Z' },
      { path: 'M 50 95 A 45 45 0 0 1 11.03 72.5 L 50 50 Z' },
      { path: 'M 11.03 72.5 A 45 45 0 0 1 11.03 27.5 L 50 50 Z' },
      { path: 'M 11.03 27.5 A 45 45 0 0 1 50 5 L 50 50 Z' },
    ],
  },
  {
    id: 'sq-6',
    targetKey: 'square',
    pieceCount: 6,
    pieces: [
      { path: 'M 10 10 L 50 10 L 50 37 L 10 37 Z' },
      { path: 'M 50 10 L 90 10 L 90 37 L 50 37 Z' },
      { path: 'M 10 37 L 50 37 L 50 63 L 10 63 Z' },
      { path: 'M 50 37 L 90 37 L 90 63 L 50 63 Z' },
      { path: 'M 10 63 L 50 63 L 50 90 L 10 90 Z' },
      { path: 'M 50 63 L 90 63 L 90 90 L 50 90 Z' },
    ],
  },
  {
    id: 'oct-6',
    targetKey: 'octagon',
    pieceCount: 6,
    pieces: [
      { path: 'M 35 5 L 65 5 L 50 50 Z' },
      { path: 'M 65 5 L 95 35 L 50 50 Z' },
      { path: 'M 95 35 L 95 65 L 65 95 L 50 50 Z' },
      { path: 'M 65 95 L 35 95 L 50 50 Z' },
      { path: 'M 35 95 L 5 65 L 50 50 Z' },
      { path: 'M 5 65 L 5 35 L 35 5 L 50 50 Z' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------------------------------------------------------------------------
// Difficulty configuration
// ---------------------------------------------------------------------------

const DIFFICULTY_CONFIG = {
  MEDIUM: { minPieces: 3, maxPieces: 3, distractorSimilarity: 'low' },
  HARD: { minPieces: 4, maxPieces: 5, distractorSimilarity: 'medium' },
  VERY_HARD: { minPieces: 5, maxPieces: 6, distractorSimilarity: 'high' },
};

// Groups of similar shapes for harder distractors
const SIMILAR_GROUPS = [
  ['triangle', 'pentagon', 'hexagon', 'octagon'],
  ['square', 'rectangle', 'parallelogram', 'rhombus', 'trapezoid'],
  ['circle', 'semicircle', 'quarterCircle', 'threeQuarterCircle'],
  ['lShape', 'tShape', 'cross', 'arrow'],
];

function getSimilarShapes(shapeKey) {
  const group = SIMILAR_GROUPS.find((g) => g.includes(shapeKey));
  if (!group) return [];
  return group.filter((k) => k !== shapeKey);
}

// ---------------------------------------------------------------------------
// Scatter layout — positions pieces avoiding overlap
// ---------------------------------------------------------------------------

function generateScatterLayout(pieceCount) {
  const positions = [];
  const cols = pieceCount <= 3 ? 3 : pieceCount <= 4 ? 2 : 3;
  const rows = Math.ceil(pieceCount / cols);
  const cellW = 300 / cols;
  const cellH = 300 / rows;

  for (let i = 0; i < pieceCount; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const baseX = col * cellW + cellW * 0.1;
    const baseY = row * cellH + cellH * 0.1;

    positions.push({
      x: baseX + randomBetween(0, Math.floor(cellW * 0.12)),
      y: baseY + randomBetween(0, Math.floor(cellH * 0.12)),
      scale: pieceCount <= 3 ? 0.78 : pieceCount <= 4 ? 0.72 : 0.6,
      rotation: pickRandom([0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 240, 270, 300, 330]),
    });
  }

  return shuffle(positions);
}

// ---------------------------------------------------------------------------
// German article helper for explanation text
// ---------------------------------------------------------------------------

function articleFor(name) {
  // neuter: Dreieck, Quadrat, Rechteck, Fünfeck, Sechseck, Achteck, Trapez, Parallelogramm, Kreuz
  // masculine: Kreis, Halbkreis, Viertelkreis, Dreiviertelkreis, Stern, Pfeil
  // feminine: Raute, L-Form, T-Form
  const masculine = ['Kreis', 'Halbkreis', 'Viertelkreis', 'Dreiviertelkreis', 'Stern', 'Pfeil'];
  const feminine = ['Raute', 'L-Form', 'T-Form'];
  if (masculine.includes(name)) return 'einen';
  if (feminine.includes(name)) return 'eine';
  return 'ein';
}

// ---------------------------------------------------------------------------
// Question generator
// ---------------------------------------------------------------------------

/**
 * Generate a single "Figuren zusammensetzen" question.
 *
 * @param {'MEDIUM'|'HARD'|'VERY_HARD'} difficulty
 * @returns {{
 *   id: string,
 *   pieces: Array<{path: string, rotation: number, x: number, y: number, scale: number}>,
 *   correctShape: {key: string, name: string, path: string, viewBox: string},
 *   options: Array<{label: string, key: string, name: string, path: string, viewBox: string, isNone?: boolean}>,
 *   correctOptionIndex: number,
 *   explanation: string,
 * }}
 */
export function generateFigurenQuestion(difficulty = 'MEDIUM') {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.MEDIUM;

  // Filter puzzles that match the piece-count range
  const eligible = PUZZLES.filter(
    (p) => p.pieceCount >= config.minPieces && p.pieceCount <= config.maxPieces
  );

  // Fallback if no eligible puzzles for given difficulty
  const pool = eligible.length > 0 ? eligible : PUZZLES;
  const puzzle = pickRandom(pool);
  const targetShape = SHAPES[puzzle.targetKey];

  // Generate scatter positions for pieces
  const layout = generateScatterLayout(puzzle.pieces.length);
  const pieces = puzzle.pieces.map((piece, i) => ({
    path: piece.path,
    rotation: layout[i].rotation,
    x: layout[i].x,
    y: layout[i].y,
    scale: layout[i].scale,
  }));

  // Build distractors (wrong answer shapes)
  const usedKeys = new Set([puzzle.targetKey]);
  const distractors = [];

  // For higher similarity, prefer shapes from the same group
  if (config.distractorSimilarity !== 'low') {
    const similar = shuffle(getSimilarShapes(puzzle.targetKey));
    for (const key of similar) {
      if (distractors.length >= 3) break;
      if (!usedKeys.has(key) && SHAPES[key]) {
        distractors.push(key);
        usedKeys.add(key);
      }
    }
  }

  // Fill remaining slots with random shapes
  const allKeys = shuffle(Object.keys(SHAPES));
  for (const key of allKeys) {
    if (distractors.length >= 3) break;
    if (!usedKeys.has(key)) {
      distractors.push(key);
      usedKeys.add(key);
    }
  }

  // 10 % chance that "Keine Antwort ist richtig" is the correct answer
  const noneIsCorrect = Math.random() < 0.1;
  const labels = ['A', 'B', 'C', 'D', 'E'];
  let options;
  let correctOptionIndex;

  if (noneIsCorrect) {
    // All four visible shapes are wrong, E is correct
    const extraDistractor = shuffle(
      Object.keys(SHAPES).filter((k) => !usedKeys.has(k))
    )[0];
    const wrongKeys = [...distractors.slice(0, 3), extraDistractor || distractors[0]];
    options = wrongKeys.map((key, i) => ({
      label: labels[i],
      key,
      name: SHAPES[key].name,
      path: SHAPES[key].path,
      viewBox: SHAPES[key].viewBox,
    }));
    options.push({
      label: 'E',
      key: 'none',
      name: 'Keine Antwort ist richtig',
      path: null,
      viewBox: null,
      isNone: true,
    });
    correctOptionIndex = 4;
  } else {
    // Place the correct answer at a random position among A-D
    const correctPos = randomBetween(0, 3);
    const wrongShapes = distractors.slice(0, 3);
    const shapeOptions = [];
    let wrongIdx = 0;

    for (let i = 0; i < 4; i++) {
      if (i === correctPos) {
        shapeOptions.push({
          label: labels[i],
          key: puzzle.targetKey,
          name: targetShape.name,
          path: targetShape.path,
          viewBox: targetShape.viewBox,
        });
      } else {
        const key = wrongShapes[wrongIdx++];
        shapeOptions.push({
          label: labels[i],
          key,
          name: SHAPES[key].name,
          path: SHAPES[key].path,
          viewBox: SHAPES[key].viewBox,
        });
      }
    }

    shapeOptions.push({
      label: 'E',
      key: 'none',
      name: 'Keine Antwort ist richtig',
      path: null,
      viewBox: null,
      isNone: true,
    });

    options = shapeOptions;
    correctOptionIndex = correctPos;
  }

  const article = articleFor(targetShape.name);
  const explanation = noneIsCorrect
    ? `Die Teile ergeben ${article} ${targetShape.name}. Diese Figur war nicht unter den Antwortoptionen A\u2013D, daher ist E richtig.`
    : `Die Teile lassen sich zu ${article} ${targetShape.name} zusammensetzen (Antwort ${labels[correctOptionIndex]}).`;

  return {
    id: `fig-${puzzle.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    pieces,
    correctShape: {
      key: puzzle.targetKey,
      name: targetShape.name,
      path: targetShape.path,
      viewBox: targetShape.viewBox,
    },
    options,
    correctOptionIndex,
    explanation,
  };
}

/**
 * Generate a set of figure assembly questions.
 * Tries to avoid repeating the same underlying puzzle within a set.
 *
 * @param {number} count
 * @param {'MEDIUM'|'HARD'|'VERY_HARD'} difficulty
 * @returns {Array}
 */
export function generateFigurenSet(count = 10, difficulty = 'MEDIUM') {
  const questions = [];
  const usedPuzzleBaseIds = new Set();

  for (let i = 0; i < count; i++) {
    let q;
    let attempts = 0;
    do {
      q = generateFigurenQuestion(difficulty);
      // Extract the base puzzle id (e.g. "fig-hex-6" -> "hex-6")
      const baseId = q.id.replace(/^fig-/, '').replace(/-\d+-\w+$/, '');
      if (!usedPuzzleBaseIds.has(baseId) || attempts >= 30) {
        usedPuzzleBaseIds.add(baseId);
        break;
      }
      attempts++;
    } while (true);

    questions.push(q);
  }

  return questions;
}
