import { calculateCumulativeBalances, ensureNestEgg } from './calculations';
import { generateMissingRowKeys } from './generateMissingRowKeys';

export const recalculateAllData = (
    tableData = [],
    userInputs = {},
    goals = {},
    userSettings = {}
) => {
    const { interestRate, investmentReturnRate, targetNestEgg } = userSettings;

    const mergedUserDataMap = new Map();
    tableData.forEach((row) => {
        console.log('tableData row: ', row);
        mergedUserDataMap.set(row.rowKey, { rowKey: row.rowKey, ...row });
    });

    Object.entries(userInputs).forEach(([rowKey, changes]) => {
        if (mergedUserDataMap.has(rowKey)) {
            mergedUserDataMap.set(rowKey, {
                ...mergedUserDataMap.get(rowKey),
                ...changes,
            });
        } else {
            mergedUserDataMap.set(rowKey, { rowKey, ...changes });
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

    console.log('calculatedData is: ', calculatedData);

    return calculatedData;
};
