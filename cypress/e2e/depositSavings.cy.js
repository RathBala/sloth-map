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

        // Visit your app
        cy.visit('/');

        // Automate the login process using data-cy attributes
        cy.get('[data-cy="login-email"]').type('testmctesttest@testmcface.com');
        cy.get('[data-cy="login-password"]').type('booyaWhat5%');
        cy.get('[data-cy="login-button"]').click();

        // Wait for the main app to load after login
        cy.contains('Welcome').should('be.visible');
    });

    it('should recur depositSavings to all subsequent rows', () => {
        cy.get('[data-cy^=depositSavings-]').first().as('firstDepositSavings');
        cy.get('@firstDepositSavings').clear().type('100').blur();

        // Wait until the first deposit savings input indeed has a value of 100
        cy.get('@firstDepositSavings').should('have.value', '100.00');

        // Then verify all rows have depositSavings of 100
        cy.get('[data-cy^=depositSavings-]').each(($input) => {
            cy.wrap($input).should('have.value', '100.00');
        });
    });

    it('should create an alt row with the same values, deactivate the original row, and activate the new alt row', () => {
        // Step 1: Capture the original row's values
        // For demonstration, we assume the first row (original row) is present and has default values.
        cy.get('tbody tr').first().as('originalRow');

        // Retrieve the row key of the original row from a data attribute or from an input name
        cy.get('@originalRow')
            .invoke('attr', 'data-rowkey')
            .as('originalRowKey');

        // We'll gather all relevant fields. The fields in the table, in order:
        // 1. Month
        // 2. Deposit in Savings
        // 3. Deposit in Investments
        // 4. Goal Name
        // 5. Goal Amount
        // 6. Total in Savings Account
        // 7. Total in Investments Account

        // We'll use column indexes to fetch values for each field from the original row.
        cy.get('@originalRow').within(() => {
            cy.get('td').eq(0).invoke('text').as('originalMonth');
            cy.get('td')
                .eq(1)
                .find('input')
                .invoke('val')
                .as('originalDepositSavings');
            cy.get('td')
                .eq(2)
                .find('input')
                .invoke('val')
                .as('originalDepositInvestments');
            cy.get('td').eq(3).invoke('text').as('originalGoalName');
            cy.get('td').eq(4).invoke('text').as('originalGoalAmount');
            cy.get('td')
                .eq(5)
                .find('input')
                .invoke('val')
                .as('originalTotalSavings');
            cy.get('td')
                .eq(6)
                .find('input')
                .invoke('val')
                .as('originalTotalInvestments');
        });

        // Step 2: Click the add alt scenario button/icon on the first row
        cy.get('@originalRow').find('.add-icon').click();

        // Step 3: Capture the newly created alt row
        cy.get('tbody tr').eq(1).as('newAltRow');

        // Step 4: Verify the new alt row has the same values as the original row
        cy.get('@newAltRow').within(() => {
            cy.get('td').eq(0).invoke('text').as('newAltMonth');
            cy.get('td')
                .eq(1)
                .find('input')
                .invoke('val')
                .as('newAltDepositSavings');
            cy.get('td')
                .eq(2)
                .find('input')
                .invoke('val')
                .as('newAltDepositInvestments');
            cy.get('td').eq(3).invoke('text').as('newAltGoalName');
            cy.get('td').eq(4).invoke('text').as('newAltGoalAmount');
            cy.get('td')
                .eq(5)
                .find('input')
                .invoke('val')
                .as('newAltTotalSavings');
            cy.get('td')
                .eq(6)
                .find('input')
                .invoke('val')
                .as('newAltTotalInvestments');
        });

        // Step 5: Use aliases to verify each field value matches
        cy.get('@originalMonth').then((originalMonth) => {
            cy.get('@newAltMonth').should('equal', originalMonth);
        });
        cy.get('@originalDepositSavings').then((originalDepositSavings) => {
            cy.get('@newAltDepositSavings').should(
                'equal',
                originalDepositSavings
            );
        });
        cy.get('@originalDepositInvestments').then(
            (originalDepositInvestments) => {
                cy.get('@newAltDepositInvestments').should(
                    'equal',
                    originalDepositInvestments
                );
            }
        );
        cy.get('@originalGoalName').then((originalGoalName) => {
            cy.get('@newAltGoalName').should('equal', originalGoalName);
        });
        cy.get('@originalGoalAmount').then((originalGoalAmount) => {
            cy.get('@newAltGoalAmount').should('equal', originalGoalAmount);
        });
        cy.get('@originalTotalSavings').then((originalTotalSavings) => {
            cy.get('@newAltTotalSavings').should('equal', originalTotalSavings);
        });
        cy.get('@originalTotalInvestments').then((originalTotalInvestments) => {
            cy.get('@newAltTotalInvestments').should(
                'equal',
                originalTotalInvestments
            );
        });

        // Step 6: Verify row states: original row becomes inactive, new alt row is active
        cy.get('@originalRow').should('have.class', 'inactive');
        cy.get('@newAltRow').should('have.class', 'active');

        // Step 7: Verify the new alt row's rowKey ends with `-1`
        // (since the original row likely ends in `-0`)
        cy.get('@newAltRow')
            .invoke('attr', 'data-rowkey')
            .should('match', /-1$/);
    });
});
