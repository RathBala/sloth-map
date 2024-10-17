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
    let updatedData = [...data];

    // Prepare the list of goals to be applied
    const sortedGoals = Object.values(goals).sort(
        (a, b) => a.amount - b.amount
    );

    let pendingGoals = [...sortedGoals];

    // Initialize running totals
    let runningTotalSavings = 0;
    let runningTotalInvestments = 0;

    for (let i = 0; i < updatedData.length; i++) {
        const entry = updatedData[i];

        // For each entry, start with previous totals
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
            const prevEntry = updatedData[i - 1];
            runningTotalSavings = prevEntry.runningTotalSavings;
            runningTotalInvestments = prevEntry.runningTotalInvestments;
        }

        // Add deposits if entry is active
        if (entry.isActive) {
            runningTotalSavings += entry.depositSavings;
            runningTotalInvestments += entry.depositInvestments;
        }

        // Calculate returns
        const interestReturn = runningTotalSavings * (interestRate / 12 / 100);
        const investmentReturn =
            runningTotalInvestments * (investmentReturnRate / 12 / 100);

        // Add returns to running totals
        runningTotalSavings += interestReturn;
        runningTotalInvestments += investmentReturn;

        // Try to apply goals only if the entry is active
        let goalApplied = null;
        if (entry.isActive) {
            while (pendingGoals.length > 0) {
                const pendingGoal = pendingGoals[0];
                const totalAvailable =
                    runningTotalSavings + runningTotalInvestments;

                if (totalAvailable >= pendingGoal.amount) {
                    let goalAmount = pendingGoal.amount;
                    let remainingGoalAmount = goalAmount;

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
                            // Not enough funds; this shouldn't happen as we checked totalAvailable
                            break;
                        }
                    }

                    goalApplied = {
                        id: pendingGoal.id,
                        name: pendingGoal.name,
                        amount: pendingGoal.amount,
                    };

                    pendingGoals.shift(); // Remove goal from pending list
                } else {
                    // Not enough funds to apply goal
                    break;
                }
            }
        }

        // Ensure totals are not negative
        runningTotalSavings = Math.max(runningTotalSavings, 0);
        runningTotalInvestments = Math.max(runningTotalInvestments, 0);

        // Set display totals
        const displayTotalSavings =
            entry.isTotalSavingsManual && i === 0
                ? entry.totalSavings
                : runningTotalSavings;
        const displayTotalInvestments =
            entry.isTotalInvestmentsManual && i === 0
                ? entry.totalInvestments
                : runningTotalInvestments;

        // Update entry data
        updatedData[i] = {
            ...entry,
            totalSavings: displayTotalSavings,
            totalInvestments: displayTotalInvestments,
            interestReturn,
            investmentReturn,
            totalSaved: displayTotalSavings + displayTotalInvestments,
            grandTotal: displayTotalSavings + displayTotalInvestments,
            goal: goalApplied,
            commentary: entry.commentary,
            runningTotalSavings, // For next iteration
            runningTotalInvestments, // For next iteration
        };
    }

    // Remove runningTotalSavings and runningTotalInvestments from entries before returning
    updatedData = updatedData.map(
        ({ runningTotalSavings, runningTotalInvestments, ...rest }) => rest
    );

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
