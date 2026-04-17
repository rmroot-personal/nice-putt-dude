import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firebaseConfig } from '../../environments/firebase';
import { firstValueFrom } from 'rxjs';
import { getAuth } from 'firebase/auth';


@Injectable({ providedIn: 'root' })
export class FunctionsService {
    private readonly http = inject(HttpClient);

    /**
     * Calls the helloWorld Firebase Function and returns the response as a Promise<string>.
     */
    async callHelloWorld(): Promise<string> {
        const url = `${firebaseConfig.functionUrl}/helloWorld`;
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error('User not authenticated');
        const token = await user.getIdToken();
        console.log(token)
        const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
        return firstValueFrom(this.http.get(url, { headers, responseType: 'text' }));
    }
}