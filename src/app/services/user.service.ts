import { Injectable, signal, computed, inject } from '@angular/core';
import { Auth, authState, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser, createUserWithEmailAndPassword, updateProfile } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { IUser } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly auth = inject(Auth);
  private readonly _user = signal<IUser | null>(null);

  constructor() {
    authState(this.auth).subscribe(firebaseUser => {
      if (firebaseUser) {
        const user: IUser = {
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

  /**
 * Create a new user account with email and password.
 * @param email The user's email address
 * @param password The user's password
 */
  async createAccountWithEmail(email: string, password: string): Promise<void> {
    await createUserWithEmailAndPassword(this.auth, email, password);
  }

  //implement updateProfile
  async updateProfile(displayName: string | null, photoURL: string | null): Promise<void> {
    if (!this.auth.currentUser) {
      throw new Error('No user is currently signed in');
    }
    await updateProfile(this.auth.currentUser, { displayName: displayName, photoURL: photoURL });
    if (this.auth.currentUser) {
      const user: IUser = {
        uid: this.auth.currentUser.uid,
        displayName: this.auth.currentUser.displayName ?? null,
        email: this.auth.currentUser.email ?? null,
        photoURL: this.auth.currentUser.photoURL ?? null,
        emailVerified: this.auth.currentUser.emailVerified,
      };
      this._user.set(user);
    }
  }
}