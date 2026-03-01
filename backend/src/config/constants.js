export const CARD_COUNT = 8;
export const QUESTION_COUNT = 25;

export const TIMERS = {
  MEMORIZE: 480,      // 8 minutes
  DISTRACTION: 2400,  // 40 minutes
  RECALL: 900,        // 15 minutes
};

export const PHASES = {
  MEMORIZE: 'MEMORIZE',
  DISTRACTION: 'DISTRACTION',
  RECALL: 'RECALL',
  COMPLETED: 'COMPLETED',
};

export const MODES = {
  PRACTICE: 'PRACTICE',
  EXAM: 'EXAM',
};

export const PHASE_ORDER = [
  PHASES.MEMORIZE,
  PHASES.DISTRACTION,
  PHASES.RECALL,
  PHASES.COMPLETED,
];

export const BLOOD_TYPES = ['A', 'B', 'AB', '0'];

export const FIELD_DISTRIBUTION = {
  name: 3,
  bloodType: 3,
  allergies: 4,
  idNumber: 3,
  birthDay: 3,
  birthMonth: 3,
  medication: 3,
  country: 3,
};
