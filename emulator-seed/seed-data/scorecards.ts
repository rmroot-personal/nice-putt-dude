import { Firestore } from 'firebase-admin/firestore';

/** Build 18 scorecard holes from a par layout, with slight random variance */
function buildHoles(pars: number[]): Record<string, { par: number; strokes: number }> {
  const offsets = [-1, 0, 0, 1, 2]; // weighted toward par
  return Object.fromEntries(
    pars.map((par, i) => {
      const strokes = Math.max(1, par + offsets[i % offsets.length]);
      return [`hole${i + 1}`, { par, strokes }];
    }),
  );
}

const MIXED_PARS = [4, 5, 3, 4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 3, 4, 5, 4, 4];
const PAR3_PARS = Array(18).fill(3);

// match-001: Alice & Bob on Pebble Beach (mixed pars)
// match-002: Bob & Carol on Sunset Par 3
export const SCORECARDS = [
  {
    id: 'scorecard-001',
    userId: 'user-alice-001',
    courseId: 'course-pebble-001',
    matchId: 'match-001',
    date: new Date('2026-04-10T10:00:00Z'),
    holes: buildHoles(MIXED_PARS),
  },
  {
    id: 'scorecard-002',
    userId: 'user-bob-002',
    courseId: 'course-pebble-001',
    matchId: 'match-001',
    date: new Date('2026-04-10T10:00:00Z'),
    holes: buildHoles([...MIXED_PARS].reverse()),
  },
  {
    id: 'scorecard-003',
    userId: 'user-bob-002',
    courseId: 'course-par3-002',
    matchId: 'match-002',
    date: new Date('2026-04-12T14:00:00Z'),
    holes: buildHoles(PAR3_PARS),
  },
  {
    id: 'scorecard-004',
    userId: 'user-carol-003',
    courseId: 'course-par3-002',
    matchId: 'match-002',
    date: new Date('2026-04-12T14:00:00Z'),
    holes: buildHoles(PAR3_PARS.map(p => p)), // same pars, different strokes via offset
  },
];

export async function seedScorecards(db: Firestore) {
  console.log('Seeding scorecards collection...');
  const batch = db.batch();
  for (const scorecard of SCORECARDS) {
    const { id, ...data } = scorecard;
    batch.set(db.collection('scorecards').doc(id), data);
  }
  await batch.commit();
  console.log(`  Written ${SCORECARDS.length} scorecards.`);
}
