import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { combineLatest, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatFormField, MatLabel, MatError, MatHint } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatButton, MatAnchor } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatDivider } from '@angular/material/list';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatchesFirestoreService } from '../../services/matches-firestore.service';
import { GolfCoursesFirestoreService } from '../../services/golf-courses-firestore.service';
import { FriendshipsFirestoreService } from '../../services/friendships-firestore.service';
import { PublicUsersFirestoreService } from '../../services/public-users-firestore.service';
import { UserService } from '../../services/user.service';
import { IGolfCourse } from '../../models/golf-course.model';
import { IPublicUser } from '../../models/public-users.model';

@Component({
  selector: 'app-new-match',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatFormField,
    MatLabel,
    MatError,
    MatHint,
    MatInput,
    MatSelect,
    MatOption,
    MatButton,
    MatAnchor,
    MatIcon,
    MatProgressSpinner,
    MatDivider,
    MatCheckbox,
  ],
  templateUrl: './new-match.html',
  styleUrl: './new-match.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewMatch {
  private readonly matchesFirestore = inject(MatchesFirestoreService);
  private readonly golfCoursesService = inject(GolfCoursesFirestoreService);
  private readonly friendshipsService = inject(FriendshipsFirestoreService);
  private readonly publicUsersService = inject(PublicUsersFirestoreService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(50)] }),
    golfCourseId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    players: new FormControl<string[]>([], { nonNullable: true }),
  });

  get name() { return this.form.controls.name; }
  get golfCourseId() { return this.form.controls.golfCourseId; }
  get players() { return this.form.controls.players; }

  readonly golfCourses = signal<IGolfCourse[]>([]);
  readonly loadingCourses = signal(true);
  readonly coursesError = signal<string | null>(null);

  private readonly friendItems = toSignal<IPublicUser[] | null>(
    combineLatest([
      this.friendshipsService.userFriendships$(),
      this.publicUsersService.publicUsers$(),
    ]).pipe(
      map(([friendships, publicUsers]) => {
        const userId = this.userService.user()?.uid;
        if (!userId) return [];
        return friendships
          .map(f => {
            const friendId = f.user1Id === userId ? f.user2Id : f.user1Id;
            return publicUsers.find(u => u.userId === friendId) ?? null;
          })
          .filter((u): u is IPublicUser => u !== null);
      }),
      catchError(() => of(null)),
    )
  );

  readonly loadingFriends = computed(() => this.friendItems() === undefined);
  readonly friends = computed(() => this.friendItems() ?? []);

  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);

  constructor() {
    this.golfCoursesService.getAllGolfCourses()
      .then(courses => {
        this.golfCourses.set(courses);
        this.loadingCourses.set(false);
      })
      .catch(() => {
        this.coursesError.set('Failed to load golf courses');
        this.loadingCourses.set(false);
      });
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.submitting()) return;
    this.submitting.set(true);
    this.submitError.set(null);
    try {
      const { name, golfCourseId, players } = this.form.getRawValue();
      const matchId = await this.matchesFirestore.addMatch(name, golfCourseId, players);
      this.router.navigate(['/play-match', matchId]);
    } catch {
      this.submitError.set('Failed to create match. Please try again.');
      this.submitting.set(false);
    }
  }
}
