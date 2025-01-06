export const generateRowKeys = (startMonth, endMonth) => {
    const parseMonth = (monthStr) => {
        const [year, month] = monthStr.split('-').map(Number);
        return new Date(year, month - 1);
    };

    const formatMonth = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    };

    const allKeys = [];
    let current = parseMonth(startMonth);
    const end = parseMonth(endMonth);

    while (current <= end) {
        const formattedMonth = formatMonth(current);
        const rowKey = `${formattedMonth}-0`;
        allKeys.push(rowKey);
        current.setMonth(current.getMonth() + 1);
    }

    return allKeys;
};
