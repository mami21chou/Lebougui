import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

const Select = React.forwardRef(({
  label,
  labelClassName = '',
  placeholder = 'Sélectionner...',
  value,
  defaultValue,
  onChange,
  options = [],
  error,
  disabled = false,
  required = false,
  className = '',
  selectClassName = '',
  id,
  name,
  icon,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const selectRef = useRef(null);

  // Combiner les refs
  useEffect(() => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(selectRef.current);
      } else {
        ref.current = selectRef.current;
      }
    }
  }, [ref]);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const getBorderColor = () => {
    if (error) return 'border-accent';
    if (isFocused) return 'border-primary';
    return 'border';
  };

  const baseClasses = `
    w-full
    px-3
    py-2
    border
    border-radius
    font-normal
    transition
    bg-white
    ${getBorderColor()}
    ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
    ${error ? 'focus:border-accent focus:ring-1 focus:ring-accent' : 'focus:border-primary focus:ring-1 focus:ring-primary'}
    ${selectClassName}
  `;

  return (
    <div className={`d-flex flex-column gap-1 ${className}`}>
      {label && (
        <label
          htmlFor={id || name}
          className={`font-medium text-gray-700 ${labelClassName}`}
        >
          {label}
          {required && <span className="text-accent ml-1">*</span>}
        </label>
      )}
      
      <div className="position-relative">
        <select
          ref={selectRef}
          id={id || name}
          name={name}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
          className={baseClasses.trim()}
          {...props}
        >
          {placeholder && !value && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        
        {icon && (
          <div className="position-absolute right-3 top-50 translate-y-50 text-gray-400 pointer-events-none">
            {icon}
          </div>
        )}
      </div>
      
      {error && (
        <span className="text-sm text-accent font-medium">{error}</span>
      )}
    </div>
  );
});

Select.displayName = 'Select';

Select.propTypes = {
  label: PropTypes.string,
  labelClassName: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.any,
  defaultValue: PropTypes.any,
  onChange: PropTypes.func,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.any.isRequired,
      label: PropTypes.string.isRequired,
      disabled: PropTypes.bool,
    })
  ),
  error: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  className: PropTypes.string,
  selectClassName: PropTypes.string,
  id: PropTypes.string,
  name: PropTypes.string,
  icon: PropTypes.node,
};

export default Select;
