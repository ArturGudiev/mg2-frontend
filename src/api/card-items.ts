import { apiFetch } from './client'
import type { CardItem, CardItemInput } from '../types/models'

export const cardItemsApi = {
  get: (id: number) => apiFetch<CardItem>(`/card-item/${id}`),

  list: () => apiFetch<CardItem[]>('/card-items'),

  getByIds: (ids: number[]) =>
    apiFetch<CardItem[]>('/get-card-items', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  create: (item: CardItemInput) =>
    apiFetch<CardItem>('/new-card-item', {
      method: 'POST',
      body: JSON.stringify(item),
    }),

  update: (partial: Partial<CardItem> & { id: number }) =>
    apiFetch<CardItem>('/update-card-item', {
      method: 'PUT',
      body: JSON.stringify(partial),
    }),

  remove: (id: number) =>
    apiFetch<void>(`/card-item/${id}`, { method: 'DELETE' }),
}
