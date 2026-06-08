import { Spinner } from '@/components/ui'

/** Centered loader for route-level loading (e.g. session rehydration). */
export function FullScreenLoader({ label = 'טוען…' }: { label?: string }) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        gap: 'var(--space-3)',
        color: 'var(--text-secondary)',
      }}
    >
      <div style={{ display: 'grid', justifyItems: 'center', gap: 'var(--space-3)' }}>
        <Spinner label={label} />
        <span style={{ fontSize: 'var(--fs-caption)' }}>{label}</span>
      </div>
    </div>
  )
}
