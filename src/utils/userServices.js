import { getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { getUserRef } from './getUserRef';

export async function fetchUserSettingsFromFirestore(currentUser) {
    if (!currentUser) return null;

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
    if (!currentUser) return;

    const userRef = getUserRef(currentUser);
    await setDoc(userRef, userSettings);
}

export async function fetchTableDataFromFirestore(currentUser) {
    if (!currentUser) return [];

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
