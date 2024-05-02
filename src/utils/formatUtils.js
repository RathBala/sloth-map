const numberFormatter = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
});

export function formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) return '';
    return numberFormatter.format(num);
}
