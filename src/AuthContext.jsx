import { createContext, useEffect, useMemo, useState } from 'react';
import { auth } from './firebase-config';
import { onAuthStateChanged } from 'firebase/auth';

export const AuthContext = createContext({ currentUser: null, userData: null });

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={currentUser}>
            {children}
        </AuthContext.Provider>
    );
};
