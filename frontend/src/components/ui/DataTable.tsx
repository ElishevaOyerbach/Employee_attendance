import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from './Button'
import { Spinner } from './Spinner'
import { EmptyState } from '@/components/feedback/EmptyState'
import './data-table.css'

export interface Column<T> {
  /** Stable identity for the column (used as React key). */
  key: string
  header: ReactNode
  /** Cell renderer. */
  render: (row: T) => ReactNode
  align?: 'start' | 'center' | 'end'
  /** Optional fixed/min width, e.g. "160px" or "20%". */
  width?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string | number
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  /** Empty-state copy shown when there are no rows (and no error). */
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: ReactNode
  /** Optional custom empty state, overrides the title/description trio. */
  emptyState?: ReactNode
}

/**
 * Generic, RTL-aware data table with built-in loading, error, and empty
 * states. Columns declare their own renderers, so callers stay declarative
 * and the same component backs attendance history, pending reviews, etc.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  error = null,
  onRetry,
  emptyTitle = 'אין נתונים להצגה',
  emptyDescription,
  emptyIcon,
  emptyState,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="data-table__status">
        <Spinner />
        <p>טוען נתונים…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="data-table__status data-table__status--error">
        <AlertCircle size={28} aria-hidden="true" />
        <p>{error}</p>
        {onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            נסו שוב
          </Button>
        )}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="data-table__status">
        {emptyState ?? (
          <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
        )}
      </div>
    )
  }

  return (
    <div className="data-table__scroll">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ textAlign: col.align ?? 'start', width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((col) => (
                <td key={col.key} style={{ textAlign: col.align ?? 'start' }}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
