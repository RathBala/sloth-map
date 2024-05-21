const InputFields = ({
    interestRate,
    investmentReturnRate,
    targetNestEgg,
    age,
    handleInterestRateChange,
    handleInvestmentReturnRateChange,
    handleTargetNestEggChange,
    achieveNestEggBy,
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
        return age + yearsRemaining;
    };

    return (
        <div>
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
            <p>Current Age: {age}</p>
            <p>Achieve Nest Egg By: {achieveNestEggBy}</p>
            <p>
                Years Remaining To Nest Egg:{' '}
                {calculateYearsRemainingToNestEgg()}
            </p>
            <p>Age achieved Nest Egg by: {calculateAgeToAchieveNestEgg()}</p>
        </div>
    );
};

export default InputFields;
