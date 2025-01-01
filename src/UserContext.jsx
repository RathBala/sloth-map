import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { AuthContext } from './AuthContext';
import { convertDatabaseTimestamp } from './utils/dateUtils';
import { getUserRef } from './utils/getUserRef';
import { formatNumber, formatMonth } from './utils/formatUtils';

const defaultUserData = {
    interestRate: 3,
    investmentReturnRate: 5,
    targetNestEgg: 100000,
    dateOfBirth: null,
};

export const UserContext = createContext({
    userData: defaultUserData,
    setUserData: () => {},
    tableData: [],
    setTableData: () => {},
    formattedTableData: [],
    slothMapData: [],
    updateFormattedData: () => {},
});

export const UserContextProvider = ({ children }) => {
    const currentUser = useContext(AuthContext);
    const [userData, setUserData] = useState(defaultUserData);
    const [tableData, setTableData] = useState([]);
    const [formattedTableData, setFormattedTableData] = useState([]);
    const [slothMapData, setSlothMapData] = useState([]);

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
                setUserData({
                    ...defaultUserData,
                    email: currentUser.email,
                    uid: currentUser.uid,
                });
            }
        } catch (error) {
            console.error('Failed to initialise user data:', error);
        }
    };

    const fetchTableData = async () => {
        if (!currentUser) return;

        const userRef = getUserRef(currentUser);
        const tableDataRef = collection(userRef, 'tableData');
        const snapshot = await getDocs(tableDataRef);

        const loadedTableData = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            const rowKey = doc.id; // e.g., "2024-10-0"
            const month = rowKey.split('-').slice(0, 2).join('-'); // Extract "2024-10"
            loadedTableData.push({ ...data, rowKey, month });
        });
        setTableData(loadedTableData);
    };

    const processDataForSlothMap = (data) => {
        const today = new Date();
        const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

        const nodes = [];
        for (let i = 0; i < data.length; i++) {
            const current = data[i];

            if (!current.month) {
                console.warn(
                    `Entry at index ${i} is missing 'month':`,
                    current
                );
                continue;
            }

            if (current.month < currentMonth) {
                continue;
            }

            const previous = data[i - 1] || {};

            if (
                current.depositInvestments !== previous.depositInvestments ||
                current.depositSavings !== previous.depositSavings
            ) {
                nodes.push({
                    id: current.id || i,
                    type: 'rect',
                    text: `Save £${current.depositSavings} in savings; Save £${current.depositInvestments} in investments`,
                    date: formatMonth(current.month),
                    grandTotal: current.grandTotal,
                });
            }

            if (current.goal) {
                nodes.push({
                    id: current.rowKey,
                    type: 'circle',
                    text: `${current.goal.name} for £${formatNumber(current.goal.amount)}`,
                    date: formatMonth(current.month),
                    grandTotal: current.grandTotal,
                });
            }
        }
        return nodes;
    };

    const updateFormattedData = () => {
        const formatted = tableData.map((entry) => ({
            ...entry,
            interestReturnFormatted: formatNumber(entry.interestReturn),
            investmentReturnFormatted: formatNumber(entry.investmentReturn),
            totalSavingsFormatted: formatNumber(entry.totalSavings),
            totalInvestmentsFormatted: formatNumber(entry.totalInvestments),
            grandTotalFormatted: formatNumber(entry.grandTotal),
        }));

        setFormattedTableData(formatted);

        const mapData = processDataForSlothMap(formatted);
        setSlothMapData(mapData);
    };

    useEffect(() => {
        if (currentUser) {
            initUserData(currentUser);
            fetchTableData();
        }
    }, [currentUser]);

    useEffect(() => {
        updateFormattedData();
    }, [tableData]);

    const value = useMemo(() => {
        return {
            userData,
            setUserData,
            tableData,
            setTableData,
            formattedTableData,
            slothMapData,
            updateFormattedData,
        };
    }, [userData, tableData, formattedTableData, slothMapData]);

    return (
        <UserContext.Provider value={value}>{children}</UserContext.Provider>
    );
};

export const useUserData = () => useContext(UserContext);
