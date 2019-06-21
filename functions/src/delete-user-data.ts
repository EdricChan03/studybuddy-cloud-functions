import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const firestore = admin.firestore();
/**
 * Cloud Function that automatically deletes a user's data if the user
 * has deleted their account from Firebase Auth.
 */
export const deleteUserData = functions.auth.user().onDelete((user, context) => {
  console.log(`User ${user.uid} has deleted their account. Deleting associated data...`);
  return firestore.doc(`users/${user.uid}`)
    .delete();
})
