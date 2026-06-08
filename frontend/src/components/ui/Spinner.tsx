interface SpinnerProps {
  label?: string
}

/** Minimal indeterminate loading indicator. */
export function Spinner({ label = 'טוען…' }: SpinnerProps) {
  return <span className="spinner" role="status" aria-label={label} />
}
