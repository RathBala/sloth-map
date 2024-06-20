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
        manualChanges,
        setManualChanges,
        saveInputFields,
        saveTableData,
        logout,
    } = useUserData();

    const [tableData, setTableData] = useState(() => generateData(500, 300, 0));
    const [recalcTrigger, setRecalcTrigger] = useState(0);

    useEffect(() => {
        console.log(
            'Recalculating data due to change in interest rate, investment return rate, or target nest egg'
        );
        if (
            interestRate !== null &&
            investmentReturnRate !== null &&
            targetNestEgg !== null
        ) {
            setTableData(generateData(500, 300, 0));
        }
    }, [interestRate, investmentReturnRate, targetNestEgg]);

    useEffect(() => {
        console.log(
            'Recalculating data due to change in table data or manual changes'
        );
        recalculateData();
    }, [interestRate, investmentReturnRate, targetNestEgg, recalcTrigger]);

    useEffect(() => {
        console.log('Manual changes detected, recalculating data');
        if (Object.keys(manualChanges).length > 0) {
            recalculateData();
        }
    }, [manualChanges]);

    // const bulkUpdateFields = (data, startIndex, field, value) => {
    //     const updatedData = [...data];

    //     for (let i = startIndex; i < updatedData.length; i++) {
    //         updatedData[i] = { ...updatedData[i], [field]: value };
    //     }

    //     return updatedData;
    // };

    const updateField = (
        data,
        index,
        field,
        value,
        trackChange = true,
        isManual = false
    ) => {
        console.log(
            `updateField called for index: ${index}, field: ${field}, value: ${value}, trackChange: ${trackChange}, isManual: ${isManual}`
        );
        console.log('Data before update:', JSON.stringify(data, null, 2));

        let updatedData = [...data];

        // Update the specific field for the given index
        updatedData[index] = { ...updatedData[index], [field]: value };

        if (field === 'depositSavings' || field === 'depositInvestments') {
            for (let i = index + 1; i < updatedData.length; i++) {
                if (
                    (field === 'depositSavings' &&
                        !updatedData[i].isTotalSavingsManual) ||
                    (field === 'depositInvestments' &&
                        !updatedData[i].isTotalInvestmentsManual)
                ) {
                    updatedData[i][field] = value;
                    // console.log(
                    //     `Propagated ${field} to index ${i}: ${JSON.stringify(updatedData[i], null, 2)}`
                    // );
                }
            }
        }

        console.log(
            'Data after field update:',
            JSON.stringify(updatedData, null, 2)
        );

        if (trackChange) {
            const [monthName, year] = updatedData[index].month.split(' ');
            const monthNumber =
                new Date(Date.parse(monthName + ' 1, 2000')).getMonth() + 1;
            const monthId = `${year}-${String(monthNumber).padStart(2, '0')}`;

            setManualChanges((prevChanges) => {
                const newChanges = { ...prevChanges };
                const existingChange =
                    prevChanges[monthId] && prevChanges[monthId][field];

                if (!newChanges[monthId]) {
                    newChanges[monthId] = {};
                }

                if (isManual && (!existingChange || existingChange !== value)) {
                    newChanges[monthId][field] = value;
                    console.log(
                        'Manual changes updated:',
                        JSON.stringify(newChanges, null, 2)
                    );
                    return newChanges;
                }

                return prevChanges;
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
                    // Determine if the goal is being moved to a new month
                    let isManualChange =
                        goal.month !== updatedData[sufficientFundsIndex].month;

                    // Track new location change using updateField
                    updatedData = updateField(
                        updatedData,
                        sufficientFundsIndex,
                        'goal',
                        goal.goal,
                        true,
                        isManualChange // Set based on whether the month has changed
                    );
                    updatedData = updateField(
                        updatedData,
                        sufficientFundsIndex,
                        'withdrawals',
                        goal.withdrawals,
                        true,
                        isManualChange // Set based on whether the month has changed
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
        let updatedData = tableData.filter((row) => row.isActive);

        console.log(
            'Data before recalculation:',
            JSON.stringify(updatedData, null, 2)
        );

        updatedData = recalculateFromIndex(
            updatedData,
            0,
            interestRate,
            investmentReturnRate
        );

        console.log(
            'Data after first recalculateFromIndex:',
            JSON.stringify(updatedData, null, 2)
        );
        console.log(
            'Manual changes being applied:',
            JSON.stringify(manualChanges, null, 2)
        );

        for (const [monthId, changes] of Object.entries(manualChanges)) {
            console.log(
                `Processing changes for monthId: ${monthId}, changes: ${JSON.stringify(changes, null, 2)}`
            );

            const monthIndex = updatedData.findIndex((row) => {
                const [monthName, year] = row.month.split(' ');
                const monthNumber =
                    new Date(Date.parse(monthName + ' 1, 2000')).getMonth() + 1;
                const rowMonthId = `${year}-${String(monthNumber).padStart(2, '0')}`;
                return rowMonthId === monthId;
            });

            if (monthIndex !== -1) {
                console.log(
                    `Applying changes for monthId: ${monthId}, at index: ${monthIndex}`
                );

                for (const [field, value] of Object.entries(changes)) {
                    updatedData[monthIndex][field] = value;

                    console.log(
                        `Updated ${field} at index ${monthIndex}: ${JSON.stringify(updatedData[monthIndex], null, 2)}`
                    );

                    if (
                        field === 'depositSavings' ||
                        field === 'depositInvestments'
                    ) {
                        for (
                            let i = monthIndex + 1;
                            i < updatedData.length;
                            i++
                        ) {
                            updatedData[i][field] = value;
                            console.log(
                                `Propagated ${field} to index ${i}: ${JSON.stringify(updatedData[i], null, 2)}`
                            );
                        }
                    }
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

                console.log(
                    'Data before second recalculateFromIndex:',
                    JSON.stringify(updatedData, null, 2)
                );

                updatedData = recalculateFromIndex(
                    updatedData,
                    monthIndex,
                    interestRate,
                    investmentReturnRate
                );

                console.log(
                    'Data after second recalculateFromIndex:',
                    JSON.stringify(updatedData, null, 2)
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

        console.log(
            'Final updated data after recalculation:',
            JSON.stringify(updatedData, null, 2)
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

    const handleFieldChange = (index, field, value, data) => {
        console.log(
            `handleFieldChange called for field: ${field} with value: ${value}`
        );

        let newData = data ? [...data] : [...tableData];
        let shouldRecalculate = false;
        let isManual = true;

        if (field === 'totalSavings' || field === 'totalInvestments') {
            const newValue = parseFloat(value);
            newData = updateField(newData, index, field, newValue);
            shouldRecalculate = true;
            if (field === 'totalSavings') {
                newData[index].isTotalSavingsManual = true;
            } else if (field === 'totalInvestments') {
                newData[index].isTotalInvestmentsManual = true;
            }
        } else if (field === 'withdrawals') {
            newData = updateField(
                newData,
                index,
                field,
                parseFloat(value),
                true,
                isManual
            );
            shouldRecalculate = true;
        } else if (field === 'goal') {
            newData = updateField(newData, index, field, value, true, isManual);
        } else if (
            field === 'depositSavings' ||
            field === 'depositInvestments'
        ) {
            for (let i = index; i < newData.length; i++) {
                // if (
                //     (field === 'depositSavings' &&
                //         !newData[i].isTotalSavingsManual) ||
                //     (field === 'depositInvestments' &&
                //         !newData[i].isTotalInvestmentsManual)
                // ) {
                if (
                    field === 'depositSavings' ||
                    field === 'depositInvestments'
                ) {
                    console.log(
                        `Before updateField - Index ${i}, field: ${field}, value: ${value}`
                    );

                    newData = updateField(
                        newData,
                        i,
                        field,
                        parseFloat(value),
                        true,
                        isManual
                    );
                    console.log(
                        `After updateField - Index ${i}, updated data: ${JSON.stringify(newData[i], null, 2)}`
                    );
                }
            }
            shouldRecalculate = true;
        }

        if (shouldRecalculate) {
            console.log('handleFieldChange calling recalculateFromIndex');
            newData = recalculateFromIndex(
                newData,
                index,
                interestRate,
                investmentReturnRate
            );
            console.log('After recalculation:', newData);
        } else {
            console.log('Data updated without recalculation:', newData);
        }

        setTableData(newData);
        setRecalcTrigger((prev) => prev + 1);
        console.log('RecalcTrigger incremented');

        return newData;
    };

    const handleSaveClick = async () => {
        console.log('Save button clicked');
        await saveInputFields();
        await saveTableData();
        setManualChanges({});
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

    // console.log('Formatted Table Data:', formattedTableData);

    const slothMapData = processDataForSlothMap(formattedTableData);

    const lastEntry = tableData[tableData.length - 1];
    const achieveNestEggBy = lastEntry ? lastEntry.month : 'TBC';

    console.log('Achieve nest egg by: ', achieveNestEggBy);

    const addAltScenario = (index) => {
        const clickedMonth = tableData[index].month; // Getting the month of the original row
        console.log(
            `Adding new altScenario for month: ${clickedMonth}, based on row index: ${index}`
        );

        const newRow = { ...tableData[index], isAlt: true, isActive: true }; // Create new alt scenario from original
        console.log(`New altScenario row created from index ${index}:`, newRow);

        let updatedTableData = [
            ...tableData.slice(0, index + 1), // Include up to the original row
            newRow, // Add new alt scenario row
            ...tableData.slice(index + 1), // Include the rest of the rows
        ];

        // Set the original row as inactive explicitly and ensure that no other rows in the same month are active
        updatedTableData = updatedTableData.map((row, i) => ({
            ...row,
            isActive:
                row.month === clickedMonth ? i === index + 1 : row.isActive, // Set only the new row as active, keep other rows' isActive state unchanged
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
        // setActiveRow(index + 1); // Set the newly added altScenario row as active in the UI
    };

    const handleRowClick = (index) => {
        const clickedMonth = tableData[index].month;
        console.log(`Row clicked: Index ${index}, Month: ${clickedMonth}`);

        console.log('Current state of all rows before update:');
        tableData.forEach((row, idx) => {
            console.log(
                `Index: ${idx}, Month: ${row.month}, isActive: ${row.isActive}`
            );
        });
        const updatedTableData = tableData.map((row, idx) => {
            if (row.month === clickedMonth) {
                console.log(
                    `Toggling isActive for index ${idx}: currently ${row.isActive}`
                );
                return { ...row, isActive: idx === index };
            }
            return row;
        });

        console.log('Updated state of all rows after update:');
        updatedTableData.forEach((row, idx) => {
            console.log(
                `Index: ${idx}, Month: ${row.month}, isActive: ${row.isActive}`
            );
        });

        setTableData(updatedTableData);
        recalculateData(); // ADDED line at the end of handleRowClick
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
