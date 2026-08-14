import { useEffect, useState } from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

interface SimpleTextCardFieldsProps {
  question: string
  answer: string
  onQuestionChange: (value: string) => void
  onAnswerChange: (value: string) => void
  autoFocus?: boolean
}

export function SimpleTextCardFields({
  question,
  answer,
  onQuestionChange,
  onAnswerChange,
  autoFocus = false,
}: SimpleTextCardFieldsProps) {
  return (
    <Stack spacing={2}>
      <TextField
        autoFocus={autoFocus}
        label="Вопрос"
        required
        fullWidth
        multiline
        minRows={3}
        value={question}
        onChange={(e) => onQuestionChange(e.target.value)}
      />
      <TextField
        label="Ответ"
        required
        fullWidth
        multiline
        minRows={3}
        value={answer}
        onChange={(e) => onAnswerChange(e.target.value)}
      />
    </Stack>
  )
}

interface SimpleTextCardDialogProps {
  open: boolean
  title?: string
  submitting?: boolean
  initialQuestion?: string
  initialAnswer?: string
  onClose: () => void
  onSubmit: (question: string, answer: string) => Promise<void> | void
}

export function SimpleTextCardDialog({
  open,
  title = 'Новая карточка',
  submitting,
  initialQuestion = '',
  initialAnswer = '',
  onClose,
  onSubmit,
}: SimpleTextCardDialogProps) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setQuestion(initialQuestion)
    setAnswer(initialAnswer)
    setError('')
  }, [open, initialQuestion, initialAnswer])

  const canSave = question.trim().length > 0 && answer.trim().length > 0 && !submitting

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <SimpleTextCardFields
            autoFocus
            question={question}
            answer={answer}
            onQuestionChange={setQuestion}
            onAnswerChange={setAnswer}
          />
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button
          variant="contained"
          disabled={!canSave}
          onClick={() => {
            void (async () => {
              try {
                setError('')
                await onSubmit(question.trim(), answer.trim())
                onClose()
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Не удалось сохранить карточку')
              }
            })()
          }}
        >
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  )
}
