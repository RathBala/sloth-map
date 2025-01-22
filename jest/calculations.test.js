import { calculateCumulativeBalances } from '../src/utils/calculations';

describe('calculateCumulativeBalances', () => {
    it('should apply correct row values based on the previous row', () => {
        const rows = [
            {
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
            },
            {
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
            },
        ];

        const interestRate = 2;
        const investmentRate = 6;
        const goals = {};

        const result = calculateCumulativeBalances(
            rows,
            interestRate,
            investmentRate,
            goals
        );

        expect(result[0].totalSavings).toBe(100);
        expect(result[0].totalInvestments).toBe(50);
        expect(result[0].interestReturn).toBe(0);
        expect(result[0].investmentReturn).toBe(0);
        expect(result[0].grandTotal).toBe(150);

        expect(result[1].depositSavings).toBe(100);
        expect(result[1].depositInvestments).toBe(50);

        const expectedInterestReturn = (2 / 12 / 100) * 100;
        const expectedInvestmentReturn = (6 / 12 / 100) * 50;

        const expectedTotalSavingsRow2 = 100 + 100 + expectedInterestReturn;
        const expectedTotalInvestmentsRow2 = 50 + 50 + expectedInvestmentReturn;
        const expectedGrandTotalRow2 =
            expectedTotalSavingsRow2 + expectedTotalInvestmentsRow2;

        expect(result[1].totalSavings).toBeCloseTo(expectedTotalSavingsRow2, 5);
        expect(result[1].totalInvestments).toBeCloseTo(
            expectedTotalInvestmentsRow2,
            5
        );

        expect(result[1].interestReturn).toBeCloseTo(expectedInterestReturn, 5);
        expect(result[1].investmentReturn).toBeCloseTo(
            expectedInvestmentReturn,
            5
        );
        
        expect(result[1].grandTotal).toBeCloseTo(expectedGrandTotalRow2, 5);
    });
});
