# Firestore Data Query Details

This document explains how the Angular application reads from and writes to Cloud Firestore, using the `@angular/fire` SDK. It covers the two primary query patterns — one-time reads and real-time subscriptions — and goes into depth on the scoreboard collection, which is the most interesting data-access pattern in the app.

---

## Query Patterns

The services use two distinct patterns depending on whether the UI needs live updates.

### One-time reads (`async/await`)

For data that only needs to be fetched once (e.g., loading a form, looking up a single record), the services use the promise-based Firestore functions: `getDoc` and `getDocs`.

```typescript
// Fetch a single document by ID
const snap = await getDoc(doc(this.firestore, 'matches', matchId));
if (!snap.exists()) return null;
return { ...snap.data() as IMatch, id: snap.id };

// Fetch a filtered collection (one-time)
const q = query(collection(this.firestore, 'scorecards'), where('matchId', '==', matchId));
const snap = await getDocs(q);
return snap.docs.map(d => ({ ...d.data() as IScorecard, id: d.id }));
```

### Real-time subscriptions (`Observable`)

For data that should update the UI automatically (e.g., the live scoreboard, your list of matches), the services return RxJS `Observable`s backed by Firestore's real-time listeners.

Two approaches are used:

**`docData` / `collectionData`** — helper wrappers from `@angular/fire` that return an `Observable` and handle cleanup automatically.

```typescript
// Real-time single document
return docData(doc(this.firestore, 'matches', matchId), { idField: 'id' }) as Observable<IMatch>;

// Real-time filtered collection
const q = query(collection(this.firestore, 'scorecards'), where('matchId', '==', matchId));
return collectionData(q, { idField: 'id' }) as Observable<IScorecard[]>;
```

**Manual `onSnapshot`** — used when more control is needed (e.g., compound `or()` queries that `collectionData` doesn't support cleanly).

```typescript
return new Observable<IMatch[]>(subscriber => {
  const unsubscribe = onSnapshot(q, snapshot => {
    subscriber.next(snapshot.docs.map(d => ({ ...d.data() as IMatch, id: d.id })));
  }, error => subscriber.error(error));
  return () => unsubscribe(); // called when subscriber unsubscribes
});
```

The teardown function returned from the `Observable` constructor calls `unsubscribe()`, so the Firestore listener is automatically released when the Angular component is destroyed (provided the component uses `async` pipe or manually unsubscribes).

---

## Services and their Query Strategies

### `GolfCoursesFirestoreService` — `golfCourses` collection

| Method | Pattern | Query |
|---|---|---|
| `getGolfCourseById(id)` | One-time `getDoc` | Single document by ID |
| `getAllGolfCourses()` | One-time `getDocs` | Full collection scan |
| `addGolfCourse(course)` | `addDoc` (write) | — |

Golf courses are relatively static and small in number, so one-time reads are sufficient.

### `MatchesFirestoreService` — `matches` collection

| Method | Pattern | Query |
|---|---|---|
| `getMatchById(id)` | One-time `getDoc` | Single document by ID |
| `getMatchesForCurrentUser()` | One-time `getDocs` | `where('createdByUserId', '==', uid)` |
| `match$(id)` | `docData` Observable | Single document by ID |
| `userMatches$()` | `onSnapshot` Observable | `or(where('createdByUserId', '==', uid), where('players', 'array-contains', uid))` |
| `addMatch(...)` | `addDoc` (write) | — |
| `deleteMatch(id)` | `deleteDoc` (write) | — |

`userMatches$()` uses a compound `or()` filter so that a user sees matches they created **and** matches they are a player in. This is a disjunction query, which Firestore only supports through the `or()` helper (Firebase SDK v9.8+).

### `ScorecardFirestoreService` — `scorecards` collection

| Method | Pattern | Query |
|---|---|---|
| `getScorecardById(id)` | One-time `getDoc` | Single document by ID |
| `getScorecardsForMatch(matchId)` | One-time `getDocs` | `where('matchId', '==', matchId)` |
| `scorecardsForMatch$(matchId)` | `collectionData` Observable | `where('matchId', '==', matchId)` |
| `updateHoleStrokes(id, holes)` | `updateDoc` (write) | — |

Writing to a scorecard (via `updateHoleStrokes`) triggers the `updateScoreboard` Cloud Function automatically.

### `PublicUsersFirestoreService` — `publicUsers` collection

| Method | Pattern | Query |
|---|---|---|
| `getPublicUserByUserId(userId)` | One-time `getDocs` | `where('userId', '==', userId)` |
| `getAllPublicUsers()` | One-time `getDocs` | Full collection scan |
| `publicUsers$()` | `collectionData` Observable | Full collection (real-time) |

Note: `getPublicUserByUserId` uses a `where` filter rather than fetching by document ID, because the document ID in `publicUsers` is not necessarily the same as `userId`.

### `FriendshipsFirestoreService` — `friendships` collection

| Method | Pattern | Query |
|---|---|---|
| `getFriendshipsForCurrentUser()` | One-time `getDocs` | `or(where('user1Id', '==', uid), where('user2Id', '==', uid))` |
| `userFriendships$()` | `onSnapshot` Observable | Same `or()` query, real-time |
| `addFriend(friendId)` | `addDoc` (write) | — |

Friendships are stored with both user IDs in the same document (`user1Id`, `user2Id`). Because either field can be the current user, the query needs `or()` to match both directions.

### `FriendRequestsFirestoreService` — `friendRequests` collection

| Method | Pattern | Query |
|---|---|---|
| `getFriendRequestsForCurrentUser()` | One-time `getDocs` | `where('toUserId', '==', uid)` |
| `getFriendRequestById(id)` | One-time `getDoc` | Single document by ID |
| `sendFriendRequest(toUserId)` | `addDoc` (write) | — |

---

## The Scoreboard Pattern

The scoreboard is the most interesting data design in the application. It demonstrates a core Firestore strategy: **denormalization to avoid client-side fan-out reads**.

### The problem it solves

To show a leaderboard for a match, the naive approach would be:
1. Fetch all scorecards for the match.
2. For each scorecard, fetch the player's display name and photo.
3. Compute totals and sort client-side.

This means N+1 reads per page load and complex client logic. It also doesn't update in real time without re-running all those reads.

### The solution: a pre-computed document

Instead, the `scoreboards` collection holds one document per match, keyed by `matchId`. This document is kept up to date by the `updateScoreboard` Cloud Function, which fires every time any scorecard document in the match is written.

#### Collection: `scoreboards`

Document ID: `{matchId}`

```jsonc
// scoreboards/{matchId}
{
  "matchId": "abc123",
  "updatedAt": "<server timestamp>",
  "entries": [
    {
      "place": 1,
      "userId": "uid_alice",
      "userDisplayName": "Alice",
      "userThumbnail": "https://...",
      "scorecardId": "sc_001",
      "score": "-3"
    },
    {
      "place": 2,
      "userId": "uid_bob",
      "userDisplayName": "Bob",
      "userThumbnail": "https://...",
      "scorecardId": "sc_002",
      "score": "+1"
    }
  ]
}
```

The `score` string is formatted relative to par: `"E"` for even, `"-3"` for three under, `"+1"` for one over.

#### Reading the scoreboard in the client

`ScoreboardsFirestoreService.getScoreboard$()` subscribes to this single document:

```typescript
getScoreboard$(matchId: string): Observable<IScoreboard | null> {
  return docData(doc(this.firestore, 'scoreboards', matchId)).pipe(
    map((data) => (data as IScoreboard | undefined) ?? null),
  );
}
```

A component subscribes to it with the `async` pipe:

```typescript
// In the component
scoreboard$ = this.scoreboardsService.getScoreboard$(this.matchId);
```

```html
<!-- In the template -->
@if (scoreboard$ | async; as scoreboard) {
  @for (entry of scoreboard.entries; track entry.userId) {
    <div>{{ entry.place }}. {{ entry.userDisplayName }} — {{ entry.score }}</div>
  }
}
```

This is a **single document read** that streams all updates in real time. The Cloud Function handles aggregation, display name lookups, and sorting so the client does none of that work.

### Write flow end-to-end

```
User updates strokes
  → ScorecardFirestoreService.updateHoleStrokes()
    → Firestore: scorecards/{scorecardId} updated
      → updateScoreboard Cloud Function triggered
        → Reads all scorecards for matchId
        → Reads publicUsers + Firebase Auth for display names/photos
        → Computes scores, sorts, assigns places
        → Writes scoreboards/{matchId}
          → ScoreboardsFirestoreService Observable emits new value
            → UI updates automatically
```

---

## Firestore Collections Summary

| Collection | Doc ID | Key fields |
|---|---|---|
| `golfCourses` | auto-id | `name`, `holes.hole1–18.par` |
| `matches` | auto-id | `name`, `createdByUserId`, `players[]`, `golfCourseId` |
| `scorecards` | auto-id | `matchId`, `userId`, `holes.hole1–18.{par, strokes}` |
| `scoreboards` | `{matchId}` | `entries[]`, `updatedAt` |
| `publicUsers` | auto-id | `userId`, `displayName` |
| `friendships` | auto-id | `user1Id`, `user2Id` |
| `friendRequests` | auto-id | `fromUserId`, `toUserId` |
