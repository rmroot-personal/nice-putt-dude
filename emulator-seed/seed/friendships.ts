import { Firestore } from 'firebase-admin/firestore';

export const FRIENDSHIPS = [
  { id: 'friendship-001', user1Id: 'user-alice-001', user2Id: 'user-bob-002' },
  { id: 'friendship-002', user1Id: 'user-bob-002', user2Id: 'user-carol-003' },
];

export async function seedFriendships(db: Firestore) {
  console.log('Seeding friendships collection...');
  const batch = db.batch();
  for (const friendship of FRIENDSHIPS) {
    const { id, ...data } = friendship;
    batch.set(db.collection('friendships').doc(id), data);
  }
  await batch.commit();
  console.log(`  Written ${FRIENDSHIPS.length} friendships.`);
}
