import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

const Input = React.forwardRef(({
  type = 'text',
  label,
  labelClassName = '',
  placeholder = '',
  value,
  defaultValue,
  onChange,
  onFocus,
  onBlur,
  error,
  disabled = false,
  readonly = false,
  required = false,
  className = '',
  inputClassName = '',
  id,
  name,
  autoComplete = 'off',
  icon,
  iconPosition = 'right',
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  // Combiner les refs
  useEffect(() => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(inputRef.current);
      } else {
        ref.current = inputRef.current;
      }
    }
  }, [ref]);

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

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
    ${getBorderColor()}
    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
    ${readonly ? 'bg-gray-50 cursor-default' : ''}
    ${error ? 'focus:border-accent focus:ring-1 focus:ring-accent' : 'focus:border-primary focus:ring-1 focus:ring-primary'}
    ${inputClassName}
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
        {icon && iconPosition === 'left' && (
          <div className="position-absolute left-3 top-50 translate-y-50 text-gray-400">
            {icon}
          </div>
        )}
        
        <input
          ref={inputRef}
          id={id || name}
          name={name}
          type={type}
          value={value}
          defaultValue={defaultValue}
          placeholder={placeholder}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          readOnly={readonly}
          required={required}
          autoComplete={autoComplete}
          className={baseClasses.trim()}
          {...props}
        />
        
        {icon && iconPosition === 'right' && (
          <div className="position-absolute right-3 top-50 translate-y-50 text-gray-400">
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

Input.displayName = 'Input';

Input.propTypes = {
  type: PropTypes.string,
  label: PropTypes.string,
  labelClassName: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.any,
  defaultValue: PropTypes.any,
  onChange: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  readonly: PropTypes.bool,
  required: PropTypes.bool,
  className: PropTypes.string,
  inputClassName: PropTypes.string,
  id: PropTypes.string,
  name: PropTypes.string,
  autoComplete: PropTypes.string,
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(['left', 'right']),
};

export default Input;
