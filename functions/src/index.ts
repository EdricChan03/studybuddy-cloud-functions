import * as functions from 'firebase-functions';

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

export const addDynamicIdToTodo = functions.firestore.document('users/{userUid}/todos/{todoUid}')
    .onCreate((documentSnapshot, context) => {
        return documentSnapshot
            .ref.update({
                id: documentSnapshot.id
            });
    })
