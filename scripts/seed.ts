/**
 * Emulator Seed Script
 *
 * Populates the Firebase Auth and Firestore emulators with consistent test data.
 *
 * Prerequisites:
 *  - Firebase emulators must be running (`npm run emulator:start` or `firebase emulators:start`)
 *
 * Usage:
 *  npm run emulator:seed
 */

import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Point the Admin SDK at the local emulators
process.env['FIRESTORE_EMULATOR_HOST'] = 'localhost:8080';
process.env['FIREBASE_AUTH_EMULATOR_HOST'] = 'localhost:9099';

initializeApp({ projectId: 'nice-putt-dude' });

const auth = getAuth();
const db = getFirestore();

// ---------------------------------------------------------------------------
// Test Users
// ---------------------------------------------------------------------------

const TEST_USERS = [
  {
    uid: 'user-alice-001',
    email: 'alice@test.com',
    password: 'password123',
    displayName: 'Alice Thompson',
  },
  {
    uid: 'user-bob-002',
    email: 'bob@test.com',
    password: 'password123',
    displayName: 'Bob Miller',
  },
  {
    uid: 'user-carol-003',
    email: 'carol@test.com',
    password: 'password123',
    displayName: 'Carol Davis',
  },
];

// ---------------------------------------------------------------------------
// Golf Courses
// ---------------------------------------------------------------------------

function allPar3Holes() {
  return Object.fromEntries(
    Array.from({ length: 18 }, (_, i) => [`hole${i + 1}`, { par: 3 }]),
  );
}

function mixedParHoles() {
  const pars = [4, 5, 3, 4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 3, 4, 5, 4, 4];
  return Object.fromEntries(
    pars.map((par, i) => [`hole${i + 1}`, { par }]),
  );
}

const GOLF_COURSES = [
  {
    id: 'course-pebble-001',
    name: 'Pebble Beach Golf Links',
    holes: mixedParHoles(),
  },
  {
    id: 'course-par3-002',
    name: 'Sunset Par 3 Course',
    holes: allPar3Holes(),
  },
];

// ---------------------------------------------------------------------------
// Matches
// ---------------------------------------------------------------------------

const MATCHES = [
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

// ---------------------------------------------------------------------------
// Friendships
// ---------------------------------------------------------------------------

const FRIENDSHIPS = [
  { id: 'friendship-001', user1Id: 'user-alice-001', user2Id: 'user-bob-002' },
  { id: 'friendship-002', user1Id: 'user-bob-002', user2Id: 'user-carol-003' },
];

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

async function seedAuthUsers() {
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

async function seedPublicUsers() {
  console.log('Seeding publicUsers collection...');
  const batch = db.batch();
  for (const user of TEST_USERS) {
    const ref = db.collection('publicUsers').doc(user.uid);
    batch.set(ref, { userId: user.uid, displayName: user.displayName });
  }
  await batch.commit();
  console.log(`  Written ${TEST_USERS.length} public users.`);
}

async function seedGolfCourses() {
  console.log('Seeding golfCourses collection...');
  const batch = db.batch();
  for (const course of GOLF_COURSES) {
    const { id, ...data } = course;
    batch.set(db.collection('golfCourses').doc(id), data);
  }
  await batch.commit();
  console.log(`  Written ${GOLF_COURSES.length} golf courses.`);
}

async function seedMatches() {
  console.log('Seeding matches collection...');
  const batch = db.batch();
  for (const match of MATCHES) {
    const { id, ...data } = match;
    batch.set(db.collection('matches').doc(id), data);
  }
  await batch.commit();
  console.log(`  Written ${MATCHES.length} matches.`);
}

async function seedFriendships() {
  console.log('Seeding friendships collection...');
  const batch = db.batch();
  for (const friendship of FRIENDSHIPS) {
    const { id, ...data } = friendship;
    batch.set(db.collection('friendships').doc(id), data);
  }
  await batch.commit();
  console.log(`  Written ${FRIENDSHIPS.length} friendships.`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Starting emulator seed...\n');

  await seedAuthUsers();
  await seedPublicUsers();
  await seedGolfCourses();
  await seedMatches();
  await seedFriendships();

  console.log('\nSeed complete!');
  console.log('\nTest credentials:');
  TEST_USERS.forEach(u => console.log(`  ${u.email} / ${u.password}`));
}

main().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
