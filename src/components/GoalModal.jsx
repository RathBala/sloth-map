// GoalModal.jsx
import { useState, useEffect } from 'react';

const GoalModal = ({ isOpen, onClose, onSave, goal, goals }) => {
    const [name, setName] = useState(goal?.name || '');
    const [amount, setAmount] = useState(goal?.amount || '');
    const [priority, setPriority] = useState(goal?.priority || 1);

    useEffect(() => {
        // Initialize priority to the next available number if creating a new goal
        if (!goal) {
            const maxPriority = Math.max(
                0,
                ...Object.values(goals).map((g) => g.priority || 0)
            );
            setPriority(maxPriority + 1);
        }
    }, [goal, goals]);

    const handleSave = () => {
        onSave({
            ...goal,
            name,
            amount: parseFloat(amount),
            priority: parseInt(priority, 10),
            createdAt: goal?.createdAt || new Date(),
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>{goal ? 'Edit Goal' : 'New Goal'}</h2>
                <label>
                    Goal Name:
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </label>
                <label>
                    Goal Amount:
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                </label>
                <label>
                    Priority:
                    <input
                        type="number"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                    />
                </label>
                <button onClick={handleSave}>Save</button>
                <button onClick={onClose}>Cancel</button>
                <h3>Existing Goals</h3>
                <ul>
                    {Object.values(goals)
                        .sort((a, b) => a.priority - b.priority)
                        .map((g) => (
                            <li key={g.id}>
                                Priority {g.priority}: {g.name} (£{g.amount})
                            </li>
                        ))}
                </ul>
            </div>
        </div>
    );
};

export default GoalModal;
