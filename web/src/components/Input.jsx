import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  { label, error, type = 'text', className = '', ...props },
  ref
) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-300">{label}</label>
      )}
      <input
        ref={ref}
        type={type}
        className={`
          w-full px-3 py-2.5 rounded-lg
          bg-dark-700 border border-dark-500
          text-gray-100 placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500
          transition-colors duration-150
          min-h-[44px]
          ${error ? 'border-red-400 focus:ring-red-400/50' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
});

export default Input;
