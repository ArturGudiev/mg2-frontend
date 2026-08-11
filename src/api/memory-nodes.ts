import { apiFetch } from './client'
import type { MemoryNode, MemoryNodePathItem } from '../types/models'

export const memoryNodesApi = {
  list: () => apiFetch<MemoryNode[]>('/memory-nodes'),

  listRoots: () => apiFetch<MemoryNode[]>('/memory-nodes/roots'),

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
    description?: string
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
