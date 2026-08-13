import { apiFetch } from './client'
import type { LoginResponse, User } from '../types/models'

export const authApi = {
  login: (login: string, password: string) =>
    apiFetch<LoginResponse>('/users/login', {
      method: 'POST',
      body: JSON.stringify({ login, password }),
    }),

  register: (name: string, login: string, email: string, password: string) =>
    apiFetch<User>('/users', {
      method: 'POST',
      body: JSON.stringify({ name, login, email, password }),
    }),

  me: () => apiFetch<User>('/users/me'),

  logout: () =>
    apiFetch<void>('/users/logout', {
      method: 'POST',
      body: JSON.stringify({}),
    }),
}
