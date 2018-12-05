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

    interface NotificationAction {
      /**
       * The icon of the notification action
       */
      actionIcon?: string;
      /**
       * The title of the notification action
       */
      actionTitle?: string;
      /**
       * The type of Intent to launch when the notification action is clicked on
       */
      actionType?: string;
    }
    interface NotificationRequest {
      /**
       * Specifies the notification's actions
       *
       * Note: This property is only for Android.
       */
      notificationActions?: NotificationAction[];
      /**
       * Specifies the body of the notification
       */
      notificationBody?: string;
      /**
       * Specifies the Android notification channel ID of the notification
       *
       * Note: This property is only for Android.
       *
       * Note: Notification channels were introduced in Android Oreo 
       */
      notificationChannelId?: string;
      /**
       * Specifies the color of the notification
       *
       * Note: This property is only for Android.
       */
      notificationColor?: string;
      /**
       * Specifies the icon of the notification
       *
       * Note: This property is only for Android.
       */
      notificationIcon?: string;
      /**
       * Specifies the priority of the notification
       */
      notificationPriority?: 'normal' | 'high';
      /**
       * Specifies the title of the notification
       */
      notificationTitle?: string;
      /**
       * Specifies the time-to-live of the notification
       *
       * Note: This property is only for Android.
       *
       * Note: This property is measured in milliseconds.
       */
      notificationTtl?: number;
      /**
       * Specifies the time-to-live of the notification
       *
       * Note: This property is only for Android.
       *
       * Note: This property is measured in milliseconds.
       * @deprecated Use `notificationTtl` instead; will be removed in a future release
       */
      ttl?: number;
      /**
       * Specifies the user/topic to send the notification to
       *
       * Note: If the notification is intended to be sent to a topic, append this property's value with a `topic_`.
       */
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

    if ('userOrTopic' in data) {
      if (data['userOrTopic'] !== null) {
        if (isString('userOrTopic')) {
          if (!isEmpty('userOrTopic')) {
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
          } else {
            console.error('The notification request\'s user/topic is empty! Aborting notification request...');
            return firestore.doc(`notificationRequests/${documentSnapshot.id}`)
              .delete();
          }
        } else {
          console.error('The notification request\'s user/topic is not a valid string! Aborting notification request...');
          return firestore.doc(`notificationRequests/${documentSnapshot.id}`)
            .delete();
        }
      }
    }
    // Handles the `notification` key
    const messageNotificationObj = {};
    // Handles the `android` key
    const messageAndroidObj = {
      // Create `data` key to prevent errors
      data: {
        notificationActions: ''
      },
      // Create `notification` key to prevent errors
      notification: {}
    };
    if ('notificationActions' in data) {
      if (data['notificationActions'] !== null) {
        if (isType('notificationActions', 'object')) {
          if (Object.keys(data['notificationActions']).length > 0) {
            messageAndroidObj['data']['notificationActions'] = JSON.stringify(data['notificationActions']);
          } else {
            console.error('The notification request\'s actions are empty!');
          }
        } else {
          console.error('The notification request\'s actions is not a valid object! Aborting notification request...');
          return firestore.doc(`notificationRequests/${documentSnapshot.id}`)
            .delete();
        }
      }
    }
    if ('notificationBody' in data) {
      if (data['notificationBody'] !== null) {
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
    }

    if ('notificationChannelId' in data) {
      if (data['notificationChannelId'] !== null) {
        if (isString('notificationChannelId')) {
          if (!isEmpty('notificationChannelId')) {
            messageAndroidObj['data']['notificationChannelId'] = data['notificationChannelId'];
          } else {
            console.error('The notification request\'s Android notification channel ID is empty! Setting to default channel ID...');
            messageAndroidObj['data']['notificationChannelId'] = 'uncategorised';
          }
        } else {
          console.error('The notification request\'s Android notification channel ID is not a valid string! Aborting notification request...');
          return firestore.doc(`notificationRequests/${documentSnapshot.id}`)
            .delete();
        }
      } else {
        console.log('No data was supplied for the notification request\'s Android notification channel ID. Setting to default channel ID...');
        messageAndroidObj['data']['notificationChannelId'] = 'uncategorised';
      }
    }
    if ('notificationColor' in data) {
      if (data['notificationColor'] !== null) {
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
    }
    if ('notificationIcon' in data) {
      if (data['notificationIcon'] !== null) {
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
    }
    if ('notificationPriority' in data) {
      if (data['notificationPriority'] !== null) {
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
    }
    if ('notificationTitle' in data) {
      if (data['notificationTitle'] !== null) {
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
    }
    if ('notificationTtl' in data) {
      if (data['notificationTtl'] !== null) {
        if (isType('notificationTtl', 'number')) {
          messageAndroidObj['ttl'] = data['notificationTtl'];
        } else {
          console.error('The notification request\'s TTL (time-to-live) is not a valid integer! Aborting notification request...');
          return firestore.doc(`notificationRequests/${documentSnapshot.id}`)
            .delete();
        }
      }
    }
    if ('ttl' in data) {
      console.log('Note: The `ttl` property is deprecated and will be removed in a future release. Use `notificationTtl` instead.');
      if (data['ttl'] !== null) {
        if (isType('ttl', 'number')) {
          messageAndroidObj['ttl'] = data['ttl'];
        } else {
          console.error('The notification request\'s TTL (time-to-live) is not a valid integer! Aborting notification request...');
          return firestore.doc(`notificationRequests/${documentSnapshot.id}`)
            .delete();
        }
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
