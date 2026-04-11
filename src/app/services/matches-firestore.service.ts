import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, doc, getDoc, query, where, getDocs, docData } from '@angular/fire/firestore';


import { IMatch } from '../models/match.model';
import { UserService } from './user.service';
import { deleteDoc } from 'firebase/firestore';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MatchesFirestoreService {
  private readonly firestore = inject(Firestore);
  private readonly userService = inject(UserService);


  async addMatch(name: string, golfCourseId: string): Promise<string> {
    const user = this.userService.user();
    if (!user) throw new Error('User must be signed in to create a match');
    const matchesRef = collection(this.firestore, 'matches');
    const docRef = await addDoc(matchesRef, {
      name,
      golfCourseId,
      createdByUserId: user.uid,
      createdAt: new Date().toISOString(),
      players: []
    });
    return docRef.id;
  }


  async getMatchById(id: string): Promise<IMatch | null> {
    const docRef = doc(this.firestore, 'matches', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data() as IMatch;
    return { ...data, id: snap.id };
  }

  async getMatchesForCurrentUser(): Promise<IMatch[]> {
    const user = this.userService.user();
    if (!user) return [];
    const matchesRef = collection(this.firestore, 'matches');
    const q = query(matchesRef, where('createdByUserId', '==', user.uid));
    const snap = await getDocs(q);
    return snap.docs.map(docSnap => {
      const data = docSnap.data() as IMatch;
      return { ...data, id: docSnap.id };
    });
  }

  async deleteMatch(matchId: string): Promise<void> {
    const matchRef = doc(this.firestore, 'matches', matchId);
    await deleteDoc(matchRef);
  }



  /**
  * Returns a real-time observable of a match for a given matchId.
  */
  match$(matchId: string): Observable<IMatch> {
    const matchRef = doc(this.firestore, 'matches', matchId);
    return docData(matchRef, { idField: 'id' }) as Observable<IMatch>;
  }
}
