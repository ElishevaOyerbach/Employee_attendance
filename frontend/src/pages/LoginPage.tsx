import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { CalendarClock, AlertCircle } from 'lucide-react'
import { Button, Card, Input } from '@/components/ui'
import { useAuth } from '@/auth/useAuth'
import { paths } from '@/routes/paths'
import type { ApiError } from '@/api/client'
import './login.css'

export function LoginPage() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Already signed in (e.g. navigated to /login manually) → go home.
  if (isAuthenticated) {
    return <Navigate to={paths.myDay} replace />
  }

  // Where to land after login: the originally requested page, or home.
  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ??
    paths.myDay

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      setError((err as ApiError).message ?? 'ההתחברות נכשלה. נסו שוב.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login">
      <div className="login__card">
        <div className="login__brand">
          <span className="login__brand-mark">
            <CalendarClock size={20} aria-hidden="true" />
          </span>
          <span>מערכת נוכחות</span>
        </div>

        <Card padded>
          <h1 className="login__title">ברוכים הבאים</h1>
          <p className="login__subtitle">התחברו כדי לנהל את הנוכחות שלכם</p>

          <form className="login__form" onSubmit={onSubmit} noValidate>
            {error && (
              <div className="login__error" role="alert">
                <AlertCircle size={16} aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <Input
              label="דוא״ל"
              type="email"
              autoComplete="username"
              dir="ltr"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="סיסמה"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" size="lg" block loading={submitting}>
              התחברות
            </Button>
          </form>
        </Card>

        <p className="login__footer">מערכת ניהול נוכחות עובדים · גרסת הדגמה</p>
      </div>
    </div>
  )
}
