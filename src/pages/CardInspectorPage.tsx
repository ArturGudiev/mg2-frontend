import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { cardsApi } from '../api'
import { CardDialog } from '../components/CardDialog'
import { CardView } from '../components/CardView'
import type { Card, CardItemInput } from '../types/models'

export function CardInspectorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const cardId = Number(id)
  const [card, setCard] = useState<Card | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)

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
  }, [cardId])

  const save = async (question: CardItemInput[], answer: CardItemInput[]) => {
    setSaving(true)
    try {
      const updated = await cardsApi.update({ id: cardId, question, answer })
      setCard(updated)
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
          Карточка #{card.id}
        </Typography>
        {card.parentNodes[0] != null && (
          <Button onClick={() => navigate(`/memory-node/${card.parentNodes[0]}`)}>
            Назад к разделу
          </Button>
        )}
        <Button variant="contained" onClick={() => setEditOpen(true)}>
          Редактировать
        </Button>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}
      <CardView card={card} showAnswer />

      <CardDialog
        open={editOpen}
        title={`Редактировать карточку #${card.id}`}
        submitting={saving}
        initialQuestion={card.question.map(({ type, text, index, code, extension, formula, imagePath, width }) => ({
          type,
          text,
          index,
          code,
          extension,
          formula,
          imagePath,
          width,
        }))}
        initialAnswer={card.answer.map(({ type, text, index, code, extension, formula, imagePath, width }) => ({
          type,
          text,
          index,
          code,
          extension,
          formula,
          imagePath,
          width,
        }))}
        onClose={() => setEditOpen(false)}
        onSubmit={save}
      />
    </Stack>
  )
}
