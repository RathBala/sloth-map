describe('Goal Management Test', () => {
    beforeEach(() => {
        // Clear session data and log in
        cy.clearCookies();
        cy.clearLocalStorage();
        cy.window().then((win) => {
            indexedDB.deleteDatabase('firebaseLocalStorageDb');
        });

        // // Seed Firestore data before tests
        // cy.task('seedFirestore');

        // Visit the app and log in
        cy.visit('/');
        cy.get('[data-cy="login-email"]').type('testmctesttest@testmcface.com');
        cy.get('[data-cy="login-password"]').type('booyaWhat5%');
        cy.get('[data-cy="login-button"]').click();
        cy.contains('Welcome').should('be.visible');
    });

    it('should allow user to create a new goal and update table accordingly', () => {
        // When user clicks on 'New Goal'
        cy.get('.new-goal-button').click();

        // Then the Goal modal opens up
        cy.get('.modal-content').should('be.visible');

        // And below the goal form input fields I see a list of existing goals
        cy.contains('h3', 'Existing Goals').should('be.visible');

        // And there are 2 existing goals: 'Priority 1: Car purchase (£10000)' and 'Priority 2: Holiday (£1000)'
        cy.get('.modal-content').within(() => {
            cy.get('ul li').should('have.length', 2);
            cy.get('ul li')
                .eq(0)
                .should('contain', 'Priority 1: Car purchase (£10000)');
            cy.get('ul li')
                .eq(1)
                .should('contain', 'Priority 2: Holiday (£1000)');
        });

        // When the user types in goal with a goal name of 'Emergency fund'
        cy.contains('label', 'Goal Name:').find('input').type('Emergency fund');

        // And types in an amount of '500'
        cy.contains('label', 'Goal Amount:').find('input').type('500');

        // And sets priority to '1'
        cy.contains('label', 'Priority:')
            .find('input')
            .clear() // Clear the default priority
            .type('1');

        // And clicks 'save'
        cy.get('.modal-content').within(() => {
            cy.contains('button', 'Save').click();
        });

        // Then the table updates to reflect 'Emergency fund' as the first goal that appears in the table
        // Wait for the modal to close
        cy.get('.modal-content').should('not.exist');

        // Now, verify the order and presence of goals in the table
        const goalData = {};

        // Get all rows in the table body
        cy.get('tbody tr').then(($rows) => {
            $rows.each((index, row) => {
                const $row = Cypress.$(row);
                const goalCell = $row.find('td').eq(3); // Assuming the 'Goal' column is the 4th column (index 3)
                const goalText = goalCell.text();

                if (goalText.includes('Emergency fund')) {
                    goalData.emergencyFund = {
                        index: index,
                        row: row,
                    };
                }
                if (goalText.includes('Car purchase')) {
                    goalData.carPurchase = {
                        index: index,
                        row: row,
                    };
                }
                if (goalText.includes('Holiday')) {
                    goalData.holiday = {
                        index: index,
                        row: row,
                    };
                }
            });

            // Assert that all goals are found
            expect(goalData.emergencyFund, '"Emergency fund" data').to.not.be
                .undefined;
            expect(goalData.carPurchase, '"Car purchase" data').to.not.be
                .undefined;
            expect(goalData.holiday, '"Holiday" data').to.not.be.undefined;

            // Then the table reflects 'Emergency fund' as the first goal that appears in the table
            expect(goalData.emergencyFund.index).to.be.lessThan(
                goalData.carPurchase.index
            );
            expect(goalData.carPurchase.index).to.be.lessThan(
                goalData.holiday.index
            );

            // And each goal only appears once
            cy.get('tbody tr td')
                .eq(3) // 'Goal' column
                .then(($cells) => {
                    const goalTexts = $cells
                        .map((i, el) => Cypress.$(el).text())
                        .get();

                    const emergencyFundOccurrences = goalTexts.filter((text) =>
                        text.includes('Emergency fund')
                    ).length;
                    const carPurchaseOccurrences = goalTexts.filter((text) =>
                        text.includes('Car purchase')
                    ).length;
                    const holidayOccurrences = goalTexts.filter((text) =>
                        text.includes('Holiday')
                    ).length;

                    expect(emergencyFundOccurrences).to.equal(1);
                    expect(carPurchaseOccurrences).to.equal(1);
                    expect(holidayOccurrences).to.equal(1);
                });

            // And both 'Emergency fund' and 'Car purchase' feature in the same row
            expect(goalData.emergencyFund.index).to.equal(
                goalData.carPurchase.index
            );
        });
    });
});
