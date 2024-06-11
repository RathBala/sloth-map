export const generateData = (savings, investments, withdrawals) => {
    const today = new Date();
    const currentMonth =
        today.toLocaleString('default', { month: 'long' }) +
        ' ' +
        today.getFullYear();

    return [
        {
            month: currentMonth,
            depositSavings: savings,
            depositInvestments: investments,
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
        },
    ];
};

export const recalculateFromIndex = (
    data,
    startIndex,
    interestRate,
    investmentReturnRate
) => {
    let runningTotalSavings =
        startIndex === 0 ? 0 : data[startIndex - 1].totalSavings;
    let runningTotalInvestments =
        startIndex === 0 ? 0 : data[startIndex - 1].totalInvestments;

    console.log(`Initial data at index 0: ${JSON.stringify(data[0], null, 2)}`);

    for (let i = startIndex; i < data.length; i++) {
        const entry = data[i];

        if (i > 0) {
            runningTotalSavings += data[i - 1].interestReturn;
            runningTotalInvestments += data[i - 1].investmentReturn;
        }

        if (i === 0) {
            console.log(
                `Before manual check - Index ${i}: runningTotalSavings: ${runningTotalSavings}, runningTotalInvestments: ${runningTotalInvestments}`
            );
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

        if (i === 0) {
            console.log(
                `After manual check - Index ${i}: runningTotalSavings: ${runningTotalSavings}, runningTotalInvestments: ${runningTotalInvestments}`
            );
        }

        if (runningTotalSavings < 0) {
            runningTotalInvestments += runningTotalSavings;
            runningTotalSavings = 0;
        }

        runningTotalInvestments = Math.max(0, runningTotalInvestments);

        const interestReturn = runningTotalSavings * (interestRate / 12 / 100);
        const investmentReturn =
            runningTotalInvestments * (investmentReturnRate / 12 / 100);

        data[i] = {
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

        if (i === 0) {
            console.log(
                `Updated data at index 0: ${JSON.stringify(data[0], null, 2)}`
            );
        }
    }

    console.log(`Final data at index 0: ${JSON.stringify(data[0], null, 2)}`);

    return data;
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
    const dateParts = currentMonth.split(' ');
    const month = dateParts[0];
    const year = parseInt(dateParts[1], 10);

    const date = new Date(`${month} 1, ${year}`);
    date.setMonth(date.getMonth() + 1);
    return (
        date.toLocaleString('default', { month: 'long' }) +
        ' ' +
        date.getFullYear()
    );
};
