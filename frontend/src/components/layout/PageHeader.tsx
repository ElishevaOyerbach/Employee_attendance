import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

/** Consistent page title block used at the top of every feature screen. */
export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-5)',
      }}
    >
      <div>
        <h1>{title}</h1>
        {subtitle && (
          <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}
