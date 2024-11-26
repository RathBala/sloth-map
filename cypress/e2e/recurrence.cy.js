describe('Recurrence Logic Test', () => {
    beforeEach(() => {
        // Clear session data and log in
        cy.clearCookies();
        cy.clearLocalStorage();
        cy.window().then((win) => {
            indexedDB.deleteDatabase('firebaseLocalStorageDb');
        });

        // // Seed Firestore data before tests
        // cy.task('seedFirestore');

        cy.visit('/');
        cy.get('[data-cy="login-email"]').type('testmctesttest@testmcface.com');
        cy.get('[data-cy="login-password"]').type('booyaWhat5%');
        cy.get('[data-cy="login-button"]').click();
        cy.contains('Welcome').should('be.visible');
    });

    it('should have Firestore data recur to subsequent values', () => {
        // Verify that depositSavings for January 2025 is 1,000.00
        cy.get('tr[data-rowkey="2025-01-0"]')
            .find('[data-cy^="depositSavings-"]')
            .should('have.value', '1,000.00');

        // Verify that this value recurs to subsequent rows until July 2025
        const monthsWith1000 = [
            '2025-02-0',
            '2025-03-0',
            '2025-04-0',
            '2025-05-0',
            '2025-06-0',
            '2025-07-0',
        ];

        monthsWith1000.forEach((rowKey) => {
            cy.get(`tr[data-rowkey="${rowKey}"]`)
                .find('[data-cy^="depositSavings-"]')
                .should('have.value', '1,000.00');
        });

        // Verify that August 2025's depositSavings is 2,000.00
        cy.get('tr[data-rowkey="2025-08-0"]')
            .find('[data-cy^="depositSavings-"]')
            .should('have.value', '2,000.00');

        // Verify that this value recurs to subsequent rows
        const monthsWith2000 = [
            '2025-09-0',
            '2025-10-0',
            '2025-11-0',
            '2025-12-0',
            // Add more months as needed
        ];

        monthsWith2000.forEach((rowKey) => {
            cy.get(`tr[data-rowkey="${rowKey}"]`)
                .find('[data-cy^="depositSavings-"]')
                .should('have.value', '2,000.00');
        });
    });

    it('should have user changes overwrite Firestore data in subsequent months', () => {
        // Verify initial value for August 2025 is 2,000.00
        cy.get('tr[data-rowkey="2025-08-0"]')
            .find('[data-cy^="depositSavings-"]')
            .should('have.value', '2,000.00');

        // Change depositSavings for 2025-02-0 to 750.00
        cy.get('tr[data-rowkey="2025-02-0"]')
            .find('[data-cy^="depositSavings-"]')
            .clear()
            .type('750')
            .blur();

        // Verify that depositSavings for March 2025 onwards are 750.00
        const monthsWith750 = [
            '2025-03-0',
            '2025-04-0',
            '2025-05-0',
            '2025-06-0',
            '2025-07-0',
            '2025-08-0', // August should now be overwritten to 750.00
            '2025-09-0',
            '2025-10-0',
            '2025-11-0',
            '2025-12-0',
            // Add more months as needed
        ];

        monthsWith750.forEach((rowKey) => {
            cy.get(`tr[data-rowkey="${rowKey}"]`)
                .find('[data-cy^="depositSavings-"]')
                .should('have.value', '750.00');
        });
    });
});
