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
    ensureNestEgg,
    calculateCumulativeBalances,
} from './utils/calculations';
import './App.css';
import GoalModal from './components/GoalModal';
import addIcon from './assets/add.svg';

const App = () => {
    const {
        loading,
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
        commitGoalsToFirestore,
        logout,
        setFieldsToDelete,
        goals,
        saveGoal,
        fetchUserInputs,
    } = useUserData();

    const [tableData, setTableData] = useState(() => generateData(500, 300));

    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);

    useEffect(() => {
        if (
            interestRate !== null &&
            investmentReturnRate !== null &&
            targetNestEgg !== null
        ) {
            recalculateAllData();
        }
    }, [interestRate, investmentReturnRate, targetNestEgg, userInputs, goals]);

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
            } else if (field === 'totalSavings') {
                updatedData[index].isTotalSavingsManual = true;
            } else if (field === 'totalInvestments') {
                updatedData[index].isTotalInvestmentsManual = true;
            }

            updatedData[index].isManualFromFirestore = false;
        }

        if (field === 'depositSavings' || field === 'depositInvestments') {
            const isManualField =
                field === 'depositSavings'
                    ? 'isDepositSavingsManual'
                    : 'isDepositInvestmentsManual';

            for (let i = index + 1; i < updatedData.length; i++) {
                if (isManual) {
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

                            //track fields to delete
                            setFieldsToDelete((prevFieldsToDelete) => {
                                const updatedFieldsToDelete = {
                                    ...prevFieldsToDelete,
                                };
                                if (!updatedFieldsToDelete[rowKey]) {
                                    updatedFieldsToDelete[rowKey] = [];
                                }
                                updatedFieldsToDelete[rowKey].push(field);
                                return updatedFieldsToDelete;
                            });

                            if (Object.keys(newChanges[rowKey]).length === 0) {
                                // RowKey has no more changes, delete it from newChanges
                                delete newChanges[rowKey];
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

        return updatedData;
    };

    const recalculateAllData = () => {
        console.log('recalculateAllData called with:');
        console.log('userInputs:', JSON.stringify(userInputs, null, 2));
        console.log('tableData:', JSON.stringify(tableData, null, 2));

        let updatedData = tableData.map((row) => ({ ...row }));

        // Step 1: Identify missing rows from userInputs
        const existingRowKeys = new Set(updatedData.map((row) => row.rowKey));
        const missingRowKeys = Object.keys(userInputs).filter(
            (rowKey) => !existingRowKeys.has(rowKey)
        );

        // Step 2: Create missing rows
        missingRowKeys.forEach((rowKey) => {
            // Find the last hyphen in the rowKey
            const lastHyphenIndex = rowKey.lastIndexOf('-');
            // Extract the month and variantIndex from the rowKey
            const month = rowKey.substring(0, lastHyphenIndex);
            const variantIndexStr = rowKey.substring(lastHyphenIndex + 1);
            const variantIndex = parseInt(variantIndexStr, 10);

            // Find a baseRow to copy from
            let baseRow = updatedData.find(
                (row) => row.month === month && row.variantIndex === 0
            );

            // If no baseRow is found, use a default row
            if (!baseRow) {
                baseRow = {
                    month: month,
                    variantIndex: 0,
                    rowKey: `${month}-0`,
                    depositSavings: 0,
                    depositInvestments: 0,
                    totalSavings: 0,
                    totalInvestments: 0,
                    isTotalSavingsManual: false,
                    isTotalInvestmentsManual: false,
                    isDepositSavingsManual: false,
                    isDepositInvestmentsManual: false,
                    totalSaved: 0,
                    interestReturn: 0,
                    investmentReturn: 0,
                    grandTotal: 0,
                    commentary: '',
                    isActive: true,
                    isManualFromFirestore: false,
                };
            }

            // Extract changes from userInputs, filtering out undefined values
            const changes = Object.fromEntries(
                Object.entries(userInputs[rowKey]).filter(
                    ([, value]) => value !== undefined
                )
            );

            const newRow = {
                ...baseRow,
                rowKey: rowKey,
                variantIndex: variantIndex,
                isAlt: variantIndex > 0,
                isActive:
                    changes.isActive !== undefined ? changes.isActive : true,
                // Apply only defined fields from changes
                ...changes,
            };

            // Ensure newRow has all necessary properties
            if (!newRow.month) newRow.month = month;
            if (newRow.variantIndex === undefined)
                newRow.variantIndex = variantIndex;

            updatedData.push(newRow);
        });

        // Step 3: Sort the updatedData by rowKey
        updatedData.sort((a, b) => a.rowKey.localeCompare(b.rowKey));

        console.log(
            'updatedData before calculateCumulativeBalances:',
            JSON.stringify(updatedData, null, 2)
        );
        console.log('Goals before recalculation:', goals);

        updatedData = calculateCumulativeBalances(
            updatedData,
            interestRate,
            investmentReturnRate,
            goals
        );

        // Apply userInputs to updatedData
        for (const [rowKey, changes] of Object.entries(userInputs)) {
            const rowIndex = updatedData.findIndex(
                (row) => row.rowKey === rowKey
            );

            if (rowIndex !== -1) {
                const isActive = updatedData[rowIndex].isActive;
                if (!isActive) {
                    continue; // Skip inactive rows
                }

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
            }
        }

        updatedData = updatedData.map((entry) => ({
            ...entry,
            totalSaved: 0,
            interestReturn: 0,
            investmentReturn: 0,
            grandTotal: 0,
        }));

        updatedData = calculateCumulativeBalances(
            updatedData,
            interestRate,
            investmentReturnRate,
            goals
        );

        updatedData = ensureNestEgg(
            targetNestEgg,
            updatedData,
            interestRate,
            investmentReturnRate,
            calculateCumulativeBalances,
            goals
        );

        if (JSON.stringify(tableData) !== JSON.stringify(updatedData)) {
            setTableData(updatedData);
        }
    };

    const handleNewGoalClick = () => {
        setEditingGoal(null);
        setIsGoalModalOpen(true);
    };

    const handleGoalSave = (goal) => {
        saveGoal(goal);
    };

    const handleEditGoal = (goal) => {
        setEditingGoal(goal);
        setIsGoalModalOpen(true);
    };

    if (loading) {
        return <div>Loading user data...</div>;
    }

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

        debugger;

        try {
            await saveInputFields();
            await saveTableData();
            await commitGoalsToFirestore();

            const newInputs = await fetchUserInputs(); // Fetch and immediately update after
            setUserInputs(newInputs);

            console.log('All changes saved successfully');
        } catch (error) {
            console.error('Failed to save changes:', error);
            alert('Error saving changes: ' + error.message);
        }
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
            isDepositSavingsManual: true, // Ensure these are set to true
            isDepositInvestmentsManual: true, // Ensure these are set to true
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

        // Update userInputs for all variants in the clickedMonth
        const updatedUserInputs = { ...userInputs };
        updatedTableData.forEach((row) => {
            if (row.month === clickedMonth) {
                if (!updatedUserInputs[row.rowKey]) {
                    updatedUserInputs[row.rowKey] = {};
                }
                updatedUserInputs[row.rowKey].isActive = row.isActive;
            }
        });

        // Update tableData and userInputs
        setTableData(updatedTableData);
        setUserInputs(updatedUserInputs);
    };

    const handleRowClick = (index) => {
        const clickedRow = tableData[index];

        if (clickedRow.isActive) {
            console.log('Clicked on an already active row; no changes made.');
            return;
        }

        const clickedMonth = clickedRow.month;

        let updatedTableData = tableData.map((row, idx) => {
            if (row.month === clickedMonth) {
                return { ...row, isActive: row.rowKey === clickedRow.rowKey };
            } else if (idx > index) {
                // For rows after the clicked row, reset isActive based on existing conditions
                return row;
            } else {
                // For rows before the clicked row, do not change isActive status
                return row;
            }
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

        // Update tableData and userInputs
        setTableData(updatedTableData);
        setUserInputs(updatedUserInputs);
    };

    return (
        <Router>
            <div className="App">
                <div className="top-nav">
                    <div className="top-nav-left">
                        <div className="welcome">
                            <h4>
                                Welcome{' '}
                                {user && user.email
                                    ? user.email
                                    : 'No user logged in'}
                            </h4>
                        </div>
                    </div>

                    <div className="top-nav-center">
                        <div className="button-group">
                            <Link to="/map">
                                <button type="button">Map</button>
                            </Link>
                            <button onClick={logout}>Log out</button>
                        </div>
                    </div>
                    <div className="top-nav-right">
                        {/* Empty div to balance the layout if needed */}
                    </div>
                </div>
                <div className="action-buttons-container">
                    <div className="left-buttons">
                        <button onClick={handleSaveClick}>Save</button>
                    </div>
                    <div className="right-buttons">
                        <button
                            type="button"
                            onClick={handleNewGoalClick}
                            className="new-goal-button"
                        >
                            <img
                                src={addIcon}
                                alt="Add Goal"
                                className="add-icon"
                            />{' '}
                            New Goal
                        </button>
                    </div>
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
                                        onEditGoal={handleEditGoal}
                                    />
                                </>
                            }
                        />
                    </Routes>
                    <GoalModal
                        isOpen={isGoalModalOpen}
                        onClose={() => setIsGoalModalOpen(false)}
                        onSave={handleGoalSave}
                        goal={editingGoal}
                        goals={goals}
                    />
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

export default App;
