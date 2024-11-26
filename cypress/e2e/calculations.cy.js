describe('Calculations Correctness Test', () => {
    beforeEach(() => {
        // Clear session data and log in
        cy.clearCookies();
        cy.clearLocalStorage();
        cy.window().then((win) => {
            indexedDB.deleteDatabase('firebaseLocalStorageDb');
        });

        // // Seed Firestore data before tests (if necessary)
        // cy.task('seedFirestore');

        cy.visit('/');
        cy.get('[data-cy="login-email"]').type('testmctesttest@testmcface.com');
        cy.get('[data-cy="login-password"]').type('booyaWhat5%');
        cy.get('[data-cy="login-button"]').click();
        cy.contains('Welcome').should('be.visible');
    });

    it('should have correct calculations for December 2026', () => {
        const rowKey = '2026-12-0'; // December 2026 with variantIndex 0

        // Expected values
        const expectedValues = {
            totalSavings: '43,871.81',
            totalInvestments: '8,669.36',
            interestReturn: '182.80',
            investmentReturn: '72.24',
            grandTotal: '52,796.21',
        };

        // Scroll to the row to ensure it's in view
        cy.get(`tr[data-rowkey="${rowKey}"]`).scrollIntoView();

        // Get the row
        cy.get(`tr[data-rowkey="${rowKey}"]`).as('decemberRow');

        // Verify Total in Savings Account
        cy.get('@decemberRow')
            .find(`[data-cy="totalSavings-${rowKey}"]`)
            .then(($cell) => {
                const cellText = $cell.text().trim();
                expect(cellText).to.equal(expectedValues.totalSavings);
            });

        // Verify Total in Investments Account
        cy.get('@decemberRow')
            .find(`[data-cy="totalInvestments-${rowKey}"]`)
            .then(($cell) => {
                const cellText = $cell.text().trim();
                expect(cellText).to.equal(expectedValues.totalInvestments);
            });

        // Verify Interest Return
        cy.get('@decemberRow')
            .find(`[data-cy="interestReturn-${rowKey}"]`)
            .then(($cell) => {
                const cellText = $cell.text().trim();
                expect(cellText).to.equal(expectedValues.interestReturn);
            });

        // Verify Investment Return
        cy.get('@decemberRow')
            .find(`[data-cy="investmentReturn-${rowKey}"]`)
            .then(($cell) => {
                const cellText = $cell.text().trim();
                expect(cellText).to.equal(expectedValues.investmentReturn);
            });

        // Verify Grand Total
        cy.get('@decemberRow')
            .find(`[data-cy="grandTotal-${rowKey}"]`)
            .then(($cell) => {
                const cellText = $cell.text().trim();
                expect(cellText).to.equal(expectedValues.grandTotal);
            });
    });

    it('should allow manual changes to totalSavings and totalInvestments on the first row only and calculate grandTotal correctly', () => {
        // Calculate first row's rowKey dynamically
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const firstRowKey = `${currentYear}-${currentMonth}-0`; // Assuming variantIndex is 0

        // Calculate second row's rowKey dynamically
        const nextMonthDate = new Date(today);
        nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);

        const nextYear = nextMonthDate.getFullYear();
        const nextMonth = String(nextMonthDate.getMonth() + 1).padStart(2, '0');
        const secondRowKey = `${nextYear}-${nextMonth}-0`; // Assuming variantIndex is 0

        // Step 1: Modify totalSavings and totalInvestments on the first row
        cy.get(`tr[data-rowkey="${firstRowKey}"]`)
            .find(`[data-cy="totalSavings-${firstRowKey}"] input`)
            .scrollIntoView({ offset: { top: -100, left: 0 } }) // Adjust top offset
            .should('be.visible')
            .click({ force: true }) // Ensure it clicks even if partially obscured
            .clear()
            .type('5000')
            .blur();

        cy.get(`tr[data-rowkey="${firstRowKey}"]`)
            .find(`[data-cy="totalInvestments-${firstRowKey}"] input`)
            .scrollIntoView({ offset: { top: -100, left: 0 } }) // Adjust top offset
            .should('be.visible')
            .click({ force: true }) // Ensure it clicks even if partially obscured
            .clear()
            .type('10000')
            .blur();

        // Step 2: Verify the changes are accepted
        cy.get(`tr[data-rowkey="${firstRowKey}"]`)
            .find(`[data-cy="totalSavings-${firstRowKey}"] input`)
            .should('have.value', '5,000.00');

        cy.get(`tr[data-rowkey="${firstRowKey}"]`)
            .find(`[data-cy="totalInvestments-${firstRowKey}"] input`)
            .should('have.value', '10,000.00');

        // Step 3: Modify depositSavings and depositInvestments on the first row
        cy.get(`tr[data-rowkey="${firstRowKey}"]`)
            .find(`[data-cy="depositSavings-${firstRowKey}"]`)
            .scrollIntoView()
            .clear()
            .type('1000')
            .blur();

        cy.get(`tr[data-rowkey="${firstRowKey}"]`)
            .find(`[data-cy="depositInvestments-${firstRowKey}"]`)
            .scrollIntoView()
            .clear()
            .type('2000')
            .blur();

        // Step 4: Verify totalSavings and totalInvestments remain unchanged
        cy.get(`tr[data-rowkey="${firstRowKey}"]`)
            .find(`[data-cy="totalSavings-${firstRowKey}"] input`)
            .should('have.value', '5,000.00');

        cy.get(`tr[data-rowkey="${firstRowKey}"]`)
            .find(`[data-cy="totalInvestments-${firstRowKey}"] input`)
            .should('have.value', '10,000.00');

        // Step 5: Verify grandTotal is sum of totalSavings and totalInvestments
        cy.get(`tr[data-rowkey="${firstRowKey}"]`)
            .find(`[data-cy="grandTotal-${firstRowKey}"]`)
            .scrollIntoView()
            .should('contain', '15,000.00');

        // Step 6: Verify interestReturn and investmentReturn are zero
        cy.get(`tr[data-rowkey="${firstRowKey}"]`)
            .find(`[data-cy="interestReturn-${firstRowKey}"]`)
            .scrollIntoView()
            .should('contain', '0.00');

        cy.get(`tr[data-rowkey="${firstRowKey}"]`)
            .find(`[data-cy="investmentReturn-${firstRowKey}"]`)
            .scrollIntoView()
            .should('contain', '0.00');

        // Step 7: Verify subsequent rows calculate correctly
        // For example, check the second row's calculations

        // Expected totalSavings for second row:
        // totalSavings = previous totalSavings + depositSavings + interestReturn
        // Since interestReturn on first row is 0, and depositSavings is 1000, expected totalSavings is 5000 + 1000 = 6000
        // Assuming interestRate is applied on the second row

        // For the purposes of this test, let's assume:
        // - Interest Rate: 3% per annum
        // - Investment Return Rate: 5% per annum

        const interestRatePerMonth = 3 / 12 / 100;
        const investmentReturnRatePerMonth = 5 / 12 / 100;

        const expectedSecondRowTotalSavings =
            5000 + 1000 + 5000 * interestRatePerMonth;
        const expectedSecondRowTotalSavingsFormatted =
            expectedSecondRowTotalSavings.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });

        const expectedSecondRowTotalInvestments =
            10000 + 2000 + 10000 * investmentReturnRatePerMonth;
        const expectedSecondRowTotalInvestmentsFormatted =
            expectedSecondRowTotalInvestments.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });

        const expectedSecondRowGrandTotal =
            expectedSecondRowTotalSavings + expectedSecondRowTotalInvestments;
        const expectedSecondRowGrandTotalFormatted =
            expectedSecondRowGrandTotal.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });

        // Verify totalSavings on second row
        cy.get(`tr[data-rowkey="${secondRowKey}"]`)
            .find(`[data-cy="totalSavings-${secondRowKey}"]`)
            .should('contain', expectedSecondRowTotalSavingsFormatted);

        // Verify totalInvestments on second row
        cy.get(`tr[data-rowkey="${secondRowKey}"]`)
            .find(`[data-cy="totalInvestments-${secondRowKey}"]`)
            .should('contain', expectedSecondRowTotalInvestmentsFormatted);

        // Verify grandTotal on second row
        cy.get(`tr[data-rowkey="${secondRowKey}"]`)
            .find(`[data-cy="grandTotal-${secondRowKey}"]`)
            .should('contain', expectedSecondRowGrandTotalFormatted);
    });
});
