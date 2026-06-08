import type { TextareaHTMLAttributes } from 'react'
import { useId } from 'react'

const cx = (...parts: Array<string | false | undefined>) =>
  parts.filter(Boolean).join(' ')

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
}

export function Textarea({ label, hint, error, id, className, rows = 3, ...rest }: TextareaProps) {
  const autoId = useId()
  const fieldId = id ?? autoId

  return (
    <div className="field">
      {label && (
        <label className="field__label" htmlFor={fieldId}>
          {label}
        </label>
      )}
      <textarea
        id={fieldId}
        rows={rows}
        className={cx('input', 'textarea', error && 'input--error', className)}
        aria-invalid={error ? true : undefined}
        {...rest}
      />
      {error ? (
        <span className="field__error">{error}</span>
      ) : hint ? (
        <span className="field__hint">{hint}</span>
      ) : null}
    </div>
  )
}
