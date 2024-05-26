import ReactFlow from 'react-flow-renderer';

const SlothMap = ({ data }) => {
    const savingGoals = [
        { amount: 20000, label: 'Goal 1' },
        { amount: 25000, label: 'Goal 2' },
        // Add more goals as needed
    ];

    const goalsWithDates = savingGoals.map((goal) => {
        const matchedDate = data.find(
            (entry) =>
                parseFloat(entry.grandTotalFormatted.replace(/,/g, '')) >=
                goal.amount
        );
        return {
            ...goal,
            date: matchedDate ? matchedDate.month : 'Not Achieved',
        };
    });

    const elements = goalsWithDates.map((goal, index) => ({
        id: `goal-${index}`,
        data: { label: `${goal.label} (${goal.date})` },
        position: { x: index * 200, y: 50 },
    }));

    return (
        <div className="slothmap-container">
            <ReactFlow elements={elements} />
        </div>
    );
};

export default SlothMap;
