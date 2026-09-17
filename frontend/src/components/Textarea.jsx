import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

const Textarea = React.forwardRef(({
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
  textareaClassName = '',
  id,
  name,
  rows = 4,
  autoComplete = 'off',
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

  // Combiner les refs
  useEffect(() => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(textareaRef.current);
      } else {
        ref.current = textareaRef.current;
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
    resize-vertical
    transition
    ${getBorderColor()}
    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
    ${readonly ? 'bg-gray-50 cursor-default' : ''}
    ${error ? 'focus:border-accent focus:ring-1 focus:ring-accent' : 'focus:border-primary focus:ring-1 focus:ring-primary'}
    ${textareaClassName}
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
      
      <textarea
        ref={textareaRef}
        id={id || name}
        name={name}
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
        rows={rows}
        className={baseClasses.trim()}
        {...props}
      />
      
      {error && (
        <span className="text-sm text-accent font-medium">{error}</span>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

Textarea.propTypes = {
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
  textareaClassName: PropTypes.string,
  id: PropTypes.string,
  name: PropTypes.string,
  rows: PropTypes.number,
  autoComplete: PropTypes.string,
};

export default Textarea;
