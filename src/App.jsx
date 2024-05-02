import { useState, useEffect } from 'react';
import TableComponent from './components/TableComponent';
import InputFields from './components/InputFields';
import { formatNumber } from './utils/formatUtils';
import './App.css';

const App = () => {
    const [interestRate, setInterestRate] = useState(5);
    const [investmentReturnRate, setInvestmentReturnRate] = useState(10);
    const [tableData, setTableData] = useState(() =>
        generateData(interestRate, investmentReturnRate, 500, 300, 0)
    );
    const [targetNestEgg, setTargetNestEgg] = useState(5000000);
    const [age, setAge] = useState(38);
    const [recalcTrigger, setRecalcTrigger] = useState(0); // New state to trigger recalculation

    useEffect(() => {
        recalculateData();
    }, [interestRate, investmentReturnRate, targetNestEgg, recalcTrigger]); // Added recalcTrigger here

    const recalculateData = () => {
        let updatedData = [...tableData];
        updatedData = recalculateFromIndex(
            updatedData,
            0,
            interestRate,
            investmentReturnRate
        );
        updatedData = ensureNestEgg(
            targetNestEgg,
            updatedData,
            interestRate,
            investmentReturnRate,
            recalculateFromIndex
        );
        setTableData(updatedData);
    };

    const handleInterestRateChange = (e) =>
        setInterestRate(parseFloat(e.target.value));
    const handleInvestmentReturnRateChange = (e) =>
        setInvestmentReturnRate(parseFloat(e.target.value));
    const handleTargetNestEggChange = (e) =>
        setTargetNestEgg(parseFloat(e.target.value));
    const handleAgeChange = (e) => setAge(parseFloat(e.target.value));

    function recalculateFromIndex(
        data,
        startIndex,
        interestRate,
        investmentReturnRate
    ) {
        let runningTotalSavings =
            startIndex === 0 ? 0 : data[startIndex - 1].totalSavings;
        let runningTotalInvestments =
            startIndex === 0 ? 0 : data[startIndex - 1].totalInvestments;

        for (let i = startIndex; i < data.length; i++) {
            const entry = data[i];

            if (i > 0) {
                runningTotalSavings += data[i - 1].interestReturn;
                runningTotalInvestments += data[i - 1].investmentReturn;
            }

            if (!entry.isTotalSavingsManual) {
                runningTotalSavings += entry.depositSavings - entry.withdrawals;
            } else {
                runningTotalSavings = entry.totalSavings;
            }

            if (!entry.isTotalInvestmentsManual) {
                runningTotalInvestments += entry.depositInvestments;
            } else {
                runningTotalInvestments = entry.totalInvestments;
            }

            if (runningTotalSavings < 0) {
                runningTotalInvestments += runningTotalSavings;
                runningTotalSavings = 0;
            }

            runningTotalInvestments = Math.max(0, runningTotalInvestments);

            const interestReturn =
                runningTotalSavings * (interestRate / 12 / 100);
            const investmentReturn =
                runningTotalInvestments * (investmentReturnRate / 12 / 100);

            data[i] = {
                ...entry,
                totalSavings: runningTotalSavings,
                totalInvestments: runningTotalInvestments,
                interestReturn,
                investmentReturn,
                totalSaved: runningTotalSavings + runningTotalInvestments,
                grandTotal:
                    runningTotalSavings +
                    runningTotalInvestments +
                    interestReturn +
                    investmentReturn,
                commentary: entry.commentary,
            };
        }

        return data;
    }

    const handleFieldChange = (index, field, value) => {
        setTableData((currentData) => {
            const newData = [...currentData];
            const newValue = parseFloat(value);

            if (field === 'totalSavings' || field === 'totalInvestments') {
                newData[index][field] = newValue;
                if (field === 'totalSavings') {
                    newData[index].isTotalSavingsManual = true;
                } else if (field === 'totalInvestments') {
                    newData[index].isTotalInvestmentsManual = true;
                }
            } else if (field === 'withdrawals') {
                newData[index][field] = newValue;
            } else {
                for (let i = index; i < newData.length; i++) {
                    if (
                        (field === 'depositSavings' &&
                            !newData[i].isTotalSavingsManual) ||
                        (field === 'depositInvestments' &&
                            !newData[i].isTotalInvestmentsManual)
                    ) {
                        newData[i][field] = newValue;
                    }
                }
            }

            const updatedData = recalculateFromIndex(
                newData,
                index,
                interestRate,
                investmentReturnRate
            );
            console.log('After recalculation:', updatedData);

            return updatedData;
        });

        setRecalcTrigger((prev) => prev + 1);
    };

    const formattedTableData = tableData.map((entry) => ({
        ...entry,
        interestReturnFormatted: formatNumber(entry.interestReturn),
        investmentReturnFormatted: formatNumber(entry.investmentReturn),
        totalDepositFormatted: formatNumber(
            entry.depositSavings + entry.depositInvestments
        ),
        totalSavingsFormatted: formatNumber(entry.totalSavings),
        totalInvestmentsFormatted: formatNumber(entry.totalInvestments),
        totalSavedFormatted: formatNumber(entry.totalSaved),
        grandTotalFormatted: formatNumber(entry.grandTotal),
    }));

    const lastEntry = tableData[tableData.length - 1];
    const achieveNestEggBy = lastEntry ? lastEntry.month : 'TBC';

    console.log('Achieve nest egg by: ', achieveNestEggBy);

    return (
        <div className="App">
            <InputFields
                interestRate={interestRate}
                investmentReturnRate={investmentReturnRate}
                targetNestEgg={targetNestEgg}
                age={age}
                handleInterestRateChange={handleInterestRateChange}
                handleInvestmentReturnRateChange={
                    handleInvestmentReturnRateChange
                }
                handleTargetNestEggChange={handleTargetNestEggChange}
                handleAgeChange={handleAgeChange}
                achieveNestEggBy={achieveNestEggBy}
            />
            <TableComponent
                data={formattedTableData}
                onFieldChange={handleFieldChange}
            />
        </div>
    );
};

function generateData() {
    const today = new Date();
    const currentMonth =
        today.toLocaleString('default', { month: 'long' }) +
        ' ' +
        today.getFullYear();

    return [
        {
            month: currentMonth,
            depositSavings: 100,
            depositInvestments: 100,
            withdrawals: 0,
            totalSavings: 0,
            totalInvestments: 0,
            isTotalSavingsManual: false,
            isTotalInvestmentsManual: false,
            totalSaved: 0,
            interestReturn: 0,
            investmentReturn: 0,
            grandTotal: 0,
            commentary: '',
        },
    ];
}

function getNextMonth(currentMonth) {
    const dateParts = currentMonth.split(' ');
    const month = dateParts[0];
    const year = parseInt(dateParts[1], 10);

    const date = new Date(`${month} 1, ${year}`);
    date.setMonth(date.getMonth() + 1);
    return (
        date.toLocaleString('default', { month: 'long' }) +
        ' ' +
        date.getFullYear()
    );
}

function ensureNestEgg(
    target,
    data,
    interestRate,
    investmentReturnRate,
    recalculate
) {
    let lastTotal = data.length ? data[data.length - 1].grandTotal : 0;

    console.log(
        `Starting ensureNestEgg with lastTotal: ${lastTotal} and target: ${target}`
    );

    if (lastTotal >= target) {
        while (data.length > 1 && data[data.length - 1].grandTotal >= target) {
            data.pop();
            lastTotal = data[data.length - 1].grandTotal;
            console.log(`Row removed, new lastTotal: ${lastTotal}`);
        }
    } else {
        let iterations = 0;
        while (lastTotal < target && iterations < 1000) {
            const newEntry = {
                month: getNextMonth(data[data.length - 1].month),
                depositSavings: data[data.length - 1].depositSavings,
                depositInvestments: data[data.length - 1].depositInvestments,
                withdrawals: data[data.length - 1].withdrawals,
                totalSavings: 0,
                totalInvestments: 0,
                totalSaved: 0,
                interestReturn: 0,
                investmentReturn: 0,
                grandTotal: 0,
                commentary: '',
            };
            data = [...data, newEntry];
            data = recalculate(
                data,
                data.length - 1,
                interestRate,
                investmentReturnRate
            );
            lastTotal = data[data.length - 1].grandTotal;
            console.log(
                `New entry added, recalculated lastTotal: ${lastTotal}`
            );
            iterations++;
        }
        console.log(
            `Iteration stopped at ${iterations} iterations. 
            Target was ${lastTotal >= target ? 'met' : 'not met'}.`
        );
    }

    if (data.length > 1 && data[data.length - 1].grandTotal < target) {
        const newEntry = {
            month: getNextMonth(data[data.length - 1].month),
            depositSavings: data[data.length - 1].depositSavings,
            depositInvestments: data[data.length - 1].depositInvestments,
            withdrawals: data[data.length - 1].withdrawals,
            totalSavings: 0,
            totalInvestments: 0,
            totalSaved: 0,
            interestReturn: 0,
            investmentReturn: 0,
            grandTotal: 0,
            commentary: '',
        };
        data.push(newEntry);
        data = recalculate(
            data,
            data.length - 1,
            interestRate,
            investmentReturnRate
        );
    }

    return data;
}

export default App;
