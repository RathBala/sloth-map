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

// calculations.js
export const recalculateAllEntries = (
    data,
    interestRate,
    investmentReturnRate,
    goals
) => {
    let updatedData = [...data];

    // Sort goals by your preferred criteria (e.g., amount or priority)
    const sortedGoals = Object.values(goals).sort(
        (a, b) => a.amount - b.amount
    );

    let pendingGoals = [...sortedGoals]; // Copy of goals to keep track of pending ones

    for (let i = 0; i < updatedData.length; i++) {
        const entry = updatedData[i];

        // Find the last active entry before this one
        let prevEntry = null;
        for (let j = i - 1; j >= 0; j--) {
            if (updatedData[j].isActive) {
                prevEntry = updatedData[j];
                break;
            }
        }

        let runningTotalSavings;
        let runningTotalInvestments;

        if (prevEntry) {
            runningTotalSavings =
                prevEntry.totalSavings + prevEntry.interestReturn;
            runningTotalInvestments =
                prevEntry.totalInvestments + prevEntry.investmentReturn;
        } else {
            // First entry
            // Use manual totals if they exist, otherwise initialize to zero
            runningTotalSavings = entry.isTotalSavingsManual
                ? entry.totalSavings
                : 0;
            runningTotalInvestments = entry.isTotalInvestmentsManual
                ? entry.totalInvestments
                : 0;
        }

        // Process deposits
        if (!entry.isTotalSavingsManual) {
            runningTotalSavings += entry.depositSavings;
        } else if (prevEntry) {
            // For manual totals in entries beyond the first, add deposits
            runningTotalSavings += entry.depositSavings;
        }

        if (!entry.isTotalInvestmentsManual) {
            runningTotalInvestments += entry.depositInvestments;
        } else if (prevEntry) {
            // For manual totals in entries beyond the first, add deposits
            runningTotalInvestments += entry.depositInvestments;
        }

        // Calculate returns
        const interestReturn = runningTotalSavings * (interestRate / 12 / 100);
        const investmentReturn =
            runningTotalInvestments * (investmentReturnRate / 12 / 100);

        let goalApplied = null;

        // Try to apply goals if the entry is active
        if (entry.isActive) {
            while (pendingGoals.length > 0) {
                const pendingGoal = pendingGoals[0];
                const totalAvailable =
                    runningTotalSavings +
                    runningTotalInvestments +
                    interestReturn +
                    investmentReturn;

                if (totalAvailable >= pendingGoal.amount) {
                    // Apply the goal
                    const goalAmount = pendingGoal.amount;

                    // Deduct from savings first, then investments
                    runningTotalSavings -= goalAmount;
                    if (runningTotalSavings < 0) {
                        runningTotalInvestments += runningTotalSavings; // Adjust investments if savings are negative
                        runningTotalSavings = 0;
                    }
                    runningTotalInvestments = Math.max(
                        0,
                        runningTotalInvestments
                    );

                    // Record the applied goal
                    goalApplied = {
                        name: pendingGoal.name,
                        amount: pendingGoal.amount,
                    };

                    // Remove the applied goal from pendingGoals
                    pendingGoals.shift();

                    // Break if you only want to apply one goal per month
                    break;
                } else {
                    // Cannot apply any more goals in this entry
                    break;
                }
            }
        }

        // Update the entry
        updatedData[i] = {
            ...entry,
            totalSavings: runningTotalSavings,
            totalInvestments: runningTotalInvestments,
            interestReturn,
            investmentReturn,
            totalSaved: runningTotalSavings + runningTotalInvestments,
            grandTotal:
                runningTotalSavings +
                runningTotalInvestments +
                interestReturn +
                investmentReturn,
            goal: goalApplied, // Only set if a goal is applied in this entry
            commentary: entry.commentary,
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
    let lastTotal = data.length ? data[data.length - 1].grandTotal : 0;

    if (lastTotal >= target) {
        while (data.length > 1 && data[data.length - 1].grandTotal >= target) {
            data.pop();
            lastTotal = data[data.length - 1].grandTotal;
        }
    } else {
        let iterations = 0;
        while (lastTotal < target && iterations < 1000) {
            const newEntry = {
                month: getNextMonth(data[data.length - 1].month),
                variantIndex: 0,
                rowKey: `${getNextMonth(data[data.length - 1].month)}-0`,
                depositSavings: data[data.length - 1].depositSavings,
                depositInvestments: data[data.length - 1].depositInvestments,
                totalSavings: 0,
                totalInvestments: 0,
                totalSaved: 0,
                interestReturn: 0,
                investmentReturn: 0,
                grandTotal: 0,
                commentary: '',
                isDepositSavingsManual: false,
                isDepositInvestmentsManual: false,
                isManualFromFirestore: false,
                isTotalSavingsManual: false,
                isTotalInvestmentsManual: false,
                isActive: true,
            };
            data = [...data, newEntry];
            data = recalculateFunction(
                data,
                interestRate,
                investmentReturnRate,
                goals
            );
            lastTotal = data[data.length - 1].grandTotal;
            iterations++;
        }
    }

    if (data.length > 1 && data[data.length - 1].grandTotal < target) {
        const newEntry = {
            month: getNextMonth(data[data.length - 1].month),
            variantIndex: 0,
            rowKey: `${getNextMonth(data[data.length - 1].month)}-0`,
            depositSavings: data[data.length - 1].depositSavings,
            depositInvestments: data[data.length - 1].depositInvestments,
            totalSavings: 0,
            totalInvestments: 0,
            totalSaved: 0,
            interestReturn: 0,
            investmentReturn: 0,
            grandTotal: 0,
            commentary: '',
            isDepositSavingsManual: false,
            isDepositInvestmentsManual: false,
            isManualFromFirestore: false,
            isTotalSavingsManual: false,
            isTotalInvestmentsManual: false,
            isActive: true,
        };
        data.push(newEntry);
        data = recalculateAllEntries(
            data,
            interestRate,
            investmentReturnRate,
            goals
        );
    }

    return data;
};

export const getNextMonth = (currentMonth) => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1); // Adjust for zero-based month index
    date.setMonth(date.getMonth() + 1);
    const nextYear = date.getFullYear();
    const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
    return `${nextYear}-${nextMonth}`;
};
