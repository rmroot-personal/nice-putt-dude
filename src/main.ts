import { provideAuth, getAuth } from '@angular/fire/auth';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { firebaseConfig } from './environments/firebase';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

bootstrapApplication(App, {
  providers: [
    ...appConfig.providers,
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
  ]
}).catch((err) => console.error(err));
