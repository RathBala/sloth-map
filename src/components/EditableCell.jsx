import { memo, useState } from 'react';

function EditableCell({ rowId, value, onBlur, onClick }) {
    // note to self: this keeps state local so typing isn't interrupted by parent re-renders
    const [inputValue, setInputValue] = useState(value);

    const handleChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleBlur = (e) => {
        onBlur(rowId, e.target.value);
    };

    return (
        <input
            type="text"
            value={inputValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onClick={onClick}
        />
    );
}

export default memo(
    EditableCell,
    (oldProps, newProps) => oldProps.value === newProps.value
);
