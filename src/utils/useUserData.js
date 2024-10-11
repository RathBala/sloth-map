import { useState, useEffect } from 'react';
import { auth, db } from '../firebase-config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    deleteDoc,
} from 'firebase/firestore';

const useUserData = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [userDocument, setUserDocument] = useState(null);

    const [interestRate, setInterestRate] = useState(null);
    const [investmentReturnRate, setInvestmentReturnRate] = useState(null);
    const [targetNestEgg, setTargetNestEgg] = useState(null);
    const [age, setAge] = useState(null);
    const [userInputs, setUserInputs] = useState({});

    const [rowsToDelete, setRowsToDelete] = useState([]);

    const calculateAge = (dateOfBirth) => {
        const dob = new Date(dateOfBirth.seconds * 1000);
        const ageDifMs = Date.now() - dob.getTime();
        const ageDate = new Date(ageDifMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            console.log('Auth state changed:', currentUser);

            if (currentUser) {
                const userRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(userRef);
                const userData = userDoc.data();
                console.log('User data from Firestore:', userData);

                setUserDocument({
                    ...userData,
                    email: currentUser.email,
                    uid: currentUser.uid,
                });

                if (userData) {
                    setInterestRate(userData.interestRate || 5);
                    setInvestmentReturnRate(
                        userData.investmentReturnRate || 10
                    );
                    setTargetNestEgg(userData.targetNestEgg || 0);
                    setAge(calculateAge(userData.dateOfBirth));
                }

                const tableDataRef = collection(userRef, 'tableData');
                const snapshot = await getDocs(tableDataRef);
                const loadedUserInputs = {};
                snapshot.forEach((doc) => {
                    loadedUserInputs[doc.id] = doc.data();
                });
                setUserInputs((prevInputs) => ({
                    ...prevInputs,
                    ...loadedUserInputs,
                }));
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

    const saveInputFields = async () => {
        if (user && user.uid) {
            const userRef = doc(db, 'users', user.uid);
            console.log('Saving user data for user:', user.uid);
            console.log('Interest Rate:', interestRate);
            console.log('Investment Return Rate:', investmentReturnRate);
            console.log('Target Nest Egg:', targetNestEgg);
            try {
                await setDoc(
                    userRef,
                    {
                        interestRate: interestRate,
                        investmentReturnRate: investmentReturnRate,
                        targetNestEgg: targetNestEgg,
                    },
                    { merge: true }
                );
                alert('Input fields updated successfully');
            } catch (error) {
                alert('Error updating user document:', error);
            }
        } else {
            console.log('User is null or missing uid.');
        }
    };

    const saveTableData = async () => {
        if (user && user.uid) {
            const userRef = doc(db, 'users', user.uid);
            const tableDataRef = collection(userRef, 'tableData');

            const MAX_ALLOWED_ENTRIES = 100;

            const numberOfEntries = Object.keys(userInputs).length;

            if (numberOfEntries > MAX_ALLOWED_ENTRIES) {
                console.error(
                    `Attempting to save too many entries (${numberOfEntries}). Save aborted.`
                );
                alert(
                    `Too many changes to save (${numberOfEntries}). Please reduce the number of changes.`
                );
                return;
            }

            try {
                // Delete only the documents explicitly marked in rowsToDelete
                if (rowsToDelete.length > 0) {
                    console.log('Rows to be deleted are:', rowsToDelete);
                    for (const docId of rowsToDelete) {
                        const docRef = doc(tableDataRef, docId);
                        const docSnapshot = await getDoc(docRef);
                        if (docSnapshot.exists()) {
                            await deleteDoc(docRef);
                            console.log(
                                `Deleted document with ID ${docId} from Firestore`
                            );
                        } else {
                            console.log(
                                `Document with ID ${docId} does not exist in Firestore`
                            );
                        }
                    }
                }

                // Save only the entries in userInputs
                for (const [rowKey, fields] of Object.entries(userInputs)) {
                    // Remove undefined values from fields
                    const cleanedFields = Object.fromEntries(
                        Object.entries(fields).filter(
                            ([, value]) => value !== undefined && value !== null
                        )
                    );

                    // Only save if there are fields to save
                    if (Object.keys(cleanedFields).length > 0) {
                        const tableDataDocRef = doc(tableDataRef, rowKey);
                        await setDoc(tableDataDocRef, cleanedFields, {
                            merge: true,
                        });
                    }
                }
                console.log('Table data saved successfully');

                setRowsToDelete([]);
            } catch (error) {
                console.error('Error saving table data:', error);
            }
        } else {
            console.log('User is null or missing uid.');
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
        userInputs,
        setUserInputs,
        saveInputFields,
        saveTableData,
        logout,
        setRowsToDelete,
    };
};

export default useUserData;
