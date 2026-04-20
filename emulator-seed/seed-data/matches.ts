import { Firestore } from 'firebase-admin/firestore';

export const MATCHES = [
  {
    id: 'match-001',
    name: 'Friday Round',
    createdByUserId: 'user-alice-001',
    createdAt: new Date('2026-04-10T10:00:00Z').toISOString(),
    players: ['user-alice-001', 'user-bob-002'],
    golfCourseId: 'course-pebble-001',
  },
  {
    id: 'match-002',
    name: 'Weekend Par 3 Challenge',
    createdByUserId: 'user-bob-002',
    createdAt: new Date('2026-04-12T14:00:00Z').toISOString(),
    players: ['user-bob-002', 'user-carol-003'],
    golfCourseId: 'course-par3-002',
  },
];

export async function seedMatches(db: Firestore) {
  console.log('Seeding matches collection...');
  const batch = db.batch();
  for (const match of MATCHES) {
    const { id, ...data } = match;
    batch.set(db.collection('matches').doc(id), data);
  }
  await batch.commit();
  console.log(`  Written ${MATCHES.length} matches.`);
}
