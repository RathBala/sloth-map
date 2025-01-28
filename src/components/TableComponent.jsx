/* eslint-disable no-debugger */
import { useState, useEffect /*useRef*/ } from 'react';
import { formatNumber, formatMonth } from '../utils/formatUtils';
import addIcon from '../assets/add.svg';
import monthIcon from '../assets/Month.svg';
import depositSavingsIcon from '../assets/Deposit in Savings.svg';
import depositInvestmentsIcon from '../assets/Deposit in Investments.svg';
// import totalDepositIcon from '../assets/Total Deposit.svg';
import goalIcon from '../assets/Goal.svg';
import goalAmountIcon from '../assets/Goal Amount.svg';
import totalSavingsAccountIcon from '../assets/Total in Savings.svg';
import totalInvestmentsAccountIcon from '../assets/Total in Investments.svg';
// import totalSavedIcon from '../assets/Total Saved.svg';
import interestReturnIcon from '../assets/Interest Return.svg';
import investmentReturnIcon from '../assets/Investment Return.svg';
import grandTotalIcon from '../assets/Grand Total.svg';
import commentaryIcon from '../assets/Commentary.svg';

const TableComponent = ({
    data,
    tableData,
    onFieldChange,
    onAltScenario,
    handleRowClick,
    // onEditGoal,
}) => {
    // const prevDataRef = useRef();
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(
        today.getMonth() + 1
    ).padStart(2, '0')}`;

    // useEffect(() => {
    //     if (prevDataRef.current) {
    //         const prevData = prevDataRef.current;
    //         if (JSON.stringify(prevData) !== JSON.stringify(data)) {
    //             // console.log(
    //             //     'TableComponent received data:',
    //             //     JSON.stringify(data, null, 2)
    //             // );
    //         }
    //     }
    //     prevDataRef.current = data;
    // }, [data]);

    const [focusedRowKey, setFocusedRowKey] = useState(null);
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
        debugger;

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

        debugger;
    }, [data]);

    const handleFocus = (rowKey, field) => {
        setFocusedRowKey(rowKey);
        setFocusedField(field);
    };

    const handleBlur = (rowKey, field, value) => {
        const numericValue =
            field === 'goal'
                ? value
                : parseFloat(value.replace(/,/g, '').replace(/^\$/, ''));
        console.log(
            `Updating on blur with cleaned numeric value:`,
            numericValue
        );

        onFieldChange(rowKey, field, numericValue);

        setInputValues((current) =>
            current.map((item) =>
                item.rowKey === rowKey
                    ? { ...item, [field]: numericValue }
                    : item
            )
        );
        setFocusedRowKey(null);
        setFocusedField(null);
    };

    const handleChange = (rowKey, field, value) => {
        setInputValues((current) =>
            current.map((item) =>
                item.rowKey === rowKey ? { ...item, [field]: value } : item
            )
        );
    };

    const handleInputInteraction = (rowKey, field, e) => {
        e.stopPropagation();
        if (field === 'depositSavings' && e.type === 'focus') {
            handleFocus(rowKey, field);
        }
    };

    return (
        <table>
            <thead>
                <tr>
                    <th>
                        <div className="header-content">
                            <img
                                src={monthIcon}
                                alt="Month Icon"
                                className="header-icon"
                            />
                            <span>Month</span>
                        </div>
                    </th>
                    <th>
                        <div className="header-content">
                            <img
                                src={depositSavingsIcon}
                                alt="Deposit in Savings Icon"
                                className="header-icon"
                            />
                            <span>Deposit in Savings</span>
                        </div>
                    </th>
                    <th>
                        <div className="header-content">
                            <img
                                src={depositInvestmentsIcon}
                                alt="Deposit in Investments Icon"
                                className="header-icon"
                            />
                            <span>Deposit in Investments</span>
                        </div>
                    </th>
                    <th>
                        <div className="header-content">
                            <img
                                src={goalIcon}
                                alt="Goal Icon"
                                className="header-icon"
                            />
                            <span>Goal</span>
                        </div>
                    </th>
                    <th>
                        <div className="header-content">
                            <img
                                src={goalAmountIcon}
                                alt="Goal Amount Icon"
                                className="header-icon"
                            />
                            <span>Goal Amount</span>
                        </div>
                    </th>
                    <th>
                        <div className="header-content">
                            <img
                                src={totalSavingsAccountIcon}
                                alt="Total in Savings Account Icon"
                                className="header-icon"
                            />
                            <span>Total in Savings Account</span>
                        </div>
                    </th>
                    <th>
                        <div className="header-content">
                            <img
                                src={totalInvestmentsAccountIcon}
                                alt="Total in Investments Account Icon"
                                className="header-icon"
                            />
                            <span>Total in Investments Account</span>
                        </div>
                    </th>
                    <th>
                        <div className="header-content">
                            <img
                                src={interestReturnIcon}
                                alt="Interest Return Icon"
                                className="header-icon"
                            />
                            <span>Interest Return</span>
                        </div>
                    </th>
                    <th>
                        <div className="header-content">
                            <img
                                src={investmentReturnIcon}
                                alt="Investment Return Icon"
                                className="header-icon"
                            />
                            <span>Investment Return</span>
                        </div>
                    </th>
                    <th>
                        <div className="header-content">
                            <img
                                src={grandTotalIcon}
                                alt="Grand Total Icon"
                                className="header-icon"
                            />
                            <span>Grand Total</span>
                        </div>
                    </th>
                    <th>
                        <div className="header-content">
                            {
                                <img
                                    src={commentaryIcon}
                                    alt="Commentary Icon"
                                    className="header-icon"
                                />
                            }
                            <span>Commentary</span>
                        </div>
                    </th>
                </tr>
            </thead>
            <tbody>
                {inputValues.map((row) => (
                    <tr
                        key={row.rowKey}
                        data-rowkey={row.rowKey}
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
                        onClick={() => handleRowClick(row.rowKey)}
                    >
                        <td className="month-column">
                            <img
                                src={addIcon}
                                alt="add icon"
                                className="add-icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAltScenario(row.rowKey);
                                }}
                            />
                            {formatMonth(row.month)}
                        </td>
                        <td>
                            <input
                                data-cy={`depositSavings-${row.rowKey}`}
                                type="text"
                                value={
                                    focusedRowKey === row.rowKey &&
                                    focusedField === 'depositSavings'
                                        ? row.depositSavings
                                        : formatNumber(row.depositSavings || '')
                                }
                                onFocus={(e) =>
                                    handleInputInteraction(
                                        row.rowKey,
                                        'depositSavings',
                                        e
                                    )
                                }
                                onClick={(e) =>
                                    handleInputInteraction(
                                        row.rowKey,
                                        'depositSavings',
                                        e
                                    )
                                }
                                onChange={(e) =>
                                    handleChange(
                                        row.rowKey,
                                        'depositSavings',
                                        e.target.value
                                    )
                                }
                                onBlur={(e) =>
                                    handleBlur(
                                        row.rowKey,
                                        'depositSavings',
                                        e.target.value
                                    )
                                }
                            />
                        </td>
                        <td>
                            <input
                                data-cy={`depositInvestments-${row.rowKey}`}
                                type="text"
                                value={
                                    focusedRowKey === row.rowKey &&
                                    focusedField === 'depositInvestments'
                                        ? row.depositInvestments
                                        : formatNumber(
                                              row.depositInvestments || ''
                                          )
                                }
                                onFocus={() =>
                                    handleFocus(
                                        row.rowKey,
                                        'depositInvestments'
                                    )
                                }
                                onChange={(e) =>
                                    handleChange(
                                        row.rowKey,
                                        'depositInvestments',
                                        e.target.value
                                    )
                                }
                                onBlur={(e) =>
                                    handleBlur(
                                        row.rowKey,
                                        'depositInvestments',
                                        e.target.value
                                    )
                                }
                            />
                        </td>
                        <td data-cy="goalColumn">
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
                        <td className="goal-amount-column">
                            {row.goal && Array.isArray(row.goal)
                                ? row.goal
                                      .map((g) => formatNumber(g.amount))
                                      .join(', ')
                                : row.goal
                                  ? formatNumber(row.goal.amount)
                                  : ''}
                        </td>

                        <td data-cy={`totalSavings-${row.rowKey}`}>
                            {row.month === currentMonth ? (
                                <input
                                    type="text"
                                    value={
                                        focusedRowKey === row.rowKey &&
                                        focusedField === 'totalSavings'
                                            ? row.totalSavings.toString()
                                            : formatNumber(
                                                  row.totalSavings || ''
                                              )
                                    }
                                    onFocus={() =>
                                        handleFocus(row.rowKey, 'totalSavings')
                                    }
                                    onChange={(e) =>
                                        handleChange(
                                            row.rowKey,
                                            'totalSavings',
                                            e.target.value
                                        )
                                    }
                                    onBlur={(e) =>
                                        handleBlur(
                                            row.rowKey,
                                            'totalSavings',
                                            e.target.value
                                        )
                                    }
                                />
                            ) : (
                                formatNumber(row.totalSavings || '')
                            )}
                        </td>
                        <td data-cy={`totalInvestments-${row.rowKey}`}>
                            {row.month === currentMonth ? (
                                <input
                                    type="text"
                                    value={
                                        focusedRowKey === row.rowKey &&
                                        focusedField === 'totalInvestments'
                                            ? row.totalInvestments.toString()
                                            : formatNumber(
                                                  row.totalInvestments || ''
                                              )
                                    }
                                    onFocus={() =>
                                        handleFocus(
                                            row.rowKey,
                                            'totalInvestments'
                                        )
                                    }
                                    onChange={(e) =>
                                        handleChange(
                                            row.rowKey,
                                            'totalInvestments',
                                            e.target.value
                                        )
                                    }
                                    onBlur={(e) =>
                                        handleBlur(
                                            row.rowKey,
                                            'totalInvestments',
                                            e.target.value
                                        )
                                    }
                                />
                            ) : (
                                formatNumber(row.totalInvestments || '')
                            )}
                        </td>
                        <td data-cy={`interestReturn-${row.rowKey}`}>
                            {row.interestReturnFormatted}
                        </td>
                        <td data-cy={`investmentReturn-${row.rowKey}`}>
                            {row.investmentReturnFormatted}
                        </td>
                        <td data-cy={`grandTotal-${row.rowKey}`}>
                            {row.grandTotalFormatted}
                        </td>
                        <td data-cy={`commentary-${row.rowKey}`}>
                            <input
                                type="text"
                                value={row.commentary || ''}
                                onFocus={() =>
                                    handleFocus(row.rowKey, 'commentary')
                                }
                                onChange={(e) =>
                                    handleChange(
                                        row.rowKey,
                                        'commentary',
                                        e.target.value
                                    )
                                }
                                onBlur={(e) =>
                                    handleBlur(
                                        row.rowKey,
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
