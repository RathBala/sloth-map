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

export const recalculateAllEntries = (
    data,
    interestRate,
    investmentReturnRate,
    goals
) => {
    // First, calculate cumulative balances without goals
    let updatedData = calculateCumulativeBalances(
        data,
        interestRate,
        investmentReturnRate
    );

    // Then, schedule the goals
    const scheduledGoals = scheduleGoals(updatedData, goals);

    // Now, recalculate balances applying the goals in scheduled months
    updatedData = applyScheduledGoals(
        updatedData,
        scheduledGoals,
        interestRate,
        investmentReturnRate
    );

    return updatedData;
};

const calculateCumulativeBalances = (
    data,
    interestRate,
    investmentReturnRate
) => {
    let updatedData = [...data];
    let runningTotalSavings = 0;
    let runningTotalInvestments = 0;

    for (let i = 0; i < updatedData.length; i++) {
        const entry = updatedData[i];

        if (i === 0) {
            // First row
            runningTotalSavings = entry.isTotalSavingsManual
                ? entry.totalSavings || 0
                : 0;
            runningTotalInvestments = entry.isTotalInvestmentsManual
                ? entry.totalInvestments || 0
                : 0;
        } else {
            // Subsequent rows
            runningTotalSavings = updatedData[i - 1].endingTotalSavings;
            runningTotalInvestments = updatedData[i - 1].endingTotalInvestments;
        }

        // Add deposits if entry is active and not manually overridden in first row
        if (entry.isActive && (i > 0 || !entry.isTotalSavingsManual)) {
            runningTotalSavings += entry.depositSavings;
        }
        if (entry.isActive && (i > 0 || !entry.isTotalInvestmentsManual)) {
            runningTotalInvestments += entry.depositInvestments;
        }

        // No goals applied yet

        // Interest and returns are zero for the first row with manual totals
        let interestReturn = 0;
        let investmentReturn = 0;

        if (i > 0) {
            interestReturn = runningTotalSavings * (interestRate / 12 / 100);
            investmentReturn =
                runningTotalInvestments * (investmentReturnRate / 12 / 100);
        }

        // Update ending balances
        const endingTotalSavings = runningTotalSavings + interestReturn;
        const endingTotalInvestments =
            runningTotalInvestments + investmentReturn;

        // Store values in entry
        updatedData[i] = {
            ...entry,
            startingTotalSavings: runningTotalSavings,
            startingTotalInvestments: runningTotalInvestments,
            interestReturn,
            investmentReturn,
            endingTotalSavings,
            endingTotalInvestments,
            totalSaved: endingTotalSavings + endingTotalInvestments,
            grandTotal: endingTotalSavings + endingTotalInvestments,
        };
    }

    return updatedData;
};

const scheduleGoals = (data, goals) => {
    const scheduledGoals = {}; // key: row index, value: array of goals to apply
    const sortedGoals = Object.values(goals).sort(
        (a, b) => a.priority - b.priority
    );

    const totalAvailable = data.map((entry) => entry.grandTotal);

    for (const goal of sortedGoals) {
        for (let i = 0; i < data.length; i++) {
            if (totalAvailable[i] >= goal.amount) {
                // Schedule goal in this month
                if (!scheduledGoals[i]) {
                    scheduledGoals[i] = [];
                }
                scheduledGoals[i].push(goal);

                // Reduce totalAvailable from this month onward
                for (let j = i; j < data.length; j++) {
                    totalAvailable[j] -= goal.amount;
                }

                break; // Goal scheduled, move to the next goal
            }
        }
    }

    return scheduledGoals;
};

const applyScheduledGoals = (
    data,
    scheduledGoals,
    interestRate,
    investmentReturnRate
) => {
    let updatedData = [...data];
    let runningTotalSavings = 0;
    let runningTotalInvestments = 0;

    for (let i = 0; i < updatedData.length; i++) {
        const entry = updatedData[i];

        if (i === 0) {
            // First row
            runningTotalSavings = entry.isTotalSavingsManual
                ? entry.totalSavings || 0
                : 0;
            runningTotalInvestments = entry.isTotalInvestmentsManual
                ? entry.totalInvestments || 0
                : 0;
        } else {
            runningTotalSavings = updatedData[i - 1].endingTotalSavings;
            runningTotalInvestments = updatedData[i - 1].endingTotalInvestments;
        }

        // Add deposits if entry is active and not manually overridden in first row
        if (entry.isActive && (i > 0 || !entry.isTotalSavingsManual)) {
            runningTotalSavings += entry.depositSavings;
        }
        if (entry.isActive && (i > 0 || !entry.isTotalInvestmentsManual)) {
            runningTotalInvestments += entry.depositInvestments;
        }

        // Apply scheduled goals
        let goalsApplied = [];
        if (scheduledGoals[i]) {
            for (const goal of scheduledGoals[i]) {
                let remainingGoalAmount = goal.amount;

                // Subtract from savings first
                if (runningTotalSavings >= remainingGoalAmount) {
                    runningTotalSavings -= remainingGoalAmount;
                    remainingGoalAmount = 0;
                } else {
                    remainingGoalAmount -= runningTotalSavings;
                    runningTotalSavings = 0;

                    // Subtract the remaining from investments
                    if (runningTotalInvestments >= remainingGoalAmount) {
                        runningTotalInvestments -= remainingGoalAmount;
                        remainingGoalAmount = 0;
                    } else {
                        // Should not happen as we checked totalAvailable
                        console.error(
                            'Insufficient funds during goal application'
                        );
                    }
                }

                goalsApplied.push(goal);
            }
        }

        // Ensure balances are not negative
        runningTotalSavings = Math.max(runningTotalSavings, 0);
        runningTotalInvestments = Math.max(runningTotalInvestments, 0);

        // Interest and returns are zero for the first row with manual totals
        let interestReturn = 0;
        let investmentReturn = 0;

        if (i > 0) {
            interestReturn = runningTotalSavings * (interestRate / 12 / 100);
            investmentReturn =
                runningTotalInvestments * (investmentReturnRate / 12 / 100);
        }

        // Update ending balances
        const endingTotalSavings = runningTotalSavings + interestReturn;
        const endingTotalInvestments =
            runningTotalInvestments + investmentReturn;

        // Update entry
        updatedData[i] = {
            ...entry,
            interestReturn,
            investmentReturn,
            endingTotalSavings,
            endingTotalInvestments,
            totalSaved: endingTotalSavings + endingTotalInvestments,
            grandTotal: endingTotalSavings + endingTotalInvestments,
            goal: goalsApplied.length > 0 ? goalsApplied : null,
        };
    }

    return updatedData;
};

export const ensureNestEgg = (
    target,
    data,
    interestRate,
    investmentReturnRate,
    recalculateFunction,
    goals
) => {
    let updatedData = [...data];
    let iterations = 0;
    const MAX_ITERATIONS = 1000;
    let lastGrandTotal = 0;

    do {
        updatedData = recalculateFunction(
            updatedData,
            interestRate,
            investmentReturnRate,
            goals
        );

        lastGrandTotal = updatedData[updatedData.length - 1].grandTotal;
        if (lastGrandTotal >= target) {
            break;
        }

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
        };

        updatedData.push(newEntry);

        iterations++;
        if (iterations > MAX_ITERATIONS) {
            console.error('Exceeded maximum iterations in ensureNestEgg');
            break;
        }
    } while (lastGrandTotal < target);

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
