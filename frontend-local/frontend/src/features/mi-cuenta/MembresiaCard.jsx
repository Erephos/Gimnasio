import Badge from '../../components/ui/Badge.jsx'
import Card from '../../components/ui/Card.jsx'
import DataState from '../../components/ui/DataState.jsx'
import InfoBox from '../../components/ui/InfoBox.jsx'
import SectionHeader from '../../components/ui/SectionHeader.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { listMyMembresias } from '../../services/membresias.js'
import { addDays, formatDate, isMembershipCurrent, pickCurrentMembership, todayLima } from '../../utils/dates.js'
import { formatCurrency } from '../../utils/format.js'

function MembresiaCard() {
  const { data, error, loading, reload } = useAsync(listMyMembresias, [])
  const today = todayLima()
  const history = data ?? []
  const current = pickCurrentMembership(history, today)

  return (
    <Card as="section" padding="none">
      <SectionHeader divided title="Mi membresía" />
      <DataState loading={loading} error={error} hasData={Boolean(data)} onRetry={reload}>
        <div className="space-y-4 p-4 sm:p-6">
          {current ? (
            <InfoBox tone="success" label="Vigente">
              Plan {current.planNombre}. Puedes ingresar hasta el {formatDate(addDays(current.fechaFin.slice(0, 10), -1))}.
            </InfoBox>
          ) : (
            <InfoBox tone="warning" label="Sin membresía vigente">
              {history.length === 0
                ? 'Aún no tienes una membresía. Acércate a recepción para adquirir un plan.'
                : 'Tu última membresía venció. Acércate a recepción para renovarla.'}
            </InfoBox>
          )}

          {history.length > 0 && (
            <ul className="divide-y divide-white/5 rounded-lg border border-white/10">
              {history.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs">
                  <span className="font-medium text-slate-200">{item.planNombre}</span>
                  <span className="text-slate-400">
                    {formatDate(item.fechaInicio)} → {formatDate(item.fechaFin)}
                  </span>
                  <span className="text-slate-400">{formatCurrency(item.precioPagado)}</span>
                  <Badge tone={isMembershipCurrent(item, today) ? 'emerald' : 'muted'}>
                    {isMembershipCurrent(item, today) ? 'Vigente' : 'No vigente'}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DataState>
    </Card>
  )
}

export default MembresiaCard
