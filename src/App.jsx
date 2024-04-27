import { useState, useEffect } from 'react';
import TableComponent from './components/TableComponent';
import InputFields from './components/InputFields';
import './App.css';

const App = () => {
    const [interestRate, setInterestRate] = useState(5);
    const [investmentReturnRate, setInvestmentReturnRate] = useState(10);
    const [tableData, setTableData] = useState(() =>
        generateData(interestRate, investmentReturnRate, 500, 300, 0)
    );
    const [targetNestEgg, setTargetNestEgg] = useState(5000000);
    const [age, setAge] = useState(38);

    // used to update the data displayed in the table whenever there's a change
    // in either the interestRate or the investmentReturnRate
    useEffect(() => {
        console.log(
            'useEffect triggered for interestRate or investmentReturnRate change.'
        );
        const updatedData = recalculateFromIndex(
            [...tableData],
            0,
            interestRate,
            investmentReturnRate
        );
        console.log('Updated data from useEffect:', updatedData);
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

    function recalculateFromIndex(
        data,
        startIndex,
        interestRate,
        investmentReturnRate
    ) {
        let runningTotalSavings =
            startIndex === 0 ? 0 : data[startIndex - 1].totalSavings;
        let runningTotalInvestments =
            startIndex === 0 ? 0 : data[startIndex - 1].totalInvestments;

        console.log(`Recalculation started from index: ${startIndex}`);

        for (let i = startIndex; i < data.length; i++) {
            const entry = data[i];

            runningTotalSavings += entry.depositSavings - entry.withdrawals;
            runningTotalInvestments += entry.depositInvestments;

            if (runningTotalSavings < 0) {
                runningTotalInvestments += runningTotalSavings;
                runningTotalSavings = 0;
            }

            runningTotalInvestments = Math.max(0, runningTotalInvestments);

            const interestReturn =
                runningTotalSavings * (interestRate / 12 / 100);
            console.log('Interest return is: ', interestReturn);
            const investmentReturn =
                runningTotalInvestments * (investmentReturnRate / 12 / 100);

            console.log(
                `Month: ${entry.month}, Savings: ${runningTotalSavings},
                Investments: ${runningTotalInvestments}, Interest Rate: ${interestRate},
                Investment Return Rate: ${investmentReturnRate}`
            );

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
                // Add formatted values
                interestReturnFormatted: interestReturn.toFixed(2),
                investmentReturnFormatted: investmentReturn.toFixed(2),
                totalSavingsFormatted: runningTotalSavings.toFixed(2),
                totalInvestmentsFormatted: runningTotalInvestments.toFixed(2),
                totalSavedFormatted: (
                    runningTotalSavings + runningTotalInvestments
                ).toFixed(2),
                grandTotalFormatted: (
                    runningTotalSavings +
                    runningTotalInvestments +
                    interestReturn +
                    investmentReturn
                ).toFixed(2),
                commentary: entry.commentary, // Assuming commentary is unchanged
            };

            runningTotalSavings += interestReturn;
            runningTotalInvestments += investmentReturn;
        }

        return data;
    }

    const handleFieldChange = (index, field, value) => {
        console.log(
            `Field change - Index: ${index}, Field: ${field}, Value: ${value}`
        );

        setTableData((currentData) => {
            const newData = [...currentData];
            console.log('Before update:', newData[index]);

            newData[index] = { ...newData[index], [field]: parseFloat(value) };
            console.log('After field update:', newData[index]);

            const updatedData = recalculateFromIndex(
                newData,
                index,
                interestRate,
                investmentReturnRate
            );
            console.log('After recalculation:', updatedData);

            return updatedData;
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
        console.log(
            'Raw interestReturn:',
            interestReturn,
            'Type:',
            typeof interestReturn
        );
        console.log('Formatted interestReturn:', interestReturn.toFixed(2));

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
