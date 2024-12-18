import { createContext, useEffect, useState } from 'react';
import { auth, db } from './firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const AuthContext = createContext({ currentUser: null, userData: null });

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userRef);
                if (!userDoc.exists()) {
                    const defaultUserData = {
                        interestRate: 3,
                        investmentReturnRate: 5,
                        targetNestEgg: 100000,
                        dateOfBirth: null,
                    };
                    await setDoc(userRef, defaultUserData);
                    setUserData({
                        ...defaultUserData,
                        email: user.email,
                        uid: user.uid,
                    });
                } else {
                    setUserData({
                        ...userDoc.data(),
                        email: user.email,
                        uid: user.uid,
                    });
                }
                setCurrentUser(user);
            } else {
                setCurrentUser(null);
                setUserData(null);
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ currentUser, userData, setUserData }}>
            {children}
        </AuthContext.Provider>
    );
};
