export const generateData = (savings, investments) => {
    const today = new Date();
    const currentMonth =
        today.getFullYear() +
        '-' +
        String(today.getMonth() + 1).padStart(2, '0');

    return [
        {
            month: currentMonth,
            variantIndex: 0,
            rowKey: `${currentMonth}-0`,
            depositSavings: savings,
            depositInvestments: investments,
            isDepositSavingsManual: false,
            isDepositInvestmentsManual: false,
            isManualFromFirestore: false,
            totalSavings: 0,
            totalInvestments: 0,
            isTotalSavingsManual: false,
            isTotalInvestmentsManual: false,
            totalSaved: 0,
            interestReturn: 0,
            investmentReturn: 0,
            grandTotal: 0,
            commentary: '',
            isActive: true,
        },
    ];
};

export const calculateCumulativeBalances = (
    data,
    interestRate,
    investmentReturnRate,
    goals
) => {
    debugger;

    let updatedData = [...data];

    let runningTotalSavings = 0;
    let runningTotalInvestments = 0;
    const sortedGoals = Object.values(goals).sort(
        (a, b) => a.priority - b.priority
    );
    let goalIndex = 0;

    // Initialize lastDepositSavings and lastDepositInvestments
    let lastDepositSavings = 0;
    let lastDepositInvestments = 0;

    // Find the first active row to initialize lastDepositSavings and lastDepositInvestments
    for (let i = 0; i < updatedData.length; i++) {
        const entry = updatedData[i];

        if (entry.isActive) {
            lastDepositSavings = entry.depositSavings;
            lastDepositInvestments = entry.depositInvestments;
            break;
        }
    }

    for (let i = 0; i < updatedData.length; i++) {
        const entry = updatedData[i];

        if (!entry.isActive) {
            // For inactive entries, preserve their deposit values and skip updates
            continue; // Skip to the next iteration
        }

        if (entry.month === '2024-10') {
            debugger;
        }

        // Set depositSavings
        if (!(entry.isDepositSavingsManual || entry.isManualFromFirestore)) {
            entry.depositSavings = lastDepositSavings;
        } else if (
            entry.depositSavings === undefined ||
            entry.depositSavings === null
        ) {
            entry.depositSavings = lastDepositSavings;
        }

        // Set depositInvestments
        if (
            !(entry.isDepositInvestmentsManual || entry.isManualFromFirestore)
        ) {
            entry.depositInvestments = lastDepositInvestments;
        } else if (
            entry.depositInvestments === undefined ||
            entry.depositInvestments === null
        ) {
            entry.depositInvestments = lastDepositInvestments;
        }

        lastDepositSavings = entry.depositSavings;
        lastDepositInvestments = entry.depositInvestments;

        // Find the last active entry
        let previousEntryIndex = i - 1;

        while (
            previousEntryIndex >= 0 &&
            !updatedData[previousEntryIndex].isActive
        ) {
            previousEntryIndex--;
        }

        if (previousEntryIndex >= 0) {
            runningTotalSavings =
                updatedData[previousEntryIndex].endingTotalSavings;
            runningTotalInvestments =
                updatedData[previousEntryIndex].endingTotalInvestments;
        } else {
            runningTotalSavings =
                entry.totalSavings !== undefined
                    ? entry.totalSavings
                    : entry.depositSavings || 0;
            runningTotalInvestments =
                entry.totalInvestments !== undefined
                    ? entry.totalInvestments
                    : entry.depositInvestments || 0;
        }

        // Handle manual totalSavings and totalInvestments in any row
        if (entry.isTotalSavingsManual) {
            runningTotalSavings = entry.totalSavings || 0;
        } else {
            runningTotalSavings += entry.depositSavings;
        }

        if (entry.isTotalInvestmentsManual) {
            runningTotalInvestments = entry.totalInvestments || 0;
        } else {
            runningTotalInvestments += entry.depositInvestments;
        }

        // Apply goals if possible
        let goalsApplied = [];
        while (goalIndex < sortedGoals.length) {
            const goal = sortedGoals[goalIndex];
            const totalAvailable =
                runningTotalSavings + runningTotalInvestments;

            if (totalAvailable >= goal.amount) {
                // Subtract goal amount
                if (runningTotalSavings >= goal.amount) {
                    runningTotalSavings -= goal.amount;
                } else {
                    const remaining = goal.amount - runningTotalSavings;
                    runningTotalSavings = 0;
                    runningTotalInvestments -= remaining;
                }
                goalsApplied.push(goal);
                goalIndex++;
            } else {
                break;
            }
        }

        // Calculate returns unless manual totals are set on the first row
        let interestReturn = 0;
        let investmentReturn = 0;
        if (!entry.isTotalSavingsManual) {
            interestReturn = runningTotalSavings * (interestRate / 12 / 100);
        }
        if (!entry.isTotalInvestmentsManual) {
            investmentReturn =
                runningTotalInvestments * (investmentReturnRate / 12 / 100);
        }

        // Update ending balances
        const endingTotalSavings = runningTotalSavings + interestReturn;
        const endingTotalInvestments =
            runningTotalInvestments + investmentReturn;

        // Update entry with all calculated values
        updatedData[i] = {
            ...entry,
            totalSavings: runningTotalSavings,
            totalInvestments: runningTotalInvestments,
            startingTotalSavings: runningTotalSavings,
            startingTotalInvestments: runningTotalInvestments,
            interestReturn,
            investmentReturn,
            endingTotalSavings,
            endingTotalInvestments,
            totalSaved: runningTotalSavings + runningTotalInvestments,
            grandTotal:
                runningTotalSavings +
                runningTotalInvestments +
                interestReturn +
                investmentReturn,
            goal: goalsApplied.length > 0 ? goalsApplied : null,
        };

        // Update running totals for the next iteration
        runningTotalSavings = endingTotalSavings;
        runningTotalInvestments = endingTotalInvestments;
    }

    return updatedData;
};

export const ensureNestEgg = (
    target,
    data,
    interestRate,
    investmentReturnRate
) => {
    let updatedData = [...data];
    let iterations = 0;
    const MAX_ITERATIONS = 1000;
    let lastGrandTotal = updatedData[updatedData.length - 1].grandTotal;

    while (lastGrandTotal < target && iterations < MAX_ITERATIONS) {
        // Add new month
        const lastMonthEntry = updatedData[updatedData.length - 1];
        const newMonth = getNextMonth(lastMonthEntry.month);
        const newEntry = {
            ...lastMonthEntry,
            month: newMonth,
            variantIndex: 0,
            rowKey: `${newMonth}-0`,
            goal: null, // Reset goal
            isManualFromFirestore: false,
            isAlt: false,
            isActive: true,
            // Reset any manual flags if necessary
            isDepositSavingsManual: false,
            isDepositInvestmentsManual: false,
            isTotalSavingsManual: false,
            isTotalInvestmentsManual: false,
        };

        updatedData.push(newEntry);

        // Recalculate only the new row
        const i = updatedData.length - 1;

        // Initialize or carry over balances from the previous row
        const previousEntry = updatedData[i - 1];
        let runningTotalSavings = previousEntry.endingTotalSavings;
        let runningTotalInvestments = previousEntry.endingTotalInvestments;

        // Add deposits if active
        runningTotalSavings += newEntry.depositSavings;
        runningTotalInvestments += newEntry.depositInvestments;

        // Apply any goals (unlikely in new rows, but included for completeness)
        let goalsApplied = [];
        // Assuming no new goals are added after initial calculations

        // Calculate returns
        let interestReturn = runningTotalSavings * (interestRate / 12 / 100);
        let investmentReturn =
            runningTotalInvestments * (investmentReturnRate / 12 / 100);

        // Update ending balances
        const endingTotalSavings = runningTotalSavings + interestReturn;
        const endingTotalInvestments =
            runningTotalInvestments + investmentReturn;

        // Update the new entry with all calculated values
        updatedData[i] = {
            ...newEntry,
            totalSavings: runningTotalSavings,
            totalInvestments: runningTotalInvestments,
            startingTotalSavings: runningTotalSavings,
            startingTotalInvestments: runningTotalInvestments,
            interestReturn,
            investmentReturn,
            endingTotalSavings,
            endingTotalInvestments,
            totalSaved: runningTotalSavings + runningTotalInvestments,
            grandTotal:
                runningTotalSavings +
                runningTotalInvestments +
                interestReturn +
                investmentReturn,
            goal: goalsApplied.length > 0 ? goalsApplied : null,
        };

        lastGrandTotal = updatedData[i].grandTotal;
        iterations++;
    }

    if (iterations >= MAX_ITERATIONS) {
        console.error('Exceeded maximum iterations in ensureNestEgg');
    }

    return updatedData;
};

export const getNextMonth = (currentMonth) => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1); // Adjust for zero-based month index
    date.setMonth(date.getMonth() + 1);
    const nextYear = date.getFullYear();
    const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
    return `${nextYear}-${nextMonth}`;
};
