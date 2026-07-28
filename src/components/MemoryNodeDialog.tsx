import { useEffect, useState } from 'react'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

export interface NewMemoryNodeValues {
  name: string
  aliases: string[]
  shared: boolean
}

interface MemoryNodeDialogProps {
  open: boolean
  title?: string
  submitting?: boolean
  defaultShared?: boolean
  allowShared?: boolean
  onClose: () => void
  onSubmit: (values: NewMemoryNodeValues) => Promise<void> | void
}

export function MemoryNodeDialog({
  open,
  title = 'New memory node',
  submitting,
  defaultShared = false,
  allowShared = false,
  onClose,
  onSubmit,
}: MemoryNodeDialogProps) {
  const [name, setName] = useState('')
  const [aliases, setAliases] = useState('')
  const [shared, setShared] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setName('')
    setAliases('')
    setShared(allowShared ? defaultShared : false)
    setError('')
  }, [open, defaultShared, allowShared])

  const submit = async () => {
    setError('')
    await onSubmit({
      name: name.trim(),
      aliases: aliases
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
      shared: allowShared ? shared : false,
    })
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            autoFocus
            label="Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && name.trim()) {
                e.preventDefault()
                void submit().catch((err) => {
                  setError(err instanceof Error ? err.message : 'Failed to create node')
                })
              }
            }}
          />
          <TextField
            label="Aliases (comma-separated)"
            value={aliases}
            onChange={(e) => setAliases(e.target.value)}
          />
          {allowShared && (
            <FormControlLabel
              control={
                <Checkbox checked={shared} onChange={(e) => setShared(e.target.checked)} />
              }
              label="Shared — visible to all users"
            />
          )}
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
          disabled={!name.trim() || submitting}
          onClick={() => {
            void submit().catch((err) => {
              setError(err instanceof Error ? err.message : 'Failed to create node')
            })
          }}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  )
}
