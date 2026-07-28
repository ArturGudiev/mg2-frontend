import { useEffect, useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import type { CardItemInput, CardItemType } from '../types/models'

const ITEM_TYPES: CardItemType[] = [
  'TEXT',
  'CODE',
  'FORMULA',
  'IMAGE',
  'TEXT_WITH_HIGHLIGHTED_SYMBOL',
  'WORD_WITH_STRESS',
]

function emptyItem(type: CardItemType = 'TEXT'): CardItemInput {
  return { type, text: '', code: '', extension: '', formula: '', imagePath: '', width: '', index: 0 }
}

function ItemEditor({
  item,
  onChange,
  onRemove,
}: {
  item: CardItemInput
  onChange: (next: CardItemInput) => void
  onRemove: () => void
}) {
  return (
    <Stack spacing={1.5} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Type</InputLabel>
          <Select
            label="Type"
            value={item.type}
            onChange={(e) => onChange({ ...item, type: e.target.value as CardItemType })}
          >
            {ITEM_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <IconButton color="error" onClick={onRemove} aria-label="remove item">
          <DeleteIcon />
        </IconButton>
      </Stack>

      {(item.type === 'TEXT' ||
        item.type === 'TEXT_WITH_HIGHLIGHTED_SYMBOL' ||
        item.type === 'WORD_WITH_STRESS') && (
        <TextField
          label="Text"
          multiline
          minRows={2}
          value={item.text ?? ''}
          onChange={(e) => onChange({ ...item, text: e.target.value })}
        />
      )}
      {(item.type === 'TEXT_WITH_HIGHLIGHTED_SYMBOL' || item.type === 'WORD_WITH_STRESS') && (
        <TextField
          label="Highlight index"
          type="number"
          value={item.index ?? 0}
          onChange={(e) => onChange({ ...item, index: Number(e.target.value) })}
        />
      )}
      {item.type === 'CODE' && (
        <>
          <TextField
            label="Extension"
            value={item.extension ?? ''}
            onChange={(e) => onChange({ ...item, extension: e.target.value })}
          />
          <TextField
            label="Code"
            multiline
            minRows={4}
            value={item.code ?? ''}
            onChange={(e) => onChange({ ...item, code: e.target.value })}
          />
        </>
      )}
      {item.type === 'FORMULA' && (
        <TextField
          label="Formula"
          value={item.formula ?? ''}
          onChange={(e) => onChange({ ...item, formula: e.target.value })}
        />
      )}
      {item.type === 'IMAGE' && (
        <>
          <TextField
            label="Image path / URL"
            value={item.imagePath ?? ''}
            onChange={(e) => onChange({ ...item, imagePath: e.target.value })}
          />
          <TextField
            label="Width"
            value={item.width ?? ''}
            onChange={(e) => onChange({ ...item, width: e.target.value })}
          />
        </>
      )}
    </Stack>
  )
}

interface CardDialogProps {
  open: boolean
  title: string
  initialQuestion?: CardItemInput[]
  initialAnswer?: CardItemInput[]
  submitting?: boolean
  onClose: () => void
  onSubmit: (question: CardItemInput[], answer: CardItemInput[]) => Promise<void> | void
}

export function CardDialog({
  open,
  title,
  initialQuestion,
  initialAnswer,
  submitting,
  onClose,
  onSubmit,
}: CardDialogProps) {
  const [question, setQuestion] = useState<CardItemInput[]>(initialQuestion ?? [emptyItem()])
  const [answer, setAnswer] = useState<CardItemInput[]>(initialAnswer ?? [emptyItem()])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setQuestion(initialQuestion ?? [emptyItem()])
    setAnswer(initialAnswer ?? [emptyItem()])
    setError('')
  }, [open, initialQuestion, initialAnswer])

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="subtitle1">Question</Typography>
          {question.map((item, idx) => (
            <ItemEditor
              key={`q-${idx}`}
              item={item}
              onChange={(next) =>
                setQuestion((prev) => prev.map((it, i) => (i === idx ? next : it)))
              }
              onRemove={() => setQuestion((prev) => prev.filter((_, i) => i !== idx))}
            />
          ))}
          <Button startIcon={<AddIcon />} onClick={() => setQuestion((p) => [...p, emptyItem()])}>
            Add question item
          </Button>

          <Typography variant="subtitle1">Answer</Typography>
          {answer.map((item, idx) => (
            <ItemEditor
              key={`a-${idx}`}
              item={item}
              onChange={(next) =>
                setAnswer((prev) => prev.map((it, i) => (i === idx ? next : it)))
              }
              onRemove={() => setAnswer((prev) => prev.filter((_, i) => i !== idx))}
            />
          ))}
          <Button startIcon={<AddIcon />} onClick={() => setAnswer((p) => [...p, emptyItem()])}>
            Add answer item
          </Button>

          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={submitting || question.length === 0 || answer.length === 0}
          onClick={async () => {
            try {
              setError('')
              await onSubmit(question, answer)
              onClose()
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to save card')
            }
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}
