describe('Deposit Savings Recurrence Test', () => {
    beforeEach(() => {
        // Clear cookies and local storage to start with a fresh session
        cy.clearCookies();
        cy.clearLocalStorage();

        cy.window().then((win) => {
            const deleteReq = win.indexedDB.deleteDatabase(
                'firebaseLocalStorageDb'
            );
            return new Promise((resolve, reject) => {
                deleteReq.onsuccess = resolve;
                deleteReq.onerror = reject;
                deleteReq.onblocked = () => {
                    // Handle the case where the deletion is blocked
                    console.warn('IndexedDB deletion blocked');
                    resolve();
                };
            });
        });
    });

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
