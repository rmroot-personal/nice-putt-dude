import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, CollectionReference, DocumentData, doc, getDoc, query, where, getDocs } from '@angular/fire/firestore';


import { IMatch } from '../models/match.model';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class MatchesFirestoreService {
  private readonly firestore = inject(Firestore);
  private readonly userService = inject(UserService);


  async addMatch(name: string): Promise<string> {
    const user = this.userService.user();
    if (!user) throw new Error('User must be signed in to create a match');
    const matchesRef = collection(this.firestore, 'matches');
    const docRef = await addDoc(matchesRef, {
      name,
      createdByUserId: user.uid,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  }


  async getMatchById(id: string): Promise<IMatch | null> {
    const docRef = doc(this.firestore, 'matches', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data() as IMatch;
    return { id: snap.id, name: data.name, createdByUserId: data.createdByUserId, createdAt: data.createdAt };
  }

  async getMatchesForCurrentUser(): Promise<IMatch[]> {
    const user = this.userService.user();
    if (!user) return [];
    const matchesRef = collection(this.firestore, 'matches');
    const q = query(matchesRef, where('createdByUserId', '==', user.uid));
    const snap = await getDocs(q);
    return snap.docs.map(docSnap => {
      const data = docSnap.data() as IMatch;
      return { id: docSnap.id, name: data.name, createdByUserId: data.createdByUserId, createdAt: data.createdAt };
    });
  }
}
