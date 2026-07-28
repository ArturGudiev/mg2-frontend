import { apiFetch } from './client'
import type {
  Card,
  CardItem,
  CardItemInput,
  LoginResponse,
  MemoryNode,
  MemoryNodePathItem,
  QuizField,
  User,
} from '../types/models'

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

export const memoryNodesApi = {
  list: () => apiFetch<MemoryNode[]>('/memory-nodes'),

  get: (id: number) => apiFetch<MemoryNode>(`/memory-node/${id}`),

  parentsPath: (id: number) =>
    apiFetch<MemoryNodePathItem[]>(`/memory-node/${id}/parents-path`),

  getByIds: (ids: number[]) =>
    apiFetch<MemoryNode[]>('/get-memory-nodes', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  getByAlias: (alias: string) =>
    apiFetch<MemoryNode>(`/node-by-alias/${encodeURIComponent(alias)}`),

  create: (memoryNode: {
    name: string
    parents?: number[]
    aliases?: string[]
    shared?: boolean
    children?: number[]
    cards?: number[]
  }) =>
    apiFetch<MemoryNode>('/new-memory-node', {
      method: 'POST',
      body: JSON.stringify({ memoryNode }),
    }),

  update: (partial: Partial<MemoryNode> & { id: number }) =>
    apiFetch<MemoryNode>('/update-memory-node', {
      method: 'PUT',
      body: JSON.stringify(partial),
    }),

  remove: (id: number) =>
    apiFetch<void>(`/memory-node/${id}`, { method: 'DELETE' }),
}

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
    cards: Array<{ id: number; count?: number; practiceCount?: number }>,
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

  increasePracticeCount: (id: number) =>
    apiFetch<Card>(`/increase-card-practice-count/${id}`, { method: 'PUT' }),

  decreasePracticeCount: (id: number) =>
    apiFetch<Card>(`/decrease-card-practice-count/${id}`, { method: 'PUT' }),
}

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
