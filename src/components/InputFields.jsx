const InputFields = ({
    interestRate,
    investmentReturnRate,
    targetNestEgg,
    age,
    handleInterestRateChange,
    handleInvestmentReturnRateChange,
    handleTargetNestEggChange,
    handleAgeChange,
    achieveNestEggBy,
    isSettingsPage,
}) => {
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
        if (
            yearsRemaining !== null &&
            age !== null &&
            age !== undefined &&
            !isNaN(age)
        ) {
            return parseInt(age, 10) + yearsRemaining;
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
                        Age:
                        <input
                            type="number"
                            value={age !== null && age !== undefined ? age : ''}
                            onChange={handleAgeChange}
                        />
                    </label>
                </>
            ) : (
                <>
                    <p>Achieve Nest Egg By: {achieveNestEggBy || 'TBC'}</p>
                    <p>
                        Years Remaining To Nest Egg:{' '}
                        {calculateYearsRemainingToNestEgg() !== null
                            ? calculateYearsRemainingToNestEgg()
                            : 'N/A'}
                    </p>
                    <p>
                        Age Achieved Nest Egg By:{' '}
                        {calculateAgeToAchieveNestEgg()}
                    </p>
                </>
            )}
        </div>
    );
};

export default InputFields;
