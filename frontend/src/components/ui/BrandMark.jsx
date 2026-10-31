const SIZES = {
  sm: { box: 'h-10 w-10 rounded-xl', icon: 'h-5 w-5' },
  lg: { box: 'h-14 w-14 rounded-2xl', icon: 'h-7 w-7' },
}

function BrandMark({ size = 'sm', className = '' }) {
  const styles = SIZES[size]

  return (
    <div
      className={`flex items-center justify-center bg-emerald-500/15 ring-1 ring-emerald-400/30 ${styles.box} ${className}`}
    >
      <svg
        className={`text-emerald-400 ${styles.icon}`}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.8"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.75 6.75h10.5M6.75 17.25h10.5M4.5 9v6M19.5 9v6M9 9v6M15 9v6"
        />
      </svg>
    </div>
  )
}

export default BrandMark
