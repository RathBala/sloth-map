import { memo, useEffect, useState } from 'react';

function EditableCell({ rowId, value, onBlur, onClick }) {
    const [inputValue, setInputValue] = useState(value);

    useEffect(() => {
        setInputValue(value);
    }, [value]);

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
