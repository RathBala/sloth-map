describe('Deposit Savings Recurrence Test', () => {
    it('should recur depositSavings to all subsequent rows', () => {
        // Visit your app
        cy.visit('/');

        // Automate the login process using data-cy attributes
        cy.get('[data-cy="login-email"]').type('testmctesttest@testmcface.com');
        cy.get('[data-cy="login-password"]').type('booyaWhat5%');
        cy.get('[data-cy="login-button"]').click();

        // Wait for the main app to load after login
        cy.contains('Welcome').should('be.visible');

        // Proceed with your original test steps
        cy.get('[data-cy^=depositSavings-]').first().as('firstDepositSavings');
        cy.get('@firstDepositSavings').clear().type('100').blur();
        cy.get('[data-cy^=depositSavings-]').each(($input) => {
            cy.wrap($input)
                .invoke('val')
                .then((val) => {
                    const numericValue = parseFloat(
                        val.replace(/[^0-9.-]+/g, '')
                    );
                    expect(numericValue).to.eq(100);
                });
        });
    });
});
