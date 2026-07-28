import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { cardsApi } from '../api'
import { CardView } from '../components/CardView'
import { useQuiz } from '../store/QuizContext'
import type { Card } from '../types/models'

function getField(card: Card, field: 'count' | 'practiceCount') {
  return field === 'count' ? card.count : card.practiceCount
}

function setField(card: Card, field: 'count' | 'practiceCount', value: number): Card {
  return field === 'count' ? { ...card, count: value } : { ...card, practiceCount: value }
}

function pickNext(cards: Card[], field: 'count' | 'practiceCount', until: number, previousId: number | null) {
  const unfinished = cards.filter((c) => getField(c, field) < until)
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
  const [finished, setFinished] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!session) return
    const clone = session.cards.map((c) => ({ ...c }))
    const orig: Record<number, number> = {}
    clone.forEach((c) => {
      orig[c.id] = getField(c, session.fieldToUpdate)
    })
    setCards(clone)
    setOriginal(orig)
    const first = pickNext(clone, session.fieldToUpdate, session.until, null)
    setCurrent(first)
    setFinished(!first)
  }, [session])

  const unfinishedCount = useMemo(() => {
    if (!session) return 0
    return cards.filter((c) => getField(c, session.fieldToUpdate) < session.until).length
  }, [cards, session])

  if (!session) {
    return <Navigate to="/" replace />
  }

  const advance = (nextCards: Card[], fromId: number) => {
    const next = pickNext(nextCards, session.fieldToUpdate, session.until, fromId)
    setShowAnswer(false)
    if (!next) {
      setFinished(true)
      setCurrent(null)
      return
    }
    setCurrent(next)
  }

  const markSuccess = () => {
    if (!current) return
    const nextCards = cards.map((c) =>
      c.id === current.id
        ? setField(c, session.fieldToUpdate, getField(c, session.fieldToUpdate) + 1)
        : c,
    )
    setCards(nextCards)
    advance(nextCards, current.id)
  }

  const markFail = () => {
    if (!current) return
    const value = getField(current, session.fieldToUpdate)
    const nextCards = cards.map((c) =>
      c.id === current.id ? setField(c, session.fieldToUpdate, Math.max(0, value - 1)) : c,
    )
    setCards(nextCards)
    advance(nextCards, current.id)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (finished || !current) return
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

  const finishAndSave = async () => {
    setSaving(true)
    setError('')
    try {
      await cardsApi.updateField(
        cards.map((c) => ({
          id: c.id,
          count: c.count,
          practiceCount: c.practiceCount,
        })),
        session.fieldToUpdate,
      )
      const nodeId = session.lastNodeId
      clearQuiz()
      navigate(nodeId ? `/memory-node/${nodeId}` : '/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save quiz results')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Stack spacing={2} sx={{ maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h4">Quiz</Typography>
      <Typography color="text.secondary">
        Tracking <strong>{session.fieldToUpdate}</strong> until {session.until} · remaining{' '}
        {unfinishedCount}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Keys: 1 reveal/success · 2 fail · 5 success
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      {finished || !current ? (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Session complete
          </Typography>
          <Button variant="contained" disabled={saving} onClick={() => void finishAndSave()}>
            Save & return
          </Button>
        </Paper>
      ) : (
        <>
          <Paper variant="outlined" sx={{ p: 1.5 }}>
            <Typography variant="body2">
              {getField(current, session.fieldToUpdate) === original[current.id]
                ? `Value ( ${getField(current, session.fieldToUpdate)} )`
                : `Start – current (${original[current.id]} – ${getField(current, session.fieldToUpdate)})`}
            </Typography>
          </Paper>

          <CardView card={current} showAnswer={showAnswer} />

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {!showAnswer ? (
              <Button variant="contained" onClick={() => setShowAnswer(true)}>
                Reveal answer (1)
              </Button>
            ) : (
              <>
                <Button variant="contained" color="success" onClick={markSuccess}>
                  Success (1 / 5)
                </Button>
                <Button variant="outlined" color="error" onClick={markFail}>
                  Fail (2)
                </Button>
              </>
            )}
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
