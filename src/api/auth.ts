import { apiFetch } from './client'
import type { LoginResponse, User } from '../types/models'

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<LoginResponse>('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string) =>
    apiFetch<User>('/users', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  me: () => apiFetch<User>('/users/me'),

  logout: () =>
    apiFetch<void>('/users/logout', {
      method: 'POST',
      body: JSON.stringify({}),
    }),
}
