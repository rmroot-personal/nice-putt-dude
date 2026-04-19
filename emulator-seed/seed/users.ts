import { Auth } from 'firebase-admin/auth';
import { Firestore } from 'firebase-admin/firestore';

export const TEST_USERS = [
  {
    uid: 'user-alice-001',
    email: 'alice@test.com',
    password: 'password123',
    displayName: 'Alice Thompson',
    photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=user-alice-001`,
  },
  {
    uid: 'user-bob-002',
    email: 'bob@test.com',
    password: 'password123',
    displayName: 'Bob Miller',
    photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=user-bob-002`,
  },
  {
    uid: 'user-carol-003',
    email: 'carol@test.com',
    password: 'password123',
    displayName: 'Carol Davis',
    photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=user-carol-003`,
  },
];

export async function seedAuthUsers(auth: Auth) {
  console.log('Seeding Auth users...');
  for (const user of TEST_USERS) {
    try {
      await auth.createUser({
        uid: user.uid,
        email: user.email,
        password: user.password,
        displayName: user.displayName,
        emailVerified: true,
      });
      console.log(`  Created user: ${user.email}`);
    } catch (err: unknown) {
      if ((err as { code?: string }).code === 'auth/uid-already-exists') {
        console.log(`  Skipped (already exists): ${user.email}`);
      } else {
        throw err;
      }
    }
  }
}

export async function seedPublicUsers(db: Firestore) {
  console.log('Seeding publicUsers collection...');
  const batch = db.batch();
  for (const user of TEST_USERS) {
    const ref = db.collection('publicUsers').doc(user.uid);
    batch.set(ref, { userId: user.uid, displayName: user.displayName });
  }
  await batch.commit();
  console.log(`  Written ${TEST_USERS.length} public users.`);
}
