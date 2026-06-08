import { api } from './client'

/** A user account (mirrors UserResponse). Manager-only data. */
export interface UserSummary {
  id: number
  fullName: string
  email: string
  role: string // "Employee" | "Manager"
  expectedDailyHours: number
  isActive: boolean
  createdAt: string
}

export interface CreateUserRequest {
  fullName: string
  email: string
  password: string
  role: 'Employee' | 'Manager'
  expectedDailyHours: number
}

export interface UpdateUserRequest {
  fullName: string
  expectedDailyHours: number
}

/** All users (manager only). GET /api/users */
export async function getUsers(): Promise<UserSummary[]> {
  const { data } = await api.get<UserSummary[]>('/users')
  return Array.isArray(data) ? data : []
}

/** Single user by id (manager only). GET /api/users/:id */
export async function getUserById(id: number): Promise<UserSummary> {
  const { data } = await api.get<UserSummary>(`/users/${id}`)
  return data
}

/** Create a new user (manager only). POST /api/users */
export async function createUser(payload: CreateUserRequest): Promise<UserSummary> {
  const { data } = await api.post<UserSummary>('/users', payload)
  return data
}

/** Update name / daily hours (manager only). PUT /api/users/:id */
export async function updateUser(id: number, payload: UpdateUserRequest): Promise<UserSummary> {
  const { data } = await api.put<UserSummary>(`/users/${id}`, payload)
  return data
}

/** Soft-deactivate a user (manager only). POST /api/users/:id/deactivate */
export async function deactivateUser(id: number): Promise<void> {
  await api.post(`/users/${id}/deactivate`)
}
