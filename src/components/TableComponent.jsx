/* eslint-disable react/prop-types */

import { useState, useEffect } from 'react';
import { formatNumber } from '../utils/formatUtils';

const TableComponent = ({ data, onFieldChange }) => {
    console.log('Received data in TableComponent:', data);

    const [focusedIndex, setFocusedIndex] = useState(null);
    const [focusedField, setFocusedField] = useState(null);

    const [inputValues, setInputValues] = useState(() =>
        data.map((row) => ({
            ...row,
            totalSavings: row.totalSavings.toString(), // Convert to string if necessary
            totalInvestments: row.totalInvestments.toString(),
            depositSavings: row.depositSavings.toString(),
            depositInvestments: row.depositInvestments.toString(),
            withdrawals: row.withdrawals.toString(),
            commentary: row.commentary, // Assuming it's already in the correct format
        }))
    );

    useEffect(() => {
        setInputValues(
            data.map((row) => ({
                ...row,
                totalSavings: row.totalSavings.toString(),
                totalInvestments: row.totalInvestments.toString(),
                depositSavings: row.depositSavings.toString(),
                depositInvestments: row.depositInvestments.toString(),
                withdrawals: row.withdrawals.toString(),
                commentary: row.commentary,
            }))
        );
    }, [data]); // Dependency array includes data to re-run the effect when data changes

    const handleFocus = (index, field) => {
        setFocusedIndex(index);
        setFocusedField(field);
    };

    const handleBlur = (index, field, value) => {
        const numericValue =
            field === 'commentary'
                ? value
                : parseFloat(value.replace(/,/g, '').replace(/^\$/, ''));
        console.log(
            `Updating on blur with cleaned numeric value:`,
            numericValue
        );
        onFieldChange(index, field, numericValue);
        setInputValues((current) =>
            current.map((item, idx) =>
                idx === index ? { ...item, [field]: numericValue } : item
            )
        );
        setFocusedIndex(null);
        setFocusedField(null);
    };

    const handleChange = (index, field, value) => {
        setInputValues((current) =>
            current.map((item, idx) =>
                idx === index ? { ...item, [field]: value } : item
            )
        );
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
                {inputValues.map((row, index) => (
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
                                onBlur={(e) =>
                                    handleBlur(
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
                                onBlur={(e) =>
                                    handleBlur(
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
                                onBlur={(e) =>
                                    handleBlur(
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
                                onChange={(e) =>
                                    handleChange(
                                        index,
                                        'totalSavings',
                                        e.target.value
                                    )
                                }
                                onBlur={(e) =>
                                    handleBlur(
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
                                onChange={(e) =>
                                    handleChange(
                                        index,
                                        'totalInvestments',
                                        e.target.value
                                    )
                                }
                                onBlur={(e) =>
                                    handleBlur(
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
                                onBlur={(e) =>
                                    handleBlur(
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
