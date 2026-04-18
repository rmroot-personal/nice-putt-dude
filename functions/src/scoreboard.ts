import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

interface ScorecardHole {
  par: number;
  strokes: number;
}

interface ScorecardData {
  matchId: string;
  userId: string;
  holes: Record<string, ScorecardHole>;
}

interface ScoreboardEntry {
  userDisplayName: string;
  userId: string;
  score: string;
  place: number;
  userThumbnail: string;
  scorecardId: string;
}

function computeScoreString(totalStrokes: number, totalPar: number): string {
  const diff = totalStrokes - totalPar;
  if (diff === 0) return "E";
  return diff > 0 ? `+${diff}` : `${diff}`;
}

/**
 * Fires whenever a scorecard document is created, updated, or deleted.
 * Recomputes the full scoreboard for the affected match and writes the
 * result to `scoreboards/{matchId}` so clients can subscribe in real time.
 */
export const updateScoreboard = onDocumentWritten(
  "scorecards/{scorecardId}",
  async (event) => {
    const after = event.data?.after;
    const before = event.data?.before;

    // Resolve the affected document (use after on write, before on delete)
    const affected = after?.exists ? after.data() : before?.data();
    const matchId = (affected as ScorecardData | undefined)?.matchId;

    if (!matchId) {
      logger.warn("updateScoreboard: could not determine matchId", { event });
      return;
    }

    const db = admin.firestore();

    // Fetch all scorecards for this match
    const scorecardsSnap = await db
      .collection("scorecards")
      .where("matchId", "==", matchId)
      .get();

    if (scorecardsSnap.empty) {
      // All scorecards deleted — clear the scoreboard
      await db
        .collection("scoreboards")
        .doc(matchId)
        .set({ matchId, entries: [], updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      return;
    }

    // Gather unique userIds to look up display names & thumbnails
    const userIds = [
      ...new Set(scorecardsSnap.docs.map((d) => (d.data() as ScorecardData).userId)),
    ];

    const [publicUsersSnap, authUsers] = await Promise.all([
      db
        .collection("publicUsers")
        .where("userId", "in", userIds)
        .get(),
      admin.auth().getUsers(userIds.map((uid) => ({ uid }))),
    ]);

    const displayNameMap = new Map<string, string>(
      publicUsersSnap.docs.map((d) => {
        const data = d.data() as { userId: string; displayName: string };
        return [data.userId, data.displayName];
      }),
    );

    const thumbnailMap = new Map<string, string>(
      authUsers.users.map((u) => [u.uid, u.photoURL ?? ""]),
    );

    // Compute per-player totals
    const computed = scorecardsSnap.docs.map((doc) => {
      const sc = doc.data() as ScorecardData;
      let totalStrokes = 0;
      let totalPar = 0;

      for (let i = 1; i <= 18; i++) {
        const hole = sc.holes[`hole${i}`];
        if (hole) {
          totalStrokes += hole.strokes;
          totalPar += hole.par;
        }
      }

      return {
        scorecardId: doc.id,
        userId: sc.userId,
        userDisplayName: displayNameMap.get(sc.userId) ?? sc.userId,
        userThumbnail: thumbnailMap.get(sc.userId) ?? "",
        scoreDiff: totalStrokes - totalPar,
        score: computeScoreString(totalStrokes, totalPar),
      };
    });

    // Sort ascending (lower score = better)
    computed.sort((a, b) => a.scoreDiff - b.scoreDiff);

    // Assign places, sharing place on ties
    let currentPlace = 1;
    const entries: ScoreboardEntry[] = computed.map((player, index) => {
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

    await db
      .collection("scoreboards")
      .doc(matchId)
      .set({ matchId, entries, updatedAt: admin.firestore.FieldValue.serverTimestamp() });

    logger.info(`Scoreboard updated for match ${matchId}`, { playerCount: entries.length });
  },
);
