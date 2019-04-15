import * as functions from 'firebase-functions';

/**
 * Automatically appends a document's ID to the document's data.
 * This function is triggered when a document is created.
 * Note that this only affects new documents and not existing documents.
 */
export const appendDocId = functions.firestore.document('users/{userUid}/{collection}/{todoUid}')
  .onCreate((documentSnapshot, context) => {
    if (context.params['collection'] === 'todoProjects') {
      return documentSnapshot
        .ref.update({
          id: documentSnapshot.id
        });
    }
    return null;
  })
