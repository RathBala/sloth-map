import { useContext } from 'react';
import { UserContext } from '../UserContext';
import { saveUserSettingsToFirestore } from '../utils/userServices';
import { AuthContext } from '../AuthContext';

function SettingsEditor() {
  const { userSettings, setUserSettings } = useContext(UserContext);
  const currentUser = useContext(AuthContext);

  const handleInterestRateChange = (newRate) => {
    setUserSettings((prev) => ({
      ...prev,
      interestRate: newRate,
    }));

    saveUserSettingsToFirestore(currentUser, {
      ...userSettings,
      interestRate: newRate,
    });
  };

  // Render UI
}
