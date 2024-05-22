import { useState, useEffect } from 'react';
import TableComponent from './components/TableComponent';
import InputFields from './components/InputFields';
import Authentication from './components/Auth';
import { formatNumber } from './utils/formatUtils';
import useUserData from './utils/useUserData';
import {
    generateData,
    recalculateFromIndex,
    ensureNestEgg,
} from './utils/calculations';
import './App.css';

const App = () => {
    const {
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
    } = useUserData();

    const [tableData, setTableData] = useState(() => generateData(500, 300, 0));
    const [recalcTrigger, setRecalcTrigger] = useState(0);

    useEffect(() => {
        if (
            interestRate !== null &&
            investmentReturnRate !== null &&
            targetNestEgg !== null
        ) {
            setTableData(generateData(500, 300, 0));
        }
    }, [interestRate, investmentReturnRate, targetNestEgg]);

    useEffect(() => {
        recalculateData();
    }, [interestRate, investmentReturnRate, targetNestEgg, recalcTrigger]);

    const recalculateData = () => {
        let updatedData = [...tableData];
        updatedData = recalculateFromIndex(
            updatedData,
            0,
            interestRate,
            investmentReturnRate
        );
        updatedData = ensureNestEgg(
            targetNestEgg,
            updatedData,
            interestRate,
            investmentReturnRate,
            recalculateFromIndex
        );
        setTableData(updatedData);
    };

    if (!isLoggedIn) {
        return <Authentication />;
    }

    const handleInterestRateChange = (e) =>
        setInterestRate(
            e.target.value === '' ? '' : parseFloat(e.target.value)
        );
    const handleInvestmentReturnRateChange = (e) =>
        setInvestmentReturnRate(
            e.target.value === '' ? '' : parseFloat(e.target.value)
        );
    const handleTargetNestEggChange = (e) =>
        setTargetNestEgg(
            e.target.value === '' ? '' : parseFloat(e.target.value)
        );
    const handleAgeChange = (e) =>
        setAge(e.target.value === '' ? '' : parseFloat(e.target.value));

    const handleFieldChange = (index, field, value) => {
        console.log(
            `handleFieldChange called for field: ${field} with value: ${value}`
        );

        setTableData((currentData) => {
            const newData = [...currentData];
            let shouldRecalculate = false;

            if (field === 'totalSavings' || field === 'totalInvestments') {
                const newValue = parseFloat(value);
                console.log(`Parsed new value:`, parseFloat(value));
                console.log(
                    `Current data at index ${index}:`,
                    newData[index][field]
                );
                newData[index][field] = newValue;
                shouldRecalculate = true;
                if (field === 'totalSavings') {
                    newData[index].isTotalSavingsManual = true;
                } else if (field === 'totalInvestments') {
                    newData[index].isTotalInvestmentsManual = true;
                }
            } else if (field === 'withdrawals') {
                newData[index][field] = parseFloat(value);
                shouldRecalculate = true;
            } else if (field === 'commentary') {
                newData[index][field] = value;
            } else {
                for (let i = index; i < newData.length; i++) {
                    if (
                        (field === 'depositSavings' &&
                            !newData[i].isTotalSavingsManual) ||
                        (field === 'depositInvestments' &&
                            !newData[i].isTotalInvestmentsManual)
                    ) {
                        newData[i][field] = parseFloat(value);
                    }
                }
                shouldRecalculate = true;
            }

            if (shouldRecalculate) {
                const updatedData = recalculateFromIndex(
                    newData,
                    index,
                    interestRate,
                    investmentReturnRate
                );
                console.log('After recalculation:', updatedData);
                return updatedData;
            } else {
                console.log('Data updated without recalculation:', newData);
                return newData;
            }
        });

        setRecalcTrigger((prev) => prev + 1);
        console.log('RecalcTrigger incremented');
    };

    const formattedTableData = tableData.map((entry) => ({
        ...entry,
        interestReturnFormatted: formatNumber(entry.interestReturn),
        investmentReturnFormatted: formatNumber(entry.investmentReturn),
        totalDepositFormatted: formatNumber(
            entry.depositSavings + entry.depositInvestments
        ),
        totalSavingsFormatted: formatNumber(entry.totalSavings),
        totalInvestmentsFormatted: formatNumber(entry.totalInvestments),
        totalSavedFormatted: formatNumber(entry.totalSaved),
        grandTotalFormatted: formatNumber(entry.grandTotal),
    }));

    console.log('Formatted Table Data:', formattedTableData);

    const lastEntry = tableData[tableData.length - 1];
    const achieveNestEggBy = lastEntry ? lastEntry.month : 'TBC';

    console.log('Achieve nest egg by: ', achieveNestEggBy);

    const handleSaveClick = () => {
        console.log('Save button clicked');
        saveUserData();
    };

    return (
        <div className="App">
            <div className="top-nav">
                <div className="welcome">
                    <h4>Welcome</h4>
                    <span>
                        {user && user.email ? user.email : 'No user logged in'}
                    </span>
                </div>
                <button type="button" onClick={handleSaveClick}>
                    Save
                </button>
                <button onClick={logout}>Log out</button>
            </div>
            <InputFields
                interestRate={interestRate || ''}
                investmentReturnRate={investmentReturnRate || ''}
                targetNestEgg={targetNestEgg || ''}
                age={age || ''}
                handleInterestRateChange={handleInterestRateChange}
                handleInvestmentReturnRateChange={
                    handleInvestmentReturnRateChange
                }
                handleTargetNestEggChange={handleTargetNestEggChange}
                handleAgeChange={handleAgeChange}
                achieveNestEggBy={achieveNestEggBy}
            />
            <TableComponent
                data={formattedTableData}
                onFieldChange={handleFieldChange}
            />
        </div>
    );
};

export default App;
