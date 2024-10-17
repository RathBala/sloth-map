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
    const [year, month] = monthString.split('-').map(Number);
    const date = new Date(year, month - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};
