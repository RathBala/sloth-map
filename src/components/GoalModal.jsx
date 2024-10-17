import { useState } from 'react';

const GoalModal = ({ isOpen, onClose, onSave, goal }) => {
    const [name, setName] = useState(goal?.name || '');
    const [amount, setAmount] = useState(goal?.amount || '');

    const handleSave = () => {
        onSave({
            ...goal,
            name,
            amount: parseFloat(amount),
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
                <button onClick={handleSave}>Save</button>
                <button onClick={onClose}>Cancel</button>
            </div>
        </div>
    );
};

export default GoalModal;
