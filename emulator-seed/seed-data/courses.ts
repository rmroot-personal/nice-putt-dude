import { Firestore } from 'firebase-admin/firestore';

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

export const GOLF_COURSES = [
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

export async function seedGolfCourses(db: Firestore) {
  console.log('Seeding golfCourses collection...');
  const batch = db.batch();
  for (const course of GOLF_COURSES) {
    const { id, ...data } = course;
    batch.set(db.collection('golfCourses').doc(id), data);
  }
  await batch.commit();
  console.log(`  Written ${GOLF_COURSES.length} golf courses.`);
}
