import { useState, useEffect } from 'react';
import { auth, db } from '../firebase-config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const useUserData = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [userDocument, setUserDocument] = useState(null);

    const [interestRate, setInterestRate] = useState(null);
    const [investmentReturnRate, setInvestmentReturnRate] = useState(null);
    const [targetNestEgg, setTargetNestEgg] = useState(null);
    const [age, setAge] = useState(null);

    const calculateAge = (dateOfBirth) => {
        const dob = new Date(dateOfBirth.seconds * 1000);
        const ageDifMs = Date.now() - dob.getTime();
        const ageDate = new Date(ageDifMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const userRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(userRef);
                const userData = userDoc.data();
                setUserDocument({
                    ...userData,
                    email: currentUser.email,
                });

                if (userData) {
                    setInterestRate(userData.interestRate || 5);
                    setInvestmentReturnRate(
                        userData.investmentReturnRate || 10
                    );
                    setAge(calculateAge(userData.dateOfBirth));
                }
            } else {
                setUserDocument(null);
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (userDocument) {
            setIsLoggedIn(true);
            setUser(userDocument);
            console.log('User document set:', userDocument);
        } else {
            setIsLoggedIn(false);
            setUser(null);
            console.log('User document is null.');
        }
    }, [userDocument]);

    const saveUserData = async () => {
        if (user && user.uid) {
            const userRef = doc(db, 'users', user.uid);
            try {
                await updateDoc(userRef, {
                    interestRate: interestRate,
                });
                console.log('Interest rate updated successfully');
            } catch (error) {
                console.error('Error updating user document:', error);
            }
        }
    };

    const logout = async () => {
        await signOut(auth);
    };

    return {
        isLoggedIn,
        user,
        interestRate,
        setInterestRate,
        investmentReturnRate,
        setInvestmentReturnRate,
        targetNestEgg,
        setTargetNestEgg,
        age,
        setAge,
        saveUserData,
        logout,
    };
};

export default useUserData;
