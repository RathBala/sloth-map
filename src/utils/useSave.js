import { useContext } from 'react';

import { AuthContext } from '../AuthContext';
import { UserContext } from '../UserContext';

import {
    saveUserSettingsToFirestore,
    saveTableDataToFirestore,
    saveGoalToFirestore,
    fetchUserSettingsFromFirestore,
} from './userServices';

export function useSave() {
    const currentUser = useContext(AuthContext);
    const { userSettings, userInputs, fieldsToDelete, setUserSettings } =
        useContext(UserContext);

    const save = async () => {
        try {
            await saveUserSettingsToFirestore(currentUser, userSettings);
            await saveTableDataToFirestore(
                currentUser,
                userInputs,
                fieldsToDelete
            );
            // await saveGoalToFirestore();

            const updatedUserSettings =
                await fetchUserSettingsFromFirestore(currentUser);
            setUserSettings(updatedUserSettings);

            alert('All changes saved successfully!');
        } catch (error) {
            alert('Error saving changes: ' + error.message);
        }
    };

    return { save };
}
