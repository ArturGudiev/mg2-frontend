import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { authApi } from '../api'
import { ApiError } from '../api/client'
import type { User } from '../types/models'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (loginOrEmail: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, addSampleCards?: boolean) => Promise<void>
  verifyEmail: (email: string, code: string) => Promise<void>
  resendCode: (email: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const me = await authApi.me()
        if (!cancelled) setUser(me)
      } catch (err) {
        if (!cancelled && !(err instanceof ApiError && err.status === 403)) {
          console.error(err)
        }
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (loginOrEmail: string, password: string) => {
    const res = await authApi.login(loginOrEmail, password)
    setUser(res.user)
  }, [])

  const register = useCallback(
    async (name: string, email: string, password: string, addSampleCards = false) => {
      await authApi.register(name, email, password, addSampleCards)
    },
    [],
  )

  const verifyEmail = useCallback(async (email: string, code: string) => {
    const res = await authApi.verify(email, code)
    setUser(res.user)
  }, [])

  const resendCode = useCallback(async (email: string) => {
    await authApi.resendCode(email)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, verifyEmail, resendCode, logout }),
    [user, loading, login, register, verifyEmail, resendCode, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
