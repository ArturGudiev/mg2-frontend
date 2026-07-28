import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { cardsApi } from '../api'
import { useQuiz } from '../store/QuizContext'
import type { Card, CardsGroup, CardsPriority, QuizField } from '../types/models'

interface CardsSelectorProps {
  memoryNodeId: number
  cards: Card[]
  selectedPriority: CardsPriority | null
  selectedGroup: CardsGroup | null
}

function cardPreview(card: Card): string {
  const first = card.question[0]
  if (!first) return '—'
  return first.text || first.code || first.formula || first.imagePath || first.type
}

export function CardsSelector({
  memoryNodeId,
  cards,
  selectedPriority,
  selectedGroup,
}: CardsSelectorProps) {
  const navigate = useNavigate()
  const { startQuiz } = useQuiz()
  const [field, setField] = useState<QuizField>('count')
  const [untilText, setUntilText] = useState('1')
  const [countText, setCountText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const stats = useMemo(() => {
    const buckets = new Map<number, number>()
    for (const card of cards) {
      const value = field === 'count' ? card.count : card.practiceCount
      buckets.set(value, (buckets.get(value) ?? 0) + 1)
    }
    return [...buckets.entries()].sort((a, b) => a[0] - b[0])
  }, [cards, field])

  const untilTrimmed = untilText.trim()
  const untilNum = Number(untilTrimmed)
  const untilError =
    untilTrimmed === ''
      ? 'Required'
      : !Number.isInteger(untilNum) || untilNum < 0
        ? 'Whole number ≥ 0'
        : ''

  const countTrimmed = countText.trim()
  const countNum = Number(countTrimmed)
  const countError =
    countTrimmed !== '' && (!Number.isInteger(countNum) || countNum < 0)
      ? 'Whole number ≥ 0'
      : ''

  const hasErrors = Boolean(untilError || countError)

  const query = useMemo(() => {
    if (hasErrors) return ''
    const base = `${field === 'practiceCount' ? 'pquiz' : 'quiz'} -until ${untilNum}`
    return countTrimmed === '' ? base : `${base} ${field} = ${countNum}`
  }, [field, untilNum, countTrimmed, countNum, hasErrors])

  const selectedCards = useMemo(() => {
    if (hasErrors) return []
    if (countTrimmed === '') return cards
    return cards.filter((c) => (field === 'count' ? c.count : c.practiceCount) === countNum)
  }, [cards, field, countTrimmed, countNum, hasErrors])

  const start = async () => {
    if (hasErrors || !query) return
    setLoading(true)
    setError('')
    try {
      const result = await cardsApi.byQuery({
        id: memoryNodeId,
        query,
        priority: selectedPriority ?? undefined,
        group: selectedGroup ?? undefined,
      })
      if (result.length === 0) {
        setError('No cards matched the query')
        return
      }
      startQuiz({
        cards: result,
        fieldToUpdate: field,
        until: untilNum,
        lastNodeId: memoryNodeId,
        query,
      })
      navigate('/quiz')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start quiz')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Quiz
      </Typography>
      <Stack spacing={1.5}>
        <FormControl size="small">
          <InputLabel>Track field</InputLabel>
          <Select
            label="Track field"
            value={field}
            onChange={(e) => setField(e.target.value as QuizField)}
          >
            <MenuItem value="count">count</MenuItem>
            <MenuItem value="practiceCount">practiceCount</MenuItem>
          </Select>
        </FormControl>

        <Box>
          <Typography variant="caption" color="text.secondary">
            Distribution
          </Typography>
          <Stack direction="row" sx={{ mt: 0.5, flexWrap: 'wrap', gap: 1 }}>
            {stats.map(([value, count]) => (
              <Typography key={value} variant="body2">
                {value}: {count}
              </Typography>
            ))}
            {stats.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                —
              </Typography>
            )}
          </Stack>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <TextField
            label="Until"
            size="small"
            type="number"
            value={untilText}
            onChange={(e) => setUntilText(e.target.value)}
            error={Boolean(untilError)}
            helperText={untilError || 'Repeat threshold'}
            sx={{ flex: 1 }}
          />
          <TextField
            label="Count"
            size="small"
            type="number"
            value={countText}
            onChange={(e) => setCountText(e.target.value)}
            error={Boolean(countError)}
            helperText={countError || 'Optional filter'}
            sx={{ flex: 1 }}
          />
        </Stack>

        <Box>
          <Typography variant="body2" color="text.secondary">
            Selected: {selectedCards.length}
          </Typography>
          <Stack direction="row" sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
            {selectedCards.slice(0, 12).map((card) => (
              <Chip key={card.id} size="small" label={cardPreview(card)} />
            ))}
            {selectedCards.length > 12 && (
              <Chip size="small" variant="outlined" label={`+${selectedCards.length - 12} more`} />
            )}
          </Stack>
        </Box>

        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}

        <Button
          variant="contained"
          startIcon={<PlayArrowIcon />}
          disabled={loading || hasErrors || selectedCards.length === 0}
          onClick={start}
        >
          Start quiz
        </Button>
      </Stack>
    </Paper>
  )
}
