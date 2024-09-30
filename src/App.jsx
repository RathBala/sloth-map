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
        if (Object.keys(userInputs).length > 0) {
            recalculateData();
        }
    }, [userInputs]);

    useEffect(() => {
        recalculateData();
    }, [tableData]);

    const updateField = (
        data,
        index,
        field,
        value,
        trackChange = true,
        isManual = false
    ) => {
        // console.log(
        //     `updateField called for index: ${index}, field: ${field}, value: ${value}, trackChange: ${trackChange}, isManual: ${isManual}`
        // );
        // console.log('Data before update:', JSON.stringify(data, null, 2));
        let updatedData = [...data];

        updatedData[index] = { ...updatedData[index], [field]: value };

        // console.log(`Updated row ${index} with ${field}: ${value}`);
        // console.log(
        //     `Data after immediate update of row ${index}:`,
        //     JSON.stringify(updatedData, null, 2)
        // );

        if (field === 'depositSavings' || field === 'depositInvestments') {
            const currentMonth = updatedData[index].month;
            const nextActiveIndex = updatedData.findIndex(
                (row, idx) =>
                    idx > index && row.isActive && row.month !== currentMonth
            );

            if (nextActiveIndex !== -1) {
                for (let i = nextActiveIndex; i < updatedData.length; i++) {
                    updatedData[i][field] = value;
                }
            }
        }

        if (trackChange && isManual) {
            const [monthName, year] = updatedData[index].month.split(' ');
            const monthNumber =
                new Date(Date.parse(monthName + ' 1, 2000')).getMonth() + 1;
            const monthId = `${year}-${String(monthNumber).padStart(2, '0')}`;

            setUserInputs((prevChanges) => {
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

        updatedData = recalculateFromIndex(
            updatedData,
            0,
            interestRate,
            investmentReturnRate
        );

        // I COULD filter out inactive rows from this first, but is there a risk that it inadvertently
        // updates the inactive row later if it becomes active again?
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

        // console.log(
        //     'Final updated data after recalculation:',
        //     JSON.stringify(updatedData, null, 2)
        // );

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

    const handleFieldChange = (index, field, value, data) => {
        console.log(
            `handleFieldChange called for field: ${field} with value: ${value}`
        );

        let newData = data ? [...data] : [...tableData];
        let shouldRecalculate = false;
        let isManual = true;

        if (field === 'totalSavings' || field === 'totalInvestments') {
            const newValue = parseFloat(value);
            newData = updateField(
                newData,
                index,
                field,
                newValue,
                true,
                isManual
            );
            shouldRecalculate = true;
            if (field === 'totalSavings') {
                newData[index].isTotalSavingsManual = true;
            } else if (field === 'totalInvestments') {
                newData[index].isTotalInvestmentsManual = true;
            }
        } else if (
            field === 'withdrawals' ||
            field === 'depositSavings' ||
            field === 'depositInvestments'
        ) {
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

    // console.log('Formatted Table Data:', formattedTableData);

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
        recalculateFromIndex(
            updatedTableData,
            index,
            interestRate,
            investmentReturnRate
        );

        setRecalcTrigger((prev) => prev + 1);
        console.log('RecalcTrigger incremented');
    };

    const handleRowClick = (index) => {
        console.log(`Row click event at index ${index}`); //added
        const clickedMonth = tableData[index].month;
        // console.log(`Row clicked: Index ${index}, Month: ${clickedMonth}`);

        // console.log('Current state of all rows before update:');
        // tableData.forEach((row, idx) => {
        //     console.log(
        //         `Index: ${idx}, Month: ${row.month}, isActive: ${row.isActive}`
        //     );
        // });

        const updatedTableData = tableData.map((row, idx) => {
            if (row.month === clickedMonth) {
                // console.log(
                //     `Toggling isActive for index ${idx}: currently ${row.isActive}`
                // );
                return { ...row, isActive: idx === index };
            }
            return row;
        });

        // console.log('Updated state of all rows after update:');
        // updatedTableData.forEach((row, idx) => {
        //     console.log(
        //         `Index: ${idx}, Month: ${row.month}, isActive: ${row.isActive}`
        //     );
        // });

        // const recalculatedData = recalculateFromIndex(
        //     updatedTableData.filter((row) => row.isActive), // Filter for active rows
        //     index,
        //     interestRate,
        //     investmentReturnRate
        // );

        // const finalData = updatedTableData.map((row) => {
        //     if (row.isActive) {
        //         return (
        //             recalculatedData.find(
        //                 (activeRow) => activeRow.month === row.month
        //             ) || row
        //         );
        //     }
        //     return row;
        // });

        // setTableData(finalData);

        setTableData(updatedTableData);
        recalculateFromIndex(
            updatedTableData,
            index,
            interestRate,
            investmentReturnRate
        );

        setRecalcTrigger((prev) => prev + 1);
        console.log('RecalcTrigger incremented');
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
