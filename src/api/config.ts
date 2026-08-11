function resolveApiBase(): string {
  const runtime = window.__env
  const base = runtime?.API_BASE_URL?.trim()
  if (base) {
    return base.replace(/\/$/, '')
  }

  const host = runtime?.API_HOST?.trim()
  const port = runtime?.API_PORT?.trim()
  if (host && port) {
    return `${host.replace(/\/$/, '')}:${port}`
  }

  return import.meta.env.VITE_API_URL ?? 'http://localhost:3033'
}

export const API_BASE = resolveApiBase()
