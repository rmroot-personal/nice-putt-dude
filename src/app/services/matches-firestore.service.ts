import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, CollectionReference, DocumentData, doc, getDoc } from '@angular/fire/firestore';

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
    const data = snap.data() as { name: string };
    return { id: snap.id, name: data.name };
  }
}
