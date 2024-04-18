import { useState, useEffect } from 'react';
import TableComponent from './components/TableComponent';
import './App.css';

// Moved outside of the App component and receives rates as arguments
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
        depositSavings: 500,
        depositInvestments: 300,
        withdrawals: 100,
        totalSavings: 400,
        totalInvestments: 600,
        commentary: 'Reviewed annual financial goals.',
    };
    let data = [previous]; // Start with the first month's data

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
            withdrawals: 100, // This could be dynamic if needed
            totalDeposit,
            totalSavings,
            totalInvestments,
            totalSaved,
            interestReturn,
            investmentReturn,
            grandTotal,
            commentary: 'Adjusted investments for better performance.',
        };
        data = [...data, newMonthData];
        previous = { ...newMonthData };
    }
    return data;
};

const App = () => {
    const [interestRate, setInterestRate] = useState(5); // Default interest rate %
    const [investmentReturnRate, setInvestmentReturnRate] = useState(10); // Default investment return rate %
    const [tableData, setTableData] = useState([]);

    useEffect(() => {
        setTableData(generateData(interestRate, investmentReturnRate));
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
