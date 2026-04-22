import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { FriendshipsFirestoreService } from '../../../services/friendships-firestore.service';
import { IFriendship } from '../../../models/friendship.model';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatError } from '@angular/material/form-field';
import { UserService } from '../../../services/user.service';
import { PublicUsersFirestoreService } from '../../../services/public-users-firestore.service';
import { MatIcon } from '@angular/material/icon';

interface FriendItem {
  friendship: IFriendship;
  userId: string;
  displayName: string;
}

@Component({
  selector: 'app-user-friends',
  imports: [RouterLink, MatCardModule, MatListModule, MatProgressSpinnerModule, MatError, MatIcon],
  templateUrl: './user-friends.html',
  styleUrl: './user-friends.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFriends {
  private readonly friendshipsService = inject(FriendshipsFirestoreService);
  private readonly publicUsersService = inject(PublicUsersFirestoreService);
  private readonly userService = inject(UserService);

  private readonly friendItems = toSignal<FriendItem[] | null>(
    combineLatest([
      this.friendshipsService.userFriendships$(),
      this.publicUsersService.publicUsers$(),
    ]).pipe(
      map(([friendships, publicUsers]) => {
        const userId = this.userService.user()?.uid;
        if (!userId) return [];
        return friendships.map(f => {
          const friendId = f.user1Id === userId ? f.user2Id : f.user1Id;
          const profile = publicUsers.find(u => u.userId === friendId);
          return { friendship: f, userId: friendId, displayName: profile?.displayName ?? 'Unknown' } as FriendItem;
        });
      }),
      catchError(() => of(null)),
    )
  );

  readonly loading = computed(() => this.friendItems() === undefined);
  readonly hasError = computed(() => this.friendItems() === null);
  readonly friends = computed(() => Array.isArray(this.friendItems()) ? this.friendItems()! : []);
}

