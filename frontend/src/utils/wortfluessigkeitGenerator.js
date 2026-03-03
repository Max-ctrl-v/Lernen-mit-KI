/**
 * Wortflüssigkeit (Word Fluency / Anagram) Generator
 *
 * MedAT rules:
 * - Scrambled letters of a German noun are shown
 * - Player must identify the FIRST LETTER of the unscrambled word
 * - 5 options: A-D are single letters, E = "Keine Antwort ist richtig"
 * - Words are 6-10 letters long
 * - Umlauts (Ä,Ö,Ü) are written as AE, OE, UE
 */

// ─── Word Bank ──────────────────────────────────────────────────────────────
// All words are uppercase, umlauts replaced: Ä→AE, Ö→OE, Ü→UE, ß→SS

const WORD_BANK = {
  MEDIUM: [
    // 6-letter words
    'GARTEN', 'BLUMEN', 'HERBST', 'KINDER', 'BRILLE', 'KAFFEE', 'MONTAG',
    'ARBEIT', 'SCHULE', 'WASSER', 'BRUDER', 'FELSEN', 'HIMMEL', 'INSEL',
    'KATZE',  'LAMPE',  'MUSTER', 'NEBEL',  'PFERD',  'REISE',
    'SOMMER', 'WINTER', 'ZUCKER', 'RAUSCH', 'BALKON', 'SPRUNG', 'STRAND',
    'KUPFER', 'SILBER', 'FUTTER', 'KNOPF',  'DRUECK', 'STAPEL', 'AMEISE',
    'BANANE', 'DECKEL', 'FINGER', 'GLOCKE', 'HAMMER', 'KIRCHE', 'MANGEL',
    'NUDELN', 'ORANGE', 'POLIZEI','SPIEGEL','TELLER', 'WOLKEN', 'TUNNEL',
    'MESSER', 'TREPPE', 'KISSEN', 'KERZEN', 'SCHERE',
    // 7-letter words
    'FLASCHE', 'FENSTER', 'STRASSE', 'FRIEDEN', 'PARTNER', 'KLAVIER',
    'PFLANZE', 'FREITAG', 'OKTOBER', 'BRUECKE', 'GEDICHT', 'KUENSTE',
    'APRILIN', 'GEFUEHL', 'SCHREIN', 'VERSUCH', 'STUDIUM', 'SCHMUCK',
    'SCHLOSS', 'SCHLITZ', 'SCHWERT', 'TECHNIK', 'ANFRAGE', 'BEITRAG',
  ],

  HARD: [
    // 7-8 letter words
    'ERFAHRUNG',  'GEBURTSTAG', 'SCHWESTER',  'MASCHINE',   'HANDTUCH',
    'FREIHEIT',   'ABENTEUER',  'COMPUTER',   'EINFLUSS',   'HAUSHALT',
    'ANKUNFT',    'ZEITRAUM',   'FAHRPLAN',   'RECHNUNG',   'FLUGHAFEN',
    'PROGRAMM',   'SPIELZEUG',  'BAECKEREI',  'ERDBEERE',   'DANKBARKEIT',
    'GOLDBERG',   'HOCHHAUS',   'KOSTPROBE',  'RATGEBER',   'JAHRBUCH',
    'BUECHER',    'WERKSTATT',  'MEISTERIN',  'LANDKARTE',  'GASTHAUS',
    'ANTWORT',    'BLICKFELD',  'BACKSTEIN',  'DREHBUCH',   'EILPOST',
    'FRUCHTSAFT', 'GLASKUGEL',  'HAARNADEL',  'IRRGARTEN',  'JAHRMARKT',
    'KOPFSTEIN',  'LEITBILD',   'MITSPIELER', 'NACHWUCHS',  'OBSTGARTEN',
    'PROBIERSTUBE','QUELLWASSER','RENNSTRECKE','SAEUGLING',  'TAGEBUCH',
    'UMGEBUNG',   'VORSCHLAG',  'WINDMUEHLE',
  ],

  VERY_HARD: [
    // 8-10 letter words
    'WISSENSCHAFT',  'VORSTELLUNG',   'BUERGERMEISTER','GLEICHGEWICHT',
    'AUFMERKSAMKEIT','VERANTWORTUNG', 'VERSTAENDNIS',  'GERECHTIGKEIT',
    'KRANKENHAUS',   'HOCHSCHULE',    'SCHOKOLADE',    'BIBLIOTHEK',
    'GESELLSCHAFT',  'UNTERNEHMEN',   'AUSSTELLUNG',   'BEGEISTERUNG',
    'ENTSCHEIDUNG',  'FREUNDSCHAFT',  'GRUNDSTUECK',   'HANDSCHRIFT',
    'JAHRESZEIT',    'LEIDENSCHAFT',  'MANNSCHAFT',    'NOTAUFNAHME',
    'PARTNERSCHAFT', 'UEBERRASCHUNG', 'VERHANDLUNG',   'WETTBEWERB',
    'ZAHNBUERSTE',   'ABENTEUERLUST', 'BEOBACHTUNG',   'EINKAUFSLISTE',
    'FERNSEHTURM',   'GEBURTSTAGSKIND','HALBINSEL',    'INNENMINISTER',
    'KAFFEEMASCHINE','LEBENSMITTEL',  'MEDIKAMENT',    'NATURSCHUTZ',
    'OLYMPIASIEGER', 'PFERDESTALL',   'REISEBERICHT',  'STRASSENNAME',
    'TRINKWASSER',   'UNTERSCHRIFT',  'VERKEHRSSCHILD','WOCHENMARKT',
    'ZOLLSTATION',   'AUGENBLICK',    'BUCHHANDLUNG',  'DACHTERRASSE',
  ],
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Fisher-Yates shuffle for an array (in-place, returns the array).
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Scramble the letters of a word. Guarantees the result differs from the original.
 */
function scrambleWord(word) {
  const letters = word.split('');
  let scrambled;
  let attempts = 0;
  do {
    scrambled = shuffle([...letters]).join('');
    attempts++;
    // Safety valve: after 50 attempts just reverse the word
    if (attempts > 50) {
      scrambled = letters.reverse().join('');
      break;
    }
  } while (scrambled === word);
  return scrambled;
}

/**
 * Pick n unique random items from an array.
 */
function pickRandom(arr, n) {
  const shuffled = shuffle([...arr]);
  return shuffled.slice(0, n);
}

/**
 * Get unique letters from a word, excluding a specific letter.
 */
function getUniqueLettersExcluding(word, excludeLetter) {
  const unique = [...new Set(word.split(''))].filter((l) => l !== excludeLetter);
  return shuffle(unique);
}

/**
 * Generate a random uppercase letter A-Z that is NOT in the given set.
 */
function randomLetterNotIn(excludeSet) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const available = alphabet.split('').filter((l) => !excludeSet.has(l));
  if (available.length === 0) return 'X'; // fallback
  return available[Math.floor(Math.random() * available.length)];
}

// ─── Main Generators ────────────────────────────────────────────────────────

/**
 * Generate a single Wortflüssigkeit question.
 *
 * @param {'MEDIUM'|'HARD'|'VERY_HARD'} difficulty
 * @returns {{
 *   scrambledLetters: string,
 *   correctWord: string,
 *   correctFirstLetter: string,
 *   options: Array<{label: string, letter: string}>,
 *   correctOptionIndex: number,
 *   explanation: string
 * }}
 */
export function generateWortfluessigkeitQuestion(difficulty = 'MEDIUM') {
  const pool = WORD_BANK[difficulty] || WORD_BANK.MEDIUM;
  const word = pool[Math.floor(Math.random() * pool.length)];
  const scrambled = scrambleWord(word);
  const firstLetter = word[0];

  // 15% chance that E ("Keine Antwort ist richtig") is the correct answer
  const isOptionE = Math.random() < 0.15;

  let options;
  let correctOptionIndex;

  if (isOptionE) {
    // Build A-D with 4 letters that are NOT the first letter of the word
    const otherLetters = getUniqueLettersExcluding(word, firstLetter);
    const wordLetterSet = new Set(word.split(''));

    // We need 4 distinct wrong letters
    const wrongLetters = [];
    // First take letters from the word itself (excluding first letter)
    for (const l of otherLetters) {
      if (wrongLetters.length >= 4) break;
      if (l !== firstLetter) wrongLetters.push(l);
    }
    // If not enough, generate random letters not in the word
    while (wrongLetters.length < 4) {
      const extra = randomLetterNotIn(new Set([...wrongLetters, firstLetter]));
      if (!wrongLetters.includes(extra)) wrongLetters.push(extra);
    }

    options = [
      { label: 'A', letter: wrongLetters[0] },
      { label: 'B', letter: wrongLetters[1] },
      { label: 'C', letter: wrongLetters[2] },
      { label: 'D', letter: wrongLetters[3] },
      { label: 'E', letter: 'Keine Antwort ist richtig' },
    ];
    correctOptionIndex = 4; // E
  } else {
    // The correct first letter must appear in exactly one of A-D
    const otherLetters = getUniqueLettersExcluding(word, firstLetter);
    const wordLetterSet = new Set(word.split(''));

    // We need 3 wrong letters (distinct, not equal to firstLetter)
    const wrongLetters = [];
    for (const l of otherLetters) {
      if (wrongLetters.length >= 3) break;
      wrongLetters.push(l);
    }
    while (wrongLetters.length < 3) {
      const extra = randomLetterNotIn(new Set([...wrongLetters, firstLetter]));
      if (!wrongLetters.includes(extra)) wrongLetters.push(extra);
    }

    // Place the correct letter at a random position among A-D (indices 0-3)
    correctOptionIndex = Math.floor(Math.random() * 4);
    const adLetters = [...wrongLetters];
    adLetters.splice(correctOptionIndex, 0, firstLetter);

    options = [
      { label: 'A', letter: adLetters[0] },
      { label: 'B', letter: adLetters[1] },
      { label: 'C', letter: adLetters[2] },
      { label: 'D', letter: adLetters[3] },
      { label: 'E', letter: 'Keine Antwort ist richtig' },
    ];
  }

  const explanation = `Das Wort lautet: ${word}. Der Anfangsbuchstabe ist ${firstLetter}.`;

  return {
    scrambledLetters: scrambled,
    correctWord: word,
    correctFirstLetter: firstLetter,
    options,
    correctOptionIndex,
    explanation,
  };
}

/**
 * Generate a set of Wortflüssigkeit questions.
 * Attempts to avoid duplicate words within the set.
 *
 * @param {number} count
 * @param {'MEDIUM'|'HARD'|'VERY_HARD'} difficulty
 * @returns {Array}
 */
export function generateWortfluessigkeitSet(count = 10, difficulty = 'MEDIUM') {
  const usedWords = new Set();
  const questions = [];

  for (let i = 0; i < count; i++) {
    let q;
    let attempts = 0;
    do {
      q = generateWortfluessigkeitQuestion(difficulty);
      attempts++;
    } while (usedWords.has(q.correctWord) && attempts < 30);

    usedWords.add(q.correctWord);
    questions.push({ ...q, id: i + 1 });
  }

  return questions;
}
