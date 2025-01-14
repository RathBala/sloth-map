export function applyGoalToRow(row, goal) {
    let remainder = goal.amount;
    if (row.totalSavings >= remainder) {
        row.totalSavings -= remainder;
        remainder = 0;
    } else {
        remainder -= row.totalSavings;
        row.totalSavings = 0;
        row.totalInvestments -= remainder;
        remainder = 0;
    }

    row.grandTotal = row.totalSavings + row.totalInvestments;

    // TODO: double-check if the below works properly
    row.goalsApplied = row.goalsApplied || [];
    row.goalsApplied.push(goal);
}
