import { calculateCumulativeBalances, ensureNestEgg } from './calculations';
import { generateMissingRowKeys } from './generateMissingRowKeys';
import { defaultRow } from './constants';

export const recalculateAllData = (
    tableData = [],
    userInputs = {},
    goals = {},
    userSettings = {}
) => {
    const { interestRate, investmentReturnRate, targetNestEgg } = userSettings;

    const mergedUserDataMap = new Map();
    tableData.forEach((row) => {
        const mergedRow = { ...defaultRow, ...row };
        mergedUserDataMap.set(mergedRow.rowKey, mergedRow);
    });

    Object.entries(userInputs).forEach(([rowKey, changes]) => {
        if (mergedUserDataMap.has(rowKey)) {
            mergedUserDataMap.set(rowKey, {
                ...mergedUserDataMap.get(rowKey),
                ...changes,
            });
        } else {
            const changedRow = { ...defaultRow, rowKey, ...changes };
            mergedUserDataMap.set(rowKey, changedRow);
        }
    });

    let mergedUserDataArray = Array.from(mergedUserDataMap.values());
    mergedUserDataArray.sort((a, b) => a.rowKey.localeCompare(b.rowKey));
    mergedUserDataArray = generateMissingRowKeys(mergedUserDataArray);

    let calculatedData = calculateCumulativeBalances(
        mergedUserDataArray,
        interestRate,
        investmentReturnRate,
        goals
    );

    calculatedData = ensureNestEgg(
        targetNestEgg,
        calculatedData,
        interestRate,
        investmentReturnRate,
        goals
    );

    return calculatedData;
};
