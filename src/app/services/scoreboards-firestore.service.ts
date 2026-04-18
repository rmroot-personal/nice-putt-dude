import { Injectable, inject } from '@angular/core';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { IScoreboard, IScoreboardEntry } from '../models/scoreboard.model';

@Injectable({ providedIn: 'root' })
export class ScoreboardsFirestoreService {
  private readonly firestore = inject(Firestore);

  /**
   * Returns a real-time Observable of scoreboard entries for a given match.
   * The scoreboard document is written by the `updateScoreboard` Cloud Function
   * trigger whenever any scorecard in the match is created or updated.
   */
  getScoreboard$(matchId: string): Observable<IScoreboard | null> {
    return docData(doc(this.firestore, 'scoreboards', matchId)).pipe(
      map((data) => (data as IScoreboard | undefined) ?? null),
    );
  }
}