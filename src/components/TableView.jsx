import { useContext, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { AuthContext } from '../AuthContext';
import { getUserRef } from '../utils/getUserRef';
import InputFields from './InputFields';
import TableComponent from './TableComponent';
import useUserData from '../utils/useUserData';

export default function TableView({
    achieveNestEggBy,
    showHistoricRows,
    setShowHistoricRows,
    formattedTableData,
    tableData,
    handleFieldChange,
    addAltScenario,
    handleRowClick,
    handleEditGoal,
}) {
    const [tableData, setTableData] = useState(() => generateData(500, 300));

    useEffect(() => {
        fetchData();
    }, []);

    const { setUserInputs, fetchGoals } = useUserData();

    const currentUser = useContext(AuthContext);
    const userRef = getUserRef(currentUser);

    const filteredTableData = showHistoricRows
        ? tableData
        : tableData.filter((entry) => entry.month >= currentMonth);

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

    const lastEntry = tableData[tableData.length - 1];
    const achieveNestEggBy = lastEntry ? formatMonth(lastEntry.month) : 'TBC';

    const handleFieldChange = (rowKey, field, value) => {
        console.log(
            `handleFieldChange called for field: ${field} with value: ${value}`
        );

        let updatedTableData = [...tableData];

        // Find the index of the row to update
        const index = updatedTableData.findIndex(
            (row) => row.rowKey === rowKey
        );
        if (index === -1) {
            console.warn(`No row found with rowKey: ${rowKey}`);
            return;
        }

        updatedTableData = updateField(updatedTableData, index, field, value, {
            trackChange: true,
            isManual: true,
        });

        setTableData(updatedTableData);
    };

    return (
        <>
            <InputFields
                achieveNestEggBy={achieveNestEggBy}
                dateOfBirth={currentUser.dateOfBirth}
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
