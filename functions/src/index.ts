import * as admin from 'firebase-admin';

admin.initializeApp();

export { sendFcmNotification } from './send-fcm-notification';
export { appendUserInfo } from './append-user-info';
export { appendDocId } from './append-doc-id';
export { appendProjectMetadata } from './append-project-metadata';
