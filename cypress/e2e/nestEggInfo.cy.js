describe('Input Fields and Nest Egg Information Test', () => {
    beforeEach(() => {
        // Clear session data and log in
        cy.clearCookies();
        cy.clearLocalStorage();
        cy.window().then((win) => {
            indexedDB.deleteDatabase('firebaseLocalStorageDb');
        });

        // Assuming data is already seeded and user is already set up

        cy.visit('/');
        cy.get('[data-cy="login-email"]').type('testmctesttest@testmcface.com');
        cy.get('[data-cy="login-password"]').type('booyaWhat5%');
        cy.get('[data-cy="login-button"]').click();
        cy.contains('Welcome').should('be.visible');
    });

    it('should display correct nest egg information based on user data', () => {
        // Assuming the date of birth is set to make the user 10 years old
        // For testing purposes, we can set the date of birth via the app

        // Navigate to Settings tab and set date of birth to 01/01/[current year - 10]
        const tenYearsAgo = new Date();
        tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
        const dobString = tenYearsAgo.toISOString().split('T')[0]; // Format YYYY-MM-DD

        // Navigate to the Settings tab
        cy.contains('Settings').click();

        // Set Date of Birth
        cy.get('[data-cy="date-of-birth-input"]').clear().type(dobString);

        // Set Target Nest Egg to a value that would make 'Age Achieved Nest Egg By' 18
        // For simplicity, let's assume it's already set to achieve by age 18

        // Save changes if necessary
        cy.get('button').contains('Save').click();

        // Navigate back to the Table tab
        cy.contains('Table').click();

        // Verify that the InputFields component shows the correct information
        cy.get('[data-cy="current-age"]').should('contain', '10');
        cy.get('[data-cy="age-achieved-nest-egg-by"]').should('contain', '18');
        cy.get('[data-cy="years-remaining-to-nest-egg"]').should(
            'contain',
            '8'
        );
    });

    it('should update nest egg information when user changes settings', () => {
        // Navigate to the Settings tab
        cy.contains('Settings').click();

        // Change the Target Nest Egg to 500,000
        cy.get('[data-cy="target-nest-egg-input"]').clear().type('500000');

        // Change the Date of Birth to 30/12/2003
        cy.get('[data-cy="date-of-birth-input"]').clear().type('2003-12-30');

        // Save changes if necessary
        cy.get('button').contains('Save').click();

        // Navigate back to the Table tab
        cy.contains('Table').click();

        // Verify that the InputFields component shows the updated information
        cy.get('[data-cy="current-age"]').should('contain', '20');
        cy.get('[data-cy="age-achieved-nest-egg-by"]').should('contain', '33');
        cy.get('[data-cy="years-remaining-to-nest-egg"]').should(
            'contain',
            '13'
        );

        // Get the data-rowkey of the last row
        cy.get('tbody tr')
            .last()
            .invoke('attr', 'data-rowkey')
            .then((rowKey) => {
                // Verify the month
                cy.get(`[data-cy="month-${rowKey}"]`).should(
                    'contain',
                    'December 2037'
                );

                // Verify the grand total
                cy.get(`[data-cy="grandTotal-${rowKey}"]`).then(($cell) => {
                    const cellText = $cell.text().trim();
                    expect(cellText).to.equal('503,604.74');
                });
            });
    });
});
