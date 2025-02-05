import { memo, useEffect, useState } from 'react';

function EditableCell({ rowId, value, onBlur, onClick }) {
    // note to self: this keeps state local so typing isn't interrupted by parent re-renders
    const [inputValue, setInputValue] = useState(value);

    // useEffect synchronises the child's state with the prop when that prop changes.
    // onBlur in TableComponent triggers the callback which updates the parent's state.
    // That state change flows down as new props to the child, triggering this useeffect,
    // keeping everything in sync.
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
