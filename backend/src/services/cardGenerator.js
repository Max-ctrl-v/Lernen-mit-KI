import { ALLERGIES } from '../data/allergies.js';
import { COUNTRIES } from '../data/countries.js';
import { CARD_COUNT, BLOOD_TYPES } from '../config/constants.js';
import { randomInt, weightedPick, pickUnique, daysInMonth } from '../utils/random.js';
import { generateName } from './nameGenerator.js';
import { fetchPhotos } from './photoService.js';

export async function generateCards(sessionId) {
  const photos = await fetchPhotos(CARD_COUNT);
  const usedNames = new Set();
  const usedCountries = new Set();

  const cards = [];
  for (let i = 0; i < CARD_COUNT; i++) {
    const name = generateName(usedNames);

    let country;
    do {
      country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
    } while (usedCountries.has(country));
    usedCountries.add(country);

    const birthMonth = randomInt(1, 12);
    const maxDay = daysInMonth(birthMonth);
    const birthDay = randomInt(1, maxDay);

    const bloodType = weightedPick(BLOOD_TYPES, [0.35, 0.15, 0.05, 0.45]);
    const medication = Math.random() > 0.5;

    const allergyCount = weightedPick([0, 1, 2, 3], [0.1, 0.3, 0.4, 0.2]);
    const allergies = pickUnique(ALLERGIES, allergyCount);

    const idNumber = String(randomInt(0, 99999)).padStart(5, '0');

    cards.push({
      sessionId,
      position: i + 1,
      photoUrl: photos[i],
      name,
      birthDay,
      birthMonth,
      medication,
      bloodType,
      allergies: JSON.stringify(allergies),
      idNumber,
      country,
    });
  }

  return cards;
}
