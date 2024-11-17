describe('Firestore Data Load Test', () => {
    before(() => {
        // Seed Firestore and Auth Emulator data before tests
        cy.task('seedFirestore');
    });

    beforeEach(() => {
        // Clear cookies and local storage to start with a fresh session
        cy.clearCookies();
        cy.clearLocalStorage();

        // Clear IndexedDB (if needed)
        cy.window().then((win) => {
            indexedDB.deleteDatabase('firebaseLocalStorageDb');
        });

        // Visit your app
        cy.visit('/');

        // Automate the login process using data-cy attributes
        cy.get('[data-cy="login-email"]').type('testmctesttest@testmcface.com');
        cy.get('[data-cy="login-password"]').type('booyaWhat5%');
        cy.get('[data-cy="login-button"]').click();

        // Wait for the main app to load after login
        cy.contains('Welcome').should('be.visible');
    });

    it('should load user data from Firestore and display it in the table', () => {
        // Verify that the table displays the data from Firestore
        cy.get('[data-cy^=depositSavings-]')
            .first()
            .should('have.value', '1,000.00');
        cy.get('[data-cy^=depositInvestments-]')
            .first()
            .should('have.value', '300.00');

        // Verify goals are loaded
        cy.get('tbody tr')
            .first()
            .within(() => {
                cy.get('.goal-pill').should('contain.text', 'Car purchase');
            });
    });
});
