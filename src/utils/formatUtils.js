const numberFormatter = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
});

export function formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) return '';
    return numberFormatter.format(num);
}

export const formatMonth = (monthString) => {
    if (!monthString || typeof monthString !== 'string') {
        console.warn(`Invalid monthString: ${monthString}`);
        return 'Unknown Month';
    }

    const parts = monthString.split('-').map(Number);
    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
        console.warn(`Invalid month format: ${monthString}`);
        return 'Invalid Month Format';
    }

    const [year, month] = parts;
    const date = new Date(year, month - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

export function formatDateForInput(date) {
    if (!date || isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
