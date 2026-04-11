import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, getDocs, query, where } from '@angular/fire/firestore';
import { IPublicUser } from '../models/public-users.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PublicUsersFirestoreService {
    private readonly firestore = inject(Firestore);


    async getPublicUserByUserId(userId: string): Promise<IPublicUser | null> {
        const publicUsersRef = collection(this.firestore, 'publicUsers');
        const q = query(publicUsersRef, where('userId', '==', userId));
        const snap = await getDocs(q);
        if (snap.empty) return null;
        const docSnap = snap.docs[0];
        const data = docSnap.data() as IPublicUser;
        return { userId: data.userId, displayName: data.displayName };
    }

    async getAllPublicUsers(): Promise<IPublicUser[]> {
        const publicUsersRef = collection(this.firestore, 'publicUsers');
        const snap = await getDocs(publicUsersRef);
        return snap.docs.map(docSnap => {
            const data = docSnap.data() as IPublicUser;
            return { userId: data.userId, displayName: data.displayName };
        });
    }

    publicUsers$(): Observable<IPublicUser[]> {
        // Use collectionData for real-time updates
        return collectionData(collection(this.firestore, 'publicUsers')) as Observable<IPublicUser[]>;
    }
}