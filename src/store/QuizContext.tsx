import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Card, QuizField, QuizSession } from '../types/models'

interface QuizContextValue {
  session: QuizSession | null
  startQuiz: (payload: {
    cards: Card[]
    fieldToUpdate: QuizField
    until: number
    lastNodeId: number
    query: string
  }) => void
  clearQuiz: () => void
}

const QuizContext = createContext<QuizContextValue | null>(null)

export function QuizProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<QuizSession | null>(null)

  const value = useMemo<QuizContextValue>(
    () => ({
      session,
      startQuiz: (payload) => setSession(payload),
      clearQuiz: () => setSession(null),
    }),
    [session],
  )

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>
}

export function useQuiz() {
  const ctx = useContext(QuizContext)
  if (!ctx) throw new Error('useQuiz must be used within QuizProvider')
  return ctx
}
