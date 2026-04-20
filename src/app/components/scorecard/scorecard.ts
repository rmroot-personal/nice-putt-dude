import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, Subscription, combineLatest, from, of } from 'rxjs';
import { debounceTime, map, startWith, switchMap } from 'rxjs/operators';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatDivider } from '@angular/material/list';
import { ScorecardFirestoreService } from '../../services/scorecard-firestore.service';
import { GolfCoursesFirestoreService } from '../../services/golf-courses-firestore.service';
import { ScoreboardsFirestoreService } from '../../services/scoreboards-firestore.service';
import { EighteenHoles, IScorecard } from '../../models/scorecard.model';
import { UserService } from '../../services/user.service';

type HoleKey = keyof EighteenHoles;

interface HoleRow {
  key: HoleKey;
  num: number;
  par: number;
  strokes: number;
}

interface MatchDetails {
  place: number | null;
  courseName: string | null;
  userName: string | null;
}

@Component({
  selector: 'app-scorecard',
  imports: [
    RouterLink,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatIconButton,
    MatIcon,
    MatProgressSpinner,
    MatDivider,
  ],
  templateUrl: './scorecard.html',
  styleUrl: './scorecard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Scorecard implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly scorecardService = inject(ScorecardFirestoreService);
  private readonly golfCoursesService = inject(GolfCoursesFirestoreService);
  private readonly scoreboardsService = inject(ScoreboardsFirestoreService);
  private readonly userService = inject(UserService);

  readonly scorecard = signal<IScorecard | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);

  readonly matchDetails = toSignal(
    toObservable(this.scorecard).pipe(
      switchMap(sc => {
        if (!sc) return of({ place: null, courseName: null, userName: null } as MatchDetails);
        return combineLatest([
          this.scoreboardsService.getScoreboard$(sc.matchId).pipe(startWith(null)),
          from(this.golfCoursesService.getGolfCourseById(sc.courseId)),
        ]).pipe(
          map(([scoreboard, course]) => {
            const entry = scoreboard?.entries?.find(e => e.userId === sc.userId) ?? null;
            return {
              place: entry?.place ?? null,
              courseName: course?.name ?? null,
              userName: entry?.userDisplayName ?? this.userService.user()?.displayName ?? null,
            } as MatchDetails;
          }),
        );
      }),
    ),
    { initialValue: { place: null, courseName: null, userName: null } as MatchDetails },
  );

  readonly canEdit = computed(() => {
    const sc = this.scorecard();
    const user = this.userService.user();
    return !!sc && !!user && sc.userId === user.uid;
  });

  readonly holes = computed<HoleRow[]>(() => {
    const sc = this.scorecard();
    if (!sc) return [];
    return Array.from({ length: 18 }, (_, i) => {
      const key = `hole${i + 1}` as HoleKey;
      return { key, num: i + 1, par: sc.holes[key].par, strokes: sc.holes[key].strokes };
    });
  });

  readonly front9 = computed(() => this.holes().slice(0, 9));
  readonly back9 = computed(() => this.holes().slice(9, 18));

  readonly front9Par = computed(() => this.front9().reduce((s, h) => s + h.par, 0));
  readonly front9Strokes = computed(() => this.front9().reduce((s, h) => s + h.strokes, 0));
  readonly front9Diff = computed(() => this.front9Strokes() - this.front9Par());

  readonly back9Par = computed(() => this.back9().reduce((s, h) => s + h.par, 0));
  readonly back9Strokes = computed(() => this.back9().reduce((s, h) => s + h.strokes, 0));
  readonly back9Diff = computed(() => this.back9Strokes() - this.back9Par());

  readonly totalPar = computed(() => this.front9Par() + this.back9Par());
  readonly totalStrokes = computed(() => this.front9Strokes() + this.back9Strokes());
  readonly totalDiff = computed(() => this.totalStrokes() - this.totalPar());
  readonly totalScoreStr = computed(() => this.formatDiff(this.totalDiff()));

  private readonly saveSubject = new Subject<void>();
  private readonly saveSubscription: Subscription;

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.scorecardService.getScorecardById(id)
        .then(sc => {
          this.scorecard.set(sc);
          this.loading.set(false);
        })
        .catch(() => {
          this.error.set('Could not load scorecard');
          this.loading.set(false);
        });
    } else {
      this.error.set('No scorecard id provided');
      this.loading.set(false);
    }

    this.saveSubscription = this.saveSubject.pipe(debounceTime(800)).subscribe(() => {
      this.persist();
    });
  }

  ngOnDestroy(): void {
    this.saveSubscription.unsubscribe();
  }

  increment(key: HoleKey): void {
    this.scorecard.update(sc => {
      if (!sc) return sc;
      return { ...sc, holes: { ...sc.holes, [key]: { ...sc.holes[key], strokes: sc.holes[key].strokes + 1 } } };
    });
    this.saveSubject.next();
  }

  decrement(key: HoleKey): void {
    this.scorecard.update(sc => {
      if (!sc) return sc;
      const current = sc.holes[key].strokes;
      if (current <= 1) return sc;
      return { ...sc, holes: { ...sc.holes, [key]: { ...sc.holes[key], strokes: current - 1 } } };
    });
    this.saveSubject.next();
  }

  formatDiff(diff: number): string {
    if (diff === 0) return 'E';
    return diff > 0 ? `+${diff}` : `${diff}`;
  }

  scoreRel(strokes: number, par: number): string {
    const d = strokes - par;
    if (d <= -2) return 'eagle';
    if (d === -1) return 'birdie';
    if (d === 0) return 'par';
    if (d === 1) return 'bogey';
    return 'double';
  }

  private async persist(): Promise<void> {
    const sc = this.scorecard();
    if (!sc) return;
    this.saving.set(true);
    try {
      await this.scorecardService.updateHoleStrokes(sc.id, sc.holes);
    } finally {
      this.saving.set(false);
    }
  }
}

