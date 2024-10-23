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

    const [interestRate, setInterestRate] = useState(null);
    const [investmentReturnRate, setInvestmentReturnRate] = useState(null);
    const [targetNestEgg, setTargetNestEgg] = useState(null);
    const [age, setAge] = useState(null);
    const [userInputs, setUserInputs] = useState({});
    const [goals, setGoals] = useState({});

    const [rowsToDelete, setRowsToDelete] = useState([]);

    const [loading, setLoading] = useState(true);

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
                setLoading(true);

                try {
                    const userDoc = await getDoc(userRef);
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        console.log('User data from Firestore:', userData);

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
                        setAge(calculateAge(userData.dateOfBirth));

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
                        setIsLoggedIn(false);
                        setUser(null);
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
        loading,
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
        goals,
        saveGoal,
        // deleteGoal,
        commitGoalsToFirestore,
        fetchUserInputs,
    };
};

export default useUserData;
