import { useState, useEffect } from 'react';
import TableComponent from './components/TableComponent';
import InputFields from './components/InputFields';
import './App.css';

// const DEPOSIT_SAVINGS = 500;
// const DEPOSIT_INVESTMENTS = 300;
// const WITHDRAWALS = 100;

// const generateData = (
//     interestRate,
//     investmentReturnRate,
//     depositSavings,
//     depositInvestments,
//     withdrawals
// ) => {
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
//     let previous = {
//         month: 'January 2024',
//         depositSavings: initialDepositSavings,
//         depositInvestments: DEPOSIT_INVESTMENTS,
//         withdrawals: 0,
//         totalSavings: initialDepositSavings,
//         totalInvestments: DEPOSIT_INVESTMENTS,
//         totalDeposit: Number(
//             initialDepositSavings + DEPOSIT_INVESTMENTS
//         ).toFixed(2),
//         interestReturn: Number(
//             initialDepositSavings * (interestRate / 12 / 100)
//         ).toFixed(2),
//         investmentReturn: Number(
//             DEPOSIT_INVESTMENTS * (investmentReturnRate / 12 / 100)
//         ).toFixed(2),
//         totalDepositFormatted: Number(
//             initialDepositSavings + DEPOSIT_INVESTMENTS
//         ).toFixed(2),
//         totalSavingsFormatted: Number(initialDepositSavings).toFixed(2),
//         totalInvestmentsFormatted: Number(DEPOSIT_INVESTMENTS).toFixed(2),
//         totalSavedFormatted: Number(
//             initialDepositSavings + DEPOSIT_INVESTMENTS
//         ).toFixed(2),
//         interestReturnFormatted: Number(
//             initialDepositSavings * (interestRate / 12 / 100)
//         ).toFixed(2),
//         investmentReturnFormatted: Number(
//             DEPOSIT_INVESTMENTS * (investmentReturnRate / 12 / 100)
//         ).toFixed(2),
//         grandTotalFormatted: Number(
//             initialDepositSavings +
//                 DEPOSIT_INVESTMENTS +
//                 initialDepositSavings * (interestRate / 12 / 100) +
//                 DEPOSIT_INVESTMENTS * (investmentReturnRate / 12 / 100)
//         ).toFixed(2),
//         commentary: 'Reviewed annual financial goals.',
//     };
//     let data = [previous];

//     for (let i = 1; i < months.length; i++) {
//         const totalDeposit = initialDepositSavings + DEPOSIT_INVESTMENTS;

//         const previousInterestReturn =
//             previous.totalSavings * (interestRate / 12 / 100);
//         const previousInvestmentReturn =
//             previous.totalInvestments * (investmentReturnRate / 12 / 100);

//         const totalSavings = Math.max(
//             0,
//             previous.totalSavings +
//                 previousInterestReturn +
//                 previous.depositSavings -
//                 WITHDRAWALS
//         );

//         const withdrawalsAdjusted = Math.max(
//             0,
//             WITHDRAWALS -
//                 (previous.depositSavings +
//                     previousInterestReturn +
//                     initialDepositSavings)
//         );

//         let totalInvestments =
//             previous.totalInvestments +
//             previousInvestmentReturn +
//             DEPOSIT_INVESTMENTS;

//         if (totalSavings === 0) {
//             totalInvestments -= withdrawalsAdjusted;
//         }

//         const totalSaved = totalSavings + totalInvestments;

//         const interestReturn = totalSavings * (interestRate / 12 / 100);
//         const investmentReturn =
//             totalInvestments * (investmentReturnRate / 12 / 100);

//         const grandTotal = totalSaved + interestReturn + investmentReturn;

//         const newMonthData = {
//             month: months[i],
//             depositSavings: initialDepositSavings,
//             depositInvestments: DEPOSIT_INVESTMENTS,
//             withdrawals: WITHDRAWALS,
//             totalDeposit,
//             totalSavings,
//             totalInvestments,
//             totalSaved,
//             grandTotal,
//             totalDepositFormatted: totalDeposit.toFixed(2),
//             totalSavingsFormatted: totalSavings.toFixed(2),
//             totalInvestmentsFormatted: totalInvestments.toFixed(2),
//             totalSavedFormatted: totalSaved.toFixed(2),
//             interestReturnFormatted: interestReturn.toFixed(2),
//             investmentReturnFormatted: investmentReturn.toFixed(2),
//             grandTotalFormatted: grandTotal.toFixed(2),
//             commentary: 'Adjusted investments for better performance.',
//         };
//         data = [...data, newMonthData];
//         previous = { ...newMonthData };
//     }
//     return data;
// };

const App = () => {
    const [interestRate, setInterestRate] = useState(5);
    const [investmentReturnRate, setInvestmentReturnRate] = useState(10);
    const [tableData, setTableData] = useState([]);
    const [targetNestEgg, setTargetNestEgg] = useState(5000000);
    const [age, setAge] = useState(38);

    useEffect(() => {
        const initialData = generateData(
            interestRate,
            investmentReturnRate,
            500,
            300,
            100
        );
        console.log('Setting table data:', initialData);
        setTableData(initialData);
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

    const handleFieldChange = (index, field, value) => {
        const newValue = field === 'commentary' ? value : parseFloat(value);
        setTableData((currentData) => {
            const newData = [...currentData];
            for (let i = index; i < newData.length; i++) {
                newData[i] = { ...newData[i], [field]: newValue };
                if (field !== 'commentary') {
                    newData[i] = recalculateFields(
                        newData,
                        i,
                        interestRate,
                        investmentReturnRate
                    );
                }
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
    const initialArray = months.map((month, index) => ({
        month,
        depositSavings,
        depositInvestments,
        totalDeposit: 0,
        withdrawals: index === 0 ? 0 : withdrawals,
        totalSavings: 0,
        totalInvestments: 0,
        totalSaved: 0,
        interestReturn: 0,
        investmentReturn: 0,
        grandTotal: 0,
        commentary: '',
    }));

    console.log('Initial array before recalculations:', initialArray);

    const finalData = initialArray.map((_, index, self) =>
        recalculateFields(self, index, interestRate, investmentReturnRate)
    );

    console.log('Final data after recalculations:', finalData);

    return finalData;
}

function recalculateFields(
    dataArray,
    index,
    interestRate,
    investmentReturnRate
) {
    const data = dataArray[index];
    const previous = index === 0 ? data : dataArray[index - 1];
    const previousInterestReturn =
        previous.totalSavings * (interestRate / 12 / 100);
    const previousInvestmentReturn =
        previous.totalInvestments * (investmentReturnRate / 12 / 100);
    const totalDeposit = data.depositSavings + data.depositInvestments;
    const totalSavings = Math.max(
        0,
        previous.totalSavings +
            previousInterestReturn +
            data.depositSavings -
            data.withdrawals
    );
    const totalInvestments = Math.max(
        0,
        previous.totalInvestments +
            previousInvestmentReturn +
            data.depositInvestments
    );
    const totalSaved = totalSavings + totalInvestments;
    const interestReturn = totalSavings * (interestRate / 12 / 100);
    const investmentReturn =
        totalInvestments * (investmentReturnRate / 12 / 100);
    const grandTotal = totalSaved + interestReturn + investmentReturn;

    return {
        ...data,
        totalDeposit: totalDeposit.toFixed(2),
        totalSavings: totalSavings.toFixed(2),
        totalInvestments: totalInvestments.toFixed(2),
        totalSaved: totalSaved.toFixed(2),
        interestReturn: interestReturn.toFixed(2),
        investmentReturn: investmentReturn.toFixed(2),
        grandTotal: grandTotal.toFixed(2),
        commentary: data.commentary,
    };
}

export default App;
