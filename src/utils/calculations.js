import { applyGoalToRow } from './applyGoalToRow';

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

export const calculateCurrentRow = (
    currentRow,
    previousRow,
    interestRate,
    investmentRate
) => {
    if (!currentRow.isDepositSavingsManual) {
        currentRow.depositSavings = previousRow.depositSavings;
    }
    if (!currentRow.isDepositInvestmentsManual) {
        currentRow.depositInvestments = previousRow.depositInvestments;
    }

    const interestReturn = (interestRate / 12 / 100) * previousRow.totalSavings;
    const investmentReturn =
        (investmentRate / 12 / 100) * previousRow.totalInvestments;

    currentRow.interestReturn = interestReturn;
    currentRow.investmentReturn = investmentReturn;

    if (!currentRow.isTotalSavingsManual) {
        currentRow.totalSavings =
            previousRow.totalSavings +
            currentRow.depositSavings +
            interestReturn;
    }
    if (!currentRow.isTotalInvestmentsManual) {
        currentRow.totalInvestments =
            previousRow.totalInvestments +
            currentRow.depositInvestments +
            investmentReturn;
    }

    currentRow.grandTotal =
        currentRow.totalSavings + currentRow.totalInvestments;
};

export const calculateCumulativeBalances = (rows, goals) => {
    const sortedGoals = Object.values(goals).sort(
        (a, b) => a.priority - b.priority
    );

    let goalIndex = 0;
    const totalGoals = sortedGoals.length;

    const firstActiveIndex = rows.findIndex((r) => r.isActive);
    if (firstActiveIndex === -1) {
        return rows;
    }
    const firstActiveRow = rows[firstActiveIndex];

    if (!firstActiveRow.isTotalSavingsManual) {
        firstActiveRow.totalSavings = firstActiveRow.depositSavings || 0;
    }
    if (!firstActiveRow.isTotalInvestmentsManual) {
        firstActiveRow.totalInvestments =
            firstActiveRow.depositInvestments || 0;
    }

    firstActiveRow.interestReturn = 0;
    firstActiveRow.investmentReturn = 0;

    firstActiveRow.grandTotal =
        firstActiveRow.totalSavings + firstActiveRow.totalInvestments;

    while (
        goalIndex < totalGoals &&
        firstActiveRow.grandTotal >= sortedGoals[goalIndex].amount
    ) {
        applyGoalToRow(firstActiveRow, sortedGoals[goalIndex]);
        goalIndex++;
    }

    let previousActiveRow = firstActiveRow;

    for (let i = firstActiveIndex + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row.isActive) continue;

        calculateCurrentRow(row, previousActiveRow);

        while (
            goalIndex < totalGoals &&
            row.grandTotal >= sortedGoals[goalIndex].amount
        ) {
            applyGoalToRow(row, sortedGoals[goalIndex]);
            goalIndex++;
        }

        previousActiveRow = row;
    }
    return rows;
};

// TODO: clean up interest etc calculations to align with calculateCurrentRow
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

        const i = updatedData.length - 1;
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
