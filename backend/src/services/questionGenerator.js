import { FIELD_DISTRIBUTION, BLOOD_TYPES } from '../config/constants.js';
import { ALLERGIES } from '../data/allergies.js';
import { COUNTRIES } from '../data/countries.js';
import { shuffleArray, randomPick, randomInt } from '../utils/random.js';

const NONE_ANSWER = 'Keine der angegebenen Antworten ist korrekt';

const MONTHS = [
  'Jänner', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

function formatMonth(month) {
  return MONTHS[month - 1];
}

// Build a plan of which card+field to ask about
function buildQuestionPlan(cards) {
  const plan = [];
  const cardQuestionCount = new Map();
  cards.forEach((c) => cardQuestionCount.set(c.id, 0));

  for (const [field, count] of Object.entries(FIELD_DISTRIBUTION)) {
    for (let i = 0; i < count; i++) {
      // Prefer cards with fewer questions assigned
      const sorted = [...cards].sort(
        (a, b) => cardQuestionCount.get(a.id) - cardQuestionCount.get(b.id)
      );
      const card = sorted[i % sorted.length];
      const useReverse = Math.random() < 0.3 && field !== 'medication';
      plan.push({ card, field, reverse: useReverse });
      cardQuestionCount.set(card.id, cardQuestionCount.get(card.id) + 1);
    }
  }

  return shuffleArray(plan);
}

function buildQuestionText(card, field, reverse, cards) {
  const allergies = JSON.parse(card.allergies);

  if (reverse) {
    return buildReverseQuestion(card, field, cards, allergies);
  }
  return buildForwardQuestion(card, field, allergies);
}

function buildForwardQuestion(card, field, allergies) {
  switch (field) {
    case 'bloodType':
      return {
        questionText: `Welche Blutgruppe hat ${card.name}?`,
        correctAnswer: card.bloodType,
      };
    case 'medication':
      return {
        questionText: `Nimmt ${card.name} Medikamente ein?`,
        correctAnswer: card.medication ? 'Ja' : 'Nein',
      };
    case 'idNumber':
      return {
        questionText: `Welche Ausweisnummer hat ${card.name}?`,
        correctAnswer: card.idNumber,
      };
    case 'country':
      return {
        questionText: `In welchem Land wurde der Ausweis von ${card.name} ausgestellt?`,
        correctAnswer: card.country,
      };
    case 'birthDay':
      return {
        questionText: `An welchem Tag im Monat hat ${card.name} Geburtstag?`,
        correctAnswer: String(card.birthDay),
      };
    case 'birthMonth':
      return {
        questionText: `In welchem Monat hat ${card.name} Geburtstag?`,
        correctAnswer: formatMonth(card.birthMonth),
      };
    case 'allergies':
      if (allergies.length === 0) {
        return {
          questionText: `Wie viele Allergien hat ${card.name}?`,
          correctAnswer: '0',
        };
      }
      if (Math.random() < 0.5) {
        return {
          questionText: `Wogegen ist ${card.name} allergisch?`,
          correctAnswer: randomPick(allergies),
        };
      }
      return {
        questionText: `Wie viele Allergien hat ${card.name}?`,
        correctAnswer: String(allergies.length),
      };
    case 'name':
      return {
        questionText: `Welche Blutgruppe hat ${card.name}?`,
        correctAnswer: card.bloodType,
      };
    default:
      return {
        questionText: `Welche Blutgruppe hat ${card.name}?`,
        correctAnswer: card.bloodType,
      };
  }
}

function buildReverseQuestion(card, field, cards, allergies) {
  switch (field) {
    case 'bloodType':
      return {
        questionText: `Wer hat die Blutgruppe ${card.bloodType}?`,
        correctAnswer: card.name,
      };
    case 'idNumber':
      return {
        questionText: `Wer hat die Ausweisnummer ${card.idNumber}?`,
        correctAnswer: card.name,
      };
    case 'country':
      return {
        questionText: `Wessen Ausweis wurde in ${card.country} ausgestellt?`,
        correctAnswer: card.name,
      };
    case 'birthMonth':
      return {
        questionText: `Wer hat im ${formatMonth(card.birthMonth)} Geburtstag?`,
        correctAnswer: card.name,
      };
    case 'birthDay':
      return {
        questionText: `Wer hat am ${card.birthDay}. eines Monats Geburtstag?`,
        correctAnswer: card.name,
      };
    case 'allergies':
      if (allergies.length > 0) {
        const allergy = randomPick(allergies);
        return {
          questionText: `Wer ist gegen ${allergy} allergisch?`,
          correctAnswer: card.name,
        };
      }
      return buildForwardQuestion(card, field, allergies);
    case 'name':
      return buildForwardQuestion(card, 'bloodType', allergies);
    default:
      return buildForwardQuestion(card, field, allergies);
  }
}

function generateDistractors(correctAnswer, field, cards, count, targetCard) {
  const distractors = new Set();

  switch (field) {
    case 'bloodType': {
      const others = BLOOD_TYPES.filter((b) => b !== correctAnswer);
      others.forEach((o) => distractors.add(o));
      break;
    }
    case 'medication': {
      distractors.add(correctAnswer === 'Ja' ? 'Nein' : 'Ja');
      // For medication we only have 2 real options, pad with related terms
      distractors.add('Unbekannt');
      distractors.add('Gelegentlich');
      break;
    }
    case 'name': {
      cards.forEach((c) => {
        if (c.name !== correctAnswer) distractors.add(c.name);
      });
      break;
    }
    case 'birthDay': {
      cards.forEach((c) => {
        if (String(c.birthDay) !== correctAnswer) distractors.add(String(c.birthDay));
      });
      while (distractors.size < count + 2) {
        distractors.add(String(randomInt(1, 31)));
      }
      distractors.delete(correctAnswer);
      break;
    }
    case 'birthMonth': {
      cards.forEach((c) => {
        const m = formatMonth(c.birthMonth);
        if (m !== correctAnswer) distractors.add(m);
      });
      while (distractors.size < count + 2) {
        distractors.add(MONTHS[randomInt(0, 11)]);
      }
      distractors.delete(correctAnswer);
      break;
    }
    case 'idNumber': {
      cards.forEach((c) => {
        if (c.idNumber !== correctAnswer) distractors.add(c.idNumber);
      });
      while (distractors.size < count + 2) {
        distractors.add(String(randomInt(0, 99999)).padStart(5, '0'));
      }
      distractors.delete(correctAnswer);
      break;
    }
    case 'country': {
      cards.forEach((c) => {
        if (c.country !== correctAnswer) distractors.add(c.country);
      });
      while (distractors.size < count + 2) {
        distractors.add(randomPick(COUNTRIES));
      }
      distractors.delete(correctAnswer);
      break;
    }
    case 'allergies': {
      // correctAnswer could be an allergy name or a number (count)
      const isCount = /^\d+$/.test(correctAnswer);
      if (isCount) {
        ['0', '1', '2', '3'].forEach((n) => {
          if (n !== correctAnswer) distractors.add(n);
        });
      } else {
        // Add allergies from other cards and from the pool
        cards.forEach((c) => {
          JSON.parse(c.allergies).forEach((a) => {
            if (a !== correctAnswer) distractors.add(a);
          });
        });
        ALLERGIES.forEach((a) => {
          if (a !== correctAnswer) distractors.add(a);
        });
      }
      break;
    }
  }

  const arr = [...distractors].filter((d) => d !== correctAnswer);
  return shuffleArray(arr).slice(0, count);
}

function generateOptions(correctAnswer, field, cards, targetCard) {
  // ~15-18% chance the correct answer is hidden, making "None" correct
  const hideCorrect = Math.random() < 0.17;

  if (hideCorrect) {
    const distractors = generateDistractors(correctAnswer, field, cards, 4, targetCard);
    return {
      options: [...distractors.slice(0, 4), NONE_ANSWER],
      correctIndex: 4,
    };
  }

  const distractors = generateDistractors(correctAnswer, field, cards, 3, targetCard);
  const options = [...distractors.slice(0, 3), correctAnswer];
  shuffleArray(options);
  const correctIndex = options.indexOf(correctAnswer);
  options.push(NONE_ANSWER);

  return { options, correctIndex };
}

export function generateQuestions(sessionId, cards) {
  const plan = buildQuestionPlan(cards);
  const questions = [];
  const usedCombinations = new Set();

  let position = 1;
  for (const { card, field, reverse } of plan) {
    const comboKey = `${card.id}-${field}-${reverse}`;
    if (usedCombinations.has(comboKey)) continue;
    usedCombinations.add(comboKey);

    const allergies = JSON.parse(card.allergies);
    const { questionText, correctAnswer } = buildQuestionText(card, field, reverse, cards);
    const { options, correctIndex } = generateOptions(correctAnswer, field, cards, card);

    questions.push({
      sessionId,
      position: position++,
      questionText,
      fieldTested: field,
      targetCardId: card.id,
      options: JSON.stringify(options),
      correctIndex,
    });

    if (position > 25) break;
  }

  return questions;
}
