/* eslint-disable no-debugger */
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import TableComponent from './components/TableComponent';
import InputFields from './components/InputFields';
import Authentication from './components/Auth';
import SlothMap from './components/SlothMap';
import { formatNumber, formatMonth } from './utils/formatUtils';
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
        setRowsToDelete,
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

            if (field === 'depositSavings') {
                updatedData[index].isDepositSavingsManual = true;
            } else if (field === 'depositInvestments') {
                updatedData[index].isDepositInvestmentsManual = true;
            }

            updatedData[index].isManualFromFirestore = false;
        }

        if (field === 'depositSavings' || field === 'depositInvestments') {
            const isManualField =
                field === 'depositSavings'
                    ? 'isDepositSavingsManual'
                    : 'isDepositInvestmentsManual';

            for (let i = index + 1; i < updatedData.length; i++) {
                if (updatedData[i].isActive) {
                    if (isManual) {
                        // For current manual changes, overwrite all subsequent rows
                        // Remove any manual flags and userInputs
                        updatedData[i] = { ...updatedData[i], [field]: value };
                        updatedData[i][isManualField] = false;
                        updatedData[i].isManualFromFirestore = false;

                        // Remove manual changes for this field in userInputs
                        const rowKey = updatedData[i].rowKey;
                        setUserInputs((prevChanges) => {
                            const newChanges = { ...prevChanges };
                            if (
                                newChanges[rowKey] &&
                                newChanges[rowKey][field] !== undefined
                            ) {
                                delete newChanges[rowKey][field];
                                if (
                                    Object.keys(newChanges[rowKey]).length === 0
                                ) {
                                    // RowKey has no more changes, delete it from newChanges
                                    delete newChanges[rowKey];

                                    // Since we had changes for this rowKey before, and now we've removed them,
                                    // we need to delete the document in Firestore
                                    setRowsToDelete((prevRowsToDelete) => {
                                        const updatedRowsToDelete = [
                                            ...prevRowsToDelete,
                                            rowKey,
                                        ];
                                        console.log(
                                            `Row overwritten and added to rowsToDelete: ${rowKey}`
                                        );
                                        console.log(
                                            'Rows to be deleted are:',
                                            updatedRowsToDelete
                                        );
                                        return updatedRowsToDelete;
                                    });
                                }
                            }
                            return newChanges;
                        });
                    } else {
                        // For initial load, stop propagation at any manual change
                        if (updatedData[i][isManualField]) {
                            break;
                        }
                        updatedData[i] = { ...updatedData[i], [field]: value };
                    }
                }
            }
        }

        return updatedData;
    };

    const adjustGoals = (data) => {
        let updatedData = data.map((row) => ({ ...row }));
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

        let updatedData = tableData.map((row) => ({ ...row }));

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

                    // Set manual flags if necessary
                    if (field === 'totalSavings') {
                        updatedData[rowIndex].isTotalSavingsManual = true;
                    } else if (field === 'totalInvestments') {
                        updatedData[rowIndex].isTotalInvestmentsManual = true;
                    } else if (field === 'depositSavings') {
                        updatedData[rowIndex].isDepositSavingsManual = true;
                    } else if (field === 'depositInvestments') {
                        updatedData[rowIndex].isDepositInvestmentsManual = true;
                    }

                    // Set the isManualFromFirestore flag
                    updatedData[rowIndex].isManualFromFirestore = true;
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

        let updatedTableData = [...tableData];

        updatedTableData = updateField(
            updatedTableData,
            index,
            field,
            value,
            true,
            true
        );

        setTableData(updatedTableData);
    };

    const handleSaveClick = async () => {
        console.log('Save button clicked');
        await saveInputFields();
        await saveTableData();
        setUserInputs({});
        setRowsToDelete([]);
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
    const achieveNestEggBy = lastEntry ? formatMonth(lastEntry.month) : 'TBC';

    console.log('Achieve nest egg by: ', achieveNestEggBy);

    const addAltScenario = (index) => {
        const clickedMonth = tableData[index].month;

        console.log(
            `Adding new altScenario for month: ${clickedMonth}, based on row index: ${index}`
        );

        // Find all variants for the clicked month
        const variantsForMonth = tableData.filter(
            (row) => row.month === clickedMonth
        );
        const maxVariantIndex = Math.max(
            ...variantsForMonth.map((row) => row.variantIndex)
        );

        const newVariantIndex = maxVariantIndex + 1;

        // Create a new row based on the selected row
        const newRow = {
            ...tableData[index],
            variantIndex: newVariantIndex,
            rowKey: `${clickedMonth}-${newVariantIndex}`,
            isAlt: true,
            isActive: true,
            isDepositSavingsManual:
                tableData[index].isDepositSavingsManual || false,
            isDepositInvestmentsManual:
                tableData[index].isDepositInvestmentsManual || false,
            isManualFromFirestore:
                tableData[index].isManualFromFirestore || false,
            isTotalSavingsManual:
                tableData[index].isTotalSavingsManual || false,
            isTotalInvestmentsManual:
                tableData[index].isTotalInvestmentsManual || false,
            // Set default values for fields that might be undefined
            goal: tableData[index].goal || '',
            depositSavings: tableData[index].depositSavings || 0,
            depositInvestments: tableData[index].depositInvestments || 0,
            withdrawals: tableData[index].withdrawals || 0,
        };

        console.log(`New altScenario row created from index ${index}:`, newRow);

        // Add the new alt row to tableData
        let updatedTableData = [
            ...tableData.slice(0, index + 1),
            newRow,
            ...tableData.slice(index + 1),
        ];

        // Deactivate other variants for the same month
        updatedTableData = updatedTableData.map((row) => {
            if (row.month === clickedMonth) {
                return { ...row, isActive: row.rowKey === newRow.rowKey };
            }
            return row;
        });

        // Update userInputs to include the new alt row
        setUserInputs((prevUserInputs) => ({
            ...prevUserInputs,
            [newRow.rowKey]: {
                depositSavings: newRow.depositSavings,
                depositInvestments: newRow.depositInvestments,
                withdrawals: newRow.withdrawals,
                goal: newRow.goal,
            },
        }));

        setTableData(updatedTableData);
    };

    const handleRowClick = (index) => {
        const clickedRow = tableData[index];
        const clickedMonth = clickedRow.month;

        // Update isActive status in tableData
        let updatedTableData = tableData.map((row) => {
            if (row.month === clickedMonth) {
                return { ...row, isActive: row.rowKey === clickedRow.rowKey };
            }
            return row;
        });

        // Record the isActive status change in userInputs
        const updatedUserInputs = { ...userInputs };
        updatedTableData.forEach((row) => {
            if (row.month === clickedMonth) {
                if (!updatedUserInputs[row.rowKey]) {
                    updatedUserInputs[row.rowKey] = {};
                }
                updatedUserInputs[row.rowKey].isActive = row.isActive;
            }
        });

        // Find the index of the new active row
        const newActiveRowIndex = updatedTableData.findIndex(
            (row) => row.month === clickedMonth && row.isActive
        );

        // Get the new deposit values from the active row
        const newDepositSavings =
            updatedTableData[newActiveRowIndex].depositSavings;
        const newDepositInvestments =
            updatedTableData[newActiveRowIndex].depositInvestments;

        // Use updateField to propagate new deposit values to subsequent rows
        updatedTableData = updateField(
            updatedTableData,
            newActiveRowIndex,
            'depositSavings',
            newDepositSavings,
            true,
            true
        );

        updatedTableData = updateField(
            updatedTableData,
            newActiveRowIndex,
            'depositInvestments',
            newDepositInvestments,
            true,
            true
        );

        setTableData(updatedTableData);
        setUserInputs(updatedUserInputs);
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
                date: formatMonth(current.month),
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
