import { useState, useEffect } from 'react';
import TableComponent from './components/TableComponent';
import InputFields from './components/InputFields';
import './App.css';

const App = () => {
    const [interestRate, setInterestRate] = useState(5);
    const [investmentReturnRate, setInvestmentReturnRate] = useState(10);
    const [tableData, setTableData] = useState(() =>
        generateData(interestRate, investmentReturnRate, 500, 300, 100)
    );
    const [targetNestEgg, setTargetNestEgg] = useState(5000000);
    const [age, setAge] = useState(38);

    useEffect(() => {
        const updatedData = generateData(
            interestRate,
            investmentReturnRate,
            500,
            300,
            100
        );
        setTableData(updatedData);
    }, [interestRate, investmentReturnRate]);

    useEffect(() => {
        console.log('Table data updated:', tableData);
    }, [tableData]);

    const handleInterestRateChange = (e) =>
        setInterestRate(parseFloat(e.target.value));
    const handleInvestmentReturnRateChange = (e) =>
        setInvestmentReturnRate(parseFloat(e.target.value));
    const handleTargetNestEggChange = (e) =>
        setTargetNestEgg(parseFloat(e.target.value));
    const handleAgeChange = (e) => setAge(parseFloat(e.target.value));

    function updateRunningTotals(data, interestRate, investmentReturnRate) {
        let runningTotalSavings = 0;
        let runningTotalInvestments = 0;

        data.forEach((entry, index) => {
            if (index > 0) {
                const prevEntry = data[index - 1];
                runningTotalSavings +=
                    prevEntry.depositSavings -
                    prevEntry.withdrawals +
                    prevEntry.interestReturn;
                runningTotalInvestments +=
                    prevEntry.depositInvestments + prevEntry.investmentReturn;

                if (runningTotalSavings < 0) {
                    runningTotalInvestments += runningTotalSavings;
                    runningTotalSavings = 0;
                }

                runningTotalInvestments = Math.max(0, runningTotalInvestments);
            } else {
                runningTotalSavings = entry.depositSavings - entry.withdrawals;
                runningTotalInvestments = entry.depositInvestments;

                if (runningTotalSavings < 0) {
                    runningTotalInvestments += runningTotalSavings;
                    runningTotalSavings = 0;
                }

                runningTotalInvestments = Math.max(0, runningTotalInvestments);
            }

            entry.totalSavings = runningTotalSavings;
            entry.totalInvestments = runningTotalInvestments;
            entry.interestReturn =
                runningTotalSavings * (interestRate / 12 / 100);
            entry.investmentReturn =
                runningTotalInvestments * (investmentReturnRate / 12 / 100);
            entry.totalSaved = entry.totalSavings + entry.totalInvestments;
            entry.grandTotal =
                entry.totalSaved +
                entry.interestReturn +
                entry.investmentReturn;
        });

        return data;
    }

    const handleFieldChange = (index, field, value) => {
        const newValue = field === 'commentary' ? value : parseFloat(value);
        setTableData((currentData) => {
            let newData = [...currentData];

            // Apply the new value to the current row
            newData[index] = { ...newData[index], [field]: newValue };

            if (
                field === 'withdrawals' ||
                field === 'depositSavings' ||
                field === 'depositInvestments'
            ) {
                // Update all entries starting from the current index
                let updatedData = updateRunningTotals(
                    newData,
                    interestRate,
                    investmentReturnRate
                );

                // Combine the unchanged data with the newly updated data
                newData = [
                    ...newData.slice(0, index),
                    ...updatedData.slice(index),
                ];
            }

            return newData;
        });
    };

    return (
        <div className="App">
            <InputFields
                interestRate={interestRate}
                investmentReturnRate={investmentReturnRate}
                targetNestEgg={targetNestEgg}
                age={age}
                handleInterestRateChange={handleInterestRateChange}
                handleInvestmentReturnRateChange={
                    handleInvestmentReturnRateChange
                }
                handleTargetNestEggChange={handleTargetNestEggChange}
                handleAgeChange={handleAgeChange}
            />
            <TableComponent
                data={tableData}
                onFieldChange={handleFieldChange}
            />
        </div>
    );
};

function generateData(
    interestRate,
    investmentReturnRate,
    depositSavings,
    depositInvestments,
    withdrawals
) {
    const months = [
        'January 2024',
        'February 2024',
        'March 2024',
        'April 2024',
        'May 2024',
        'June 2024',
        'July 2024',
        'August 2024',
        'September 2024',
        'October 2024',
        'November 2024',
        'December 2024',
    ];
    let data = months.map((month) => ({
        month,
        depositSavings,
        depositInvestments,
        withdrawals: withdrawals,
        totalSavings: 0,
        totalInvestments: 0,
        totalSaved: 0,
        interestReturn: 0,
        investmentReturn: 0,
        grandTotal: 0,
        commentary: '',
    }));

    let runningTotalSavings = depositSavings - withdrawals;
    let runningTotalInvestments = depositInvestments;

    if (runningTotalSavings < 0) {
        runningTotalInvestments += runningTotalSavings;
        runningTotalSavings = 0;
    }

    runningTotalInvestments = Math.max(0, runningTotalInvestments);

    data.forEach((entry, index) => {
        let interestReturn = runningTotalSavings * (interestRate / 12 / 100);
        let investmentReturn =
            runningTotalInvestments * (investmentReturnRate / 12 / 100);

        // Assign interest and investment return to the current month's entry
        entry.interestReturn = interestReturn;
        entry.investmentReturn = investmentReturn;

        entry.grandTotal =
            runningTotalSavings +
            runningTotalInvestments +
            interestReturn +
            investmentReturn;

        entry.totalSavings = runningTotalSavings;
        entry.totalInvestments = runningTotalInvestments;
        entry.totalSaved = entry.totalSavings + entry.totalInvestments;

        entry.totalDepositFormatted = (
            depositSavings + depositInvestments
        ).toFixed(2);
        entry.totalSavingsFormatted = runningTotalSavings.toFixed(2);
        entry.totalInvestmentsFormatted = runningTotalInvestments.toFixed(2);
        entry.totalSavedFormatted = entry.totalSaved.toFixed(2);
        entry.interestReturnFormatted = interestReturn.toFixed(2);
        entry.investmentReturnFormatted = investmentReturn.toFixed(2);
        entry.grandTotalFormatted = entry.grandTotal.toFixed(2);
        entry.commentary =
            index === 0
                ? 'Initial deposit.'
                : 'Adjusted investments for better performance.';

        if (index < data.length - 1) {
            // Prepare for next month by applying deposits and withdrawals
            runningTotalSavings += depositSavings - withdrawals;
            runningTotalInvestments += depositInvestments;

            // Adjust if current withdrawals make the savings go negative
            if (runningTotalSavings < 0) {
                runningTotalInvestments += runningTotalSavings; // Adjust investments by the negative savings amount
                runningTotalSavings = 0; // Reset savings to zero
            }

            // Ensure running total investments do not go negative
            runningTotalInvestments = Math.max(0, runningTotalInvestments);

            // Add returns to running totals for the next month
            runningTotalSavings += interestReturn;
            runningTotalInvestments += investmentReturn;
        }
    });

    return data;
}

// function recalculateFields(
//     dataArray,
//     index,
//     interestRate,
//     investmentReturnRate
// ) {
//     const data = dataArray[index];
//     const previous = index === 0 ? null : dataArray[index - 1];

//     const previousTotalSavings = previous
//         ? parseFloat(previous.totalSavings)
//         : 0;
//     const previousTotalInvestments = previous
//         ? parseFloat(previous.totalInvestments)
//         : 0;

//     const previousInterestReturn =
//         previousTotalSavings * (interestRate / 12 / 100);
//     const previousInvestmentReturn =
//         previousTotalInvestments * (investmentReturnRate / 12 / 100);

//     const totalDeposit = data.depositSavings + data.depositInvestments;

//     const totalSavings = Math.max(
//         0,
//         previousTotalSavings +
//             previousInterestReturn +
//             data.depositSavings -
//             data.withdrawals
//     );
//     const shortfall = Math.max(
//         0,
//         parseFloat(data.withdrawals) -
//             (parseFloat(previousTotalSavings) + previousInterestReturn)
//     );
//     let totalInvestments =
//         parseFloat(previousTotalInvestments) +
//         previousInvestmentReturn +
//         parseFloat(data.depositInvestments) -
//         shortfall;
//     totalInvestments = Math.max(0, totalInvestments);
//     const totalSaved = totalSavings + totalInvestments;
//     const interestReturn = totalSavings * (interestRate / 12 / 100);
//     const investmentReturn =
//         totalInvestments * (investmentReturnRate / 12 / 100);
//     const grandTotal = totalSaved + interestReturn + investmentReturn;

//     console.log(
//         'Here are some of the values: ',
//         grandTotal,
//         investmentReturn,
//         interestReturn,
//         totalSaved
//     );

//     return {
//         ...data,
//         totalDepositFormatted: totalDeposit.toFixed(2),
//         totalSavingsFormatted: totalSavings.toFixed(2),
//         totalInvestmentsFormatted: totalInvestments.toFixed(2),
//         totalSavedFormatted: totalSaved.toFixed(2),
//         interestReturnFormatted: interestReturn.toFixed(2),
//         investmentReturnFormatted: investmentReturn.toFixed(2),
//         grandTotalFormatted: grandTotal.toFixed(2),
//         commentary: data.commentary,
//     };
// }

export default App;
