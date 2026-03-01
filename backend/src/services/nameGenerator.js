import { FIRST_SYLLABLES, SECOND_SYLLABLES } from '../data/nameSyllables.js';
import { randomPick } from '../utils/random.js';

export function generateName(existingNames) {
  let name;
  let attempts = 0;
  do {
    const first = randomPick(FIRST_SYLLABLES);
    const second = randomPick(SECOND_SYLLABLES);
    name = first + second;
    attempts++;
    if (attempts > 200) throw new Error('Could not generate unique name');
  } while (existingNames.has(name));
  existingNames.add(name);
  return name;
}
