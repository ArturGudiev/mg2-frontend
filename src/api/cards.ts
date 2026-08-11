import { apiFetch } from './client'
import type { Card, CardItemInput, QuizField } from '../types/models'

export const cardsApi = {
  list: () => apiFetch<Card[]>('/cards'),

  get: (id: number) => apiFetch<Card>(`/card/${id}`),

  getByIds: (ids: number[]) =>
    apiFetch<Card[]>('/get-cards', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  byQuery: (payload: {
    id: number
    query?: string
    priority?: { name: string; number: number; cards: number[] }
    group?: { name: string; cards: number[] }
  }) =>
    apiFetch<Card[]>('/cards-by-query', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  create: (payload: {
    _id: number
    question: CardItemInput[]
    answer: CardItemInput[]
  }) =>
    apiFetch<Card>('/new-card', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (partial: Record<string, unknown> & { id: number }) =>
    apiFetch<Card>('/update-card', {
      method: 'PUT',
      body: JSON.stringify(partial),
    }),

  updateField: (
    cards: Array<{ id: number; count?: number }>,
    field: QuizField,
  ) =>
    apiFetch<void>('/update-cards-field', {
      method: 'POST',
      body: JSON.stringify({ cards, field }),
    }),

  remove: (ids: number[]) =>
    apiFetch<void>('/delete-cards', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  increaseCount: (id: number) =>
    apiFetch<Card>(`/increase-card-count/${id}`, { method: 'PUT' }),

  decreaseCount: (id: number) =>
    apiFetch<Card>(`/decrease-card-count/${id}`, { method: 'PUT' }),
}
