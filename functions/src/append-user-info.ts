import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const firestore = admin.firestore();

/**
 * Cloud Function that adds information about a newly logged-in Firebase user to the associated document in Cloud Firestore.
 * This function is triggered when a new user is authenticated.
 * 
 * TODO: Fix broken function
 */
export const appendUserInfo = functions.auth.user().onCreate((user, context) => {
  console.log('User data (as JSON):', user.toJSON());
  console.log('User data (raw):', user);
  // The following lines of code are adapted from the Firebase Functions source code.
  // See 
  return firestore.doc(`users/${user.uid}`)
  .set({
    user: JSON.parse(JSON.stringify(user))
  });
})
