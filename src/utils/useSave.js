export const handleSaveClick = async () => {
    console.log('Save button clicked');

    try {
        await saveInputFields();
        await saveTableData();
        await commitGoalsToFirestore();

        const newInputs = await fetchUserInputs();
        setUserInputs(newInputs);

        console.log('All changes saved successfully');
    } catch (error) {
        console.error('Failed to save changes:', error);
        alert('Error saving changes: ' + error.message);
    }
};
