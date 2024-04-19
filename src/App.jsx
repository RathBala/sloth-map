import { useState, useEffect } from 'react';
import TableComponent from './components/TableComponent';
import './App.css';

const generateData = (interestRate, investmentReturnRate) => {
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
    let previous = {
        month: 'January 2024',
        depositSavings: 500,
        depositInvestments: 300,
        withdrawals: 100,
        totalSavings: 500,
        totalInvestments: 300,
        totalDeposit: Number(500 + 300).toFixed(2),
        interestReturn: Number(500 * (interestRate / 12 / 100)).toFixed(2),
        investmentReturn: Number(
            300 * (investmentReturnRate / 12 / 100)
        ).toFixed(2),
        totalDepositFormatted: Number(500 + 300).toFixed(2),
        totalSavingsFormatted: Number(500).toFixed(2),
        totalInvestmentsFormatted: Number(300).toFixed(2),
        totalSavedFormatted: Number(500 + 300).toFixed(2),
        interestReturnFormatted: Number(
            500 * (interestRate / 12 / 100)
        ).toFixed(2),
        investmentReturnFormatted: Number(
            300 * (investmentReturnRate / 12 / 100)
        ).toFixed(2),
        grandTotalFormatted: Number(
            500 +
                300 +
                500 * (interestRate / 12 / 100) +
                300 * (investmentReturnRate / 12 / 100)
        ).toFixed(2),
        commentary: 'Reviewed annual financial goals.',
    };
    let data = [previous];

    for (let i = 1; i < months.length; i++) {
        const totalDeposit =
            previous.depositSavings + previous.depositInvestments;
        const interestReturn =
            previous.totalSavings * (interestRate / 12 / 100);
        const investmentReturn =
            previous.totalInvestments * (investmentReturnRate / 12 / 100);
        const totalSavings = Math.max(
            0,
            previous.totalSavings +
                interestReturn +
                previous.depositSavings -
                previous.withdrawals
        );
        const withdrawalsAdjusted = Math.max(
            0,
            previous.withdrawals - (previous.depositSavings + interestReturn)
        );
        const totalInvestments =
            previous.totalInvestments +
            investmentReturn +
            previous.depositInvestments -
            withdrawalsAdjusted;
        const totalSaved = totalSavings + totalInvestments;
        const grandTotal = totalSaved + interestReturn + investmentReturn;

        const newMonthData = {
            month: months[i],
            depositSavings: 500,
            depositInvestments: 300,
            withdrawals: 100,
            totalDeposit,
            totalSavings,
            totalInvestments,
            totalSaved,
            interestReturn,
            investmentReturn,
            grandTotal,
            totalDepositFormatted: totalDeposit.toFixed(2),
            totalSavingsFormatted: totalSavings.toFixed(2),
            totalInvestmentsFormatted: totalInvestments.toFixed(2),
            totalSavedFormatted: totalSaved.toFixed(2),
            interestReturnFormatted: interestReturn.toFixed(2),
            investmentReturnFormatted: investmentReturn.toFixed(2),
            grandTotalFormatted: grandTotal.toFixed(2),
            commentary: 'Adjusted investments for better performance.',
        };
        data = [...data, newMonthData];
        previous = { ...newMonthData };
    }
    return data;
};

const App = () => {
    const [interestRate, setInterestRate] = useState(5);
    const [investmentReturnRate, setInvestmentReturnRate] = useState(10);
    const [tableData, setTableData] = useState([]);

    useEffect(() => {
        const newData = generateData(interestRate, investmentReturnRate);
        console.log(newData);
        setTableData(newData);
    }, [interestRate, investmentReturnRate]);

    const handleInterestRateChange = (e) => {
        setInterestRate(parseFloat(e.target.value));
    };

    const handleInvestmentReturnRateChange = (e) => {
        setInvestmentReturnRate(parseFloat(e.target.value));
    };

    return (
        <div className="App">
            <label>
                Interest Rate (%):
                <input
                    type="number"
                    value={interestRate}
                    onChange={handleInterestRateChange}
                />
            </label>
            <label>
                Investment Return Rate (%):
                <input
                    type="number"
                    value={investmentReturnRate}
                    onChange={handleInvestmentReturnRateChange}
                />
            </label>
            <TableComponent data={tableData} />
        </div>
    );
};

export default App;
