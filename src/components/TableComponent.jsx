/* eslint-disable react/prop-types */

import { useState } from 'react';
import { formatNumber } from '../utils/formatUtils';

const TableComponent = ({ data, onFieldChange }) => {
    const [focusedIndex, setFocusedIndex] = useState(null);
    const [focusedField, setFocusedField] = useState(null);

    const handleFocus = (index, field) => {
        setFocusedIndex(index);
        setFocusedField(field);
    };

    const handleBlur = (index, field, value) => {
        onFieldChange(
            index,
            field,
            parseFloat(value.replace(/,/g, '').replace(/^\$/, ''))
        );
        setFocusedIndex(null);
        setFocusedField(null);
    };

    console.log('Data received by TableComponent:', data);
    const handleChange = (index, field, value) => {
        onFieldChange(index, field, value);
    };

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
                        <td>
                            <input
                                type="number"
                                value={row.depositSavings}
                                onChange={(e) =>
                                    handleChange(
                                        index,
                                        'depositSavings',
                                        e.target.value
                                    )
                                }
                            />
                        </td>
                        <td>
                            <input
                                type="number"
                                value={row.depositInvestments}
                                onChange={(e) =>
                                    handleChange(
                                        index,
                                        'depositInvestments',
                                        e.target.value
                                    )
                                }
                            />
                        </td>
                        <td>{row.totalDepositFormatted}</td>
                        <td>
                            <input
                                type="number"
                                value={row.withdrawals}
                                onChange={(e) =>
                                    handleChange(
                                        index,
                                        'withdrawals',
                                        e.target.value
                                    )
                                }
                            />
                        </td>
                        <td>
                            <input
                                type="text"
                                value={
                                    focusedIndex === index &&
                                    focusedField === 'totalSavings'
                                        ? row.totalSavings.toString()
                                        : formatNumber(row.totalSavings)
                                }
                                onFocus={() =>
                                    handleFocus(index, 'totalSavings')
                                }
                                onBlur={(e) =>
                                    handleBlur(
                                        index,
                                        'totalSavings',
                                        e.target.value
                                    )
                                }
                                onChange={(e) =>
                                    handleChange(
                                        index,
                                        'totalSavings',
                                        e.target.value
                                    )
                                }
                            />
                        </td>
                        <td>
                            <input
                                type="text"
                                value={
                                    focusedIndex === index &&
                                    focusedField === 'totalInvestments'
                                        ? row.totalInvestments.toString()
                                        : formatNumber(row.totalInvestments)
                                }
                                onFocus={() =>
                                    handleFocus(index, 'totalInvestments')
                                }
                                onBlur={(e) =>
                                    handleBlur(
                                        index,
                                        'totalInvestments',
                                        e.target.value
                                    )
                                }
                                onChange={(e) =>
                                    handleChange(
                                        index,
                                        'totalInvestments',
                                        e.target.value
                                    )
                                }
                            />
                        </td>
                        <td>{row.totalSavedFormatted}</td>
                        <td>{row.interestReturnFormatted}</td>
                        <td>{row.investmentReturnFormatted}</td>
                        <td>{row.grandTotalFormatted}</td>
                        <td>
                            <input
                                type="text"
                                value={row.commentary}
                                onChange={(e) =>
                                    handleChange(
                                        index,
                                        'commentary',
                                        e.target.value
                                    )
                                }
                            />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default TableComponent;
