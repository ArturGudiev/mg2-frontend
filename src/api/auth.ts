import { apiFetch } from './client'
import type { LoginResponse, User } from '../types/models'

export const authApi = {
  login: (login: string, password: string) =>
    apiFetch<LoginResponse>('/users/login', {
      method: 'POST',
      body: JSON.stringify({ login, password }),
    }),

  register: (name: string, email: string, password: string, addSampleCards = false) =>
    apiFetch<User>('/users', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, addSampleCards }),
    }),

  verify: (email: string, code: string) =>
    apiFetch<LoginResponse>('/users/verify', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    }),

  resendCode: (email: string) =>
    apiFetch<{ ok: boolean }>('/users/resend-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  me: () => apiFetch<User>('/users/me'),

  logout: () =>
    apiFetch<void>('/users/logout', {
      method: 'POST',
      body: JSON.stringify({}),
    }),
}
