'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

/*exports.notifyNewMessage = functions.firestore.document('chats/{chatUid}/messages/{messageUid}')
    .onCreate((documentSnapshot, context) => {
        const message = documentSnapshot.data();
        const senderId = message['senderId'];
        const senderName = message['senderName'];
        
    })
*/
/**
 * Creates the 'id' property for new documents written to a user's todos collection.
 * This reduces the amount of code used to automatically add an ID to the document in
 * the web app.
 */
exports.addDynamicIdToTodo = functions.firestore.document('users/{userUid}/todos/{todoUid}')
    .onCreate((documentSnapshot, context) => {
        return documentSnapshot
            .ref.update({
                id: documentSnapshot.id
            });
    })
