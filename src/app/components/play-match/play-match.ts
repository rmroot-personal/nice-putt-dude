
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatchesFirestoreService } from '../../services/matches-firestore.service';
import { ScorecardFirestoreService } from '../../services/scorecard-firestore.service';
import { PublicUsersFirestoreService } from '../../services/public-users-firestore.service';
import { UserService } from '../../services/user.service';
import { GolfCoursesFirestoreService } from '../../services/golf-courses-firestore.service';
import { IMatch } from '../../models/match.model';
import { getEighteenHolesFromCourse, IScorecard } from '../../models/scorecard.model';
import { MatCard, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatError } from '@angular/material/form-field';
import { MatList, MatListItem, MatNavList } from '@angular/material/list';

@Component({
  selector: 'app-play-match',
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatIcon,
    MatCardSubtitle,
    MatCardContent,
    MatProgressSpinner,
    MatError,
    MatListItem,
    RouterLink,
    MatNavList
],
  templateUrl: './play-match.html',
  styleUrl: './play-match.css',
})
export class PlayMatch {
  private readonly route = inject(ActivatedRoute);
  private readonly matchesService = inject(MatchesFirestoreService);
  private readonly scorecardService = inject(ScorecardFirestoreService);
  private readonly publicUsersService = inject(PublicUsersFirestoreService);
  private readonly userService = inject(UserService);
  private readonly golfCoursesService = inject(GolfCoursesFirestoreService);
  private readonly router = inject(Router);

  readonly match = signal<IMatch | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly scorecards = signal<{ scorecard: IScorecard; displayName: string | null }[]>([]);
  readonly user = computed(() => this.userService.user());
  readonly userHasScorecard = computed(() => {
    const user = this.user();
    if (!user) return false;
    return this.scorecards().some(entry => entry.scorecard.userId === user.uid);
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.matchesService.getMatchById(id)
        .then(match => {
          this.match.set(match);
          // Fetch scorecards for this match
          return this.scorecardService.getScorecardsForMatch(match?.id ?? '');
        })
        .then(async scorecards => {
          // For each scorecard, fetch the display name
          const results = await Promise.all(
            scorecards.map(async (sc) => {
              const user = await this.publicUsersService.getPublicUserByUserId(sc.userId);
              return { scorecard: sc, displayName: user?.displayName ?? null };
            })
          );
          this.scorecards.set(results);
          this.loading.set(false);
        })
        .catch(err => {
          this.error.set('Could not load match or scorecards');
          this.loading.set(false);
        });
    } else {
      this.error.set('No match id provided');
      this.loading.set(false);
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
    this.loading.set(true);
    try {
      const course = await this.golfCoursesService.getGolfCourseById(courseId);
      if (!course) {
        this.error.set('Golf course not found');
        this.loading.set(false);
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
      this.loading.set(false);
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
