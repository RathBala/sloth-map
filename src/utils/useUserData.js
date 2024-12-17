/* eslint-disable no-debugger */
import { useState, useEffect, useContext } from 'react';
import { auth, db } from '../firebase-config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    deleteField,
    Timestamp,
} from 'firebase/firestore';
import { AuthContext } from '../AuthContext.js';

const useUserData = () => {
    // const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);

    const [interestRate, setInterestRate] = useState(null);
    const [investmentReturnRate, setInvestmentReturnRate] = useState(null);
    const [targetNestEgg, setTargetNestEgg] = useState(null);
    const [dateOfBirth, setDateOfBirth] = useState(null);

    const [userInputs, setUserInputs] = useState({});
    const [goals, setGoals] = useState({});

    const [fieldsToDelete, setFieldsToDelete] = useState({});

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const userRef = doc(db, 'users', currentUser.uid);
                setLoading(true);

                try {
                    const userDoc = await getDoc(userRef);
                    if (userDoc.exists()) {
                        let userData = userDoc.data() || {};
                        console.log('User data from Firestore:', userData);

                        // Handle dateOfBirth
                        let dob = userData.dateOfBirth || null;
                        if (dob && dob.toDate) {
                            // It's a Firestore Timestamp
                            dob = dob.toDate();
                        } else if (dob && typeof dob === 'string') {
                            // If it's a string, parse it as a Date
                            dob = new Date(dob);
                        }

                        setDateOfBirth(dob);

                        // Check if userData is empty or missing required fields
                        if (!userData || Object.keys(userData).length === 0) {
                            // Initialise userData with default values
                            const defaultUserData = {
                                interestRate: 3,
                                investmentReturnRate: 5,
                                targetNestEgg: 100000,
                                dateOfBirth: null,
                            };
                            userData = defaultUserData;
                            await setDoc(userRef, userData);
                            console.log(
                                'User data was empty, initialized with default values'
                            );
                        }

                        setUser({
                            ...userData,
                            email: currentUser.email,
                            uid: currentUser.uid,
                        });
                        setIsLoggedIn(true);

                        setInterestRate(userData.interestRate || 5);
                        setInvestmentReturnRate(
                            userData.investmentReturnRate || 10
                        );
                        setTargetNestEgg(userData.targetNestEgg || 0);

                        const tableDataRef = collection(userRef, 'tableData');
                        const snapshot = await getDocs(tableDataRef);
                        const loadedUserInputs = {};
                        snapshot.forEach((doc) => {
                            loadedUserInputs[doc.id] = doc.data();
                        });
                        setUserInputs(loadedUserInputs);

                        await fetchGoals(currentUser.uid);
                    } else {
                        console.log(
                            'No user document exists:',
                            currentUser.uid
                        );
                        // Initialize userData with default values
                        let userData = {
                            interestRate: 3,
                            investmentReturnRate: 5,
                            targetNestEgg: 100000,
                            dateOfBirth: null,
                        };
                        // Save the default data to Firestore
                        await setDoc(userRef, userData);
                        console.log(
                            'User document created with default values'
                        );

                        setUser({
                            ...userData,
                            email: currentUser.email,
                            uid: currentUser.uid,
                        });
                        setIsLoggedIn(true);

                        setDateOfBirth(userData.dateOfBirth || null);
                        setInterestRate(userData.interestRate || 5);
                        setInvestmentReturnRate(
                            userData.investmentReturnRate || 10
                        );
                        setTargetNestEgg(userData.targetNestEgg || 0);

                        // Initialize userInputs and goals as empty
                        setUserInputs({});
                        setGoals({});
                    }
                } catch (error) {
                    console.error('Failed to fetch user document:', error);
                    setIsLoggedIn(false);
                    setUser(null);
                }
            } else {
                console.log('No user logged in');
                setIsLoggedIn(false);
                setUser(null);
                setInterestRate(null);
                setInvestmentReturnRate(null);
                setTargetNestEgg(null);
                setDateOfBirth(null);
                setUserInputs({});
                setGoals({});
                setFieldsToDelete({});
            }
            setLoading(false); // Ensure loading is set to false regardless of the outcome
        });

        return () => unsubscribe();
    }, []);

    const fetchUserInputs = async () => {
        if (user && user.uid) {
            const userRef = doc(db, 'users', user.uid);
            const tableDataRef = collection(userRef, 'tableData');
            const snapshot = await getDocs(tableDataRef);
            const loadedUserInputs = {};
            snapshot.forEach((doc) => {
                loadedUserInputs[doc.id] = doc.data();
            });
            console.log(
                'Re-fetched userInputs from Firestore:',
                loadedUserInputs
            );
            return loadedUserInputs; // Return the fetched data instead of setting it here
        }
        return {}; // Return an empty object if no user or data
    };

    const fetchGoals = async (userId) => {
        const goalsRef = collection(db, 'users', userId, 'goals');
        try {
            const snapshot = await getDocs(goalsRef);
            const loadedGoals = {};
            snapshot.forEach((doc) => {
                loadedGoals[doc.id] = { id: doc.id, ...doc.data() };
            });
            setGoals(loadedGoals);
            console.log('Loaded goals:', loadedGoals);
        } catch (error) {
            console.error('Error fetching goals:', error);
        }
    };

    const generateGoalId = () => {
        return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    };

    const saveGoal = async (goal) => {
        if (user && user.uid) {
            const goalId = goal.id || generateGoalId();

            setGoals((prevGoals) => {
                let updatedGoals = { ...prevGoals };

                // Adjust priorities if necessary
                const newPriority = goal.priority;
                const otherGoals = Object.values(updatedGoals).filter(
                    (g) => g.id !== goalId
                );

                otherGoals.forEach((existingGoal) => {
                    if (existingGoal.priority >= newPriority) {
                        existingGoal.priority += 1;
                    }
                });

                updatedGoals = { ...updatedGoals };
                otherGoals.forEach((g) => {
                    updatedGoals[g.id] = g;
                });

                updatedGoals[goalId] = { ...goal, id: goalId };

                return updatedGoals;
            });
        }
    };

    const commitGoalsToFirestore = async () => {
        if (user && user.uid) {
            const userRef = doc(db, 'users', user.uid);
            const goalsRef = collection(userRef, 'goals');
            const promises = Object.values(goals).map((goal) => {
                const goalRef = doc(goalsRef, goal.id);
                return setDoc(goalRef, goal, { merge: true });
            });
            await Promise.all(promises);
            console.log('Goals saved to Firestore');
        }
    };

    // const deleteGoal = async (goalId) => {
    //     if (user && user.uid) {
    //         const userRef = doc(db, 'users', user.uid);
    //         const goalRef = doc(userRef, 'goals', goalId);
    //         await deleteDoc(goalRef);

    //         setGoals((prevGoals) => {
    //             const updatedGoals = { ...prevGoals };
    //             delete updatedGoals[goalId];
    //             return updatedGoals;
    //         });
    //     }
    // };

    const saveInputFields = async () => {
        if (user && user.uid) {
            const userRef = doc(db, 'users', user.uid);
            try {
                const dobTimestamp = dateOfBirth
                    ? Timestamp.fromDate(dateOfBirth)
                    : null;

                await setDoc(
                    userRef,
                    {
                        interestRate: interestRate,
                        investmentReturnRate: investmentReturnRate,
                        targetNestEgg: targetNestEgg,
                        dateOfBirth: dobTimestamp,
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
                // Save only the entries in userInputs
                for (const [rowKey, fields] of Object.entries(userInputs)) {
                    const cleanedFields = Object.fromEntries(
                        Object.entries(fields).filter(
                            ([, value]) => value !== undefined && value !== null
                        )
                    );

                    if (Object.keys(cleanedFields).length > 0) {
                        const tableDataDocRef = doc(tableDataRef, rowKey);
                        await setDoc(tableDataDocRef, cleanedFields, {
                            merge: true,
                        });
                    }
                }

                //delete specific fields from documents
                if (Object.keys(fieldsToDelete).length > 0) {
                    for (const [rowKey, fields] of Object.entries(
                        fieldsToDelete
                    )) {
                        const tableDataDocRef = doc(tableDataRef, rowKey);
                        const deleteObj = {};
                        fields.forEach((field) => {
                            deleteObj[field] = deleteField();
                        });
                        await setDoc(tableDataDocRef, deleteObj, {
                            merge: true,
                        });
                        console.log(
                            `Deleted fields ${fields} from document ${rowKey}`
                        );
                    }
                    // Clear fieldsToDelete after processing
                    setFieldsToDelete({});
                }

                console.log('Table data saved successfully');

                // Clear fieldsToDelete
                setFieldsToDelete({});
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
        loading,
        isLoggedIn,
        user,
        interestRate,
        setInterestRate,
        investmentReturnRate,
        setInvestmentReturnRate,
        targetNestEgg,
        setTargetNestEgg,
        dateOfBirth,
        setDateOfBirth,
        userInputs,
        setUserInputs,
        saveInputFields,
        saveTableData,
        logout,
        setFieldsToDelete,
        goals,
        saveGoal,
        // deleteGoal,
        commitGoalsToFirestore,
        fetchUserInputs,
    };
};

export default useUserData;
