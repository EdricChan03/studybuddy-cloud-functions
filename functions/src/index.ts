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

    /**
     * Checks if the property specified is equals to the 2nd parameter
     * @param prop The property in the `data` array
     * @param against The value to check against
     * @return True if the property is equals to the value, false otherwise
     */
    function isEquals(prop: string, against: any): boolean {
      return data[prop] === against;
    }

    /**
     * Checks if the property specified is of a specific type
     * @param prop The property in the `data` array
     * @param type The type to check
     * @return True if the property is of type `type`, false otherwise
     */
    function isType(prop: string, type: 'boolean' | 'function' | 'number' | 'object' | 'string' | 'symbol' | 'undefined'): boolean {
      return typeof data[prop] === type;
    }
    /**
     * Checks if the property specified is a string
     * @param prop The property in the `data` array
     * @return True if the property is a string, false otherwise
     * @deprecated Use `isType` instead
     */
    function isString(prop: string): boolean {
      return isType(prop, 'string');
    }
    /**
     * Checks if the property specified is not empty
     * @param prop The property in the `data` array
     * @return True if the property is empty, false otherwise
     */
    function isEmpty(prop: string): boolean {
      return data[prop] === '';
    }
    /**
     * Checks if the property specified is a valid hexadecimal color value
     * @param prop The property in the `data` array
     * @return True if the property is a valid hexadecimal color, false otherwise
     */
    function isHexColor(prop: string): boolean {
      return /^#[0-9A-F]{6}$/i.test(data[prop]);
    }
  
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
      if (isString('notificationTitle')) {
        if (!isEmpty('notificationTitle')) {
          messageNotificationObj['title'] = data['notificationTitle'];
        } else {
          console.error('The notification request\'s title is empty!');
        }
      } else {
        console.error('The notification request\'s title is not a valid string! Aborting notification request...');
        return firestore.doc(`notificationRequests/${documentSnapshot.id}`)
        .delete();
      }
    }
    if ('notificationBody' in data) {
      if (isString('notificationBody')) {
        if (!isEmpty('notificationBody')) {
          messageNotificationObj['body'] = data['notificationBody'];
        } else {
          console.error('The notification request\'s body is empty!');
        }
      } else {
        console.error('The notification request\'s body is not a valid string! Aborting notification request...');
        return firestore.doc(`notificationRequests/${documentSnapshot.id}`)
          .delete();
      }
    }

    if ('notificationChannelId' in data) {
      if (isString('notificationChannelId')) {
        if (!isEmpty('notificationChannelId')) {
          messageAndroidObj['data']['notificationChannelId'] = data['notificationChannelId'];
        } else {
          console.error('The notification\'s Android notification channel ID is empty! Setting to default channel ID...');
          messageAndroidObj['data']['notificationChannelId'] = 'uncategorised';
        }
      } else {
        console.error('The notification request\'s Android notification channel ID is not a valid string! Aborting notification request...');
        return firestore.doc(`notificationRequests/${documentSnapshot.id}`)
          .delete();
      }
    }
    if ('notificationColor' in data) {
      if (isString('notificationColor')) {
        if (!isEmpty('notificationColor')) {
          if (isHexColor('notificationColor')) {
            messageAndroidObj['notification']['color'] = data['notificationColor'];
          } else {
            console.error('The notification request\'s color is not a hexadecimal color! Setting to default color...');
            messageAndroidObj['notification']['color'] = '#3F51B5';
          }
        } else {
          console.error('The notification request\'s color is empty! Setting to default color...');
          messageAndroidObj['notification']['color'] = '#3F51B5';
        }
      } else {
        console.error('The notification request\'s color is not a valid string! Aborting notification request...');
        return firestore.doc(`notificationRequests/${documentSnapshot.id}`)
          .delete();
      }
    }
    if ('notificationIcon' in data) {
      if (isString('notificationIcon')) {
        if (!isEmpty('notificationIcon')) {
          messageAndroidObj['notification']['icon'] = data['notificationIcon'];
        } else {
          console.error('The notification request\'s icon is empty!');
        }
      } else {
        console.error('The notification request\'s icon is not a valid string! Aborting notification request...');
        return firestore.doc(`notificationRequests/${documentSnapshot.id}`)
          .delete();
      }
    }
    if ('notificationPriority' in data) {
      if (isString('notificationPriority')) {
        if (!isEmpty('notificationPriority')) {
          if (isEquals('notificationPriority', 'normal') || isEquals('notificationPriority', 'high')) {
            messageAndroidObj['priority'] = data['notificationPriority'];
          } else {
            console.error('The notification request\'s priority is not a valid priority type! Setting to default value...');
            messageAndroidObj['priority'] = 'normal';
          }
        } else {
          console.error('The notification request\'s priority is empty!');
        }
      } else {
        console.error('The notification request\'s priority is not a valid string! Aborting notification request...');
        return firestore.doc(`notificationRequests/${documentSnapshot.id}`)
          .delete();
      }
    }

    if ('ttl' in data) {
      if (isType('ttl', 'number')) {
        messageAndroidObj['ttl'] = data['ttl'];
      } else {
        console.error('The notification request\'s TTL (time-to-live) is not a valid integer! Aborting notification request...');
        return firestore.doc(`notificationRequests/${documentSnapshot.id}`)
          .delete();
      }
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
