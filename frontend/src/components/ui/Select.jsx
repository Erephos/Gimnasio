import { INPUT_BASE, INPUT_SIZES, INPUT_TONES } from './uiStyles.js'

function Select({ size = 'sm', invalid = false, className = '', children, ...props }) {
  return (
    <select
      {...props}
      aria-invalid={invalid || undefined}
      className={`${INPUT_BASE} ${INPUT_SIZES[size]} ${
        invalid ? INPUT_TONES.invalid : INPUT_TONES.default
      } ${className}`}
    >
      {children}
    </select>
  )
}

export default Select
