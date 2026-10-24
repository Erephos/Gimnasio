const CELL_PADDING = {
  normal: 'px-4 py-3',
  compact: 'px-2 py-3',
}

export function DataTable({ className = '', children }) {
  return (
    <table className={`min-w-full text-left text-sm ${className}`}>
      {children}
    </table>
  )
}

export function DataTableHeaderRow({ children }) {
  return (
    <tr className="border-b border-white/10 text-xs tracking-wide text-slate-500 uppercase">
      {children}
    </tr>
  )
}

export function DataTableBody({ children }) {
  return <tbody className="divide-y divide-white/5">{children}</tbody>
}

export function DataTableRow({ selected = false, className = '', children }) {
  return (
    <tr
      className={`${
        selected ? 'bg-white/5' : 'transition hover:bg-white/5'
      } ${className}`}
    >
      {children}
    </tr>
  )
}

export function DataTableHeaderCell({
  padding = 'normal',
  className = '',
  children,
}) {
  return (
    <th className={`${CELL_PADDING[padding]} font-medium ${className}`}>
      {children}
    </th>
  )
}

export function DataTableCell({ padding = 'normal', className = '', children }) {
  return (
    <td className={`${CELL_PADDING[padding]} ${className}`}>{children}</td>
  )
}
