import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { checkEventType } from './check-event-type';

const firestore = admin.firestore();

/**
 * Appends project info when new documents are written to the `users/{userUid}/todos` collection with a project assigned to the document(s).
 * Note that this affects documents which are created/deleted/updated.
 */
export const appendProjectMetadata = functions.firestore.document('users/{userUid}/todos/{todoUid}')
  .onWrite((change, context) => {
    const beforeDoc = change.before;
    const afterDoc = change.after;
    let projectDoc: admin.firestore.DocumentReference;
    if (beforeDoc.data()['project']) {
      projectDoc = firestore.doc(`users/${context.params['userUid']}/todoProjects/${beforeDoc.data()['project']}`);
      if (projectDoc) {
        return projectDoc.get()
          .then((snapshot) => {
            const projectDocData = snapshot.data();
            let docToUpdate = {};
            switch (checkEventType(change)) {
              case 'create':
                docToUpdate = {
                  todos: admin.firestore.FieldValue.arrayUnion(afterDoc.ref)
                };
                if (afterDoc.data()['isDone']) {
                  docToUpdate['todosDone'] = admin.firestore.FieldValue.arrayUnion(afterDoc.ref);
                }
              case 'delete':
                docToUpdate = {
                  todos: admin.firestore.FieldValue.arrayRemove(beforeDoc.ref),
                  todosDone: admin.firestore.FieldValue.arrayRemove(beforeDoc.ref)
                };
              case 'update':
                if (!projectDocData['todos'].some(doc => doc.id === afterDoc.id)) {
                  docToUpdate['todos'] = admin.firestore.FieldValue.arrayUnion(afterDoc.ref);
                } else {
                  if (afterDoc.data()['isDone']) {
                    if (!projectDocData['todosDone'].some(doc => doc.id === afterDoc.id)) {
                      docToUpdate['todosDone'] = admin.firestore.FieldValue.arrayUnion(afterDoc.ref);
                    }
                  } else {
                    if (!projectDocData['todosDone'].some(doc => doc.id === afterDoc.id)) {
                      docToUpdate['todosDone'] = admin.firestore.FieldValue.arrayRemove(afterDoc.ref);
                    }
                  }
                }
            }
            return projectDoc.update(docToUpdate);
          });
      }
    }
    console.log(`Document ${beforeDoc.id} has no project assigned to it!`);
    return null;
  })
