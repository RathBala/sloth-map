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
            .type('2');

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
                const goalColumn = $row.find('td').eq(3); // Assuming the 'Goal' column is the 4th column (index 3)
                const goalText = goalColumn.text();

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

            // Then the table reflects 'Emergency fund' as the 2nd goal that appears in the table
            expect(goalData.emergencyFund.index).to.be.lessThan(
                goalData.holiday.index
            );

            // And each goal only appears once
            cy.get('[data-cy="goalColumn"]').then(($cells) => {
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

    it('should correctly allocate funds when adding a new goal "Coffee machine"', () => {
        // **Action: Add 'Coffee machine' goal**
        // When the user clicks on 'New Goal'
        cy.get('.new-goal-button').click();

        // Then the Goal modal opens up
        cy.get('.modal-content').should('be.visible');

        // And the user types in goal with a goal name of 'Coffee machine'
        cy.contains('label', 'Goal Name:').find('input').type('Coffee machine');

        // And types in an amount of '4000'
        cy.contains('label', 'Goal Amount:').find('input').type('4000');

        // And sets priority to '4'
        cy.contains('label', 'Priority:').find('input').clear().type('3');

        // And clicks 'save'
        cy.get('.modal-content').within(() => {
            cy.contains('button', 'Save').click();
        });

        // Wait for the modal to close
        cy.get('.modal-content').should('not.exist');

        // **Assertion: Verify 'Coffee machine' appears after 'Holiday'**
        cy.get('[data-cy="goalColumn"]').then(($cells) => {
            const goalTexts = $cells.map((i, el) => Cypress.$(el).text()).get();

            // Flatten the goals in case of multiple goals per cell
            const allGoals = goalTexts.flatMap((text) =>
                text.trim().split(/\s*,\s*/)
            );

            // Verify that 'Coffee machine' appears after 'Holiday'
            const holidayIndex = allGoals.indexOf('Holiday');
            const coffeeMachineIndex = allGoals.indexOf('Coffee machine');

            expect(holidayIndex).to.be.greaterThan(-1);
            expect(coffeeMachineIndex).to.be.greaterThan(-1);
            expect(coffeeMachineIndex).to.be.greaterThan(holidayIndex);
        });

        // **Assertion: Verify 'Total in Savings' and 'Total in Investments' values**
        // Find the row where 'Coffee machine' appears
        cy.get('tbody tr').each(($row) => {
            cy.wrap($row)
                .find('[data-cy="goalColumn"]')
                .then(($goalColumn) => {
                    const goalText = $goalColumn.text();

                    if (goalText.includes('Coffee machine')) {
                        // Verify 'Total in Savings' is £0
                        cy.wrap($row)
                            .find('[data-cy^="totalSavings-"]')
                            .should('contain', '0.00');

                        // Verify 'Total in Investments' is £533.49
                        cy.wrap($row)
                            .find('[data-cy^="totalInvestments-"]')
                            .invoke('text')
                            .then((text) => {
                                const numericValue = parseFloat(
                                    text.replace(/[^0-9.-]+/g, '')
                                );
                                expect(numericValue).to.be.closeTo(
                                    533.48,
                                    0.01
                                );
                            });
                    }
                });
        });
    });

    it('should adjust totals correctly when adding a goal to current row', () => {
        // **Step 1: Change 'Total in Savings' for the first row to £1000**

        // First, we need to get the `rowKey` of the first row
        cy.get('tbody tr')
            .first()
            .invoke('attr', 'data-rowkey')
            .then((firstRowKey) => {
                // Use your method to edit 'Total in Savings'
                cy.get(`tr[data-rowkey="${firstRowKey}"]`)
                    .find(`[data-cy="totalSavings-${firstRowKey}"] input`)
                    .scrollIntoView({ offset: { top: -100, left: 0 } }) // Adjust top offset
                    .should('be.visible')
                    .click({ force: true }) // Ensure it clicks even if partially obscured
                    .clear()
                    .type('1000')
                    .blur();

                // **Step 2: Add a new goal 'Mini holiday' with amount £100 and priority 1**

                // Click on 'New Goal' button
                cy.get('.new-goal-button').click();

                // Ensure the modal is visible
                cy.get('.modal-content').should('be.visible');

                // Fill in the goal details
                cy.contains('label', 'Goal Name:')
                    .find('input')
                    .type('Mini holiday');
                cy.contains('label', 'Goal Amount:').find('input').type('100');
                cy.contains('label', 'Priority:')
                    .find('input')
                    .clear()
                    .type('1');

                // Save the goal
                cy.get('.modal-content').within(() => {
                    cy.contains('button', 'Save').click();
                });

                // Wait for the modal to close
                cy.get('.modal-content').should('not.exist');

                // **Step 3: Verify that 'Mini holiday' appears in the first row**

                cy.get(`tr[data-rowkey="${firstRowKey}"]`)
                    .find('[data-cy="goalColumn"]')
                    .should('contain', 'Mini holiday');

                // **Step 4: Verify that 'Total in Savings' is £900 in that row**

                cy.get(`tr[data-rowkey="${firstRowKey}"]`)
                    .find(`[data-cy="totalSavings-${firstRowKey}"]`)
                    .should('contain', '900.00');

                // **Step 5: Verify that 'Total in Investments' is £300 in that row**

                cy.get(`tr[data-rowkey="${firstRowKey}"]`)
                    .find(`[data-cy="totalInvestments-${firstRowKey}"]`)
                    .should('contain', '300.00');
            });
    });

    it('should adjust goal timelines when increasing depositSavings in a future date', () => {
        // **Assumption: There are 2 goals already in the table**

        // Wait for the table to load if necessary
        cy.wait(1000);

        // **Step 1: Record the positions of the goals before the change**

        cy.get('tbody tr').then(($rows) => {
            const goalPositionsBefore = {};

            $rows.each((index, row) => {
                const $row = Cypress.$(row);
                const $goalCell = $row.find('[data-cy="goalColumn"]');
                const goalText = $goalCell.text();

                if (goalText.includes('Car purchase')) {
                    goalPositionsBefore['Car purchase'] = index;
                }
                if (goalText.includes('Holiday')) {
                    goalPositionsBefore['Holiday'] = index;
                }
            });

            // **Step 2: Calculate the date 4 months from now and find the corresponding row**

            const today = new Date();
            const futureDate = new Date(
                today.getFullYear(),
                today.getMonth() + 4,
                1
            );
            const futureMonthFormatted = futureDate.toLocaleString('default', {
                month: 'long',
                year: 'numeric',
            });

            let targetRowKey;

            $rows.each((index, row) => {
                const $row = Cypress.$(row);
                const rowKey = $row.attr('data-rowkey');
                const monthCellText = $row.find('td').first().text().trim();

                if (monthCellText === futureMonthFormatted) {
                    targetRowKey = rowKey;
                    return false; // Break the each loop
                }
            });

            expect(targetRowKey, 'Target row for future month').to.exist;

            // **Step 3: Change depositSavings for that date to 2000.00**

            cy.get(`tr[data-rowkey="${targetRowKey}"]`)
                .find(`[data-cy="depositSavings-${targetRowKey}"]`)
                .scrollIntoView({ offset: { top: -100, left: 0 } })
                .should('be.visible')
                .click({ force: true })
                .clear()
                .type('2000.00')
                .blur();

            // Wait for the table to update if necessary
            cy.wait(500); // Adjust the wait time as needed

            // **Step 4: Record the positions of the goals after the change**

            cy.get('tbody tr').then(($updatedRows) => {
                const goalPositionsAfter = {};

                $updatedRows.each((index, row) => {
                    const $row = Cypress.$(row);
                    const $goalCell = $row.find('[data-cy="goalColumn"]');
                    const goalText = $goalCell.text();

                    if (goalText.includes('Car purchase')) {
                        goalPositionsAfter['Car purchase'] = index;
                    }
                    if (goalText.includes('Holiday')) {
                        goalPositionsAfter['Holiday'] = index;
                    }
                });

                // **Step 5: Assert that the goals have moved up

                expect(goalPositionsAfter['Car purchase']).to.equal(
                    goalPositionsBefore['Car purchase'] - 2
                );
                expect(goalPositionsAfter['Holiday']).to.equal(
                    goalPositionsBefore['Holiday'] - 3
                );
            });
        });
    });
});
