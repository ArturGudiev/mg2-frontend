import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ClearIcon from '@mui/icons-material/Clear'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
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
import { CardHoverPreview } from './CardHoverPreview'

const CHIP_LABEL_MAX = 30
const MAX_VISIBLE_CHIPS = 30
const UNTIL_OFFSETS = [2, 3, 5]
const LIMIT_OPTIONS = [3, 5, 12, 13, 25]
const DEBOUNCE_MS = 300
const THROTTLE_MS = 500

interface CardsSelectorProps {
  memoryNodeId: number
  cards: Card[]
  selectedPriority: CardsPriority | null
  selectedGroup: CardsGroup | null
}

interface SelectionInput {
  countText: string
  limitText: string
  cards: Card[]
}

function cardChipLabel(card: Card): string {
  const first = card.question[0]
  const raw =
    first?.text || first?.code || first?.formula || first?.imagePath || `#${card.id}`
  return raw.length > CHIP_LABEL_MAX ? `${raw.slice(0, CHIP_LABEL_MAX)}...` : raw
}

function parseNonNegInt(text: string): number | null {
  const trimmed = text.trim()
  if (trimmed === '') return null
  const n = Number(trimmed)
  if (!Number.isInteger(n) || n < 0) return null
  return n
}

/** Debounce quiet updates; also throttle so rapid changes still refresh at least every `throttleMs`. */
function useDebouncedThrottledValue<T>(value: T, debounceMs: number, throttleMs: number): T {
  const [output, setOutput] = useState(value)
  const lastEmitRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const valueRef = useRef(value)
  valueRef.current = value

  useEffect(() => {
    const emit = () => {
      lastEmitRef.current = Date.now()
      setOutput(valueRef.current)
      timerRef.current = null
    }

    const elapsed = Date.now() - lastEmitRef.current
    if (elapsed >= throttleMs) {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      emit()
      return
    }

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(emit, debounceMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [value, debounceMs, throttleMs])

  return output
}

function selectCards({ countText, limitText, cards }: SelectionInput): Card[] {
  const countFilter = parseNonNegInt(countText)
  if (countText.trim() !== '' && countFilter == null) return []
  const limitFilter = parseNonNegInt(limitText)
  if (limitText.trim() !== '' && (limitFilter == null || limitFilter === 0)) return []
  let list = countFilter == null ? cards : cards.filter((c) => c.count === countFilter)
  if (limitFilter != null && limitFilter < list.length) {
    list = list.slice(0, limitFilter)
  }
  return list
}

export function CardsSelector({
  memoryNodeId,
  cards,
  selectedPriority,
  selectedGroup,
}: CardsSelectorProps) {
  const navigate = useNavigate()
  const { startQuiz } = useQuiz()
  const [untilText, setUntilText] = useState('1')
  const [countText, setCountText] = useState('')
  const [limitText, setLimitText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [chipsExpanded, setChipsExpanded] = useState(false)

  const selectionInput = useMemo<SelectionInput>(
    () => ({ countText, limitText, cards }),
    [countText, limitText, cards],
  )
  const debouncedSelection = useDebouncedThrottledValue(
    selectionInput,
    DEBOUNCE_MS,
    THROTTLE_MS,
  )

  const untilTrimmed = untilText.trim()
  const untilNum = Number(untilTrimmed)
  const untilError =
    untilTrimmed === ''
      ? 'Обязательно'
      : !Number.isInteger(untilNum) || untilNum < 0
        ? 'Целое число ≥ 0'
        : ''

  const countTrimmed = countText.trim()
  const countNum = Number(countTrimmed)
  const countError =
    countTrimmed !== '' && (!Number.isInteger(countNum) || countNum < 0)
      ? 'Целое число ≥ 0'
      : ''

  const limitTrimmed = limitText.trim()
  const limitNum = Number(limitTrimmed)
  const limitError =
    limitTrimmed !== '' && (!Number.isInteger(limitNum) || limitNum <= 0)
      ? 'Целое число ≥ 1'
      : ''

  const hasErrors = Boolean(untilError || countError || limitError)

  const stats = useMemo(() => {
    const buckets = new Map<number, number>()
    for (const card of cards) {
      buckets.set(card.count, (buckets.get(card.count) ?? 0) + 1)
    }
    return [...buckets.entries()].sort((a, b) => a[0] - b[0])
  }, [cards])

  const selectedCards = useMemo(
    () => selectCards(debouncedSelection),
    [debouncedSelection],
  )

  const visibleChips = selectedCards.slice(0, MAX_VISIBLE_CHIPS)
  const hasMoreChips = selectedCards.length > MAX_VISIBLE_CHIPS

  useEffect(() => {
    setCountText('')
    setLimitText('')
    setError('')
    setChipsExpanded(false)
  }, [selectedPriority, selectedGroup, memoryNodeId])

  const query = useMemo(() => {
    if (hasErrors) return ''
    const parts = [`quiz -until ${untilNum}`]
    if (countTrimmed !== '') parts.push(`count = ${countNum}`)
    if (limitTrimmed !== '') parts.push(`--limit ${limitNum}`)
    return parts.join(' ')
  }, [hasErrors, untilNum, countTrimmed, countNum, limitTrimmed, limitNum])

  const onCountRowClick = (value: number, quantity: number) => {
    setCountText(String(value))
    setUntilText(String(value + 2))
    setLimitText(String(quantity))
    setError('')
  }

  const onUntilOffsetClick = (offset: number) => {
    const base = parseNonNegInt(countText) ?? 0
    setUntilText(String(base + offset))
    setError('')
  }

  const clearSelection = () => {
    setCountText('')
    setLimitText('')
    setUntilText('1')
    setError('')
    setChipsExpanded(false)
  }

  const hasSelection =
    countText !== '' || limitText !== '' || untilText !== '1'

  const start = async () => {
    if (hasErrors || !query) return
    setLoading(true)
    setError('')
    try {
      // Use the latest input values for start (not debounced), so Enter/click feels immediate.
      const latest = selectCards({ countText, limitText, cards })
      const result =
        latest.length > 0
          ? latest
          : await cardsApi.byQuery({
              id: memoryNodeId,
              query,
              priority: selectedPriority ?? undefined,
              group: selectedGroup ?? undefined,
            })
      if (result.length === 0) {
        setError('Нет карточек по запросу')
        return
      }
      startQuiz({
        cards: result,
        fieldToUpdate: 'count',
        until: untilNum,
        lastNodeId: memoryNodeId,
        query,
      })
      navigate('/quiz')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось начать практику')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Практика
      </Typography>
      <Stack spacing={1.5}>
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Уровни ({cards.length})
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Выберите уровень, с которого учить
          </Typography>
          {stats.length > 0 ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Уровень</TableCell>
                  <TableCell align="right">Карточек</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.map(([value, quantity]) => (
                  <TableRow
                    key={value}
                    hover
                    selected={countTrimmed !== '' && countNum === value}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => onCountRowClick(value, quantity)}
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

        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
          <TextField
            label="Уровень"
            size="small"
            type="number"
            value={countText}
            onChange={(e) => setCountText(e.target.value)}
            error={Boolean(countError)}
            helperText={countError || 'Фильтр по уровню'}
            sx={{ width: 180 }}
            slotProps={{ htmlInput: { min: 0, step: 1 } }}
          />
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', flexWrap: 'wrap' }} useFlexGap>
          <TextField
            label="Кол-во карточек"
            size="small"
            type="number"
            value={limitText}
            onChange={(e) => setLimitText(e.target.value)}
            error={Boolean(limitError)}
            helperText={limitError || 'Ограничение сессии'}
            sx={{ width: 180 }}
            slotProps={{ htmlInput: { min: 1, step: 1 } }}
          />
          {LIMIT_OPTIONS.map((n) => (
            <Chip
              key={n}
              size="small"
              label={n}
              clickable
              color={limitTrimmed !== '' && limitNum === n ? 'primary' : 'default'}
              onClick={() =>
                setLimitText((prev) => (prev.trim() === String(n) ? '' : String(n)))
              }
              sx={{ mt: 0.75 }}
            />
          ))}
        </Stack>

        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', flexWrap: 'wrap' }} useFlexGap>
          <TextField
            label="Учить до"
            size="small"
            type="number"
            value={untilText}
            onChange={(e) => setUntilText(e.target.value)}
            error={Boolean(untilError)}
            helperText={untilError || 'Целевой уровень'}
            sx={{ width: 180 }}
            slotProps={{ htmlInput: { min: 0, step: 1 } }}
          />
          {UNTIL_OFFSETS.map((offset) => {
            const base = parseNonNegInt(countText) ?? 0
            const nextUntil = base + offset
            return (
              <Chip
                key={offset}
                size="small"
                label={`+${offset}`}
                clickable
                color={untilTrimmed !== '' && untilNum === nextUntil ? 'primary' : 'default'}
                onClick={() => onUntilOffsetClick(offset)}
                sx={{ mt: 0.75 }}
              />
            )
          })}
        </Stack>

        <Box>
          <Typography
            variant="body2"
            color={selectedCards.length > 0 ? 'primary' : 'text.secondary'}
            sx={{
              mb: chipsExpanded && selectedCards.length > 0 ? 1 : 0,
              cursor: selectedCards.length > 0 ? 'pointer' : 'default',
              userSelect: 'none',
              '&:hover': selectedCards.length > 0 ? { textDecoration: 'underline' } : undefined,
            }}
            onClick={() => {
              if (selectedCards.length > 0) setChipsExpanded((v) => !v)
            }}
            title={selectedCards.length > 0 ? 'Показать или скрыть список' : undefined}
          >
            Выбрано: {selectedCards.length}
            {selectedCards.length > 0 && (chipsExpanded ? ' ▴' : ' ▾')}
          </Typography>
          {chipsExpanded && selectedCards.length > 0 && (
            <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap' }}>
              {visibleChips.map((card) => (
                <CardHoverPreview key={card.id} card={card}>
                  <Chip
                    size="small"
                    variant="outlined"
                    label={cardChipLabel(card)}
                  />
                </CardHoverPreview>
              ))}
              {hasMoreChips && <Chip size="small" label="..." />}
            </Stack>
          )}
        </Box>

        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<ClearIcon />}
            disabled={!hasSelection}
            onClick={clearSelection}
          >
            Очистить
          </Button>
          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            disabled={
              loading || hasErrors || selectCards({ countText, limitText, cards }).length === 0
            }
            onClick={() => void start()}
          >
            Начать практику
          </Button>
        </Stack>
      </Stack>
    </Paper>
  )
}
