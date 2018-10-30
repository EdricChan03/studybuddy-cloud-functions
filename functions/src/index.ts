import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp();
/**
 * Automatically adds a document's ID to the document's data.
 * This function is triggered when a document is created.
 * Note that this only affects new documents.
 */
export const addDynamicIdToDocument = functions.firestore.document('users/{userUid}/{collection}/{todoUid}')
  .onCreate((documentSnapshot, context) => {
    if (context.params['collection'] === 'todos' || context.params['collection'] === 'todoProjects') {
      return documentSnapshot
        .ref.update({
          id: documentSnapshot.id
        });
    }
    return null;
  })
/**
 * Cloud Function that adds information about a newly logged-in Firebase user to the associated document in Cloud Firestore.
 * This function is triggered when a new user is authenticated.
 */
export const addUserInfoToDocument = functions.auth.user().onCreate((user, context) => {
  return admin.firestore().doc(`users/${user.uid}`)
    .set({
      user: user.toJSON()
    });
})
