import AddIcon from '@mui/icons-material/Add'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import type { MemoryNode } from '../types/models'

interface NodeBrowserProps {
  children: MemoryNode[]
  isAdmin?: boolean
  onOpenChild: (node: MemoryNode) => void
  onAddChild: () => void
}

export function NodeBrowser({ children, isAdmin = false, onOpenChild, onAddChild }: NodeBrowserProps) {
  return (
    <Paper variant="outlined">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5,
          pt: 1.5,
          pb: 0.5,
        }}
      >
        <Typography variant="h6">Разделы</Typography>
        <IconButton color="primary" aria-label="добавить раздел" onClick={onAddChild}>
          <AddIcon />
        </IconButton>
      </Box>
      <List dense>
        {children.map((child, index) => (
          <ListItemButton key={child.id} onClick={() => onOpenChild(child)}>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography component="span" color="primary" sx={{ minWidth: 24 }}>
                    {index + 1}.
                  </Typography>
                  <span>
                    {child.name}
                    {isAdmin ? ` (#${child.id})` : ''}
                  </span>
                  {isAdmin && child.shared && <Chip size="small" label="общий" color="info" />}
                </Box>
              }
              secondary={`${child.cards.length} карточек`}
            />
          </ListItemButton>
        ))}
        {children.length === 0 && (
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography color="text.secondary" variant="body2">
              Дочерних разделов нет. Нажмите +, чтобы добавить.
            </Typography>
          </Box>
        )}
      </List>
    </Paper>
  )
}
