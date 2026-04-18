import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, doc, getDoc, getDocs, updateDoc } from '@angular/fire/firestore';
import { collectionData } from '@angular/fire/firestore';
import { UserService } from './user.service';
import { EighteenHoles, IScorecard } from '../models/scorecard.model';
import { query, where } from 'firebase/firestore';
import { Observable } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class ScorecardFirestoreService {
    private readonly firestore = inject(Firestore);
    private readonly userService = inject(UserService);


    async addScorecard(newScorecard: IScorecard): Promise<string> {
        const user = this.userService.user();
        if (!user) throw new Error('User must be signed in to create a scorecard');
        const scorecardsRef = collection(this.firestore, 'scorecards');
        const docRef = await addDoc(scorecardsRef, newScorecard);
        return docRef.id;
    }


    async getScorecardById(id: string): Promise<IScorecard | null> {
        const docRef = doc(this.firestore, 'scorecards', id);
        const snap = await getDoc(docRef);
        if (!snap.exists()) return null;
        const data = snap.data() as IScorecard;
        data.id = snap.id; // Ensure the id field is set
        return { ...data };
    }

    async getAllScorecards(): Promise<IScorecard[]> {
        const scorecardsRef = collection(this.firestore, 'scorecards');
        const snap = await getDocs(scorecardsRef);
        return snap.docs.map(docSnap => {
            const data = docSnap.data() as IScorecard;
            return { ...data, id: docSnap.id };
        });
    }

    //scorecards for match
    async getScorecardsForMatch(matchId: string): Promise<IScorecard[]> {
        const scorecardsRef = collection(this.firestore, 'scorecards');
        const q = query(scorecardsRef, where('matchId', '==', matchId));
        const snap = await getDocs(q);
        return snap.docs.map(docSnap => {
            const data = docSnap.data() as IScorecard;
            return { ...data, id: docSnap.id };
        });
    }

    /**
    * Returns a real-time observable of scorecards for a given matchId.
    */
    scorecardsForMatch$(matchId: string): Observable<IScorecard[]> {
        const scorecardsRef = collection(this.firestore, 'scorecards');
        const q = query(scorecardsRef, where('matchId', '==', matchId));
        // idField ensures the id is included in the returned objects
        return collectionData(q, { idField: 'id' }) as Observable<IScorecard[]>;
    }

    async updateHoleStrokes(id: string, holes: EighteenHoles): Promise<void> {
        const docRef = doc(this.firestore, 'scorecards', id);
        await updateDoc(docRef, { holes });
    }
}
