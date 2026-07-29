import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { cardsApi } from '../api'
import { CardView } from '../components/CardView'
import { useQuiz } from '../store/QuizContext'
import type { Card } from '../types/models'

function pickNext(cards: Card[], until: number, previousId: number | null) {
  const unfinished = cards.filter((c) => c.count < until)
  if (unfinished.length === 0) return null
  const candidates = unfinished.filter((c) => c.id !== previousId)
  const pool = candidates.length > 0 ? candidates : unfinished
  return pool[Math.floor(Math.random() * pool.length)]
}

export function QuizPage() {
  const navigate = useNavigate()
  const { session, clearQuiz } = useQuiz()
  const [cards, setCards] = useState<Card[]>([])
  const [current, setCurrent] = useState<Card | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [original, setOriginal] = useState<Record<number, number>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [pendingSave, setPendingSave] = useState<Card[] | null>(null)
  const savingRef = useRef(false)

  useEffect(() => {
    if (!session) return
    const clone = session.cards.map((c) => ({ ...c }))
    const orig: Record<number, number> = {}
    clone.forEach((c) => {
      orig[c.id] = c.count
    })
    setCards(clone)
    setOriginal(orig)
    setError('')
    setPendingSave(null)
    savingRef.current = false
    const first = pickNext(clone, session.until, null)
    setCurrent(first)
    if (!first) {
      setPendingSave(clone)
    }
  }, [session])

  const unfinishedCount = useMemo(() => {
    if (!session) return 0
    return cards.filter((c) => c.count < session.until).length
  }, [cards, session])

  useEffect(() => {
    if (!session || !pendingSave || savingRef.current) return
    savingRef.current = true
    setSaving(true)
    setError('')
    void (async () => {
      try {
        await cardsApi.updateField(
          pendingSave.map((c) => ({ id: c.id, count: c.count })),
          'count',
        )
        const nodeId = session.lastNodeId
        clearQuiz()
        navigate(nodeId ? `/memory-node/${nodeId}` : '/', { replace: true })
      } catch (err) {
        savingRef.current = false
        setSaving(false)
        setError(err instanceof Error ? err.message : 'Failed to save quiz results')
      }
    })()
  }, [pendingSave, session, clearQuiz, navigate])

  if (!session) {
    return <Navigate to="/" replace />
  }

  const completeWith = (nextCards: Card[]) => {
    setCards(nextCards)
    setCurrent(null)
    setShowAnswer(false)
    setPendingSave(nextCards)
  }

  const advance = (nextCards: Card[], fromId: number) => {
    const next = pickNext(nextCards, session.until, fromId)
    if (!next) {
      completeWith(nextCards)
      return
    }
    setCards(nextCards)
    setShowAnswer(false)
    setCurrent(next)
  }

  const markSuccess = () => {
    if (!current || saving || pendingSave) return
    const nextCards = cards.map((c) =>
      c.id === current.id ? { ...c, count: c.count + 1 } : c,
    )
    advance(nextCards, current.id)
  }

  const markFail = () => {
    if (!current || saving || pendingSave) return
    const nextCards = cards.map((c) =>
      c.id === current.id ? { ...c, count: Math.max(0, c.count - 1) } : c,
    )
    advance(nextCards, current.id)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (saving || pendingSave || !current) return
      if (e.key === '1') {
        e.preventDefault()
        if (!showAnswer) setShowAnswer(true)
        else markSuccess()
      } else if (e.key === '2') {
        e.preventDefault()
        if (!showAnswer) setShowAnswer(true)
        else markFail()
      } else if (e.key === '5') {
        e.preventDefault()
        markSuccess()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (pendingSave || saving) {
    return (
      <Stack spacing={2} sx={{ maxWidth: 900, mx: 'auto' }}>
        <Typography variant="h4">Quiz</Typography>
        {error ? (
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  savingRef.current = false
                  setPendingSave([...(pendingSave ?? cards)])
                }}
              >
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        ) : (
          <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={24} />
            <Typography>Saving…</Typography>
          </Paper>
        )}
      </Stack>
    )
  }

  return (
    <Stack spacing={2} sx={{ maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h4">Quiz</Typography>
      <Typography color="text.secondary">
        Tracking <strong>count</strong> until {session.until} · remaining {unfinishedCount}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Keys: 1 reveal/success · 2 fail · 5 success
      </Typography>

      {current && (
        <>
          <Paper variant="outlined" sx={{ p: 1.5 }}>
            <Typography variant="body2">
              {current.count === original[current.id]
                ? `Value ( ${current.count} )`
                : `Start – current (${original[current.id]} – ${current.count})`}
            </Typography>
          </Paper>

          <CardView card={current} showAnswer={showAnswer} />

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {!showAnswer && (
              <Button variant="contained" onClick={() => setShowAnswer(true)}>
                Reveal answer (1)
              </Button>
            )}
            <Button variant="contained" color="success" onClick={markSuccess}>
              Success {showAnswer ? '(1 / 5)' : '(5)'}
            </Button>
            <Button variant="outlined" color="error" onClick={markFail}>
              Fail (2)
            </Button>
            <Button
              onClick={() => {
                clearQuiz()
                navigate(session.lastNodeId ? `/memory-node/${session.lastNodeId}` : '/')
              }}
            >
              Abort
            </Button>
          </Box>
        </>
      )}
    </Stack>
  )
}
