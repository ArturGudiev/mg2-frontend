import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ClearIcon from '@mui/icons-material/Clear'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { cardsApi } from '../api'
import { useQuiz } from '../store/QuizContext'
import type { Card, CardsGroup, CardsPriority } from '../types/models'

const CHIP_LABEL_MAX = 30
const MAX_VISIBLE_CHIPS = 30
const LIMIT_OPTIONS = [25, 13, 12, 8, 6, 5, 3]

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

function upsertCountFilter(query: string, value: number): string {
  const clause = `count = ${value}`
  const replaced = query.replace(/\bcount\s*(?:===|==|=|<=|>=|<|>)\s*-?\d+/i, clause)
  if (replaced !== query) return replaced.trim()
  const trimmed = query.trim()
  return trimmed ? `${trimmed} ${clause}` : clause
}

function upsertLimit(query: string, limit: number): string {
  const clause = `--limit ${limit}`
  const replaced = query.replace(/--?limit\s+\d+/i, clause)
  if (replaced !== query) return replaced.trim()
  const trimmed = query.trim()
  return trimmed ? `${trimmed} ${clause}` : clause
}

function cardChipLabel(card: Card): string {
  const first = card.question[0]
  const raw =
    first?.text || first?.code || first?.formula || first?.imagePath || `#${card.id}`
  return raw.length > CHIP_LABEL_MAX ? `${raw.slice(0, CHIP_LABEL_MAX)}...` : raw
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
  const [selectedCards, setSelectedCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const stats = useMemo(() => {
    const buckets = new Map<number, number>()
    for (const card of cards) {
      buckets.set(card.count, (buckets.get(card.count) ?? 0) + 1)
    }
    return [...buckets.entries()].sort((a, b) => a[0] - b[0])
  }, [cards])

  const visibleChips = selectedCards.slice(0, MAX_VISIBLE_CHIPS)
  const hasMoreChips = selectedCards.length > MAX_VISIBLE_CHIPS

  useEffect(() => {
    setSelectedCards([])
    setError('')
  }, [selectedPriority, selectedGroup, memoryNodeId])

  const selectByQuery = useCallback(
    async (nextQuery: string) => {
      setLoading(true)
      setError('')
      try {
        const result = await cardsApi.byQuery({
          id: memoryNodeId,
          query: nextQuery,
          priority: selectedPriority ?? undefined,
          group: selectedGroup ?? undefined,
        })
        setSelectedCards(result)
        if (result.length === 0) {
          setError('No cards matched the query')
        }
      } catch (err) {
        setSelectedCards([])
        setError(err instanceof Error ? err.message : 'Failed to select cards')
      } finally {
        setLoading(false)
      }
    },
    [memoryNodeId, selectedGroup, selectedPriority],
  )

  const onCountRowClick = async (value: number) => {
    const nextQuery = upsertCountFilter(query, value)
    setQuery(nextQuery)
    await selectByQuery(nextQuery)
  }

  const onAddLimit = async (limit: number) => {
    const nextQuery = upsertLimit(query, limit)
    setQuery(nextQuery)
    await selectByQuery(nextQuery)
  }

  const clearSelection = () => {
    setSelectedCards([])
    setError('')
    setQuery((q) =>
      q
        .replace(/\bcount\s*(?:===|==|=|<=|>=|<|>)\s*-?\d+/gi, '')
        .replace(/--?limit\s+\d+/gi, '')
        .replace(/\s+/g, ' ')
        .trim() || 'quiz -until 1',
    )
  }

  const start = async () => {
    setLoading(true)
    setError('')
    try {
      const result =
        selectedCards.length > 0
          ? selectedCards
          : await cardsApi.byQuery({
              id: memoryNodeId,
              query,
              priority: selectedPriority ?? undefined,
              group: selectedGroup ?? undefined,
            })
      if (result.length === 0) {
        setError('No cards matched the query')
        return
      }
      setSelectedCards(result)
      const until = parseUntil(query)
      startQuiz({
        cards: result,
        fieldToUpdate: 'count',
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
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            count ({cards.length})
          </Typography>
          {stats.length > 0 ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>count</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.map(([value, quantity]) => (
                  <TableRow
                    key={value}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => void onCountRowClick(value)}
                  >
                    <TableCell>
                      <Typography color="primary" variant="body2">
                        {value}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography color="primary" variant="body2">
                        {quantity}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography variant="body2" color="text.secondary">
              —
            </Typography>
          )}
        </Box>

        <Stack direction="row" spacing={1} alignItems="flex-start">
          <TextField
            label="Query"
            size="small"
            fullWidth
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void selectByQuery(query)
              }
            }}
            helperText="Enter to select · count = 0 · --limit 25"
          />
          {selectedCards.length > 0 && (
            <IconButton aria-label="clear selection" onClick={clearSelection} sx={{ mt: 0.5 }}>
              <ClearIcon />
            </IconButton>
          )}
        </Stack>

        {selectedCards.length >= 3 && (
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="caption" color="text.secondary">
              Limit:
            </Typography>
            {LIMIT_OPTIONS.map((n) => (
              <Chip
                key={n}
                size="small"
                label={n}
                clickable
                onClick={() => void onAddLimit(n)}
              />
            ))}
          </Stack>
        )}

        {selectedCards.length > 0 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Selected: {selectedCards.length}
            </Typography>
            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
              {visibleChips.map((card) => (
                <Chip
                  key={card.id}
                  size="small"
                  variant="outlined"
                  label={cardChipLabel(card)}
                  title={`#${card.id} · count ${card.count}`}
                />
              ))}
              {hasMoreChips && <Chip size="small" label="..." />}
            </Stack>
          </Box>
        )}

        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}

        <Button
          variant="contained"
          startIcon={<PlayArrowIcon />}
          disabled={loading || cards.length === 0}
          onClick={() => void start()}
        >
          Start quiz
        </Button>
      </Stack>
    </Paper>
  )
}
