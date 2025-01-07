/**
 * Generates any missing rowKeys between the earliest and latest rowKeys in the data.
 * Assumes rowKeys are in the format "YYYY-MM-variantIndex".
 *
 * @param {Array} data - The merged and sorted array of data entries.
 * @returns {Array} - The data array with missing rowKeys added.
 */

import { parseMonth } from './parseMonth';

export const generateMissingRowKeys = (data) => {
    if (data.length === 0) return data;

    const parseRowKey = (rowKey) => {
        const [year, month, variantIndexStr] = rowKey.split('-');
        return {
            date: new Date(Number(year), Number(month) - 1),
            variantIndex: Number(variantIndexStr),
        };
    };

    const formatMonth = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    };

    const uniqueMonthsSet = new Set(data.map((row) => row.month));
    const uniqueMonths = Array.from(uniqueMonthsSet).sort();

    const start = parseMonth(uniqueMonths[0]);
    const end = parseMonth(uniqueMonths[uniqueMonths.length - 1]);

    const allMonths = [];
    let current = new Date(start.getFullYear(), start.getMonth());
    while (current <= end) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        allMonths.push(`${year}-${month}`);
        current.setMonth(current.getMonth() + 1);
    }

    const missingMonths = allMonths.filter(
        (month) => !uniqueMonthsSet.has(month)
    );

    missingMonths.forEach((month) => {
        const newRowKey = `${month}-0`;
        const newRow = {
            rowKey: newRowKey,
            month: month,
            variantIndex: 0,
        };
        data.push(newRow);
    });

    data.sort((a, b) => a.rowKey.localeCompare(b.rowKey));

    return data;
};
