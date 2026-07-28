import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
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

function parseUntil(query: string): number {
  const match = query.match(/-until\s+(\d+)/i)
  return match ? Number(match[1]) : 1
}

function parseField(query: string): QuizField {
  return /\bpquiz\b/i.test(query) ? 'practiceCount' : 'count'
}

export function CardsSelector({
  memoryNodeId,
  cards,
  selectedPriority,
  selectedGroup,
}: CardsSelectorProps) {
  const navigate = useNavigate()
  const { startQuiz } = useQuiz()
  const [query, setQuery] = useState('quiz -until 1')
  const [field, setField] = useState<QuizField>('count')
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

  const start = async () => {
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
      const until = parseUntil(query)
      const fieldToUpdate = parseField(query)
      startQuiz({
        cards: result,
        fieldToUpdate,
        until,
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

        <TextField
          label="Query"
          size="small"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          helperText="Examples: quiz -until 1 · pquiz -until 3"
        />

        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}

        <Button
          variant="contained"
          startIcon={<PlayArrowIcon />}
          disabled={loading || cards.length === 0}
          onClick={start}
        >
          Start quiz
        </Button>
      </Stack>
    </Paper>
  )
}
