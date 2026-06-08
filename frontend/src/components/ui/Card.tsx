import type { HTMLAttributes, ReactNode } from 'react'

const cx = (...parts: Array<string | false | undefined>) =>
  parts.filter(Boolean).join(' ')

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Apply default padding directly on the card (no header/body split). */
  padded?: boolean
}

export function Card({ padded = false, className, children, ...rest }: CardProps) {
  return (
    <div className={cx('card', padded && 'card--pad', className)} {...rest}>
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title?: ReactNode
  action?: ReactNode
  children?: ReactNode
}

export function CardHeader({ title, action, children }: CardHeaderProps) {
  return (
    <div
      className="card__header"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
    >
      {children ?? <h3 className="card__title">{title}</h3>}
      {action}
    </div>
  )
}

export function CardBody({ children }: { children: ReactNode }) {
  return <div className="card__body">{children}</div>
}
