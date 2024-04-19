import { useState, useEffect } from 'react';
import TableComponent from './components/TableComponent';
import './App.css';

const DEPOSIT_SAVINGS = 500;
const DEPOSIT_INVESTMENTS = 300;

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
        depositSavings: DEPOSIT_SAVINGS,
        depositInvestments: DEPOSIT_INVESTMENTS,
        withdrawals: 0,
        totalSavings: DEPOSIT_SAVINGS,
        totalInvestments: DEPOSIT_INVESTMENTS,
        totalDeposit: Number(DEPOSIT_SAVINGS + DEPOSIT_INVESTMENTS).toFixed(2),
        interestReturn: Number(
            DEPOSIT_SAVINGS * (interestRate / 12 / 100)
        ).toFixed(2),
        investmentReturn: Number(
            DEPOSIT_INVESTMENTS * (investmentReturnRate / 12 / 100)
        ).toFixed(2),
        totalDepositFormatted: Number(
            DEPOSIT_SAVINGS + DEPOSIT_INVESTMENTS
        ).toFixed(2),
        totalSavingsFormatted: Number(DEPOSIT_SAVINGS).toFixed(2),
        totalInvestmentsFormatted: Number(DEPOSIT_INVESTMENTS).toFixed(2),
        totalSavedFormatted: Number(
            DEPOSIT_SAVINGS + DEPOSIT_INVESTMENTS
        ).toFixed(2),
        interestReturnFormatted: Number(
            DEPOSIT_SAVINGS * (interestRate / 12 / 100)
        ).toFixed(2),
        investmentReturnFormatted: Number(
            DEPOSIT_INVESTMENTS * (investmentReturnRate / 12 / 100)
        ).toFixed(2),
        grandTotalFormatted: Number(
            DEPOSIT_SAVINGS +
                DEPOSIT_INVESTMENTS +
                DEPOSIT_SAVINGS * (interestRate / 12 / 100) +
                DEPOSIT_INVESTMENTS * (investmentReturnRate / 12 / 100)
        ).toFixed(2),
        commentary: 'Reviewed annual financial goals.',
    };
    let data = [previous];

    for (let i = 1; i < months.length; i++) {
        const totalDeposit = DEPOSIT_SAVINGS + DEPOSIT_INVESTMENTS;
        const previousInterestReturn =
            previous.totalSavings * (interestRate / 12 / 100);
        const previousInvestmentReturn =
            previous.totalInvestments * (investmentReturnRate / 12 / 100);
        const totalSavings = Math.max(
            0,
            previous.totalSavings +
                previousInterestReturn +
                previous.depositSavings -
                previous.withdrawals
        );
        const withdrawalsAdjusted = Math.max(
            0,
            previous.withdrawals -
                (previous.depositSavings + previousInterestReturn)
        );
        const totalInvestments =
            previous.totalInvestments +
            previousInvestmentReturn +
            previous.depositInvestments -
            withdrawalsAdjusted;
        const totalSaved = totalSavings + totalInvestments;
        const grandTotal =
            totalSaved + previousInterestReturn + previousInvestmentReturn;

        const newMonthData = {
            month: months[i],
            depositSavings: DEPOSIT_SAVINGS,
            depositInvestments: DEPOSIT_INVESTMENTS,
            withdrawals: 100,
            totalDeposit,
            totalSavings,
            totalInvestments,
            totalSaved,
            previousInterestReturn,
            previousInvestmentReturn,
            grandTotal,
            totalDepositFormatted: totalDeposit.toFixed(2),
            totalSavingsFormatted: totalSavings.toFixed(2),
            totalInvestmentsFormatted: totalInvestments.toFixed(2),
            totalSavedFormatted: totalSaved.toFixed(2),
            interestReturnFormatted: previousInterestReturn.toFixed(2),
            investmentReturnFormatted: previousInvestmentReturn.toFixed(2),
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
