import { useState } from 'react';
import TableComponent from './components/TableComponent';
import './App.css';

const App = () => {
    const [tableData] = useState([
        {
            month: 'January 2024',
            depositSavings: 500,
            depositInvestments: 300,
            totalDeposit: 800,
            withdrawals: 100,
            totalSavings: 400,
            totalInvestments: 600,
            totalSaved: 1000,
            interestReturn: 5,
            investmentReturn: 10,
            grandTotal: 1015,
            commentary: 'Reviewed annual financial goals.',
        },
        {
            month: 'February 2024',
            depositSavings: 500,
            depositInvestments: 300,
            totalDeposit: 800,
            withdrawals: 0,
            totalSavings: 900,
            totalInvestments: 900,
            totalSaved: 1800,
            interestReturn: 5,
            investmentReturn: 15,
            grandTotal: 1820,
            commentary: 'Adjusted investments for better performance.',
        },
        {
            month: 'March 2024',
            depositSavings: 500,
            depositInvestments: 300,
            totalDeposit: 800,
            withdrawals: 0,
            totalSavings: 1400,
            totalInvestments: 1200,
            totalSaved: 2600,
            interestReturn: 5,
            investmentReturn: 20,
            grandTotal: 2625,
            commentary: 'Considering increasing investment deposit.',
        },
    ]);

    return (
        <div>
            <TableComponent data={tableData} />
        </div>
    );
};

export default App;
