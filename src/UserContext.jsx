import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { AuthContext } from './AuthContext';
import { convertDatabaseTimestamp } from './utils/dateUtils';
import { getUserRef } from './utils/getUserRef';
import { formatNumber, formatMonth } from './utils/formatUtils';
import { recalculateAllData } from './utils/recalculateAllData';
import useUserSettings from './utils/useUserSettings';

const defaultUserSettings = {
    interestRate: 5,
    investmentReturnRate: 10,
    targetNestEgg: 100000,
    dateOfBirth: null,
};

export const UserContext = createContext({
    userSettings: defaultUserSettings,
    setuserSettings: () => {},
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

    const [loading, setLoading] = useState(false);

    const [interestRate, setInterestRate] = useState(5);
    const [investmentReturnRate, setInvestmentReturnRate] = useState(10);
    const [targetNestEgg, setTargetNestEgg] = useState(100000);
    const [dateOfBirth, setDateOfBirth] = useState(null);

    const [rawTableData, setRawTableData] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [formattedTableData, setFormattedTableData] = useState([]);

    const [slothMapData, setSlothMapData] = useState([]);

    const {
        userInputs,
        goals,
        // interestRate,
        // investmentReturnRate,
        // targetNestEgg,
    } = useUserSettings();

    const initUserSettings = async () => {
        const userRef = getUserRef(currentUser);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const newUserSettings = {
                ...userDoc.data(),
                email: currentUser.email,
            };
            setuserSettings(newUserSettings);
        } else {
            await setDoc(userRef, defaultUserSettings);
            const newUserSettings = {
                ...defaultUserSettings,
                email: currentUser.email,
                uid: currentUser.uid,
            };
            setuserSettings(newUserSettings);
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
        return data;
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

            await initUserSettings();
            const tableData = await fetchTableData();
            const transformedData = transformData(tableData);
            updateFormattedData(transformedData);
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
            userSettings,
            setuserSettings,
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
        userSettings,
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
