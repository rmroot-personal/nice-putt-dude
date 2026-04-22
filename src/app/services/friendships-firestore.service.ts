
import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, doc, getDoc, query, where, getDocs, onSnapshot } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { IFriendship } from '../models/friendship.model';
import { UserService } from './user.service';
import { or } from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class FriendshipsFirestoreService {
	private readonly firestore = inject(Firestore);
	private readonly userService = inject(UserService);

	async addFriend(friendId: string): Promise<string> {
		const user = this.userService.user();
		if (!user) throw new Error('User must be signed in to add a friend');
		const friendshipsRef = collection(this.firestore, 'friendships');
		const docRef = await addDoc(friendshipsRef, {
			user1Id: user.uid,
			user2Id: friendId
		});
		return docRef.id;
	}

	async getFriendshipById(id: string): Promise<IFriendship | null> {
		const docRef = doc(this.firestore, 'friendships', id);
		const snap = await getDoc(docRef);
		if (!snap.exists()) return null;
		const data = snap.data() as IFriendship;
		return { id: snap.id, user1Id: data.user1Id, user2Id: data.user2Id };
	}

	async getFriendshipsForCurrentUser(): Promise<IFriendship[]> {
		const user = this.userService.user();
		if (!user) return [];
		const friendshipsRef = collection(this.firestore, 'friendships');
		const q = query(friendshipsRef, or(
			where('user1Id', '==', user.uid),
			where('user2Id', '==', user.uid)
		));
		const snap = await getDocs(q);
		return snap.docs.map(docSnap => {
			const data = docSnap.data() as IFriendship;
			return { id: docSnap.id, user1Id: data.user1Id, user2Id: data.user2Id };
		});
	}

	/**
	 * Returns a real-time observable of friendships for the current user.
	 */
	userFriendships$(): Observable<IFriendship[]> {
		const user = this.userService.user();
		if (!user) return new Observable<IFriendship[]>(subscriber => subscriber.next([]));
		const friendshipsRef = collection(this.firestore, 'friendships');
		const q = query(friendshipsRef, or(
			where('user1Id', '==', user.uid),
			where('user2Id', '==', user.uid)
		));
		return new Observable<IFriendship[]>(subscriber => {
			const unsubscribe = onSnapshot(q, snapshot => {
				const friendships = snapshot.docs.map(docSnap => {
					const data = docSnap.data() as IFriendship;
					return { id: docSnap.id, user1Id: data.user1Id, user2Id: data.user2Id };
				});
				subscriber.next(friendships);
			}, error => {
				subscriber.error(error);
			});
			return () => unsubscribe();
		});
	}
}
