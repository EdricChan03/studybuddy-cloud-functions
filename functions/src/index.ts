import * as functions from 'firebase-functions';

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
