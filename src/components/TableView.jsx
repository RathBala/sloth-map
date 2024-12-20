import { useContext, useEffect } from 'react';
import { UserContext } from '../UserContext';

export function TableView() {
    const userData = useContext(UserContext);

    const fetchData = async () => {
        const tableDataRef = collection(userRef, 'tableData');
        const snapshot = await getDocs(tableDataRef);

        const loadedUserInputs = {};
        snapshot.forEach((doc) => {
            loadedUserInputs[doc.id] = doc.data();
        });
        setUserInputs(loadedUserInputs);

        await fetchGoals(currentUser.uid);
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <>
            <InputFields
                achieveNestEggBy={achieveNestEggBy}
                dateOfBirth={userData.dateOfBirth}
                isSettingsPage={false}
            />
            <button
                type="button"
                onClick={() => setShowHistoricRows((prev) => !prev)}
                className="toggle-historic-button"
            >
                {showHistoricRows ? (
                    <>
                        <span className="icon-collapse" /> ▼ Hide historic rows
                    </>
                ) : (
                    <>
                        <span className="icon-expand" /> ▶ Show historic rows
                    </>
                )}
            </button>
            <TableComponent
                data={formattedTableData}
                tableData={tableData}
                onFieldChange={handleFieldChange}
                onAltScenario={addAltScenario}
                handleRowClick={handleRowClick}
                onEditGoal={handleEditGoal}
            />
        </>
    );
}
