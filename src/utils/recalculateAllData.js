import { calculateCumulativeBalances, ensureNestEgg } from "./calculations";

/* tableData = loaded data from firestore
** userInputs = changes the user makes beyond data from firestore (ideally - but initially,
** it would be the same as tableData?)
** so missingRowKeys needs to NOT use userInputs when generating rowKeys, but actually
** it should be all row keys between today and the nest egg month.
** That could be its own utility function.
** However, ensureNestEgg already generates rows between a start date and the end date.
** It DOESN'T generate rows in between rows, so we would need to do this:
** generateRowKeys to generate row keys between today and the last month in firestore.
** ensureNestEgg to generate all subsequent rows.
** although this feels like it could all be done by a single utility function?
*/
export const recalculateAllData = (tableData, userInputs, goals, interestRate, investmentReturnRate, targetNestEgg) => {
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
        // Extract the month and variantIndex from the rowKey
        const lastHyphenIndex = rowKey.lastIndexOf('-');
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
            isActive: changes.isActive !== undefined ? changes.isActive : true,
            // Apply only defined fields from changes
            ...changes,
            isManualFromFirestore: true,
        };

        // Ensure newRow has all necessary properties
        if (!newRow.month) newRow.month = month;
        if (newRow.variantIndex === undefined)
            newRow.variantIndex = variantIndex;

        updatedData.push(newRow);
    });

    // Define parseMonth function
    const parseMonth = (monthStr) => {
        const [year, month] = monthStr.split('-').map(Number);
        return new Date(year, month - 1); // JS months are 0-based
    };

    // Get current month and date
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(
        today.getMonth() + 1
    ).padStart(2, '0')}`;
    const currentMonthDate = parseMonth(currentMonth);

    // Determine earliest month
    const allMonthsSet = new Set();
    updatedData.forEach((entry) => allMonthsSet.add(entry.month));
    Object.keys(userInputs).forEach((rowKey) => {
        const lastHyphenIndex = rowKey.lastIndexOf('-');
        const month = rowKey.substring(0, lastHyphenIndex);
        allMonthsSet.add(month);
    });
    const allMonthsArray = Array.from(allMonthsSet).sort();
    const earliestMonth = allMonthsArray[0];

    // Generate all months between earliest and current month
    const generateMonthsBetween = (startMonth, endMonth) => {
        const months = [];
        let current = parseMonth(startMonth);
        const end = parseMonth(endMonth);

        while (current <= end) {
            const year = current.getFullYear();
            const month = String(current.getMonth() + 1).padStart(2, '0');
            months.push(`${year}-${month}`);
            current.setMonth(current.getMonth() + 1);
        }
        return months;
    };

    const allMonths = generateMonthsBetween(earliestMonth, currentMonth);

    // Initialize lastDepositSavings and lastDepositInvestments
    let lastDepositSavings = 0;
    let lastDepositInvestments = 0;

    // Update last deposits based on the earliest active entry
    for (let i = 0; i < updatedData.length; i++) {
        const entry = updatedData[i];
        if (entry.isActive) {
            lastDepositSavings = entry.depositSavings || 0;
            lastDepositInvestments = entry.depositInvestments || 0;
            break;
        }
    }

    // Populate missing months
    allMonths.forEach((month) => {
        if (!updatedData.some((entry) => entry.month === month)) {
            const newRow = {
                month: month,
                variantIndex: 0,
                rowKey: `${month}-0`,
                depositSavings: lastDepositSavings,
                depositInvestments: lastDepositInvestments,
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
            updatedData.push(newRow);
        } else {
            // Update last deposits
            const entries = updatedData.filter(
                (entry) => entry.month === month && entry.isActive
            );
            if (entries.length > 0) {
                lastDepositSavings =
                    entries[0].depositSavings || lastDepositSavings;
                lastDepositInvestments =
                    entries[0].depositInvestments || lastDepositInvestments;
            }
        }
    });

    // Sort updatedData by month date and then by variantIndex
    updatedData.sort((a, b) => {
        const dateA = parseMonth(a.month);
        const dateB = parseMonth(b.month);
        if (dateA.getTime() !== dateB.getTime()) {
            return dateA - dateB; // Sort by month
        } else {
            return a.variantIndex - b.variantIndex; // Sort by variantIndex
        }
    });

    console.log(
        'debug 051224: Data before filtering previous months:',
        JSON.stringify(updatedData, null, 2)
    );

    console.log(
        'debug 051224: updatedData before calculateCumulativeBalances:',
        JSON.stringify(updatedData, null, 2)
    );
    console.log('Goals before recalculation:', goals);

    updatedData = calculateCumulativeBalances(
        updatedData,
        interestRate,
        investmentReturnRate,
        goals
    );

    console.log(
        'debug 051224: Data after calculateCumulativeBalances:',
        JSON.stringify(updatedData, null, 2)
    );

    // Apply userInputs to updatedData
    for (const [rowKey, changes] of Object.entries(userInputs)) {
        // debugger;

        console.log(`About to apply userInputs for rowKey: ${rowKey}`);
        console.log('Changes:', changes);

        const rowIndex = updatedData.findIndex((row) => row.rowKey === rowKey);

        if (rowIndex !== -1) {
            for (const [field, value] of Object.entries(changes)) {
                console.log(
                    `Applying change to field: ${field}, value: ${value}`
                );

                // Before applying the update, log the current state of the row
                console.log(
                    'Row state before change:',
                    JSON.stringify(updatedData[rowIndex], null, 2)
                );

                updatedData = updateField(updatedData, rowIndex, field, value, {
                    trackChange: false,
                    isManual: true,
                    isManualFromFirestore: true,
                });

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

                console.log(
                    'Row state after change:',
                    JSON.stringify(updatedData[rowIndex], null, 2)
                );
            }
        }
    }

    console.log(
        'debug 051224: Data after applying userInputs:',
        JSON.stringify(updatedData, null, 2)
    );

    // Reset cumulative fields before recalculation
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

    console.log(
        'debug 051224: Data after recalculating cumulative balances:',
        JSON.stringify(updatedData, null, 2)
    );

    // Ensure target nest egg is met
    updatedData = ensureNestEgg(
        targetNestEgg,
        updatedData,
        interestRate,
        investmentReturnRate,
        calculateCumulativeBalances,
        goals
    );

    // Update state if data has changed
    // if (JSON.stringify(tableData) !== JSON.stringify(updatedData)) {
    //     console.log('Data has changed, updating tableData state.');
    // } else {
    //     console.log('No changes detected in data; state not updated.');
    // }

    return updatedData;
};
