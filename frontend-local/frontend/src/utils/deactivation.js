export async function requestDeactivate(id, { confirm, deactivate }) {
  if (!confirm(`¿Deseas desactivar al socio ${id}?`)) return false
  await deactivate(id)
  return true
}
