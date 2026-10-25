import { INPUT_BASE, INPUT_SIZES, INPUT_TONES } from './uiStyles.js'

function Input({ size = 'sm', invalid = false, className = '', ...props }) {
  return (
    <input
      {...props}
      aria-invalid={invalid || undefined}
      className={`${INPUT_BASE} ${INPUT_SIZES[size]} ${
        invalid ? INPUT_TONES.invalid : INPUT_TONES.default
      } ${className}`}
    />
  )
}

export default Input
