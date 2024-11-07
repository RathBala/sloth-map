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
        const targetYear = achieveNestEggBy
            ? parseInt(achieveNestEggBy.split(' ')[1], 10)
            : currentYear;
        return targetYear - currentYear;
    };

    const calculateAgeToAchieveNestEgg = () => {
        const yearsRemaining = calculateYearsRemainingToNestEgg();
        return age ? parseInt(age, 10) + yearsRemaining : 'N/A';
    };

    return (
        <div className="input-fields">
            {isSettingsPage ? (
                <>
                    <label>
                        Interest Rate (%):
                        <input
                            type="number"
                            value={interestRate}
                            onChange={handleInterestRateChange}
                        />
                    </label>
                    <label>
                        Investment Return Rate (%):
                        <input
                            type="number"
                            value={investmentReturnRate}
                            onChange={handleInvestmentReturnRateChange}
                        />
                    </label>
                    <label>
                        Target Nest Egg:
                        <input
                            type="number"
                            value={targetNestEgg}
                            onChange={handleTargetNestEggChange}
                        />
                    </label>
                    <label>
                        Age:
                        <input
                            type="number"
                            value={age}
                            onChange={handleAgeChange}
                        />
                    </label>
                </>
            ) : (
                <>
                    <p>Achieve Nest Egg By: {achieveNestEggBy}</p>
                    <p>
                        Years Remaining To Nest Egg:{' '}
                        {calculateYearsRemainingToNestEgg()}
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
