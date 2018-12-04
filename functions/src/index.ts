import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp();

const firestore = admin.firestore();

/**
 * Listens to changes made on the `notificationRequests` collection in Firestore
 * and sends notifications accordingly, as well as delete the associated documents.
 * 
 * TODO: Add support for WebPush and APNS (Apple Push Notification Service)
 */
export const sendFcmNotification = functions.firestore.document('notificationRequests/{request}')
  .onCreate((documentSnapshot, context) => {
    interface NotificationRequest {
      notificationBody?: string;
      notificationChannelId?: string;
      notificationColor?: string;
      notificationIcon?: string;
      notificationPriority?: 'normal' | 'high';
      notificationTitle?: string;
      ttl?: number;
      userOrTopic?: string;
    }
    const data: NotificationRequest = <NotificationRequest>documentSnapshot.data();
    const message: admin.messaging.Message = {
      // Prevent error from showing
      // Delete this property if the notification is using a topic
      token: ''
    };
    if (data['userOrTopic'].startsWith('topic')) {
      // Message is meant to be sent to a topic
      // Remove the prefix
      message['topic'] = data['userOrTopic'].replace('topic_', '');
      delete message['token'];
    } else {
      // Attempt to use the user's device registration token
      firestore.doc(`users/${data['userOrTopic']}`)
        .get()
        .then((doc) => {
          if (doc.exists) {
            const docData = doc.data();
            if ('registrationToken' in docData) {
              message['token'] = docData['registrationToken'];
            } else {
              console.error('registrationToken doesn\'t exist!');
            }
          } else {
            console.error('User doesn\'t exist!');
          }
        })
        .catch((reason) => {
          console.error('An error occurred while attempting to retrieve the document:', reason);
        });
    }
    // Handles the `notification` key
    const messageNotificationObj = {};
    // Handles the `android` key
    const messageAndroidObj = {
      // Create `data` key to prevent errors
      data: {},
      // Create `notification` key to prevent errors
      notification: {}
    };
    if ('notificationTitle' in data) {
      messageNotificationObj['title'] = data['notificationTitle'];
    }
    if ('notificationBody' in data) {
      messageNotificationObj['body'] = data['notificationBody'];
    }

    if ('notificationChannelId' in data) {
      messageAndroidObj['data']['notificationChannelId'] = data['notificationChannelId'];
    }
    if ('notificationColor' in data) {
      messageAndroidObj['notification']['color'] = data['notificationColor'];
    }
    if ('notificationIcon' in data) {
      messageAndroidObj['notification']['icon'] = data['notificationIcon'];
    }
    if ('notificationPriority' in data) {
      messageAndroidObj['priority'] = data['notificationPriority'];
    }
    if ('ttl' in data) {
      messageAndroidObj['ttl'] = data['ttl'];
    }
    
    if (Object.keys(messageNotificationObj).length !== 0) {
      message['notification'] = messageNotificationObj;
    }
    if (Object.keys(messageAndroidObj).length !== 0) {
      message['android'] = messageAndroidObj;
    }
    // Send the message
    return admin.messaging().send(message)
      .then(() => {
        // And delete the document
        return firestore.doc(`notificationRequests/${documentSnapshot.id}`)
          .delete();
      });
  })
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
