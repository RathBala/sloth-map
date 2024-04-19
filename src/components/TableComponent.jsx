/* eslint-disable react/prop-types */

const TableComponent = ({ data }) => {
    return (
        <table>
            <thead>
                <tr>
                    <th>Month</th>
                    <th>Deposit in Savings</th>
                    <th>Deposit in Investments</th>
                    <th>Total Deposit</th>
                    <th>Withdrawals</th>
                    <th>Total in Savings Account</th>
                    <th>Total in Investments Account</th>
                    <th>Total Saved</th>
                    <th>Interest Return</th>
                    <th>Investment Return</th>
                    <th>Grand Total</th>
                    <th>Commentary</th>
                </tr>
            </thead>
            <tbody>
                {data.map((row, index) => (
                    <tr key={index}>
                        <td>{row.month}</td>
                        <td>{row.depositSavings}</td>
                        <td>{row.depositInvestments}</td>
                        <td>{row.totalDepositFormatted}</td>
                        <td>{row.withdrawals}</td>
                        <td>{row.totalSavingsFormatted}</td>
                        <td>{row.totalInvestmentsFormatted}</td>
                        <td>{row.totalSavedFormatted}</td>
                        <td>{row.interestReturnFormatted}</td>
                        <td>{row.investmentReturnFormatted}</td>
                        <td>{row.grandTotalFormatted}</td>
                        <td>{row.commentary}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default TableComponent;
