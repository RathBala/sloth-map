import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { AuthContext } from './AuthContext';
import { convertDatabaseTimestamp } from './utils/dateUtils';
import { getUserRef } from './utils/getUserRef';
import { formatNumber, formatMonth } from './utils/formatUtils';
import { recalculateAllData } from './utils/recalculateAllData';
import useUserData from './utils/useUserData';

const defaultUserData = {
    interestRate: 5,
    investmentReturnRate: 10,
    targetNestEgg: 100000,
    dateOfBirth: null,
};

export const UserContext = createContext({
    userData: defaultUserData,
    setUserData: () => {},
    loading: true,
    setLoading: () => {},
    tableData: [],
    setTableData: () => {},
    formattedTableData: [],
    slothMapData: [],
    updateFormattedData: () => {},
});

export const UserContextProvider = ({ children }) => {
    const currentUser = useContext(AuthContext);

    const [userData, setUserData] = useState(defaultUserData);
    const [loading, setLoading] = useState(false);

    const [rawTableData, setRawTableData] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [formattedTableData, setFormattedTableData] = useState([]);

    const [slothMapData, setSlothMapData] = useState([]);

    const {
        userInputs,
        goals,
        interestRate,
        investmentReturnRate,
        targetNestEgg,
    } = useUserData();

    const initUserData = async () => {
        const userRef = getUserRef(currentUser);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const newUserData = {
                ...userDoc.data(),
                email: currentUser.email,
                uid: currentUser.uid,
                dateOfBirth: convertDatabaseTimestamp(
                    userDoc.data().dateOfBirth
                ),
            };
            console.log('Setting userData:', newUserData);
            setUserData(newUserData);
        } else {
            await setDoc(userRef, defaultUserData);
            const newUserData = {
                ...defaultUserData,
                email: currentUser.email,
                uid: currentUser.uid,
            };
            console.log('Creating and setting new userData:', newUserData);
            setUserData(newUserData);
        }
    };

    const fetchTableData = async () => {
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

        setRawTableData(loadedTableData);

        return loadedTableData;
    };

    const transformData = (rawData) => {
        const data = recalculateAllData(
            rawData,
            userInputs,
            goals,
            interestRate,
            investmentReturnRate,
            targetNestEgg
        );

        setTableData(data);
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

    const updateFormattedData = (tableData) => {
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

    const initData = async () => {
        try {
            setLoading(true);

            await initUserData();
            const tableData = await fetchTableData();
            transformData(tableData);
            updateFormattedData(tableData);
        } catch (e) {
            console.log('initData failed', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser) {
            initData();
        }
    }, [currentUser]);

    const value = useMemo(() => {
        return {
            userData,
            setUserData,
            loading,
            setLoading,

            rawTableData,
            setRawTableData,

            tableData,
            setTableData,

            formattedTableData,
            slothMapData,
            updateFormattedData,
        };
    }, [
        userData,
        loading,
        rawTableData,
        tableData,
        formattedTableData,
        slothMapData,
    ]);

    return (
        <UserContext.Provider value={value}>{children}</UserContext.Provider>
    );
};
