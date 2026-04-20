import { Firestore } from 'firebase-admin/firestore';
import { TEST_USERS } from './users';
import { SCORECARDS } from './scorecards';

export async function seedScoreboards(db: Firestore) {
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
