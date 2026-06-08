import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button, Input, Modal, Select } from '@/components/ui'
import type { SelectOption } from '@/components/ui'
import { createUser } from '@/api/users.api'
import { useToast } from '@/components/feedback/useToast'
import type { ApiError } from '@/api/client'

interface CreateEmployeeModalProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

const ROLE_OPTIONS: SelectOption[] = [
  { value: 'Employee', label: 'עובד/ת' },
  { value: 'Manager', label: 'מנהל/ת' },
]

const FORM_ID = 'create-employee-form'

export function CreateEmployeeModal({ open, onClose, onCreated }: CreateEmployeeModalProps) {
  const toast = useToast()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'Employee' | 'Manager'>('Employee')
  const [expectedDailyHours, setExpectedDailyHours] = useState('8')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setFullName('')
    setEmail('')
    setPassword('')
    setRole('Employee')
    setExpectedDailyHours('8')
    setError(null)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const hours = parseFloat(expectedDailyHours)
    if (isNaN(hours) || hours <= 0) {
      setError('שעות עבודה יומיות חייבות להיות מספר חיובי.')
      return
    }
    if (password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await createUser({ fullName, email, password, role, expectedDailyHours: hours })
      toast.success(`${fullName} נוסף/ה למערכת בהצלחה.`)
      reset()
      onCreated()
      onClose()
    } catch (err) {
      setError((err as ApiError).message ?? 'יצירת המשתמש נכשלה. נסו שוב.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="הוספת עובד/ת חדש/ה">
      <form id={FORM_ID} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <Input
          label="שם מלא"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          placeholder="ישראל ישראלי"
        />
        <Input
          type="email"
          label="כתובת מייל"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="user@example.com"
        />
        <Input
          type="password"
          label="סיסמה (לפחות 6 תווים)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••••"
        />
        <Select
          label="תפקיד"
          options={ROLE_OPTIONS}
          value={role}
          onChange={(e) => setRole(e.target.value as 'Employee' | 'Manager')}
        />
        <Input
          type="number"
          label="שעות עבודה יומיות"
          value={expectedDailyHours}
          onChange={(e) => setExpectedDailyHours(e.target.value)}
          required
          min="0.5"
          max="24"
          step="0.5"
        />
        {error && (
          <p style={{ color: 'var(--danger-600)', fontSize: 'var(--fs-caption)' }}>{error}</p>
        )}
      </form>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-5)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border)' }}>
        <Button variant="ghost" type="button" onClick={handleClose} disabled={submitting}>
          ביטול
        </Button>
        <Button type="submit" form={FORM_ID} loading={submitting} disabled={submitting}>
          יצירה
        </Button>
      </div>
    </Modal>
  )
}
