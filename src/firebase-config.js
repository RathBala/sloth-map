import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: 'AIzaSyBg9oTSxgiXb9P_FPet0snym1R3szJawx8',
    authDomain: 'budgie-dc9f6.firebaseapp.com',
    projectId: 'budgie-dc9f6',
    storageBucket: 'budgie-dc9f6.appspot.com',
    messagingSenderId: '105899101971',
    appId: '1:105899101971:web:2c0cd86a5f2bc28c6a54e6',
    measurementId: 'G-G2Q5FYSZN8',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const useEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';

console.log(
    'VITE_USE_FIREBASE_EMULATORS:',
    import.meta.env.VITE_USE_FIREBASE_EMULATORS
);

if (useEmulators) {
    console.log('Connecting to Firebase emulators');
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectAuthEmulator(auth, 'http://localhost:9099');
} else {
    console.log('Connecting to production Firebase');
}

export { auth, db };
