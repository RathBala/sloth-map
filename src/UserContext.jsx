import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { AuthContext } from './AuthContext';
import { convertDatabaseTimestamp } from './utils/dateUtils';

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

    const userRef = currentUser ? doc(db, 'users', currentUser.uid) : null;

    const initUserData = async (currentUser) => {
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            setUserData({
                ...userDoc.data(),
                email: currentUser.email,
                uid: currentUser.uid,
                dateOfBirth: convertDatabaseTimestamp(userDoc.dateOfBirth),
            });
        } else {
            await setDoc(userRef, defaultUserData);
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
            userRef,
        };
    }, [userData]);

    return (
        <UserContext.Provider value={value}>{children}</UserContext.Provider>
    );
};
