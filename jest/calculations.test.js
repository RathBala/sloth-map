import { calculateCurrentRow } from '../src/utils/calculations';

describe('calculateCurrentRow', () => {
    it('should update currentRow based on previousRow and given rates', () => {
        const previousRow = {
            month: '2025-01',
            isActive: true,

            depositSavings: 100,
            depositInvestments: 50,
            isDepositSavingsManual: false,
            isDepositInvestmentsManual: false,

            totalSavings: 0,
            totalInvestments: 0,
            isTotalSavingsManual: false,
            isTotalInvestmentsManual: false,

            interestReturn: 0,
            investmentReturn: 0,
            grandTotal: 0,
        };

        const currentRow = {
            month: '2025-02',
            isActive: true,

            depositSavings: 0,
            depositInvestments: 0,
            isDepositSavingsManual: false,
            isDepositInvestmentsManual: false,

            totalSavings: 0,
            totalInvestments: 0,
            isTotalSavingsManual: false,
            isTotalInvestmentsManual: false,

            interestReturn: 0,
            investmentReturn: 0,
            grandTotal: 0,
        };

        const interestRate = 2;
        const investmentRate = 6;

        calculateCurrentRow(
            currentRow,
            previousRow,
            interestRate,
            investmentRate
        );

        expect(currentRow.depositSavings).toBe(100);
        expect(currentRow.depositInvestments).toBe(50);

        const expectedInterestReturn =
            (interestRate / 12 / 100) * previousRow.totalSavings;
        const expectedInvestmentReturn =
            (investmentRate / 12 / 100) * previousRow.totalInvestments;

        expect(currentRow.interestReturn).toBeCloseTo(
            expectedInterestReturn,
            5
        );
        expect(currentRow.investmentReturn).toBeCloseTo(
            expectedInvestmentReturn,
            5
        );

        const expectedTotalSavings =
            previousRow.totalSavings +
            currentRow.depositSavings +
            expectedInterestReturn;
        expect(currentRow.totalSavings).toBeCloseTo(expectedTotalSavings, 5);

        const expectedTotalInvestments =
            previousRow.totalInvestments +
            currentRow.depositInvestments +
            expectedInvestmentReturn;
        expect(currentRow.totalInvestments).toBeCloseTo(
            expectedTotalInvestments,
            5
        );

        const expectedGrandTotal =
            expectedTotalSavings + expectedTotalInvestments;
        expect(currentRow.grandTotal).toBeCloseTo(expectedGrandTotal, 5);
    });
});
