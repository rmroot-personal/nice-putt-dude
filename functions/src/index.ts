import { setGlobalOptions } from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

setGlobalOptions({ maxInstances: 10 });

export { updateScoreboard } from "./scoreboard";
