import {
    getDoc,
    setDoc,
    collection,
    getDocs,
    doc,
    deleteField,
} from 'firebase/firestore';
import { getUserRef } from './getUserRef';
import { db } from '../firebase-config';

export async function fetchUserSettingsFromFirestore(currentUser) {
    const userRef = getUserRef(currentUser);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
        return {
            ...userDoc.data(),
            email: currentUser.email,
        };
    } else {
        return null; // caller decides what to do
    }
}

export async function saveUserSettingsToFirestore(currentUser, userSettings) {
    const userRef = getUserRef(currentUser);
    await setDoc(userRef, userSettings, { merge: true });
}

export async function fetchTableDataFromFirestore(currentUser) {
    const userRef = getUserRef(currentUser);
    const tableDataRef = collection(userRef, 'tableData');
    const snapshot = await getDocs(tableDataRef);

    const loadedTableData = [];
    snapshot.forEach((doc) => {
        const data = doc.data();
        const rowKey = doc.id;
        const [year, month] = rowKey.split('-');
        loadedTableData.push({
            ...data,
            rowKey,
            month: `${year}-${month}`,
        });
    });

    return loadedTableData;
}

export async function saveTableDataToFirestore(
    currentUser,
    userInputs,
    fieldsToDelete
) {
    const userRef = getUserRef(currentUser);
    const tableDataRef = collection(userRef, 'tableData');

    for (const [rowKey, fields] of Object.entries(userInputs)) {
        const cleaned = {};
        for (const [k, v] of Object.entries(fields)) {
            if (v !== undefined && v !== null) cleaned[k] = v;
        }
        if (Object.keys(cleaned).length > 0) {
            await setDoc(doc(tableDataRef, rowKey), cleaned, { merge: true });
        }
    }

    for (const [rowKey, fields] of Object.entries(fieldsToDelete)) {
        const deleteObj = {};
        fields.forEach((field) => {
            deleteObj[field] = deleteField();
        });
        await setDoc(doc(tableDataRef, rowKey), deleteObj, { merge: true });
    }
}

export async function fetchGoalsFromFirestore(currentUser) {
    const goalsRef = collection(db, 'users', currentUser.uid, 'goals');
    const snapshot = await getDocs(goalsRef);
    const loadedGoals = {};

    snapshot.forEach((docSnap) => {
        loadedGoals[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
    });
    return loadedGoals;
}

export async function saveGoalToFirestore(currentUser, goal) {
    const userRef = doc(db, 'users', currentUser.uid);
    const goalsRef = collection(userRef, 'goals');
    await setDoc(doc(goalsRef, goal.id), goal, { merge: true });
}
