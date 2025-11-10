/**
 * NumberInput Component
 *
 * Eliminates ~180 lines of duplicate number input validation logic
 * across 6 files (EventForm, SchoolForm, MarketShareForm, BudgetForm, PublicForm, AccidentForm)
 *
 * Features:
 * - Auto-select on focus
 * - Prevents negative numbers
 * - Prevents invalid characters (-, +, e, E)
 * - Bootstrap styling
 *
 * Usage:
 * <NumberInput
 *   label="Student Count"
 *   name="student_count"
 *   value={formData.student_count}
 *   onChange={handleChange}
 *   required
 * />
 */

import React from 'react';
import PropTypes from 'prop-types';

const NumberInput = ({
  label,
  name,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  placeholder = '',
  required = false,
  disabled = false,
  className = '',
  helpText = ''
}) => {
  // Auto-select all text on focus
  const handleFocus = (e) => {
    e.target.select();
  };

  // Prevent negative numbers and invalid keys
  const handleKeyDown = (e) => {
    // Prevent minus, plus, e, E
    if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
      e.preventDefault();
    }
  };

  // Handle change with validation
  const handleChange = (e) => {
    const newValue = e.target.value;

    // Allow empty string
    if (newValue === '') {
      onChange(e);
      return;
    }

    // Validate number is not negative (if min is 0 or above)
    const numValue = parseFloat(newValue);
    if (min >= 0 && (numValue < 0 || newValue.includes('-'))) {
      return; // Don't update if negative
    }

    // Call parent onChange
    onChange(e);
  };

  return (
    <div className={`mb-3 ${className}`}>
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span className="text-danger">*</span>}
        </label>
      )}
      <input
        type="number"
        id={name}
        name={name}
        className="form-control"
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
      />
      {helpText && (
        <div className="form-text">{helpText}</div>
      )}
    </div>
  );
};

NumberInput.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  helpText: PropTypes.string
};

export default NumberInput;
