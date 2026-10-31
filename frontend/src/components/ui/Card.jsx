const RADIUS = {
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
}

const PADDING = {
  none: '',
  tight: 'px-4 py-3',
  sm: 'p-4',
  normal: 'p-4 sm:p-6',
}

function Card({
  as: Tag = 'div',
  radius = '2xl',
  padding = 'normal',
  className = '',
  children,
  ...props
}) {
  return (
    <Tag
      {...props}
      className={`${RADIUS[radius]} border border-white/10 bg-slate-900/60 ${PADDING[padding]} ${className}`}
    >
      {children}
    </Tag>
  )
}

export default Card
