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

        // Update the specific field for the current row
        updatedData[index] = { ...updatedData[index], [field]: value };

        // If the field is 'depositSavings' or 'depositInvestments', propagate the change to subsequent active rows
        if (field === 'depositSavings' || field === 'depositInvestments') {
            // Start updating from the next row
            for (let i = index + 1; i < updatedData.length; i++) {
                if (updatedData[i].isActive) {
                    // Clone the row before modifying
                    updatedData[i] = { ...updatedData[i], [field]: value };
                }
            }
        }

        // Track manual changes if needed
        if (trackChange && isManual) {
            const rowKey = updatedData[index].rowKey;

            setUserInputs((prevChanges) => {
                const newChanges = { ...prevChanges };
                if (!newChanges[rowKey]) {
                    newChanges[rowKey] = {};
                }
                newChanges[rowKey][field] = value;
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
                    id: entry.id,
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

        goals.sort((a, b) => a.originalIndex - b.originalIndex);

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

        for (const [rowKey, changes] of Object.entries(userInputs)) {
            const rowIndex = updatedData.findIndex(
                (row) => row.rowKey === rowKey
            );

            if (rowIndex !== -1 && updatedData[rowIndex].isActive) {
                for (const [field, value] of Object.entries(changes)) {
                    updatedData = updateField(
                        updatedData,
                        rowIndex,
                        field,
                        value,
                        false
                    );
                }

                // Set manual flags if necessary
                if (
                    Object.prototype.hasOwnProperty.call(
                        changes,
                        'totalSavings'
                    )
                ) {
                    updatedData[rowIndex].isTotalSavingsManual = true;
                }
                if (
                    Object.prototype.hasOwnProperty.call(
                        changes,
                        'totalInvestments'
                    )
                ) {
                    updatedData[rowIndex].isTotalInvestmentsManual = true;
                }

                updatedData = recalculateFromIndex(
                    updatedData,
                    rowIndex,
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
        const rowKey = updatedTableData[index].rowKey;

        setUserInputs((prevChanges) => {
            const newChanges = { ...prevChanges };
            if (!newChanges[rowKey]) {
                newChanges[rowKey] = {};
            }
            newChanges[rowKey][field] = value;
            return newChanges;
        });
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

        const variantsForMonth = tableData.filter(
            (row) => row.month === clickedMonth
        );
        const maxVariantIndex = Math.max(
            ...variantsForMonth.map((row) => row.variantIndex)
        );

        const newVariantIndex = maxVariantIndex + 1;

        const newRow = {
            ...tableData[index],
            variantIndex: newVariantIndex,
            rowKey: `${clickedMonth}-${newVariantIndex}`,
            isAlt: true,
            isActive: true,
        };

        console.log(`New altScenario row created from index ${index}:`, newRow);

        let updatedTableData = [
            ...tableData.slice(0, index + 1),
            newRow,
            ...tableData.slice(index + 1),
        ];

        updatedTableData = updatedTableData.map((row) => {
            if (row.month === clickedMonth) {
                return { ...row, isActive: row.rowKey === newRow.rowKey };
            }
            return row;
        });

        setTableData(updatedTableData);
    };

    const handleRowClick = (index) => {
        const clickedRow = tableData[index];

        const updatedTableData = tableData.map((row) => {
            if (row.month === clickedRow.month && row.id !== clickedRow.id) {
                // Deactivate other rows with the same month
                return { ...row, isActive: false };
            } else if (row.id === clickedRow.id) {
                // Activate the clicked row
                return { ...row, isActive: true };
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
                id: current.id,
                type: 'rect',
                text: `Save £${current.depositSavings} in savings; Save £${current.depositInvestments} in investments`,
                date: current.month,
                grandTotal: current.grandTotal,
            });
        }
        if (current.withdrawals > 0) {
            nodes.push({
                id: current.id,
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
