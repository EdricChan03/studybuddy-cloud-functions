import { Change } from 'firebase-functions';

/**
 * Checks if the event type is a `create`/`delete`/`update` event and returns either one of the values as a string
 * @param change The change to check
 * @returns One of the event types: `create`, `delete` or `update`
 */
export function checkEventType(change: Change<FirebaseFirestore.DocumentSnapshot>): 'create' | 'delete' | 'update' {
  const before: boolean = change.before.exists;
  const after: boolean = change.after.exists;

  if (!before && after) {
    return 'create';
  } else if (before && after) {
    return 'update';
  } else if (before && !after) {
    return 'delete';
  } else {
    return null;
  }
}
