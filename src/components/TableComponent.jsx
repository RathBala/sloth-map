/* eslint-disable no-debugger */
import { useState, useEffect, useRef } from 'react';
import { formatNumber, formatMonth } from '../utils/formatUtils';
import addIcon from '../assets/add.svg';

const TableComponent = ({
    data,
    tableData,
    onFieldChange,
    onAltScenario,
    handleRowClick,
    onEditGoal,
}) => {
    const prevDataRef = useRef();
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(
        today.getMonth() + 1
    ).padStart(2, '0')}`;

    useEffect(() => {
        if (prevDataRef.current) {
            const prevData = prevDataRef.current;
            if (JSON.stringify(prevData) !== JSON.stringify(data)) {
                // console.log(
                //     'TableComponent received data:',
                //     JSON.stringify(data, null, 2)
                // );
            }
        }
        prevDataRef.current = data;
    }, [data]);

    const [focusedIndex, setFocusedIndex] = useState(null);
    const [focusedField, setFocusedField] = useState(null);

    const initialState = data.map((row) => ({
        ...row,
        totalSavings: row.totalSavings?.toString() || '',
        totalInvestments: row.totalInvestments?.toString() || '',
        depositSavings: row.depositSavings?.toString() || '',
        depositInvestments: row.depositInvestments?.toString() || '',
        goalName: row.goal
            ? Array.isArray(row.goal)
                ? row.goal.map((g) => g.name).join(', ')
                : row.goal.name
            : '',
        goalAmount: row.goal
            ? Array.isArray(row.goal)
                ? row.goal.reduce((sum, g) => sum + g.amount, 0).toString()
                : row.goal.amount.toString()
            : '',
        commentary: row.commentary || '',
    }));

    const [inputValues, setInputValues] = useState(initialState);

    useEffect(() => {
        setInputValues(
            data.map((row) => ({
                ...row,
                totalSavings: row.totalSavings?.toString() || '',
                totalInvestments: row.totalInvestments?.toString() || '',
                depositSavings: row.depositSavings?.toString() || '',
                depositInvestments: row.depositInvestments?.toString() || '',
                goalName: row.goal
                    ? Array.isArray(row.goal)
                        ? row.goal.map((g) => g.name).join(', ')
                        : row.goal.name
                    : '',
                goalAmount: row.goal
                    ? Array.isArray(row.goal)
                        ? row.goal
                              .reduce((sum, g) => sum + g.amount, 0)
                              .toString()
                        : row.goal.amount.toString()
                    : '',
                commentary: row.commentary || '',
            }))
        );
    }, [data]);

    const handleFocus = (index, field) => {
        console.log(`Focus event on ${field} at index ${index}`);
        setFocusedIndex(index);
        setFocusedField(field);
    };

    const handleBlur = (index, field, value) => {
        const numericValue =
            field === 'goal'
                ? value
                : parseFloat(value.replace(/,/g, '').replace(/^\$/, ''));
        console.log(
            `Updating on blur with cleaned numeric value:`,
            numericValue
        );

        if (field === 'depositSavings') {
            console.log(
                `Before onBlur - depositSavings at index ${index}: ${inputValues[index][field]}`
            );
        }

        onFieldChange(index, field, numericValue);

        if (field === 'depositSavings') {
            console.log(
                `After onBlur - depositSavings at index ${index}: ${inputValues[index][field]}`
            );
        }

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

    const handleInputInteraction = (index, field, e) => {
        console.log(`Interaction event on ${field} at index ${index}`);
        e.stopPropagation();
        if (field === 'depositSavings' && e.type === 'focus') {
            handleFocus(index, field, e);
        }
    };

    return (
        <table>
            <thead>
                <tr>
                    <th className="add-column-header"></th>
                    <th>Month</th>
                    <th>Deposit in Savings</th>
                    <th>Deposit in Investments</th>
                    <th>Total Deposit</th>
                    <th>Goal</th>
                    <th>Goal Amount</th>
                    <th>Total in Savings Account (monzo)</th>
                    <th>Total in Investments Account (HL, SJP ISA, bitcoin)</th>
                    <th>Total Saved</th>
                    <th>Interest Return</th>
                    <th>Investment Return</th>
                    <th>Grand Total</th>
                    <th>Commentary</th>
                </tr>
            </thead>
            <tbody>
                {inputValues.map((row, index) => (
                    <tr
                        key={row.rowKey}
                        className={
                            row.isAlt
                                ? row.isActive
                                    ? 'alt-scenario active'
                                    : 'alt-scenario inactive'
                                : row.isActive
                                  ? 'active'
                                  : tableData.some(
                                          (r) =>
                                              r.isAlt &&
                                              r.month === row.month &&
                                              r.isActive
                                      )
                                    ? 'inactive'
                                    : 'active'
                        }
                        onClick={() => handleRowClick(index)}
                    >
                        <td className="add-column">
                            <img
                                src={addIcon}
                                alt="add icon"
                                className="add-icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAltScenario(index);
                                }}
                            />{' '}
                        </td>
                        <td>{formatMonth(row.month)}</td>
                        <td>
                            <input
                                type="text"
                                value={
                                    focusedIndex === index &&
                                    focusedField === 'depositSavings'
                                        ? row.depositSavings
                                        : formatNumber(row.depositSavings || '')
                                }
                                onFocus={(e) =>
                                    handleInputInteraction(
                                        index,
                                        'depositSavings',
                                        e
                                    )
                                }
                                onClick={(e) =>
                                    handleInputInteraction(
                                        index,
                                        'depositSavings',
                                        e
                                    )
                                }
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
                                type="text"
                                value={
                                    focusedIndex === index &&
                                    focusedField === 'depositInvestments'
                                        ? row.depositInvestments
                                        : formatNumber(
                                              row.depositInvestments || ''
                                          )
                                }
                                onFocus={(e) =>
                                    handleFocus(index, 'depositInvestments', e)
                                }
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
                            {row.goal && Array.isArray(row.goal) ? (
                                row.goal.map((g) => (
                                    <span
                                        key={g.id}
                                        className="goal-pill"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEditGoal(g);
                                        }}
                                    >
                                        {g.name}
                                    </span>
                                ))
                            ) : row.goal ? (
                                <span
                                    className="goal-pill"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEditGoal(row.goal);
                                    }}
                                >
                                    {row.goal.name}
                                </span>
                            ) : null}
                        </td>
                        <td>
                            {row.goal && Array.isArray(row.goal)
                                ? row.goal
                                      .map((g) => formatNumber(g.amount))
                                      .join(', ')
                                : row.goal
                                  ? formatNumber(row.goal.amount)
                                  : ''}
                        </td>

                        <td>
                            {row.month === currentMonth ? (
                                <input
                                    type="text"
                                    value={
                                        focusedIndex === index &&
                                        focusedField === 'totalSavings'
                                            ? row.totalSavings.toString()
                                            : formatNumber(
                                                  row.totalSavings || ''
                                              )
                                    }
                                    onFocus={(e) =>
                                        handleFocus(index, 'totalSavings', e)
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
                            ) : (
                                formatNumber(row.totalSavings || '')
                            )}
                        </td>
                        <td>
                            {row.month === currentMonth ? (
                                <input
                                    type="text"
                                    value={
                                        focusedIndex === index &&
                                        focusedField === 'totalInvestments'
                                            ? row.totalInvestments.toString()
                                            : formatNumber(
                                                  row.totalInvestments || ''
                                              )
                                    }
                                    onFocus={(e) =>
                                        handleFocus(
                                            index,
                                            'totalInvestments',
                                            e
                                        )
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
                            ) : (
                                formatNumber(row.totalInvestments || '')
                            )}
                        </td>
                        <td>{row.totalSavedFormatted}</td>
                        <td>{row.interestReturnFormatted}</td>
                        <td>{row.investmentReturnFormatted}</td>
                        <td>{row.grandTotalFormatted}</td>
                        <td>
                            <input
                                type="text"
                                value={inputValues[index].commentary || ''}
                                onFocus={(e) =>
                                    handleFocus(index, 'commentary', e)
                                }
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
