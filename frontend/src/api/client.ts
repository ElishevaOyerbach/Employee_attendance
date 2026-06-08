import axios, { AxiosError } from 'axios'
import { clearSession, getToken } from '@/auth/token'

/** Event name the AuthProvider listens to in order to force a logout + redirect. */
export const AUTH_LOGOUT_EVENT = 'auth:logout'

/** Normalized error shape the UI can rely on regardless of failure mode. */
export interface ApiError {
  status: number // 0 == network/timeout (no HTTP response)
  message: string
  details?: unknown
}

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// ---- Request: attach the JWT bearer token, if present. --------------------
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ---- Response: normalize errors + handle auth expiry centrally. -----------
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // A 401 means the token is missing/expired/invalid — drop the session and
    // signal the app to redirect to login. Done via event so this module stays
    // free of React/router imports (no circular dependencies).
    if (error.response?.status === 401) {
      clearSession()
      window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT))
    }

    return Promise.reject(normalizeError(error))
  },
)

function normalizeError(error: AxiosError): ApiError {
  if (error.response) {
    const data = error.response.data as
      | { message?: string; title?: string }
      | undefined
    return {
      status: error.response.status,
      message:
        data?.message ??
        data?.title ??
        defaultMessageForStatus(error.response.status),
      details: error.response.data,
    }
  }

  // No response: network error, CORS, or timeout.
  return {
    status: 0,
    message:
      error.code === 'ECONNABORTED'
        ? 'תם הזמן הקצוב לבקשה. נסו שוב.'
        : 'לא ניתן להתחבר לשרת. בדקו את החיבור ונסו שוב.',
    details: error.message,
  }
}

function defaultMessageForStatus(status: number): string {
  switch (status) {
    case 400:
      return 'הבקשה אינה תקינה.'
    case 401:
      return 'נדרשת התחברות מחדש.'
    case 403:
      return 'אין לך הרשאה לבצע פעולה זו.'
    case 404:
      return 'המשאב המבוקש לא נמצא.'
    case 500:
      return 'אירעה שגיאה בשרת. נסו שוב מאוחר יותר.'
    default:
      return 'אירעה שגיאה לא צפויה.'
  }
}
