import { parseMonth } from './parseMonth';

export const generateMissingRowKeys = (data) => {
    if (data.length === 0) return data;

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
            isActive: true,
        };
        data.push(newRow);
    });

    data.sort((a, b) => a.rowKey.localeCompare(b.rowKey));

    return data;
};
