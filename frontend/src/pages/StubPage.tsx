import type { ReactNode } from 'react'
import { Card } from '@/components/ui'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/feedback/EmptyState'

interface StubPageProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  /** Short note describing what this screen will contain in a later phase. */
  note: string
}

/**
 * Placeholder for feature screens not yet built (Phase 1+). Keeps the shell,
 * routing, and navigation fully demoable today without committing to UI that
 * belongs to a later phase.
 */
export function StubPage({ title, subtitle, icon, note }: StubPageProps) {
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      <Card>
        <EmptyState icon={icon} title="בקרוב" description={note} />
      </Card>
    </>
  )
}
