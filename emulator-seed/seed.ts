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
 *
 * Data files:
 *  scripts/seed/users.ts       — Auth users & publicUsers
 *  scripts/seed/courses.ts     — Golf courses
 *  scripts/seed/matches.ts     — Matches
 *  scripts/seed/friendships.ts — Friendships
 *  scripts/seed/scorecards.ts  — Scorecards
 *  scripts/seed/scoreboards.ts — Scoreboard computation & write
 */

import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

import { TEST_USERS, seedAuthUsers, seedPublicUsers } from './seed/users';
import { seedGolfCourses } from './seed/courses';
import { seedMatches } from './seed/matches';
import { seedFriendships } from './seed/friendships';
import { seedScorecards } from './seed/scorecards';
import { seedScoreboards } from './seed/scoreboards';

// Point the Admin SDK at the local emulators
process.env['FIRESTORE_EMULATOR_HOST'] = 'localhost:8080';
process.env['FIREBASE_AUTH_EMULATOR_HOST'] = 'localhost:9099';

initializeApp({ projectId: 'nice-putt-dude' });

const auth = getAuth();
const db = getFirestore();

async function main() {
  console.log('Starting emulator seed...\n');

  await seedAuthUsers(auth);
  await seedPublicUsers(db);
  await seedGolfCourses(db);
  await seedMatches(db);
  await seedFriendships(db);
  await seedScorecards(db);
  await seedScoreboards(db);

  console.log('\nSeed complete!');
  console.log('\nTest credentials:');
  TEST_USERS.forEach(u => console.log(`  ${u.email} / ${u.password}`));
}

main().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
