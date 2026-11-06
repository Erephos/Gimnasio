export function formatCurrency(amount) {
  return `S/ ${Number(amount ?? 0).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
