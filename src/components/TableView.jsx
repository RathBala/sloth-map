import React, { useContext, useState } from 'react';
import { UserContext } from '../UserContext';
import TableComponent from './TableComponent';
import UserInfoDisplay from './UserInfoDisplay';
import { formatMonth } from '../utils/formatUtils';
import Settings from './Settings';

export default function TableView() {
    const [showHistoricRows, setShowHistoricRows] = useState(false);

    const {
        loading,
        tableData,
        setTableData,
        userSettings,
        goals,
        userInputs,
        setUserInputs,
        fieldsToDelete,
        setFieldsToDelete,
    } = useContext(UserContext);

    if (loading) {
        return <div>Loading...</div>;
    }

    const lastEntry = tableData[tableData.length - 1];
    const achieveNestEggBy = lastEntry ? formatMonth(lastEntry.month) : 'TBC';

    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    const filteredData = showHistoricRows
        ? tableData
        : tableData.filter((row) => row.month >= currentMonth);

    const handleFieldChange = (rowKey, field, value) => {
        let updatedTableData = [...tableData];

        const index = updatedTableData.findIndex(
            (row) => row.rowKey === rowKey
        );
        if (index === -1) {
            console.warn(`No row found with rowKey: ${rowKey}`);
            return;
        }

        updatedTableData = updateField(updatedTableData, index, field, value, {
            trackChange: true,
            isManual: true,
        });

        setTableData(updatedTableData);
    };

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

                    switch (field) {
                        case 'depositSavings':
                            newChanges[rowKey].isDepositSavingsManual = true;
                            updatedData[index].isDepositSavingsManual = true;
                            break;
                        case 'depositInvestments':
                            newChanges[rowKey].isDepositInvestmentsManual =
                                true;
                            updatedData[index].isDepositInvestmentsManual =
                                true;
                            break;
                        case 'totalSavings':
                            newChanges[rowKey].isTotalSavingsManual = true;
                            updatedData[index].isTotalSavingsManual = true;
                            break;
                        case 'totalInvestments':
                            newChanges[rowKey].isTotalInvestmentsManual = true;
                            updatedData[index].isTotalInvestmentsManual = true;
                            break;
                        default:
                            break;
                    }

                    return newChanges;
                });
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

    console.log('tableData in TableView:', tableData);

    return (
        <>
            <UserInfoDisplay
                dateOfBirth={userSettings.dateOfBirth}
                achieveNestEggBy={achieveNestEggBy}
            />
            <button
                type="button"
                onClick={() => setShowHistoricRows((prev) => !prev)}
                className="toggle-historic-button"
            >
                {showHistoricRows ? (
                    <>
                        <span className="icon-collapse" /> ▼ Hide historic rows
                    </>
                ) : (
                    <>
                        <span className="icon-expand" /> ▶ Show historic rows
                    </>
                )}
            </button>
            <TableComponent
                data={filteredData}
                onFieldChange={handleFieldChange}
                onAltScenario={addAltScenario}
                handleRowClick={handleRowClick}
            />
        </>
    );
}
