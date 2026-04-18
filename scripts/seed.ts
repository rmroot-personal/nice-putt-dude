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
    photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=user-alice-001`
  },
  {
    uid: 'user-bob-002',
    email: 'bob@test.com',
    password: 'password123',
    displayName: 'Bob Miller',
    photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=user-bob-002`
  },
  {
    uid: 'user-carol-003',
    email: 'carol@test.com',
    password: 'password123',
    displayName: 'Carol Davis',
    photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=user-carol-003`
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
// Scorecards
// ---------------------------------------------------------------------------

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
const SCORECARDS = [
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

async function seedScorecards() {
  console.log('Seeding scorecards collection...');
  const batch = db.batch();
  for (const scorecard of SCORECARDS) {
    const { id, ...data } = scorecard;
    batch.set(db.collection('scorecards').doc(id), data);
  }
  await batch.commit();
  console.log(`  Written ${SCORECARDS.length} scorecards.`);
}

async function seedScoreboards() {
  console.log('Seeding scoreboards collection...');

  const userMap = new Map(TEST_USERS.map(u => [u.uid, u]));

  // Group scorecards by matchId
  const byMatch = new Map<string, typeof SCORECARDS>();
  for (const sc of SCORECARDS) {
    if (!byMatch.has(sc.matchId)) byMatch.set(sc.matchId, []);
    byMatch.get(sc.matchId)!.push(sc);
  }

  const batch = db.batch();
  for (const [matchId, scorecards] of byMatch) {
    const computed = scorecards.map(sc => {
      let totalStrokes = 0;
      let totalPar = 0;
      for (let i = 1; i <= 18; i++) {
        const hole = sc.holes[`hole${i}`];
        if (hole) {
          totalStrokes += hole.strokes;
          totalPar += hole.par;
        }
      }
      const diff = totalStrokes - totalPar;
      const score = diff === 0 ? 'E' : diff > 0 ? `+${diff}` : `${diff}`;
      const user = userMap.get(sc.userId);
      return {
        scorecardId: sc.id,
        userId: sc.userId,
        userDisplayName: user?.displayName ?? sc.userId,
        userThumbnail: user?.photoURL ?? '',
        scoreDiff: diff,
        score,
      };
    });

    computed.sort((a, b) => a.scoreDiff - b.scoreDiff);

    let currentPlace = 1;
    const entries = computed.map((player, index) => {
      if (index > 0 && player.scoreDiff !== computed[index - 1].scoreDiff) {
        currentPlace = index + 1;
      }
      return {
        userDisplayName: player.userDisplayName,
        userId: player.userId,
        score: player.score,
        place: currentPlace,
        userThumbnail: player.userThumbnail,
        scorecardId: player.scorecardId,
      };
    });

    batch.set(db.collection('scoreboards').doc(matchId), {
      matchId,
      entries,
      updatedAt: new Date(),
    });
  }

  await batch.commit();
  console.log(`  Written ${byMatch.size} scoreboards.`);
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
  await seedScorecards();
  await seedScoreboards();

  console.log('\nSeed complete!');
  console.log('\nTest credentials:');
  TEST_USERS.forEach(u => console.log(`  ${u.email} / ${u.password}`));
}

main().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
