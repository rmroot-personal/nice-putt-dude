
import { Component, computed, inject, signal, effect } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatchesFirestoreService } from '../../services/matches-firestore.service';
import { ScorecardFirestoreService } from '../../services/scorecard-firestore.service';
import { UserService } from '../../services/user.service';
import { GolfCoursesFirestoreService } from '../../services/golf-courses-firestore.service';
import { IMatch } from '../../models/match.model';
import { getEighteenHolesFromCourse, IScorecard } from '../../models/scorecard.model';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatError } from '@angular/material/form-field';
import { MatDivider, MatListItem, MatNavList } from '@angular/material/list';
import { UserDisplayNamePipe } from '../../pipes/user-display-name-pipe';

@Component({
  selector: 'app-play-match',
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatIcon,
    MatCardContent,
    MatProgressSpinner,
    MatError,
    MatListItem,
    RouterLink,
    MatNavList,
    UserDisplayNamePipe,
    MatDivider
  ],
  templateUrl: './play-match.html',
  styleUrl: './play-match.css',
})
export class PlayMatch {
  private readonly route = inject(ActivatedRoute);
  private readonly matchesService = inject(MatchesFirestoreService);
  private readonly scorecardService = inject(ScorecardFirestoreService);
  private readonly userService = inject(UserService);
  private readonly golfCoursesService = inject(GolfCoursesFirestoreService);
  private readonly router = inject(Router);

  readonly match = signal<IMatch | null>(null);
  readonly loadingMatch = signal(true);
  readonly loadingScorecards = signal(true);
  readonly error = signal<string | null>(null);
  readonly scorecards = signal<IScorecard[]>([]);
  readonly user = computed(() => this.userService.user());
  readonly userHasScorecard = computed(() => {
    const user = this.user();
    if (!user) return false;
    return this.scorecards().some(entry => entry.userId === user.uid);
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      effect(() => {
        const sub = this.matchesService.match$(id).subscribe({
          next: match => {
            this.match.set(match);
            this.loadingMatch.set(false);
          },
          error: err => {
            this.error.set('Could not load match or scorecards');
            this.loadingMatch.set(false);
          }
        });
        return () => sub.unsubscribe();
      })


      // Subscribe to real-time scorecards for this match
      effect(() => {
        const sub = this.scorecardService.scorecardsForMatch$(id).subscribe({
          next: scorecards => {
            this.scorecards.set(scorecards);
            this.loadingScorecards.set(false);
          },
          error: err => {
            this.error.set('Could not load scorecards');
            this.loadingScorecards.set(false);
          }
        });
        return () => sub.unsubscribe();
      });

    } else {
      this.error.set('No match id provided');
      this.loadingMatch.set(false);
    }

  }


  async addUserScorecard() {
    const user = this.user();
    const match = this.match();
    if (!user || !match) {
      this.error.set('User or match not loaded');
      return;
    }
    // Assume match has courseId
    // If not, error
    // If courseId is not present, error
    // Otherwise, fetch course
    // Then create a blank scorecard for the user
    // Add to Firestore
    // Reload scorecards
    // Defensive: courseId may be in match or not
    const courseId = match.golfCourseId;
    if (!courseId) {
      this.error.set('No courseId found for this match');
      return;
    }
    this.loadingScorecards.set(true);
    try {
      const course = await this.golfCoursesService.getGolfCourseById(courseId);
      if (!course) {
        this.error.set('Golf course not found');
        this.loadingScorecards.set(false);
        return;
      }
      const newScorecard: Omit<IScorecard, 'id'> = {
        userId: user.uid,
        courseId: course.id,
        matchId: match.id,
        date: new Date(),
        holes: getEighteenHolesFromCourse(course)
      };
      const newScorecardId = await this.scorecardService.addScorecard(newScorecard as IScorecard);
      //navigate to scorecard
      this.router.navigate(['/scorecard', newScorecardId]);
    } catch (err) {
      this.error.set('Failed to add scorecard');
      this.loadingScorecards.set(false);
    }
  }

  async deleteMatch() {
    const match = this.match();
    if (!match) {
      this.error.set('Match not loaded');
      return;
    }
    await this.matchesService.deleteMatch(match.id);
    this.router.navigate(['/matches']);
  }
}
