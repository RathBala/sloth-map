/* eslint-disable no-debugger */
import { useState, useEffect, useRef } from 'react';
import { Route, Routes, Link, useLocation } from 'react-router-dom';
import TableView from './components/TableView';
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
import plusIcon from './assets/Plus.svg';
import tableIcon from './assets/table.png';
import mapIcon from './assets/map.png';
import tableSelectedIcon from './assets/table-selected.png';
import mapSelectedIcon from './assets/map-selected.png';
import cogIcon from './assets/Cog.svg';
import cogSelectedIcon from './assets/Cog.svg';

const App = () => {
    const {
        // loading,
        // isLoggedIn,
        user,
        interestRate,
        setInterestRate,
        investmentReturnRate,
        setInvestmentReturnRate,
        targetNestEgg,
        setTargetNestEgg,
        dateOfBirth,
        setDateOfBirth,
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

    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef(null);
    const profileIconRef = useRef(null);

    // const [tableData, setTableData] = useState(() => generateData(500, 300));
    const [showHistoricRows, setShowHistoricRows] = useState(false);

    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);

    const location = useLocation();

    const isTableSelected =
        location.pathname === '/' || location.pathname === '';
    const isMapSelected = location.pathname === '/map';
    const isSettingsSelected = location.pathname === '/settings';

    const toggleProfileMenu = () => {
        setIsProfileMenuOpen(!isProfileMenuOpen);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                profileMenuRef.current &&
                !profileMenuRef.current.contains(event.target) &&
                profileIconRef.current &&
                !profileIconRef.current.contains(event.target)
            ) {
                setIsProfileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        setIsProfileMenuOpen(false);
    }, [user]);

    useEffect(() => {
        // debugger;

        if (
            interestRate !== null &&
            investmentReturnRate !== null &&
            targetNestEgg !== null
        ) {
            recalculateAllData();
        }
    }, [interestRate, investmentReturnRate, targetNestEgg, userInputs, goals]);

    // useEffect(() => {
    //     if (!user) {
    //         setTableData(generateData(500, 300));
    //     }
    // }, [user]);

    const updateField = (data, index, field, value, options = {}) => {
        const {
            trackChange = true,
            isManual = false,
            isManualFromFirestore = false,
        } = options;

        let updatedData = [...data];

        updatedData[index] = { ...updatedData[index], [field]: value };

        if (isManual) {
            const rowKey = updatedData[index].rowKey;

            if (trackChange) {
                setUserInputs((prevChanges) => {
                    const newChanges = { ...prevChanges };
                    if (!newChanges[rowKey]) {
                        newChanges[rowKey] = {};
                    }
                    newChanges[rowKey][field] = value;
                    return newChanges;
                });
            }

            if (field === 'depositSavings') {
                updatedData[index].isDepositSavingsManual = true;
            } else if (field === 'depositInvestments') {
                updatedData[index].isDepositInvestmentsManual = true;
            } else if (field === 'totalSavings') {
                updatedData[index].isTotalSavingsManual = true;
            } else if (field === 'totalInvestments') {
                updatedData[index].isTotalInvestmentsManual = true;
            }

            updatedData[index].isManualFromFirestore = isManualFromFirestore;
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

                    if (trackChange) {
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

                                if (
                                    Object.keys(newChanges[rowKey]).length === 0
                                ) {
                                    // RowKey has no more changes, delete it from newChanges
                                    delete newChanges[rowKey];
                                }
                            }
                            return newChanges;
                        });
                    }
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

    // Needs to go in a custom hook
    // const recalculateAllData = () => {
    //     console.log('recalculateAllData called with:');
    //     console.log('userInputs:', JSON.stringify(userInputs, null, 2));
    //     console.log('tableData:', JSON.stringify(tableData, null, 2));

    //     let updatedData = tableData.map((row) => ({ ...row }));

    //     // Step 1: Identify missing rows from userInputs
    //     const existingRowKeys = new Set(updatedData.map((row) => row.rowKey));
    //     const missingRowKeys = Object.keys(userInputs).filter(
    //         (rowKey) => !existingRowKeys.has(rowKey)
    //     );

    //     // Step 2: Create missing rows
    //     missingRowKeys.forEach((rowKey) => {
    //         // Extract the month and variantIndex from the rowKey
    //         const lastHyphenIndex = rowKey.lastIndexOf('-');
    //         const month = rowKey.substring(0, lastHyphenIndex);
    //         const variantIndexStr = rowKey.substring(lastHyphenIndex + 1);
    //         const variantIndex = parseInt(variantIndexStr, 10);

    //         // Find a baseRow to copy from
    //         let baseRow = updatedData.find(
    //             (row) => row.month === month && row.variantIndex === 0
    //         );

    //         // If no baseRow is found, use a default row
    //         if (!baseRow) {
    //             baseRow = {
    //                 month: month,
    //                 variantIndex: 0,
    //                 rowKey: `${month}-0`,
    //                 depositSavings: 0,
    //                 depositInvestments: 0,
    //                 totalSavings: 0,
    //                 totalInvestments: 0,
    //                 isTotalSavingsManual: false,
    //                 isTotalInvestmentsManual: false,
    //                 isDepositSavingsManual: false,
    //                 isDepositInvestmentsManual: false,
    //                 totalSaved: 0,
    //                 interestReturn: 0,
    //                 investmentReturn: 0,
    //                 grandTotal: 0,
    //                 commentary: '',
    //                 isActive: true,
    //                 isManualFromFirestore: false,
    //             };
    //         }

    //         // Extract changes from userInputs, filtering out undefined values
    //         const changes = Object.fromEntries(
    //             Object.entries(userInputs[rowKey]).filter(
    //                 ([, value]) => value !== undefined
    //             )
    //         );

    //         const newRow = {
    //             ...baseRow,
    //             rowKey: rowKey,
    //             variantIndex: variantIndex,
    //             isAlt: variantIndex > 0,
    //             isActive:
    //                 changes.isActive !== undefined ? changes.isActive : true,
    //             // Apply only defined fields from changes
    //             ...changes,
    //             isManualFromFirestore: true,
    //         };

    //         // Ensure newRow has all necessary properties
    //         if (!newRow.month) newRow.month = month;
    //         if (newRow.variantIndex === undefined)
    //             newRow.variantIndex = variantIndex;

    //         updatedData.push(newRow);
    //     });

    //     // Define parseMonth function
    //     const parseMonth = (monthStr) => {
    //         const [year, month] = monthStr.split('-').map(Number);
    //         return new Date(year, month - 1); // JS months are 0-based
    //     };

    //     // Get current month and date
    //     const today = new Date();
    //     const currentMonth = `${today.getFullYear()}-${String(
    //         today.getMonth() + 1
    //     ).padStart(2, '0')}`;
    //     const currentMonthDate = parseMonth(currentMonth);

    //     // Determine earliest month
    //     const allMonthsSet = new Set();
    //     updatedData.forEach((entry) => allMonthsSet.add(entry.month));
    //     Object.keys(userInputs).forEach((rowKey) => {
    //         const lastHyphenIndex = rowKey.lastIndexOf('-');
    //         const month = rowKey.substring(0, lastHyphenIndex);
    //         allMonthsSet.add(month);
    //     });
    //     const allMonthsArray = Array.from(allMonthsSet).sort();
    //     const earliestMonth = allMonthsArray[0];

    //     // Generate all months between earliest and current month
    //     const generateMonthsBetween = (startMonth, endMonth) => {
    //         const months = [];
    //         let current = parseMonth(startMonth);
    //         const end = parseMonth(endMonth);

    //         while (current <= end) {
    //             const year = current.getFullYear();
    //             const month = String(current.getMonth() + 1).padStart(2, '0');
    //             months.push(`${year}-${month}`);
    //             current.setMonth(current.getMonth() + 1);
    //         }
    //         return months;
    //     };

    //     const allMonths = generateMonthsBetween(earliestMonth, currentMonth);

    //     // Initialize lastDepositSavings and lastDepositInvestments
    //     let lastDepositSavings = 0;
    //     let lastDepositInvestments = 0;

    //     // Update last deposits based on the earliest active entry
    //     for (let i = 0; i < updatedData.length; i++) {
    //         const entry = updatedData[i];
    //         if (entry.isActive) {
    //             lastDepositSavings = entry.depositSavings || 0;
    //             lastDepositInvestments = entry.depositInvestments || 0;
    //             break;
    //         }
    //     }

    //     // Populate missing months
    //     allMonths.forEach((month) => {
    //         if (!updatedData.some((entry) => entry.month === month)) {
    //             const newRow = {
    //                 month: month,
    //                 variantIndex: 0,
    //                 rowKey: `${month}-0`,
    //                 depositSavings: lastDepositSavings,
    //                 depositInvestments: lastDepositInvestments,
    //                 totalSavings: 0,
    //                 totalInvestments: 0,
    //                 isTotalSavingsManual: false,
    //                 isTotalInvestmentsManual: false,
    //                 isDepositSavingsManual: false,
    //                 isDepositInvestmentsManual: false,
    //                 totalSaved: 0,
    //                 interestReturn: 0,
    //                 investmentReturn: 0,
    //                 grandTotal: 0,
    //                 commentary: '',
    //                 isActive: true,
    //                 isManualFromFirestore: false,
    //             };
    //             updatedData.push(newRow);
    //         } else {
    //             // Update last deposits
    //             const entries = updatedData.filter(
    //                 (entry) => entry.month === month && entry.isActive
    //             );
    //             if (entries.length > 0) {
    //                 lastDepositSavings =
    //                     entries[0].depositSavings || lastDepositSavings;
    //                 lastDepositInvestments =
    //                     entries[0].depositInvestments || lastDepositInvestments;
    //             }
    //         }
    //     });

    //     // Sort updatedData by month date and then by variantIndex
    //     updatedData.sort((a, b) => {
    //         const dateA = parseMonth(a.month);
    //         const dateB = parseMonth(b.month);
    //         if (dateA.getTime() !== dateB.getTime()) {
    //             return dateA - dateB; // Sort by month
    //         } else {
    //             return a.variantIndex - b.variantIndex; // Sort by variantIndex
    //         }
    //     });

    //     console.log(
    //         'debug 051224: Data before filtering previous months:',
    //         JSON.stringify(updatedData, null, 2)
    //     );

    //     console.log(
    //         'debug 051224: updatedData before calculateCumulativeBalances:',
    //         JSON.stringify(updatedData, null, 2)
    //     );
    //     console.log('Goals before recalculation:', goals);

    //     updatedData = calculateCumulativeBalances(
    //         updatedData,
    //         interestRate,
    //         investmentReturnRate,
    //         goals
    //     );

    //     console.log(
    //         'debug 051224: Data after calculateCumulativeBalances:',
    //         JSON.stringify(updatedData, null, 2)
    //     );

    //     // debugger;

    //     // Apply userInputs to updatedData
    //     for (const [rowKey, changes] of Object.entries(userInputs)) {
    //         // debugger;

    //         console.log(`About to apply userInputs for rowKey: ${rowKey}`);
    //         console.log('Changes:', changes);

    //         const rowIndex = updatedData.findIndex(
    //             (row) => row.rowKey === rowKey
    //         );

    //         if (rowIndex !== -1) {
    //             for (const [field, value] of Object.entries(changes)) {
    //                 console.log(
    //                     `Applying change to field: ${field}, value: ${value}`
    //                 );

    //                 // Before applying the update, log the current state of the row
    //                 console.log(
    //                     'Row state before change:',
    //                     JSON.stringify(updatedData[rowIndex], null, 2)
    //                 );

    //                 updatedData = updateField(
    //                     updatedData,
    //                     rowIndex,
    //                     field,
    //                     value,
    //                     {
    //                         trackChange: false,
    //                         isManual: true,
    //                         isManualFromFirestore: true,
    //                     }
    //                 );

    //                 // Set manual flags if necessary
    //                 if (field === 'totalSavings') {
    //                     updatedData[rowIndex].isTotalSavingsManual = true;
    //                 } else if (field === 'totalInvestments') {
    //                     updatedData[rowIndex].isTotalInvestmentsManual = true;
    //                 } else if (field === 'depositSavings') {
    //                     updatedData[rowIndex].isDepositSavingsManual = true;
    //                 } else if (field === 'depositInvestments') {
    //                     updatedData[rowIndex].isDepositInvestmentsManual = true;
    //                 }

    //                 // Set the isManualFromFirestore flag
    //                 updatedData[rowIndex].isManualFromFirestore = true;

    //                 console.log(
    //                     'Row state after change:',
    //                     JSON.stringify(updatedData[rowIndex], null, 2)
    //                 );
    //             }
    //         }
    //     }

    //     // debugger;

    //     console.log(
    //         'debug 051224: Data after applying userInputs:',
    //         JSON.stringify(updatedData, null, 2)
    //     );

    //     // Reset cumulative fields before recalculation
    //     updatedData = updatedData.map((entry) => ({
    //         ...entry,
    //         totalSaved: 0,
    //         interestReturn: 0,
    //         investmentReturn: 0,
    //         grandTotal: 0,
    //     }));

    //     updatedData = calculateCumulativeBalances(
    //         updatedData,
    //         interestRate,
    //         investmentReturnRate,
    //         goals
    //     );

    //     console.log(
    //         'debug 051224: Data after recalculating cumulative balances:',
    //         JSON.stringify(updatedData, null, 2)
    //     );

    //     // Ensure target nest egg is met
    //     updatedData = ensureNestEgg(
    //         targetNestEgg,
    //         updatedData,
    //         interestRate,
    //         investmentReturnRate,
    //         calculateCumulativeBalances,
    //         goals
    //     );

    //     // Update state if data has changed
    //     if (JSON.stringify(tableData) !== JSON.stringify(updatedData)) {
    //         console.log('Data has changed, updating tableData state.');
    //         setTableData(updatedData);
    //     } else {
    //         console.log('No changes detected in data; state not updated.');
    //     }
    // };

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

    // if (loading) {
    //     return <div>Loading user data...</div>;
    // }

    if (!user) {
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
    const handleDateOfBirthChange = (date) => {
        setDateOfBirth(date);
    };

    // const handleSaveClick = async () => {
    //     console.log('Save button clicked');

    //     try {
    //         await saveInputFields();
    //         await saveTableData();
    //         await commitGoalsToFirestore();

    //         const newInputs = await fetchUserInputs(); // Fetch and immediately update after
    //         setUserInputs(newInputs);

    //         console.log('All changes saved successfully');
    //     } catch (error) {
    //         console.error('Failed to save changes:', error);
    //         alert('Error saving changes: ' + error.message);
    //     }
    // };

    // const filteredTableData = showHistoricRows
    //     ? tableData
    //     : tableData.filter((entry) => entry.month >= currentMonth);

    const formattedTableData = filteredTableData.map((entry) => ({
        ...entry,
        interestReturnFormatted: formatNumber(entry.interestReturn),
        investmentReturnFormatted: formatNumber(entry.investmentReturn),
        totalSavingsFormatted: formatNumber(entry.totalSavings),
        totalInvestmentsFormatted: formatNumber(entry.totalInvestments),
        grandTotalFormatted: formatNumber(entry.grandTotal),
    }));

    const slothMapData = processDataForSlothMap(formattedTableData);

    // const lastEntry = tableData[tableData.length - 1];
    // const achieveNestEggBy = lastEntry ? formatMonth(lastEntry.month) : 'TBC';

    // this needs to be a custom hook
    const addAltScenario = (rowKey) => {
        // Find the base row using rowKey
        const baseRow = tableData.find((row) => row.rowKey === rowKey);
        if (!baseRow) {
            console.warn(`No row found with rowKey: ${rowKey}`);
            return;
        }

        const clickedMonth = baseRow.month;

        console.log(
            `Adding new altScenario for month: ${clickedMonth}, based on rowKey: ${rowKey}`
        );

        // Find all variants for the clicked month
        const variantsForMonth = tableData.filter(
            (row) => row.month === clickedMonth
        );
        const maxVariantIndex = Math.max(
            ...variantsForMonth.map((row) => row.variantIndex)
        );
        const newVariantIndex = maxVariantIndex + 1;
        const newRowKey = `${clickedMonth}-${newVariantIndex}`;

        // Create a new alt scenario row by cloning the base row
        const newRow = {
            ...baseRow,
            variantIndex: newVariantIndex,
            rowKey: newRowKey,
            isAlt: true,
            isActive: true,

            // Inherit manual flags exactly from the baseRow
            isDepositSavingsManual: baseRow.isDepositSavingsManual,
            isDepositInvestmentsManual: baseRow.isDepositInvestmentsManual,
            isTotalSavingsManual: baseRow.isTotalSavingsManual,
            isTotalInvestmentsManual: baseRow.isTotalInvestmentsManual,
            isManualFromFirestore: baseRow.isManualFromFirestore,

            // Copy the current displayed values
            depositSavings: baseRow.depositSavings,
            depositInvestments: baseRow.depositInvestments,
            totalSavings: baseRow.totalSavings,
            totalInvestments: baseRow.totalInvestments,
            interestReturn: baseRow.interestReturn,
            investmentReturn: baseRow.investmentReturn,
            grandTotal: baseRow.grandTotal,

            // Copy over goal and commentary if needed
            goal: baseRow.goal,
            commentary: baseRow.commentary,
        };

        console.log(
            `New altScenario row created from rowKey ${rowKey}:`,
            newRow
        );

        // Insert the new alt row into tableData
        const baseRowIndex = tableData.findIndex(
            (row) => row.rowKey === rowKey
        );
        let updatedTableData = [
            ...tableData.slice(0, baseRowIndex + 1),
            newRow,
            ...tableData.slice(baseRowIndex + 1),
        ];

        // Deactivate other variants for the same month, leaving only the new one active
        updatedTableData = updatedTableData.map((row) => {
            if (row.month === clickedMonth) {
                return { ...row, isActive: row.rowKey === newRowKey };
            }
            return row;
        });

        // Update userInputs accordingly
        const updatedUserInputs = { ...userInputs };

        // Copy base scenario's userInputs to the new alt scenario if they exist
        if (userInputs[baseRow.rowKey]) {
            updatedUserInputs[newRowKey] = { ...userInputs[baseRow.rowKey] };
        } else {
            updatedUserInputs[newRowKey] = {};
        }

        // Ensure isActive is set for all variants in userInputs
        updatedTableData
            .filter((row) => row.month === clickedMonth)
            .forEach((row) => {
                if (!updatedUserInputs[row.rowKey]) {
                    updatedUserInputs[row.rowKey] = {};
                }
                updatedUserInputs[row.rowKey].isActive = row.isActive;
            });

        // Now preserve manual fields for the original scenario if it's now inactive
        const originalScenarioRow = updatedTableData.find(
            (row) => row.month === clickedMonth && row.rowKey !== newRowKey
        );

        if (
            originalScenarioRow &&
            !originalScenarioRow.isActive &&
            originalScenarioRow.isManualFromFirestore
        ) {
            // If isManualFromFirestore is true, we preserve its values in userInputs
            if (!updatedUserInputs[originalScenarioRow.rowKey]) {
                updatedUserInputs[originalScenarioRow.rowKey] = {};
            }

            // Store its fields as they are
            if (
                originalScenarioRow.isDepositSavingsManual ||
                originalScenarioRow.isManualFromFirestore
            ) {
                updatedUserInputs[originalScenarioRow.rowKey].depositSavings =
                    originalScenarioRow.depositSavings;
            }
            if (
                originalScenarioRow.isDepositInvestmentsManual ||
                originalScenarioRow.isManualFromFirestore
            ) {
                updatedUserInputs[
                    originalScenarioRow.rowKey
                ].depositInvestments = originalScenarioRow.depositInvestments;
            }
            if (
                originalScenarioRow.isTotalSavingsManual ||
                originalScenarioRow.isManualFromFirestore
            ) {
                updatedUserInputs[originalScenarioRow.rowKey].totalSavings =
                    originalScenarioRow.totalSavings;
            }
            if (
                originalScenarioRow.isTotalInvestmentsManual ||
                originalScenarioRow.isManualFromFirestore
            ) {
                updatedUserInputs[originalScenarioRow.rowKey].totalInvestments =
                    originalScenarioRow.totalInvestments;
            }

            // Preserve isActive and isManualFromFirestore
            updatedUserInputs[originalScenarioRow.rowKey].isActive =
                originalScenarioRow.isActive;
            updatedUserInputs[
                originalScenarioRow.rowKey
            ].isManualFromFirestore = true;
        }

        setTableData(updatedTableData);
        setUserInputs(updatedUserInputs);
    };

    // move into custom hook
    const handleRowClick = (rowKey) => {
        const clickedRow = tableData.find((row) => row.rowKey === rowKey);
        if (!clickedRow) {
            console.warn(`No row found with rowKey: ${rowKey}`);
            return;
        }

        if (clickedRow.isActive) {
            console.log('Clicked on an already active row; no changes made.');
            return;
        }

        const clickedMonth = clickedRow.month;

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

        // Update tableData and userInputs
        setTableData(updatedTableData);
        setUserInputs(updatedUserInputs);
    };

    return (
        <div className="App">
            {/* TODO: make these below components */}
            <div className="top-nav">
                <div className="top-nav-left">
                    <div className="profile-icon-container">
                        <svg
                            className="profile-icon"
                            width="44"
                            height="44"
                            viewBox="0 0 44 44"
                            onClick={toggleProfileMenu}
                            ref={profileIconRef}
                        >
                            <circle cx="22" cy="22" r="20" fill="#d2d2d2" />
                        </svg>
                        {isProfileMenuOpen && (
                            <div className="profile-menu" ref={profileMenuRef}>
                                <ul>
                                    <li onClick={logout}>Log out</li>
                                </ul>
                            </div>
                        )}
                    </div>
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
                    <div className="tab-group">
                        <Link
                            to="/"
                            className={`tab ${isTableSelected ? 'active-tab' : ''}`}
                        >
                            <img
                                src={
                                    isTableSelected
                                        ? tableSelectedIcon
                                        : tableIcon
                                }
                                alt="Table Icon"
                                className="tab-icon"
                            />{' '}
                            Table
                        </Link>
                        <Link
                            to="/map"
                            className={`tab ${isMapSelected ? 'active-tab' : ''}`}
                        >
                            <img
                                src={isMapSelected ? mapSelectedIcon : mapIcon}
                                alt="Map Icon"
                                className="tab-icon"
                            />{' '}
                            Map
                        </Link>
                        <Link
                            to="/settings"
                            className={`tab ${isSettingsSelected ? 'active-tab' : ''}`}
                        >
                            <img
                                src={
                                    isSettingsSelected
                                        ? cogSelectedIcon
                                        : cogIcon
                                }
                                alt="Settings Icon"
                                className="tab-icon"
                            />
                            Settings
                        </Link>
                    </div>
                </div>
            </div>
            <div className="action-buttons-container">
                <div className="left-buttons">
                    <button onClick={handleSaveClick}>Save</button>
                </div>
                {!isSettingsSelected && (
                    <div className="right-buttons">
                        <button
                            type="button"
                            onClick={handleNewGoalClick}
                            className="new-goal-button"
                        >
                            <img
                                src={plusIcon}
                                alt="Add Goal"
                                className="plus-icon"
                            />{' '}
                            New Goal
                        </button>
                    </div>
                )}
            </div>
            <div className="content">
                <Routes>
                    <Route
                        path="/map"
                        element={
                            <div className="slothmap-container">
                                <SlothMap data={slothMapData} />
                            </div>
                        }
                    />
                    <Route
                        path="/settings"
                        element={
                            <InputFields
                                interestRate={interestRate || ''}
                                investmentReturnRate={
                                    investmentReturnRate || ''
                                }
                                targetNestEgg={targetNestEgg || ''}
                                dateOfBirth={dateOfBirth}
                                handleDateOfBirthChange={
                                    handleDateOfBirthChange
                                }
                                handleInterestRateChange={
                                    handleInterestRateChange
                                }
                                handleInvestmentReturnRateChange={
                                    handleInvestmentReturnRateChange
                                }
                                handleTargetNestEggChange={
                                    handleTargetNestEggChange
                                }
                                isSettingsPage={true}
                            />
                        }
                    />
                    <Route
                        path="/"
                        element={
                            <TableView
                                formattedTableData={formattedTableData}
                                tableData={tableData}
                                onFieldChange={handleFieldChange}
                                onAltScenario={addAltScenario}
                                handleRowClick={handleRowClick}
                                onEditGoal={handleEditGoal}
                                showHistoricRows={showHistoricRows}
                                setShowHistoricRows={setShowHistoricRows}
                                achieveNestEggBy={achieveNestEggBy}
                                dateOfBirth={dateOfBirth}
                            />
                        }
                    />
                    <Route
                        path="*"
                        element={<div>No match for this route</div>}
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
    );
};

const processDataForSlothMap = (data) => {
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    const nodes = [];
    for (let i = 0; i < data.length; i++) {
        const current = data[i];

        if (current.month < currentMonth) {
            continue;
        }

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
