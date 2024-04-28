import { useState, useEffect } from 'react';
import TableComponent from './components/TableComponent';
import InputFields from './components/InputFields';
import './App.css';

function formatNumber(num) {
    return new Intl.NumberFormat('en-US', {
        style: 'decimal',
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
    }).format(num);
}

const App = () => {
    const [interestRate, setInterestRate] = useState(5);
    const [investmentReturnRate, setInvestmentReturnRate] = useState(10);
    const [tableData, setTableData] = useState(() =>
        generateData(interestRate, investmentReturnRate, 500, 300, 0)
    );
    const [targetNestEgg, setTargetNestEgg] = useState(5000000);
    const [age, setAge] = useState(38);

    useEffect(() => {
        console.log(
            'useEffect triggered for interestRate, investmentReturnRate, or targetNestEgg change.'
        );

        // Use a copy of the current table data to apply changes
        let updatedData = [...tableData];

        // Recalculate data from the beginning to apply new rates
        updatedData = recalculateFromIndex(
            updatedData,
            0,
            interestRate,
            investmentReturnRate
        );

        // Ensure the data meets the target nest egg requirements
        updatedData = ensureNestEgg(
            targetNestEgg,
            updatedData,
            interestRate,
            investmentReturnRate,
            recalculateFromIndex
        );

        // Update the state with the new data
        setTableData(updatedData);

        console.log('Updated data from useEffect:', updatedData);
    }, [interestRate, investmentReturnRate, targetNestEgg]); // Remove tableData from here

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

            const totalDeposit =
                entry.depositSavings + entry.depositInvestments;

            if (i > 0) {
                runningTotalSavings += data[i - 1].interestReturn;
                runningTotalInvestments += data[i - 1].investmentReturn;
            }

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
                interestReturnFormatted: formatNumber(interestReturn),
                investmentReturnFormatted: formatNumber(investmentReturn),
                totalDepositFormatted: formatNumber(
                    entry.depositSavings + entry.depositInvestments
                ),
                totalSavingsFormatted: formatNumber(runningTotalSavings),
                totalInvestmentsFormatted: formatNumber(
                    runningTotalInvestments
                ),
                totalSavedFormatted: formatNumber(
                    runningTotalSavings + runningTotalInvestments
                ),
                grandTotalFormatted: formatNumber(
                    runningTotalSavings +
                        runningTotalInvestments +
                        interestReturn +
                        investmentReturn
                ),
                commentary: entry.commentary,
            };
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

            if (
                field === 'withdrawals' ||
                field === 'depositSavings' ||
                field === 'depositInvestments'
            ) {
                for (let i = index + 1; i < newData.length; i++) {
                    newData[i] = { ...newData[i], [field]: parseFloat(value) };
                }
            }

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

function generateData() {
    const today = new Date();
    const currentMonth =
        today.toLocaleString('default', { month: 'long' }) +
        ' ' +
        today.getFullYear();

    return [
        {
            month: currentMonth,
            depositSavings: 100, // Set default deposit for savings
            depositInvestments: 100, // Set default deposit for investments
            withdrawals: 0,
            totalSavings: 0,
            totalInvestments: 0,
            totalSaved: 0,
            interestReturn: 0,
            investmentReturn: 0,
            grandTotal: 0,
            commentary: '',
        },
    ];
}

function getNextMonth(currentMonth) {
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
}

function ensureNestEgg(
    target,
    data,
    interestRate,
    investmentReturnRate,
    recalculate
) {
    let lastTotal = data.length ? data[data.length - 1].grandTotal : 0;
    let iterations = 0;
    while (lastTotal < target && iterations < 100) {
        // Stop after 100 iterations to prevent infinite loops
        const newEntry = {
            month: data.length
                ? getNextMonth(data[data.length - 1].month)
                : 'Start Month',
            depositSavings: data.length
                ? data[data.length - 1].depositSavings
                : 0,
            depositInvestments: data.length
                ? data[data.length - 1].depositInvestments
                : 0,
            withdrawals: data.length ? data[data.length - 1].withdrawals : 0,
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
    return data;
}

// function generateData(
//     interestRate,
//     investmentReturnRate,
//     depositSavings,
//     depositInvestments,
//     withdrawals
// ) {
//     const months = [
//         'January 2024',
//         'February 2024',
//         'March 2024',
//         'April 2024',
//         'May 2024',
//         'June 2024',
//         'July 2024',
//         'August 2024',
//         'September 2024',
//         'October 2024',
//         'November 2024',
//         'December 2024',
//     ];
//     let data = months.map((month) => ({
//         month,
//         depositSavings,
//         depositInvestments,
//         withdrawals: withdrawals,
//         totalSavings: 0,
//         totalInvestments: 0,
//         totalSaved: 0,
//         interestReturn: 0,
//         investmentReturn: 0,
//         grandTotal: 0,
//         commentary: '',
//     }));

//     let runningTotalSavings = depositSavings - withdrawals;
//     let runningTotalInvestments = depositInvestments;

//     if (runningTotalSavings < 0) {
//         runningTotalInvestments += runningTotalSavings;
//         runningTotalSavings = 0;
//     }

//     runningTotalInvestments = Math.max(0, runningTotalInvestments);

//     data.forEach((entry, index) => {
//         let interestReturn = runningTotalSavings * (interestRate / 12 / 100);
//         console.log(
//             'Raw interestReturn:',
//             interestReturn,
//             'Type:',
//             typeof interestReturn
//         );
//         console.log('Formatted interestReturn:', interestReturn.toFixed(2));

//         let investmentReturn =
//             runningTotalInvestments * (investmentReturnRate / 12 / 100);

//         entry.interestReturn = interestReturn;
//         entry.investmentReturn = investmentReturn;

//         entry.grandTotal =
//             runningTotalSavings +
//             runningTotalInvestments +
//             interestReturn +
//             investmentReturn;

//         entry.totalSavings = runningTotalSavings;
//         entry.totalInvestments = runningTotalInvestments;
//         entry.totalSaved = entry.totalSavings + entry.totalInvestments;

//         entry.totalDepositFormatted = (
//             depositSavings + depositInvestments
//         ).toFixed(2);
//         entry.totalSavingsFormatted = runningTotalSavings.toFixed(2);
//         entry.totalInvestmentsFormatted = runningTotalInvestments.toFixed(2);
//         entry.totalSavedFormatted = entry.totalSaved.toFixed(2);
//         entry.interestReturnFormatted = interestReturn.toFixed(2);
//         entry.investmentReturnFormatted = investmentReturn.toFixed(2);
//         entry.grandTotalFormatted = entry.grandTotal.toFixed(2);
//         entry.commentary = '';

//         if (index < data.length - 1) {
//             runningTotalSavings += depositSavings - withdrawals;
//             runningTotalInvestments += depositInvestments;

//             if (runningTotalSavings < 0) {
//                 runningTotalInvestments += runningTotalSavings;
//                 runningTotalSavings = 0;
//             }

//             runningTotalInvestments = Math.max(0, runningTotalInvestments);

//             runningTotalSavings += interestReturn;
//             runningTotalInvestments += investmentReturn;
//         }
//     });

//     return data;
// }

export default App;
