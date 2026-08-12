import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import type { CardItem } from '../types/models'
import { MarkdownContent } from './MarkdownContent'

export type CardItemDraft = {
  text?: string | null
  index?: number | null
  code?: string | null
  extension?: string | null
  formula?: string | null
  imagePath?: string | null
  width?: string | null
}

function highlightText(text: string, index: number | null | undefined) {
  if (index == null || index < 0 || index >= text.length) return text
  return (
    <>
      {text.slice(0, index)}
      <Box component="mark" sx={{ bgcolor: 'warning.light', px: 0.25 }}>
        {text[index]}
      </Box>
      {text.slice(index + 1)}
    </>
  )
}

function draftFromItem(item: CardItem): CardItemDraft {
  return {
    text: item.text,
    index: item.index,
    code: item.code,
    extension: item.extension,
    formula: item.formula,
    imagePath: item.imagePath,
    width: item.width,
  }
}

export function buildItemDrafts(items: CardItem[]): Record<number, CardItemDraft> {
  const drafts: Record<number, CardItemDraft> = {}
  for (const item of items) {
    drafts[item.id] = draftFromItem(item)
  }
  return drafts
}

interface CardItemViewProps {
  item: CardItem
  editing?: boolean
  draft?: CardItemDraft
  onDraftChange?: (patch: CardItemDraft) => void
}

export function CardItemView({ item, editing = false, draft, onDraftChange }: CardItemViewProps) {
  if (editing && draft && onDraftChange) {
    switch (item.type) {
      case 'TEXT':
      case 'MARKDOWN':
        return (
          <TextField
            fullWidth
            multiline
            minRows={3}
            label={item.type === 'MARKDOWN' ? 'Markdown' : 'Текст'}
            value={draft.text ?? ''}
            onChange={(e) => onDraftChange({ text: e.target.value })}
          />
        )
      case 'TEXT_WITH_HIGHLIGHTED_SYMBOL':
      case 'WORD_WITH_STRESS':
        return (
          <Stack spacing={1}>
            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Текст"
              value={draft.text ?? ''}
              onChange={(e) => onDraftChange({ text: e.target.value })}
            />
            <TextField
              type="number"
              label="Индекс символа"
              value={draft.index ?? ''}
              onChange={(e) => {
                const raw = e.target.value
                onDraftChange({ index: raw === '' ? null : Number(raw) })
              }}
              sx={{ maxWidth: 180 }}
            />
          </Stack>
        )
      case 'CODE':
        return (
          <Stack spacing={1}>
            <TextField
              size="small"
              label="Расширение"
              value={draft.extension ?? ''}
              onChange={(e) => onDraftChange({ extension: e.target.value })}
              sx={{ maxWidth: 200 }}
            />
            <TextField
              fullWidth
              multiline
              minRows={4}
              label="Код"
              value={draft.code ?? ''}
              onChange={(e) => onDraftChange({ code: e.target.value })}
              slotProps={{ input: { sx: { fontFamily: 'ui-monospace, monospace', fontSize: 13 } } }}
            />
          </Stack>
        )
      case 'FORMULA':
        return (
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="Формула"
            value={draft.formula ?? ''}
            onChange={(e) => onDraftChange({ formula: e.target.value })}
            slotProps={{ input: { sx: { fontFamily: 'ui-monospace, monospace' } } }}
          />
        )
      case 'IMAGE':
        return (
          <Stack spacing={1}>
            <TextField
              fullWidth
              label="Путь к изображению"
              value={draft.imagePath ?? ''}
              onChange={(e) => onDraftChange({ imagePath: e.target.value })}
            />
            <TextField
              label="Ширина"
              value={draft.width ?? ''}
              onChange={(e) => onDraftChange({ width: e.target.value })}
              sx={{ maxWidth: 200 }}
            />
            {draft.imagePath ? (
              <Box
                component="img"
                src={draft.imagePath}
                alt="карточка"
                sx={{ maxWidth: draft.width || '100%', borderRadius: 1 }}
              />
            ) : null}
          </Stack>
        )
      default:
        return <Typography color="text.secondary">{item.type}</Typography>
    }
  }

  switch (item.type) {
    case 'TEXT':
      return <Typography sx={{ whiteSpace: 'pre-wrap' }}>{item.text}</Typography>
    case 'TEXT_WITH_HIGHLIGHTED_SYMBOL':
    case 'WORD_WITH_STRESS':
      return (
        <Typography sx={{ whiteSpace: 'pre-wrap' }}>
          {highlightText(item.text ?? '', item.index)}
        </Typography>
      )
    case 'CODE':
      return (
        <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#1e1e1e', overflow: 'auto' }}>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <Chip size="small" label={item.extension || 'код'} />
          </Stack>
          <Box
            component="pre"
            sx={{ m: 0, color: '#d4d4d4', fontFamily: 'ui-monospace, monospace', fontSize: 13 }}
          >
            {item.code}
          </Box>
        </Paper>
      )
    case 'FORMULA':
      return (
        <Typography
          sx={{
            fontFamily: 'ui-monospace, monospace',
            bgcolor: 'action.hover',
            px: 1.5,
            py: 1,
            borderRadius: 1,
          }}
        >
          {item.formula}
        </Typography>
      )
    case 'IMAGE':
      return item.imagePath ? (
        <Box
          component="img"
          src={item.imagePath}
          alt="карточка"
          sx={{ maxWidth: item.width || '100%', borderRadius: 1 }}
        />
      ) : (
        <Typography color="text.secondary">Нет изображения</Typography>
      )
    case 'MARKDOWN':
      return <MarkdownContent source={item.text ?? ''} />
    default:
      return <Typography color="text.secondary">{item.type}</Typography>
  }
}
