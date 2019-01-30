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

    /**
     * Retrieves the project document assigned to the todo document
     * @param todoDoc The todo document to check
     * @return A document reference, or null if the todo document doesn't exist
     */
    function getProjectDocument(todoDoc: FirebaseFirestore.DocumentSnapshot): FirebaseFirestore.DocumentReference {
      if (todoDoc.exists) {
        if (typeof todoDoc.data()['project'] === 'string') {
          // Using deprecated approach
          return firestore.doc(`users/${context.params['userId']}/todoProjects/${todoDoc.data()['project']}`);
        } else {
          // The field is probably a document reference
          return todoDoc.data()['project'] as FirebaseFirestore.DocumentReference;
        }
      } else {
        return null;
      }
    }
    if (beforeDoc.data()['project']) {
      projectDoc = getProjectDocument(beforeDoc);
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
