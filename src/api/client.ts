import { API_BASE } from './config'

export class ApiError extends Error {
  status: number
  email?: string

  constructor(status: number, message: string, email?: string) {
    super(message)
    this.status = status
    this.email = email
  }
}

async function parseError(res: Response): Promise<{ message: string; email?: string }> {
  try {
    const data = (await res.json()) as { error?: string; email?: string }
    return { message: data.error ?? res.statusText, email: data.email }
  } catch {
    return { message: res.statusText || 'Ошибка запроса' }
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
    const parsed = await parseError(res)
    throw new ApiError(res.status, parsed.message, parsed.email)
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
