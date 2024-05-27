// import ReactFlow from 'react-flow-renderer';

// const SlothMap = ({ data }) => {
//     const savingGoals = [
//         { amount: 20000, label: 'Goal 1' },
//         { amount: 25000, label: 'Goal 2' },
//         // Add more goals as needed
//     ];

//     const goalsWithDates = savingGoals.map((goal) => {
//         const matchedDate = data.find(
//             (entry) =>
//                 parseFloat(entry.grandTotalFormatted.replace(/,/g, '')) >=
//                 goal.amount
//         );
//         return {
//             ...goal,
//             date: matchedDate ? matchedDate.month : 'Not Achieved',
//         };
//     });

//     const elements = goalsWithDates.map((goal, index) => ({
//         id: `goal-${index}`,
//         data: { label: `${goal.label} (${goal.date})` },
//         position: { x: index * 200, y: 50 },
//     }));

//     return (
//         <div className="slothmap-container">
//             <ReactFlow elements={elements} />
//         </div>
//     );
// };

// export default SlothMap;

import ReactFlow from 'reactflow';
import 'reactflow/dist/style.css';

const SlothMap = () => {
    const elements = [
        {
            id: '1',
            type: 'input',
            position: { x: 100, y: 50 },
            data: { label: 'Input Node' },
        },
        {
            id: '2',
            position: { x: 100, y: 150 },
            data: { label: 'Another Node' },
        },
        {
            id: 'e1-2',
            source: '1',
            target: '2',
            animated: true,
            label: 'A Connection',
        },
    ];

    return (
        <div style={{ height: '90vh', width: '100%' }}>
            <ReactFlow elements={elements} fitView />
        </div>
    );
};

export default SlothMap;
