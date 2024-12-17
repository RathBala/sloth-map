const InputFields = ({
    interestRate,
    investmentReturnRate,
    targetNestEgg,
    dateOfBirth,
    handleInterestRateChange,
    handleInvestmentReturnRateChange,
    handleTargetNestEggChange,
    handleDateOfBirthChange,
    achieveNestEggBy,
    isSettingsPage,
}) => {
    
    const formatDateForInput = (date) => {
        if (!date) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const onDateOfBirthChange = (e) => {
        const selectedDate = e.target.value ? new Date(e.target.value) : null;
        handleDateOfBirthChange(selectedDate);
    };

    
    const calculateCurrentAge = () => {
        if (
            !dateOfBirth ||
            !(dateOfBirth instanceof Date) ||
            isNaN(dateOfBirth.getTime())
        ) {
            return 'N/A';
        }
        const now = new Date();
        let age = now.getFullYear() - dateOfBirth.getFullYear();
        const monthDiff = now.getMonth() - dateOfBirth.getMonth();
        if (
            monthDiff < 0 ||
            (monthDiff === 0 && now.getDate() < dateOfBirth.getDate())
        ) {
            age--;
        }
        return age;
    };

    const calculateYearsRemainingToNestEgg = () => {
        const currentYear = new Date().getFullYear();
        if (achieveNestEggBy && achieveNestEggBy !== 'TBC') {
            const parts = achieveNestEggBy.split(' ');
            const yearPart = parts[1];
            const targetYear = parseInt(yearPart, 10);
            if (!isNaN(targetYear)) {
                return targetYear - currentYear;
            }
        }
        // If achieveNestEggBy is 'TBC' or cannot be parsed, return null or a default value
        return null; // or return 0 if that's more appropriate
    };

    const calculateAgeToAchieveNestEgg = () => {
        const yearsRemaining = calculateYearsRemainingToNestEgg();
        const currentAge = calculateCurrentAge();
        if (
            yearsRemaining !== null &&
            currentAge !== 'N/A' &&
            !isNaN(currentAge)
        ) {
            return parseInt(currentAge, 10) + yearsRemaining;
        } else {
            return 'N/A';
        }
    };

    return (
        <div className="input-fields">
            {isSettingsPage ? ( 
                <>
                    <label>
                        Interest Rate (%):
                        <input
                            data-cy="interest-rate-input"
                            type="number"
                            value={

                                interestRate !== null &&
                                interestRate !== undefined
                                    ? interestRate
                                    : ''
                            }
                            onChange={handleInterestRateChange}
                        />
                    </label>
                    <label>
                        Investment Return Rate (%):
                        <input
                            data-cy="investment-return-rate-input"
                            type="number"
                            value={
                                investmentReturnRate !== null &&
                                investmentReturnRate !== undefined
                                    ? investmentReturnRate
                                    : ''
                            }
                            onChange={handleInvestmentReturnRateChange}
                        />
                    </label>
                    <label>
                        Target Nest Egg:
                        <input
                            data-cy="target-nest-egg-input"
                            type="number"
                            value={
                                targetNestEgg !== null &&
                                targetNestEgg !== undefined
                                    ? targetNestEgg
                                    : ''
                            }
                            onChange={handleTargetNestEggChange}
                        />
                    </label>
                    <label>
                        Date of Birth:
                        <input
                            data-cy="date-of-birth-input"
                            type="date"
                            value={formatDateForInput(dateOfBirth)}
                            onChange={onDateOfBirthChange}
                        />
                    </label>
                </>
            ) : (
                <>
                    <p data-cy="current-age">

                        Current Age: {calculateCurrentAge()}
                    </p>
                    <p data-cy="age-achieved-nest-egg-by">
                        Age Achieved Nest Egg By:{' '}
                        {calculateAgeToAchieveNestEgg()}
                    </p>
                    <p data-cy="years-remaining-to-nest-egg">
                        Years Remaining To Nest Egg:{' '}
                        {calculateYearsRemainingToNestEgg() !== null
                            ? calculateYearsRemainingToNestEgg()
                            : 'N/A'}
                    </p>
                </>
            )}
        </div>
    );
};

export default InputFields;
