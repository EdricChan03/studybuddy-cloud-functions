import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { Utils } from './utils';

const firestore = admin.firestore();

/**
 * Interface for a notification request action
 */
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
/**
 * Interface for a notification request
 */
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
/**
 * Listens to changes made on the `notificationRequests` collection in Firestore
 * and sends notifications accordingly, as well as delete the associated documents.
 * 
 * TODO: Add support for WebPush and APNS (Apple Push Notification Service)
 */
export const sendFcmNotification = functions.firestore.document('notificationRequests/{request}')
  .onCreate((documentSnapshot, context) => {
    const data: NotificationRequest = <NotificationRequest>documentSnapshot.data();
    const message: admin.messaging.Message = {
      // Prevent error from showing
      // Delete this property if the notification is using a topic
      token: ''
    };

    if ('userOrTopic' in data) {
      if (data['userOrTopic'] !== null) {
        if (Utils.isString(data['userOrTopic'])) {
          if (!Utils.isEmpty(data['userOrTopic'])) {
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
        if (Utils.isType(data['notificationActions'], 'object')) {
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
        if (Utils.isString(data['notificationBody'])) {
          if (!Utils.isEmpty(data['notificationBody'])) {
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
        if (Utils.isString(data['notificationChannelId'])) {
          if (!Utils.isEmpty(data['notificationChannelId'])) {
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
        if (Utils.isString(data['notificationColor'])) {
          if (!Utils.isEmpty(data['notificationColor'])) {
            if (Utils.isHexColor(data['notificationColor'])) {
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
        if (Utils.isString(data['notificationIcon'])) {
          if (!Utils.isEmpty(data['notificationIcon'])) {
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
        if (Utils.isString(data['notificationPriority'])) {
          if (!Utils.isEmpty(data['notificationPriority'])) {
            if (Utils.isEquals(data['notificationPriority'], 'normal') || Utils.isEquals(data['notificationPriority'], 'high')) {
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
        if (Utils.isString(data['notificationTitle'])) {
          if (!Utils.isEmpty(data['notificationTitle'])) {
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
        if (Utils.isType(data['notificationTtl'], 'number')) {
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
        if (Utils.isType(data['ttl'], 'number')) {
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
