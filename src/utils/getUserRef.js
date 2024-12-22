import { doc } from 'firebase/firestore';
import { db } from '../firebase-config';

export const getUserRef = (currentUser) => {
    return currentUser ? doc(db, 'users', currentUser.uid) : null;
};
