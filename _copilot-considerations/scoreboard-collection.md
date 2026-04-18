Q:From a scalability and data perspective. What are the considerations to think about when having scoreboards as a collection in the database and not something that is a calculated result?

A:
Good architectural question. Here are the key considerations:

---

### Advantages of the pre-computed approach (what you have)

- **Read performance** — clients read one document instead of fetching and aggregating N scorecards on every load.
- **Real-time simplicity** — `docData()` on a single document is far cheaper than a collection query + client-side aggregation.
- **Offline support** — Firestore caches the document, so scoreboards work offline.

---

### Trade-offs and risks to consider

**Data consistency**
- The scoreboard is eventually consistent — there's a brief window between a scorecard write and the trigger completing where the scoreboard is stale.
- If the trigger fails (crash, timeout), the scoreboard silently diverges from reality. You need Cloud Functions retry policies and alerting.

**Firestore write costs**
- Every scorecard save triggers a scoreboard write, even if only one hole changed. At scale (many concurrent matches) this multiplies your write cost.
- Consider debouncing — only recompute the scoreboard if no write has happened in the last N seconds.

**Fan-out problem**
- If a match has many players, one scorecard write causes the trigger to read all other scorecards + Auth + publicUsers + write the scoreboard. That's O(players) reads per scorecard save.
- Firestore's `getUsers()` has a limit of 100 UIDs per call — you'd need batching beyond that.

**Stale data on delete**
- If a player's `publicUser` or Auth record is deleted but their scorecard remains, you'll get fallback display names (`userId` as name). Plan for this.

**Schema migration**
- If you change how score is calculated (e.g. add handicap), every existing `scoreboards` document is stale. You'd need a backfill migration script.

**Storage cost vs. compute cost**
- You're trading storage (one scoreboard doc per match, forever) for compute. For a golf app this is negligible, but worth knowing.

---

### What to watch for as you scale

| Concern | Mitigation |
|---|---|
| Trigger failures | Enable retry in function config, add dead-letter monitoring |
| High write volume | Debounce or use a write-ahead queue |
| Stale scoreboard after failed trigger | Add a `lastScorecardUpdatedAt` field to detect drift |
| Schema changes | Keep a `version` field on the scoreboard document |

---

For a golf app, this approach is the right call — matches are small (2–4 players), short-lived, and read far more than written. The trade-offs only become real problems at much larger scale.