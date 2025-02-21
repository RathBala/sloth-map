/* eslint-disable no-debugger */
import EditableCell from './EditableCell';
import { formatNumber, formatMonth } from '../utils/formatUtils';

import addIcon from '../assets/add.svg';
import monthIcon from '../assets/Month.svg';
import depositSavingsIcon from '../assets/Deposit in Savings.svg';
import depositInvestmentsIcon from '../assets/Deposit in Investments.svg';
import goalIcon from '../assets/Goal.svg';
import goalAmountIcon from '../assets/Goal Amount.svg';
import totalSavingsAccountIcon from '../assets/Total in Savings.svg';
import totalInvestmentsAccountIcon from '../assets/Total in Investments.svg';
import interestReturnIcon from '../assets/Interest Return.svg';
import investmentReturnIcon from '../assets/Investment Return.svg';
import grandTotalIcon from '../assets/Grand Total.svg';
import commentaryIcon from '../assets/Commentary.svg';

// const updateFormattedData = (data) => {
//     const formatted = data.map((entry) => ({
//         ...entry,
//         interestReturnFormatted: formatNumber(entry.interestReturn),
//         investmentReturnFormatted: formatNumber(entry.investmentReturn),
//         totalSavingsFormatted: formatNumber(entry.totalSavings),
//         totalInvestmentsFormatted: formatNumber(entry.totalInvestments),
//         grandTotalFormatted: formatNumber(entry.grandTotal),
//     }));

//     setFormattedTableData(formatted);

//     setSlothMapData(processDataForSlothMap(formatted));
// };

function getRowClasses(row, allRows) {
    if (row.isAlt) {
        return row.isActive ? 'alt-scenario active' : 'alt-scenario inactive';
    }
    if (row.isActive) {
        return 'active';
    }
    const hasActiveAltForMonth = allRows.some(
        (r) => r.isAlt && r.month === row.month && r.isActive
    );
    return hasActiveAltForMonth ? 'inactive' : 'active';
}

const TableComponent = ({
    data,
    onFieldChange,
    onAltScenario,
    handleRowClick,
}) => {
    // // prepares input fields for rendering (since input fields need to be strings?)
    // const inputValues = useMemo(() => {
    //     return data.map((row) => ({
    //         ...row,
    //         totalSavings: row.totalSavings?.toString() || '',
    //         totalInvestments: row.totalInvestments?.toString() || '',
    //         depositSavings: row.depositSavings?.toString() || '',
    //         depositInvestments: row.depositInvestments?.toString() || '',
    //         goalName: row.goal
    //             ? Array.isArray(row.goal)
    //                 ? row.goal.map((g) => g.name).join(', ')
    //                 : row.goal.name
    //             : '',
    //         goalAmount: row.goal
    //             ? Array.isArray(row.goal)
    //                 ? row.goal.reduce((sum, g) => sum + g.amount, 0).toString()
    //                 : row.goal.amount.toString()
    //             : '',
    //         commentary: row.commentary || '',
    //     }));
    // }, [data]);

    // const handleFocus = (rowKey, field) => {
    //     setFocusedRowKey(rowKey);
    //     setFocusedField(field);
    // };

    // const handleBlur = (rowKey, field, value) => {
    //     const numericValue =
    //         field === 'goal' ? value : parseFloat(value.replace(/,/g, ''));

    //     onFieldChange(rowKey, field, numericValue);

    //     setFocusedRowKey(null);
    //     setFocusedField(null);
    // };

    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(
        today.getMonth() + 1
    ).padStart(2, '0')}`;

    // if (inputValues == null) {
    //     return null;
    // }

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
                {data.map((row) => (
                    <tr
                        key={row.rowKey}
                        data-rowkey={row.rowKey}
                        className={getRowClasses(row, data)}
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
                            <EditableCell
                                data-cy={`depositSavings-${row.rowKey}`}
                                rowId={row.rowKey}
                                value={row.depositSavings?.toString() || ''}
                                onBlur={(rowId, value) => {
                                    onFieldChange(
                                        rowId,
                                        'depositSavings',
                                        parseFloat(value.replace(/,/g, ''))
                                    );
                                }}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </td>
                        <td>
                            <EditableCell
                                data-cy={`depositInvestments-${row.rowKey}`}
                                rowId={row.rowKey}
                                value={row.depositInvestments?.toString() || ''}
                                onBlur={(rowId, value) =>
                                    onFieldChange(
                                        rowId,
                                        'depositInvestments',
                                        parseFloat(value.replace(/,/g, ''))
                                    )
                                }
                                onClick={(e) => e.stopPropagation()}
                            />
                        </td>
                        <td data-cy={`interestReturn-${row.rowKey}`}>
                            {row.interestReturnFormatted}
                        </td>
                        <td data-cy={`investmentReturn-${row.rowKey}`}>
                            {row.investmentReturnFormatted}
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
                                <EditableCell
                                    rowId={row.rowKey}
                                    value={row.totalSavings?.toString() || ''}
                                    onBlur={(rowId, value) =>
                                        onFieldChange(
                                            rowId,
                                            'totalSavings',
                                            parseFloat(value.replace(/,/g, ''))
                                        )
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                formatNumber(row.totalSavings || '')
                            )}
                        </td>
                        <td data-cy={`totalInvestments-${row.rowKey}`}>
                            {row.month === currentMonth ? (
                                <EditableCell
                                    rowId={row.rowKey}
                                    value={
                                        row.totalInvestments?.toString() || ''
                                    }
                                    onBlur={(rowId, value) =>
                                        onFieldChange(
                                            rowId,
                                            'totalInvestments',
                                            parseFloat(value.replace(/,/g, ''))
                                        )
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                formatNumber(row.totalInvestments || '')
                            )}
                        </td>
                        <td data-cy={`grandTotal-${row.rowKey}`}>
                            {row.grandTotalFormatted}
                        </td>
                        <td data-cy={`commentary-${row.rowKey}`}>
                            <EditableCell
                                rowId={row.rowKey}
                                value={row.commentary || ''}
                                onBlur={(rowId, value) =>
                                    onFieldChange(rowId, 'commentary', value)
                                }
                                onClick={(e) => e.stopPropagation()}
                            />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default TableComponent;
