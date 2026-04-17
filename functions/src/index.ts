/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import cors from "cors";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({maxInstances: 10});


export const helloWorld = onRequest(async (request, response) => {
  const corsHandler = cors({origin: "http://localhost:4200"});
  corsHandler(request, response, async () => {
    // Get the Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      response.status(401).send("Missing or invalid Authorization header");
      return;
    }
    const idToken = authHeader.split("Bearer ")[1];
    try {
      // Verify the ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      logger.info("Authenticated user:", {uid: decodedToken.uid});
      response.send("Hello from Nice Putt Dude!");
    } catch (error) {
      logger.error("Token verification failed", error);
      response.status(401).send("Unauthorized: Invalid or expired token");
    }
  });
});
