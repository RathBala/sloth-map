/* eslint-disable react/prop-types */

const InputFields = ({
    interestRate,
    investmentReturnRate,
    targetNestEgg,
    age,
    handleInterestRateChange,
    handleInvestmentReturnRateChange,
    handleTargetNestEggChange,
    handleAgeChange,
}) => {
    const calculateAchieveNestEggBy = () => {
        // TODO: Implement the logic to calculate when the nest egg will be achieved
        return 'TBC';
    };

    const calculateYearsRemainingToRetirement = () => {
        // TODO: Implement the logic to calculate the years remaining to retirement
        return 0;
    };

    const calculateAbleToRetireAt = () => {
        const yearsRemaining = calculateYearsRemainingToRetirement();
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
            <label>
                Age:
                <input type="number" value={age} onChange={handleAgeChange} />
            </label>

            <p>Achieve Nest Egg By: {calculateAchieveNestEggBy()}</p>
            <p>
                Years Remaining To Retirement:{' '}
                {calculateYearsRemainingToRetirement()}
            </p>
            <p>Able to Retire At: {calculateAbleToRetireAt()}</p>
        </div>
    );
};

export default InputFields;
