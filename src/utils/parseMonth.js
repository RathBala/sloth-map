export const parseMonth = (monthStr) => {
    const [year, month] = monthStr.split('-').map(Number);
    return new Date(year, month - 1); // JS months are 0-based
};
