import { Pipe, PipeTransform, inject } from '@angular/core';
import { PublicUsersFirestoreService } from '../services/public-users-firestore.service';
import { signal } from '@angular/core';

@Pipe({ name: 'userDisplayName', standalone: true, pure: false })
export class UserDisplayNamePipe implements PipeTransform {
  private publicUsersService = inject(PublicUsersFirestoreService);
  private usersMap = signal<Record<string, string>>({});

  constructor() {
    this.publicUsersService.publicUsers$().subscribe(users => {
      const map: Record<string, string> = {};
      users.forEach(u => map[u.userId] = u.displayName);
      this.usersMap.set(map);
    });
  }

  transform(userId: string): string {
    return this.usersMap()[userId] ?? 'Unknown user';
  }
}