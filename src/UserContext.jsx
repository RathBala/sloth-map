import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { getDoc, setDoc } from 'firebase/firestore';
import { AuthContext } from './AuthContext';
import { convertDatabaseTimestamp } from './utils/dateUtils';
import { getUserRef } from './utils/getUserRef';

const defaultUserData = {
    interestRate: 3,
    investmentReturnRate: 5,
    targetNestEgg: 100000,
    dateOfBirth: null,
};

export const UserContext = createContext(defaultUserData);

export const UserContextProvider = ({ children }) => {
    const currentUser = useContext(AuthContext);
    const [userData, setUserData] = useState(null);

    const initUserData = async (currentUser) => {
        try {
            const userRef = getUserRef(currentUser);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                setUserData({
                    ...userDoc.data(),
                    email: currentUser.email,
                    uid: currentUser.uid,
                    dateOfBirth: convertDatabaseTimestamp(
                        userDoc.data().dateOfBirth
                    ),
                });
            } else {
                await setDoc(userRef, defaultUserData);
            }
        } catch (error) {
            console.error('Failed to initialise user data:', error);
        }
    };

    useEffect(() => {
        if (currentUser) {
            initUserData(currentUser);
        }
    }, [currentUser]);

    const value = useMemo(() => {
        return {
            userData,
            setUserData,
        };
    }, [userData]);

    return (
        <UserContext.Provider value={value}>{children}</UserContext.Provider>
    );
};
