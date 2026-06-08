import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

/** Reusable placeholder for empty lists, "all caught up", and stub screens. */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'grid',
        justifyItems: 'center',
        textAlign: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-8) var(--space-5)',
        color: 'var(--text-secondary)',
      }}
    >
      {icon && <div style={{ color: 'var(--slate-400)' }}>{icon}</div>}
      <h3 style={{ color: 'var(--text-primary)' }}>{title}</h3>
      {description && (
        <p style={{ maxWidth: 420, lineHeight: 'var(--lh-normal)' }}>{description}</p>
      )}
      {action}
    </div>
  )
}
