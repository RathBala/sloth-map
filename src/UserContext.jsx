import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
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

export const UserContextProvider = () => {
    const currentUser = useContext(AuthContext);
    const [userData, setUserData] = useState(null);

    const initUserData = async (currentUser) => {
        const userRef = doc(db, 'users', currentUser.uid);
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
        };
    }, [userData]);

    return (
        <UserContext.Provider value={value}>{children}</UserContext.Provider>
    );
};
