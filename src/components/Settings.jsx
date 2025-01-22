import { useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { UserContext } from '../UserContext';
import { saveUserSettingsToFirestore } from '../utils/userServices';
import {
    formatDateForInput,
    convertDatabaseTimestamp,
} from '../utils/formatUtils';

export default function Settings() {
    const { userSettings, setUserSettings } = useContext(UserContext);
    const currentUser = useContext(AuthContext);

    function handleChange(field, value) {
        let updatedValue = value;
        if (field === 'dateOfBirth') {
            updatedValue = value ? new Date(value) : null;
        } else {
            updatedValue = parseFloat(value) || 0;
        }
        setUserSettings((prev) => ({ ...prev, [field]: updatedValue }));
        saveUserSettingsToFirestore(currentUser, {
            ...userSettings,
            [field]: updatedValue,
        });
    }

    return (
        <div>
            <div>
                <label>Interest Rate (%):</label>
                <input
                    type="number"
                    value={userSettings.interestRate ?? ''}
                    onChange={(e) =>
                        handleChange('interestRate', e.target.value)
                    }
                />
            </div>

            <div>
                <label>Investment Return Rate (%):</label>
                <input
                    type="number"
                    value={userSettings.investmentReturnRate ?? ''}
                    onChange={(e) =>
                        handleChange('investmentReturnRate', e.target.value)
                    }
                />
            </div>

            <div>
                <label>Target Nest Egg:</label>
                <input
                    type="number"
                    value={userSettings.targetNestEgg ?? ''}
                    onChange={(e) =>
                        handleChange('targetNestEgg', e.target.value)
                    }
                />
            </div>

            <div>
                <label>Date of Birth:</label>
                <input
                    type="date"
                    value={formatDateForInput(
                        convertDatabaseTimestamp(userSettings.dateOfBirth)
                    )}
                    onChange={(e) =>
                        handleChange('dateOfBirth', e.target.value)
                    }
                />
            </div>
        </div>
    );
}
