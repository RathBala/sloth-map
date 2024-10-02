/* eslint-disable no-debugger */
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import TableComponent from './components/TableComponent';
import InputFields from './components/InputFields';
import Authentication from './components/Auth';
import SlothMap from './components/SlothMap';
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
        userInputs,
        setUserInputs,
        saveInputFields,
        saveTableData,
        logout,
    } = useUserData();

    const [tableData, setTableData] = useState(() => generateData(500, 300, 0));

    useEffect(() => {
        if (
            interestRate !== null &&
            investmentReturnRate !== null &&
            targetNestEgg !== null
        ) {
            recalculateData();
        }
    }, [
        interestRate,
        investmentReturnRate,
        targetNestEgg,
        userInputs,
        tableData,
    ]);

    const updateField = (
        data,
        index,
        field,
        value,
        trackChange = true,
        isManual = false
    ) => {
        let updatedData = [...data];

        updatedData[index] = { ...updatedData[index], [field]: value };

        if (field === 'depositSavings' || field === 'depositInvestments') {
            const currentMonth = updatedData[index].month;
            const nextActiveIndex = updatedData.findIndex(
                (row, idx) =>
                    idx > index && row.isActive && row.month !== currentMonth
            );

            const monthsToUpdate = [];

            if (nextActiveIndex !== -1) {
                for (let i = nextActiveIndex; i < updatedData.length; i++) {
                    updatedData[i][field] = value;
                    monthsToUpdate.push(updatedData[i].month);
                }
            }

            // Only remove manual changes from userInputs if the change is manual
            if (isManual && monthsToUpdate.length > 0) {
                setUserInputs((prevChanges) => {
                    const newChanges = { ...prevChanges };
                    monthsToUpdate.forEach((monthStr) => {
                        const [monthName, year] = monthStr.split(' ');
                        const monthNumber =
                            new Date(
                                Date.parse(`${monthName} 1, 2000`)
                            ).getMonth() + 1;
                        const monthId = `${year}-${String(monthNumber).padStart(2, '0')}`;

                        if (newChanges[monthId] && newChanges[monthId][field]) {
                            // Remove the manual change for this field
                            delete newChanges[monthId][field];
                            if (Object.keys(newChanges[monthId]).length === 0) {
                                delete newChanges[monthId];
                            }
                        }
                    });
                    return newChanges;
                });
            }
        }

        if (trackChange && isManual) {
            const [monthName, year] = updatedData[index].month.split(' ');
            const monthNumber =
                new Date(Date.parse(monthName + ' 1, 2000')).getMonth() + 1;
            const monthId = `${year}-${String(monthNumber).padStart(2, '0')}`;

            setUserInputs((prevChanges) => {
                const newChanges = { ...prevChanges };
                if (!newChanges[monthId]) {
                    newChanges[monthId] = {};
                }
                newChanges[monthId][field] = value;
                return newChanges;
            });
        }

        return updatedData;
    };

    const adjustGoals = (data) => {
        let updatedData = JSON.parse(JSON.stringify(data));
        let goals = [];

        updatedData.forEach((entry, index) => {
            if (entry.withdrawals > 0 && entry.goal) {
                goals.push({
                    goal: entry.goal,
                    withdrawals: entry.withdrawals,
                    originalIndex: index,
                    month: entry.month,
                });

                updatedData = updateField(
                    updatedData,
                    index,
                    'goal',
                    '',
                    true,
                    false
                );
                updatedData = updateField(
                    updatedData,
                    index,
                    'withdrawals',
                    0,
                    true,
                    false
                );
            }
        });

        updatedData = recalculateFromIndex(
            updatedData,
            0,
            interestRate,
            investmentReturnRate
        );

        goals.sort((a, b) => new Date(a.month) - new Date(b.month));

        goals.forEach((goal) => {
            let withdrawalAmount = goal.withdrawals;
            let sufficientFundsIndex = goal.originalIndex;

            while (sufficientFundsIndex < updatedData.length) {
                let hypotheticalSavings =
                    updatedData[sufficientFundsIndex].totalSavings -
                    withdrawalAmount;
                let hypotheticalInvestments =
                    updatedData[sufficientFundsIndex].totalInvestments;

                if (hypotheticalSavings < 0) {
                    hypotheticalInvestments += hypotheticalSavings;
                    hypotheticalSavings = 0;
                }

                if (hypotheticalInvestments >= 0) {
                    let isManualChange =
                        goal.month !== updatedData[sufficientFundsIndex].month;

                    updatedData = updateField(
                        updatedData,
                        sufficientFundsIndex,
                        'goal',
                        goal.goal,
                        true,
                        isManualChange
                    );
                    updatedData = updateField(
                        updatedData,
                        sufficientFundsIndex,
                        'withdrawals',
                        goal.withdrawals,
                        true,
                        isManualChange
                    );

                    updatedData = recalculateFromIndex(
                        updatedData,
                        sufficientFundsIndex,
                        interestRate,
                        investmentReturnRate
                    );
                    break;
                }

                sufficientFundsIndex++;
            }
        });

        return updatedData;
    };

    const recalculateData = () => {
        console.log('recalculateData called');

        let updatedData = tableData.map((row) => ({
            ...row,
            isActive: row.isActive !== undefined ? row.isActive : true,
        }));

        debugger;

        updatedData = recalculateFromIndex(
            updatedData,
            0,
            interestRate,
            investmentReturnRate
        );

        debugger;

        for (const [monthId, changes] of Object.entries(userInputs)) {
            const monthIndex = updatedData.findIndex((row) => {
                const [monthName, year] = row.month.split(' ');
                const monthNumber =
                    new Date(Date.parse(monthName + ' 1, 2000')).getMonth() + 1;
                const rowMonthId = `${year}-${String(monthNumber).padStart(2, '0')}`;
                return rowMonthId === monthId;
            });

            if (monthIndex !== -1 && updatedData[monthIndex].isActive) {
                for (const [field, value] of Object.entries(changes)) {
                    updatedData = updateField(
                        updatedData,
                        monthIndex,
                        field,
                        value,
                        false
                    );
                }

                if (
                    Object.prototype.hasOwnProperty.call(
                        changes,
                        'totalSavings'
                    )
                ) {
                    updatedData[monthIndex].isTotalSavingsManual = true;
                }
                if (
                    Object.prototype.hasOwnProperty.call(
                        changes,
                        'totalInvestments'
                    )
                ) {
                    updatedData[monthIndex].isTotalInvestmentsManual = true;
                }

                updatedData = recalculateFromIndex(
                    updatedData,
                    monthIndex,
                    interestRate,
                    investmentReturnRate
                );
            }
        }

        updatedData = adjustGoals(updatedData);

        updatedData = ensureNestEgg(
            targetNestEgg,
            updatedData,
            interestRate,
            investmentReturnRate,
            recalculateFromIndex
        );

        if (JSON.stringify(tableData) !== JSON.stringify(updatedData)) {
            setTableData(updatedData); // Only update state if there is a change
        }
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

        // Clone the current table data to avoid mutating state directly
        let updatedTableData = [...tableData];

        // Update the specific field in the cloned data
        updatedTableData = updateField(
            updatedTableData,
            index,
            field,
            value,
            true,
            true
        );

        // Set manual flags if necessary
        if (field === 'totalSavings') {
            updatedTableData[index].isTotalSavingsManual = true;
        } else if (field === 'totalInvestments') {
            updatedTableData[index].isTotalInvestmentsManual = true;
        }

        // Update the state to reflect the change in the UI immediately
        setTableData(updatedTableData);

        // Record the manual change in userInputs
        const [monthName, year] = updatedTableData[index].month.split(' ');
        const monthNumber =
            new Date(Date.parse(`${monthName} 1, 2000`)).getMonth() + 1;
        const monthId = `${year}-${String(monthNumber).padStart(2, '0')}`;

        setUserInputs((prevChanges) => {
            const newChanges = { ...prevChanges };
            if (!newChanges[monthId]) {
                newChanges[monthId] = {};
            }
            newChanges[monthId][field] = value;
            return newChanges;
        });

        // No need to call recalculateFromIndex or increment recalcTrigger here
    };

    const handleSaveClick = async () => {
        console.log('Save button clicked');
        await saveInputFields();
        await saveTableData();
        setUserInputs({});
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

    const slothMapData = processDataForSlothMap(formattedTableData);

    const lastEntry = tableData[tableData.length - 1];
    const achieveNestEggBy = lastEntry ? lastEntry.month : 'TBC';

    console.log('Achieve nest egg by: ', achieveNestEggBy);

    const addAltScenario = (index) => {
        const clickedMonth = tableData[index].month;
        console.log(
            `Adding new altScenario for month: ${clickedMonth}, based on row index: ${index}`
        );

        const newRow = { ...tableData[index], isAlt: true, isActive: true };
        console.log(`New altScenario row created from index ${index}:`, newRow);

        let updatedTableData = [
            ...tableData.slice(0, index + 1),
            newRow,
            ...tableData.slice(index + 1),
        ];

        updatedTableData = updatedTableData.map((row, i) => ({
            ...row,
            isActive:
                row.month === clickedMonth ? i === index + 1 : row.isActive,
        }));

        console.log(`Updated states for month ${clickedMonth}:`);
        updatedTableData
            .filter((row) => row.month === clickedMonth)
            .forEach((row) => {
                console.log(
                    `Row index ${updatedTableData.indexOf(row)}: isActive = ${row.isActive}`
                );
            });

        setTableData(updatedTableData);
    };

    const handleRowClick = (index) => {
        console.log(`Row click event at index ${index}`);
        const clickedMonth = tableData[index].month;

        const updatedTableData = tableData.map((row, idx) => {
            if (row.month === clickedMonth) {
                return { ...row, isActive: idx === index };
            }
            return row;
        });

        setTableData(updatedTableData);
    };

    return (
        <Router>
            <div className="App">
                <div className="top-nav">
                    <div className="welcome">
                        <h4>Welcome</h4>
                        <span>
                            {user && user.email
                                ? user.email
                                : 'No user logged in'}
                        </span>
                    </div>
                    <button type="button" onClick={handleSaveClick}>
                        Save
                    </button>
                    <Link to="/map">
                        <button type="button">Show Sloth Map</button>
                    </Link>
                    <button onClick={logout}>Log out</button>
                </div>
                <div className="content">
                    <Routes>
                        <Route
                            path="*"
                            element={<div>No match for this route</div>}
                        />
                        <Route
                            path="/map"
                            element={
                                <div className="slothmap-container">
                                    {' '}
                                    <SlothMap data={slothMapData} />
                                </div>
                            }
                        />
                        <Route
                            path="/"
                            element={
                                <>
                                    <InputFields
                                        interestRate={interestRate || ''}
                                        investmentReturnRate={
                                            investmentReturnRate || ''
                                        }
                                        targetNestEgg={targetNestEgg || ''}
                                        age={age || ''}
                                        handleInterestRateChange={
                                            handleInterestRateChange
                                        }
                                        handleInvestmentReturnRateChange={
                                            handleInvestmentReturnRateChange
                                        }
                                        handleTargetNestEggChange={
                                            handleTargetNestEggChange
                                        }
                                        handleAgeChange={handleAgeChange}
                                        achieveNestEggBy={achieveNestEggBy}
                                    />
                                    <TableComponent
                                        data={formattedTableData}
                                        tableData={tableData}
                                        onFieldChange={handleFieldChange}
                                        onAltScenario={addAltScenario}
                                        handleRowClick={handleRowClick}
                                    />
                                </>
                            }
                        />
                    </Routes>
                </div>
            </div>
        </Router>
    );
};

const processDataForSlothMap = (data) => {
    const nodes = [];
    for (let i = 0; i < data.length; i++) {
        const current = data[i];
        const previous = data[i - 1] || {};

        if (
            current.depositInvestments !== previous.depositInvestments ||
            current.depositSavings !== previous.depositSavings
        ) {
            nodes.push({
                id: current.month,
                type: 'rect',
                text: `Save £${current.depositSavings} in savings; Save £${current.depositInvestments} in investments`,
                date: current.month,
                grandTotal: current.grandTotal,
            });
        }
        if (current.withdrawals > 0) {
            nodes.push({
                id: current.month,
                type: 'circle',
                text: `${current.goal || 'Withdrawal'} for £${current.withdrawals}`,
                date: current.month,
                grandTotal: current.grandTotal,
            });
        }
    }
    return nodes;
};

export default App;
