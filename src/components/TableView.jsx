import React, { useContext, useState, useMemo } from 'react';
import { UserContext } from '../UserContext';
import TableComponent from './TableComponent';
import UserInfoDisplay from './UserInfoDisplay';
import { formatMonth } from '../utils/formatUtils';
import { recalculateAllData } from '../utils/recalculateAllData';

export default function TableView() {
    const [showHistoricRows, setShowHistoricRows] = useState(false);

    const {
        loading,
        rawTableData,
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

    const computedTableData = useMemo(() => {
        return recalculateAllData(
            rawTableData,
            userInputs,
            goals,
            userSettings
        );
    }, [rawTableData, userInputs, goals, userSettings]);

    const lastEntry = computedTableData[computedTableData.length - 1];
    const achieveNestEggBy = lastEntry ? formatMonth(lastEntry.month) : 'TBC';
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const filteredData = showHistoricRows
        ? computedTableData
        : computedTableData.filter((row) => row.month >= currentMonth);

    const handleFieldChange = (rowKey, field, value) => {
        const index = computedTableData.findIndex(
            (row) => row.rowKey === rowKey
        );

        updateField(computedTableData, index, field, value, {
            trackChange: true,
            isManual: true,
        });
    };

    //     setTableData((prevTableData) => {
    //         const updatedTableData = [...prevTableData];
    //         const index = updatedTableData.findIndex(
    //             (row) => row.rowKey === rowKey
    //         );
    //         const newData = updateField(updatedTableData, index, field, value, {
    //             trackChange: true,
    //             isManual: true,
    //         });

    //         if (
    //             field === 'depositSavings' ||
    //             field === 'depositInvestments' ||
    //             field === 'totalSavings' ||
    //             field === 'totalInvestments'
    //         ) {
    //             return recalculateAllData(
    //                 newData,
    //                 userInputs,
    //                 goals,
    //                 userSettings
    //             );
    //         }

    //         return newData;
    //     });
    // };

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
                // Always override subsequent rows when a manual change is made
                updatedData[i] = { ...updatedData[i], [field]: value };
                updatedData[i][isManualField] = false;
                updatedData[i].isManualFromFirestore = false;

                if (trackChange) {
                    const rowKey = updatedData[i].rowKey;
                    setUserInputs((prevChanges) => {
                        const newChanges = { ...prevChanges };
                        if (!newChanges[rowKey]) {
                            newChanges[rowKey] = {};
                        }
                        // Propagate the new value to userInputs for this row
                        newChanges[rowKey][field] = value;
                        return newChanges;
                    });
                }
            }
        }
    };

    const addAltScenario = (rowKey) => {
        const baseRow = computedTableData.find((row) => row.rowKey === rowKey);
        if (!baseRow) {
            console.warn(`No row found with rowKey: ${rowKey}`);
            return;
        }

        const clickedMonth = baseRow.month;

        console.log(
            `Adding new altScenario for month: ${clickedMonth}, based on rowKey: ${rowKey}`
        );

        const variantsForMonth = computedTableData.filter(
            (row) => row.month === clickedMonth
        );
        const maxVariantIndex = Math.max(
            ...variantsForMonth.map((row) => row.variantIndex)
        );
        const newVariantIndex = maxVariantIndex + 1;
        const newRowKey = `${clickedMonth}-${newVariantIndex}`;

        const newRow = {
            ...baseRow,
            variantIndex: newVariantIndex,
            rowKey: newRowKey,
            isAlt: true,
            isActive: true,

            isDepositSavingsManual: baseRow.isDepositSavingsManual,
            isDepositInvestmentsManual: baseRow.isDepositInvestmentsManual,
            isTotalSavingsManual: baseRow.isTotalSavingsManual,
            isTotalInvestmentsManual: baseRow.isTotalInvestmentsManual,
            isManualFromFirestore: baseRow.isManualFromFirestore,

            depositSavings: baseRow.depositSavings,
            depositInvestments: baseRow.depositInvestments,
            totalSavings: baseRow.totalSavings,
            totalInvestments: baseRow.totalInvestments,
            interestReturn: baseRow.interestReturn,
            investmentReturn: baseRow.investmentReturn,
            grandTotal: baseRow.grandTotal,

            goal: baseRow.goal,
            commentary: baseRow.commentary,
        };

        console.log(
            `New altScenario row created from rowKey ${rowKey}:`,
            newRow
        );

        setUserInputs((prevInputs) => ({
            ...prevInputs,
            [newRowKey]: prevInputs[baseRow.rowKey]
                ? { ...prevInputs[baseRow.rowKey] }
                : {},
        }));
    };

    //     // Insert the new alt row into computedTableData
    //     const baseRowIndex = computedTableData.findIndex(
    //         (row) => row.rowKey === rowKey
    //     );
    //     let updatedTableData = [
    //         ...computedTableData.slice(0, baseRowIndex + 1),
    //         newRow,
    //         ...computedTableData.slice(baseRowIndex + 1),
    //     ];

    //     // Deactivate other variants for the same month, leaving only the new one active
    //     updatedTableData = updatedTableData.map((row) => {
    //         if (row.month === clickedMonth) {
    //             return { ...row, isActive: row.rowKey === newRowKey };
    //         }
    //         return row;
    //     });

    //     // Update userInputs accordingly
    //     const updatedUserInputs = { ...userInputs };

    //     // Copy base scenario's userInputs to the new alt scenario if they exist
    //     if (userInputs[baseRow.rowKey]) {
    //         updatedUserInputs[newRowKey] = { ...userInputs[baseRow.rowKey] };
    //     } else {
    //         updatedUserInputs[newRowKey] = {};
    //     }

    //     // Ensure isActive is set for all variants in userInputs
    //     updatedTableData
    //         .filter((row) => row.month === clickedMonth)
    //         .forEach((row) => {
    //             if (!updatedUserInputs[row.rowKey]) {
    //                 updatedUserInputs[row.rowKey] = {};
    //             }
    //             updatedUserInputs[row.rowKey].isActive = row.isActive;
    //         });

    //     // Now preserve manual fields for the original scenario if it's now inactive
    //     const originalScenarioRow = updatedTableData.find(
    //         (row) => row.month === clickedMonth && row.rowKey !== newRowKey
    //     );

    //     if (
    //         originalScenarioRow &&
    //         !originalScenarioRow.isActive &&
    //         originalScenarioRow.isManualFromFirestore
    //     ) {
    //         // If isManualFromFirestore is true, we preserve its values in userInputs
    //         if (!updatedUserInputs[originalScenarioRow.rowKey]) {
    //             updatedUserInputs[originalScenarioRow.rowKey] = {};
    //         }

    //         // Store its fields as they are
    //         if (
    //             originalScenarioRow.isDepositSavingsManual ||
    //             originalScenarioRow.isManualFromFirestore
    //         ) {
    //             updatedUserInputs[originalScenarioRow.rowKey].depositSavings =
    //                 originalScenarioRow.depositSavings;
    //         }
    //         if (
    //             originalScenarioRow.isDepositInvestmentsManual ||
    //             originalScenarioRow.isManualFromFirestore
    //         ) {
    //             updatedUserInputs[
    //                 originalScenarioRow.rowKey
    //             ].depositInvestments = originalScenarioRow.depositInvestments;
    //         }
    //         if (
    //             originalScenarioRow.isTotalSavingsManual ||
    //             originalScenarioRow.isManualFromFirestore
    //         ) {
    //             updatedUserInputs[originalScenarioRow.rowKey].totalSavings =
    //                 originalScenarioRow.totalSavings;
    //         }
    //         if (
    //             originalScenarioRow.isTotalInvestmentsManual ||
    //             originalScenarioRow.isManualFromFirestore
    //         ) {
    //             updatedUserInputs[originalScenarioRow.rowKey].totalInvestments =
    //                 originalScenarioRow.totalInvestments;
    //         }

    //         // Preserve isActive and isManualFromFirestore
    //         updatedUserInputs[originalScenarioRow.rowKey].isActive =
    //             originalScenarioRow.isActive;
    //         updatedUserInputs[
    //             originalScenarioRow.rowKey
    //         ].isManualFromFirestore = true;
    //     }

    //     setTableData(updatedTableData);
    //     setUserInputs(updatedUserInputs);
    // };

    const handleRowClick = (rowKey) => {
        const clickedRow = computedTableData.find(
            (row) => row.rowKey === rowKey
        );
        if (!clickedRow) {
            console.warn(`No row found with rowKey: ${rowKey}`);
            return;
        }

        if (clickedRow.isActive) {
            console.log('Clicked on an already active row; no changes made.');
            return;
        }

        const clickedMonth = clickedRow.month;

        setUserInputs((prevInputs) => {
            const updatedInputs = { ...prevInputs };

            computedTableData.forEach((row) => {
                if (row.month === clickedMonth) {
                    if (!updatedInputs[row.rowKey]) {
                        updatedInputs[row.rowKey] = {};
                    }
                    updatedInputs[row.rowKey].isActive = row.rowKey === rowKey;
                }
            });
            return updatedInputs;
        });
    };

    //     let updatedTableData = computedTableData.map((row) => {
    //         if (row.month === clickedMonth) {
    //             return { ...row, isActive: row.rowKey === clickedRow.rowKey };
    //         }
    //         return row;
    //     });

    //     // Record the isActive status change in userInputs
    //     const updatedUserInputs = { ...userInputs };
    //     updatedTableData.forEach((row) => {
    //         if (row.month === clickedMonth) {
    //             if (!updatedUserInputs[row.rowKey]) {
    //                 updatedUserInputs[row.rowKey] = {};
    //             }
    //             updatedUserInputs[row.rowKey].isActive = row.isActive;
    //         }
    //     });

    //     // Update tableData and userInputs
    //     setTableData(updatedTableData);
    //     setUserInputs(updatedUserInputs);
    // };

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
