import { api } from './client'
import type { LoginResponse } from '@/auth/types'

export interface LoginCredentials {
  email: string
  password: string
}

/** POST /api/auth/login — returns the JWT plus identity + role. */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', credentials)
  return data
}
