import { provideAuth, getAuth, connectAuthEmulator } from '@angular/fire/auth';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { firebaseConfig, useEmulators } from './environments/firebase';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { connectFirestoreEmulator } from '@angular/fire/firestore';
bootstrapApplication(App, {
  providers: [
    ...appConfig.providers,
    provideFirebaseApp(() => {
      const app = initializeApp(firebaseConfig);
      if (useEmulators) {
        // Connect Auth and Firestore to local emulators
        // These must be imported dynamically to avoid SSR issues
        connectAuthEmulator(getAuth(app), 'http://localhost:9099');
        connectFirestoreEmulator(getFirestore(app), 'localhost', 8080);
      }
      return app;
    }),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
  ]
}).catch((err) => console.error(err));
