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
    let updatedData = [...data];
    let runningTotalSavings = 0;
    let runningTotalInvestments = 0;
    const sortedGoals = Object.values(goals).sort(
        (a, b) => a.priority - b.priority
    );
    let goalIndex = 0;

    for (let i = 0; i < updatedData.length; i++) {
        const entry = updatedData[i];

        // Initialize or carry over balances
        if (i === 0) {
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

        // Add deposits if active
        if (entry.isActive && (i > 0 || !entry.isTotalSavingsManual)) {
            runningTotalSavings += entry.depositSavings;
        }
        if (entry.isActive && (i > 0 || !entry.isTotalInvestmentsManual)) {
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
        if (
            !(
                i === 0 &&
                (entry.isTotalSavingsManual || entry.isTotalInvestmentsManual)
            )
        ) {
            interestReturn = runningTotalSavings * (interestRate / 12 / 100);
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
