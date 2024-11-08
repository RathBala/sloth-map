describe('Deposit Savings Recurrence Test', () => {
    it('should recur depositSavings to all subsequent rows', () => {
        // Visit your app (replace with your app's URL)
        cy.visit('/'); // Visits the baseUrl

        // Wait for the page to load and get the first depositSavings input
        cy.get('[data-cy^=depositSavings-]').first().as('firstDepositSavings');

        // Clear the input and type '100', then blur to trigger formatting
        cy.get('@firstDepositSavings').clear().type('100').blur();

        // Now, check that all depositSavings inputs have the value '£100'
        cy.get('[data-cy^=depositSavings-]').each(($input) => {
            // Extract the numeric value from the input's value
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
