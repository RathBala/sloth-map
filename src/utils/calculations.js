export const generateData = (savings, investments, withdrawals) => {
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
            withdrawals: withdrawals,
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

export const recalculateFromIndex = (
    data,
    startIndex,
    interestRate,
    investmentReturnRate
) => {
    let updatedData = [...data];

    let runningTotalSavings =
        startIndex === 0 ? 0 : updatedData[startIndex - 1].totalSavings;
    let runningTotalInvestments =
        startIndex === 0 ? 0 : updatedData[startIndex - 1].totalInvestments;

    for (let i = startIndex; i < updatedData.length; i++) {
        const entry = updatedData[i];

        if (!entry.isActive) {
            continue;
        }

        if (i > 0) {
            runningTotalSavings += updatedData[i - 1].interestReturn;
            runningTotalInvestments += updatedData[i - 1].investmentReturn;
        }

        if (!entry.isTotalSavingsManual) {
            runningTotalSavings += entry.depositSavings - entry.withdrawals;
        } else {
            runningTotalSavings = entry.totalSavings;
        }

        if (!entry.isTotalInvestmentsManual) {
            runningTotalInvestments += entry.depositInvestments;
        } else {
            runningTotalInvestments = entry.totalInvestments;
        }

        if (runningTotalSavings < 0) {
            runningTotalInvestments += runningTotalSavings;
            runningTotalSavings = 0;
        }

        runningTotalInvestments = Math.max(0, runningTotalInvestments);

        const interestReturn = runningTotalSavings * (interestRate / 12 / 100);
        const investmentReturn =
            runningTotalInvestments * (investmentReturnRate / 12 / 100);

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
    recalculate
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
                withdrawals: data[data.length - 1].withdrawals,
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
            data = recalculate(
                data,
                data.length - 1,
                interestRate,
                investmentReturnRate
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
            withdrawals: data[data.length - 1].withdrawals,
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
        data = recalculate(
            data,
            data.length - 1,
            interestRate,
            investmentReturnRate
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
