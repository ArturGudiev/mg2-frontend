import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { cardItemsApi, cardsApi } from '../api'
import { useAuth } from '../auth/AuthContext'
import { CardView } from '../components/CardView'
import { buildItemDrafts, type CardItemDraft } from '../components/CardItemView'
import { SimpleTextCardFields } from '../components/SimpleTextCardDialog'
import type { Card, CardItem } from '../types/models'

function itemContentChanged(item: CardItem, draft: CardItemDraft): boolean {
  const norm = (v: string | null | undefined) => v ?? ''
  switch (item.type) {
    case 'TEXT':
    case 'MARKDOWN':
      return norm(item.text) !== norm(draft.text)
    case 'TEXT_WITH_HIGHLIGHTED_SYMBOL':
    case 'WORD_WITH_STRESS':
      return norm(item.text) !== norm(draft.text) || (item.index ?? null) !== (draft.index ?? null)
    case 'CODE':
      return norm(item.code) !== norm(draft.code) || norm(item.extension) !== norm(draft.extension)
    case 'FORMULA':
      return norm(item.formula) !== norm(draft.formula)
    case 'IMAGE':
      return norm(item.imagePath) !== norm(draft.imagePath) || norm(item.width) !== norm(draft.width)
    default:
      return false
  }
}

function draftToUpdatePayload(item: CardItem, draft: CardItemDraft): Partial<CardItem> & { id: number } {
  switch (item.type) {
    case 'TEXT':
    case 'MARKDOWN':
      return { id: item.id, text: draft.text ?? '' }
    case 'TEXT_WITH_HIGHLIGHTED_SYMBOL':
    case 'WORD_WITH_STRESS':
      return { id: item.id, text: draft.text ?? '', index: draft.index ?? null }
    case 'CODE':
      return { id: item.id, code: draft.code ?? '', extension: draft.extension ?? '' }
    case 'FORMULA':
      return { id: item.id, formula: draft.formula ?? '' }
    case 'IMAGE':
      return { id: item.id, imagePath: draft.imagePath ?? '', width: draft.width ?? '' }
    default:
      return { id: item.id }
  }
}

export function CardInspectorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const cardId = Number(id)
  const [card, setCard] = useState<Card | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [drafts, setDrafts] = useState<Record<number, CardItemDraft>>({})
  const [saving, setSaving] = useState(false)
  const [questionText, setQuestionText] = useState('')
  const [answerText, setAnswerText] = useState('')

  const returnTo =
    typeof (location.state as { returnTo?: unknown } | null)?.returnTo === 'string'
      ? (location.state as { returnTo: string }).returnTo
      : null

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setCard(await cardsApi.get(cardId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить карточку')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    setEditing(false)
    setDrafts({})
  }, [cardId])

  const isAdmin = user?.role === 'admin'
  const canEdit = Boolean(card && user && user.id === card.userId && (isAdmin || !card.shared))
  const isSimpleTextCard = Boolean(
    card &&
      card.question.length === 1 &&
      card.answer.length === 1 &&
      card.question[0].type === 'TEXT' &&
      card.answer[0].type === 'TEXT',
  )
  const useSimpleEditor = Boolean(canEdit && isSimpleTextCard && !isAdmin)

  const allItems = useMemo(
    () => (card ? [...card.question, ...card.answer] : []),
    [card],
  )

  const startEdit = () => {
    if (!card) return
    if (useSimpleEditor) {
      setQuestionText(card.question[0]?.text ?? '')
      setAnswerText(card.answer[0]?.text ?? '')
    } else {
      setDrafts(buildItemDrafts(allItems))
    }
    setEditing(true)
    setError('')
  }

  const cancelEdit = () => {
    setEditing(false)
    setDrafts({})
    setQuestionText('')
    setAnswerText('')
    setError('')
  }

  const save = async () => {
    if (!card) return
    setSaving(true)
    setError('')
    try {
      if (useSimpleEditor) {
        const q = questionText.trim()
        const a = answerText.trim()
        if (!q || !a) {
          setError('Вопрос и ответ не должны быть пустыми')
          setSaving(false)
          return
        }
        const updates = []
        if ((card.question[0].text ?? '') !== q) {
          updates.push(cardItemsApi.update({ id: card.question[0].id, text: q }))
        }
        if ((card.answer[0].text ?? '') !== a) {
          updates.push(cardItemsApi.update({ id: card.answer[0].id, text: a }))
        }
        if (updates.length > 0) {
          await Promise.all(updates)
        }
      } else {
        const updates = allItems
          .filter((item) => drafts[item.id] && itemContentChanged(item, drafts[item.id]))
          .map((item) => draftToUpdatePayload(item, drafts[item.id]))

        if (updates.length > 0) {
          await Promise.all(updates.map((partial) => cardItemsApi.update(partial)))
        }
      }

      const updated = await cardsApi.get(cardId)
      setCard(updated)
      setEditing(false)
      setDrafts({})
      setQuestionText('')
      setAnswerText('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить карточку')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!card) {
    return <Alert severity="error">{error || 'Карточка не найдена'}</Alert>
  }

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Карточка{isAdmin ? ` #${card.id}` : ''}
        </Typography>
        {card.parentNodes[0] != null && (
          <Button
            disabled={saving}
            onClick={() =>
              navigate(returnTo ?? `/memory-node/${card.parentNodes[0]}`)
            }
          >
            Назад к разделу
          </Button>
        )}
        {canEdit && !editing && (
          <Button variant="contained" onClick={startEdit}>
            Редактировать
          </Button>
        )}
        {canEdit && editing && (
          <>
            <Button disabled={saving} onClick={cancelEdit}>
              Отмена
            </Button>
            <Button
              variant="contained"
              disabled={saving || (useSimpleEditor && (!questionText.trim() || !answerText.trim()))}
              onClick={() => void save()}
            >
              {saving ? 'Сохранение…' : 'Сохранить'}
            </Button>
          </>
        )}
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {editing && useSimpleEditor ? (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <SimpleTextCardFields
            autoFocus
            question={questionText}
            answer={answerText}
            onQuestionChange={setQuestionText}
            onAnswerChange={setAnswerText}
          />
        </Paper>
      ) : (
        <CardView
          card={card}
          showAnswer
          editing={editing}
          drafts={drafts}
          onDraftChange={(itemId, patch) => {
            setDrafts((prev) => ({
              ...prev,
              [itemId]: { ...prev[itemId], ...patch },
            }))
          }}
        />
      )}
    </Stack>
  )
}
