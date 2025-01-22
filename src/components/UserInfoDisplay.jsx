import React from 'react';
import { convertDatabaseTimestamp } from '../utils/formatUtils';

function calculateCurrentAge(dateOfBirth) {
    const dateObj = convertDatabaseTimestamp(dateOfBirth);

    if (!dateObj || isNaN(dateObj.getTime())) return 'N/A';

    const now = new Date();
    let age = now.getFullYear() - dateObj.getFullYear();
    const monthDiff = now.getMonth() - dateObj.getMonth();

    if (
        monthDiff < 0 ||
        (monthDiff === 0 && now.getDate() < dateObj.getDate())
    ) {
        age--;
    }

    return age;
}

export default function UserInfoDisplay({ dateOfBirth, achieveNestEggBy }) {
    function calculateYearsRemaining() {
        if (!achieveNestEggBy || achieveNestEggBy === 'TBC') return 'N/A';
        const [monthText, yearText] = achieveNestEggBy.split(' ');
        const targetYear = parseInt(yearText, 10);
        if (isNaN(targetYear)) return 'N/A';
        const currentYear = new Date().getFullYear();
        return targetYear - currentYear;
    }

    function calculateAgeAchievedNestEgg() {
        const yearsRemaining = parseInt(calculateYearsRemaining(), 10);
        const currentAge = parseInt(calculateCurrentAge(dateOfBirth), 10);
        if (isNaN(yearsRemaining) || isNaN(currentAge)) return 'N/A';
        return currentAge + yearsRemaining;
    }

    return (
        <div className="user-info-display">
            <p>Current Age: {calculateCurrentAge(dateOfBirth)}</p>
            <p>Years Remaining To Nest Egg: {calculateYearsRemaining()}</p>
            <p>Age Achieved Nest Egg By: {calculateAgeAchievedNestEgg()}</p>
        </div>
    );
}
