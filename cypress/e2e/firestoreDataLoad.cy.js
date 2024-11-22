describe('Firestore Data Load Test', () => {
    // before(() => {
    //     // Seed Firestore and Auth Emulator data before tests
    //     cy.task('seedFirestore');
    // });

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
        // **Step 1: Select the row with rowkey '2025-01-0'**
        cy.get('tr[data-rowkey="2025-01-0"]').as('specificRow');

        // **Step 2: Verify that the depositSavings input has value '1,000.00'**
        cy.get('@specificRow')
            .find('[data-cy^="depositSavings-"]')
            .should('have.value', '1,000.00');
    });

    it('should have "Car purchase" and "Holiday" goals with correct amounts and in correct order', () => {
        // Store data about goals
        const goalData = {};

        // Get all rows in the table body
        cy.get('tbody tr').then(($rows) => {
            // Total number of rows
            const totalRows = $rows.length;

            // Find the row containing 'Car purchase'
            cy.contains('tbody tr', 'Car purchase')
                .then(($carPurchaseRow) => {
                    const carPurchaseIndex = $rows.index($carPurchaseRow);

                    // Get the goal amount for 'Car purchase'
                    cy.wrap($carPurchaseRow)
                        .find('.goal-amount-column')
                        .invoke('text')
                        .then((text) => {
                            goalData.carPurchase = {
                                index: carPurchaseIndex,
                                amount: text.trim(),
                            };
                        });
                })
                .then(() => {
                    // Find the row containing 'Holiday'
                    cy.contains('tbody tr', 'Holiday')
                        .then(($holidayRow) => {
                            const holidayIndex = $rows.index($holidayRow);

                            // Get the goal amount for 'Holiday'
                            cy.wrap($holidayRow)
                                .find('.goal-amount-column')
                                .invoke('text')
                                .then((text) => {
                                    goalData.holiday = {
                                        index: holidayIndex,
                                        amount: text.trim(),
                                    };
                                });
                        })
                        .then(() => {
                            // Perform assertions after both goals have been found
                            expect(goalData.carPurchase, '"Car purchase" data')
                                .to.not.be.undefined;
                            expect(goalData.holiday, '"Holiday" data').to.not.be
                                .undefined;

                            // Assert that 'Car purchase' comes before 'Holiday'
                            expect(goalData.carPurchase.index).to.be.lessThan(
                                goalData.holiday.index
                            );

                            // Verify the goal amounts
                            expect(goalData.carPurchase.amount).to.equal(
                                '10,000.00'
                            );
                            expect(goalData.holiday.amount).to.equal(
                                '1,000.00'
                            );
                        });
                });
        });
    });
});
