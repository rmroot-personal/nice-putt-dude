

import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, map, Observable, of, switchMap, catchError } from 'rxjs';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatchesFirestoreService } from '../../services/matches-firestore.service';
import { ScoreboardsFirestoreService } from '../../services/scoreboards-firestore.service';
import { UserService } from '../../services/user.service';
import { IMatch } from '../../models/match.model';
import { IScoreboard, IScoreboardEntry } from '../../models/scoreboard.model';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatIcon } from '@angular/material/icon';
import { MatDivider } from '@angular/material/list';
import { MatError } from '@angular/material/form-field';
import { MatAnchor } from '@angular/material/button';

interface MatchItem {
  match: IMatch;
  scoreboard: IScoreboard | null;
  userEntry: IScoreboardEntry | null;
}

@Component({
  selector: 'app-my-matches',
  imports: [
    RouterLink,
    DatePipe,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatProgressSpinner,
    MatIcon,
    MatDivider,
    MatError,
    MatAnchor,
  ],
  templateUrl: './my-matches.html',
  styleUrl: './my-matches.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyMatches {
  private readonly matchesService = inject(MatchesFirestoreService);
  private readonly scoreboardsService = inject(ScoreboardsFirestoreService);
  private readonly userService = inject(UserService);

  private readonly currentUser = this.userService.user;

  private readonly data$: Observable<MatchItem[] | 'error'> =
    this.matchesService.userMatches$().pipe(
      switchMap(matches => {
        if (matches.length === 0) return of([] as MatchItem[]);
        return combineLatest(
          matches.map(match =>
            this.scoreboardsService.getScoreboard$(match.id).pipe(
              map(scoreboard => ({
                match,
                scoreboard,
                userEntry:
                  scoreboard?.entries?.find(
                    e => e.userId === this.currentUser()?.uid,
                  ) ?? null,
              } as MatchItem)),
            ),
          ),
        );
      }),
      catchError(() => of('error' as const)),
    );

  private readonly data = toSignal(this.data$);

  readonly loading = computed(() => this.data() === undefined);
  readonly hasError = computed(() => this.data() === 'error');
  readonly matchItems = computed(() => {
    const d = this.data();
    if (!Array.isArray(d)) return [];
    return [...d].sort(
      (a, b) =>
        new Date(b.match.createdAt).getTime() -
        new Date(a.match.createdAt).getTime(),
    );
  });
}
