import { Injectable, signal, computed, inject } from '@angular/core';
import { Auth, authState, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly auth = inject(Auth);
  private readonly _user = signal<User | null>(null);

  constructor() {
    authState(this.auth).subscribe(firebaseUser => {
      if (firebaseUser) {
        const user: User = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName ?? null,
          email: firebaseUser.email ?? null,
          photoURL: firebaseUser.photoURL ?? null,
          emailVerified: firebaseUser.emailVerified,
        };
        this._user.set(user);
      } else {
        this._user.set(null);
      }
    });
  }

  readonly user = computed(() => this._user());

  async signInWithGoogle(): Promise<void> {
    await signInWithPopup(this.auth, new GoogleAuthProvider());
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
  }
}