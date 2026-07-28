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

const API_BASE = resolveApiBase()

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string }
    return data.error ?? res.statusText
  } catch {
    return res.statusText || 'Request failed'
  }
}

let refreshPromise: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/users/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
      .then((res) => res.ok)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers,
  })

  if (res.status === 403 && retry) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      return apiFetch<T>(path, options, false)
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, await parseError(res))
  }

  if (res.status === 204) {
    return undefined as T
  }

  const text = await res.text()
  if (!text) {
    return undefined as T
  }
  return JSON.parse(text) as T
}

export { API_BASE }
