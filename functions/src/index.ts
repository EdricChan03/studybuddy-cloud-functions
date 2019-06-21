import * as admin from 'firebase-admin';

admin.initializeApp();

export { appendUserInfo } from './append-user-info';
export { appendDocId } from './append-doc-id';
export { deleteUserData } from './delete-user-data';
export { appendProjectMetadata } from './append-project-metadata';
export { sendFcmNotification } from './send-fcm-notification';
