import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { memoryNodesApi } from '../api'
import { useAuth } from '../auth/AuthContext'
import { MemoryNodeDialog } from '../components/MemoryNodeDialog'
import type { MemoryNode } from '../types/models'

export function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [nodes, setNodes] = useState<MemoryNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await memoryNodesApi.listRoots()
      setNodes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load nodes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h4">Memory nodes</Typography>
        <Typography color="text.secondary">
          Root nodes — open one to browse children and cards.
        </Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

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
          <Typography variant="h6">Root nodes</Typography>
          <IconButton
            color="primary"
            aria-label="add memory node"
            onClick={() => setCreateOpen(true)}
          >
            <AddIcon />
          </IconButton>
        </Box>
        <List>
          {nodes.map((node) => (
            <ListItemButton key={node.id} onClick={() => navigate(`/memory-node/${node.id}`)}>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>
                      {node.name} (#{node.id})
                    </span>
                    {node.shared && <Chip size="small" label="shared" color="info" />}
                  </Box>
                }
                secondary={[
                  `${node.children.length} children`,
                  `${node.cards.length} cards`,
                  node.aliases.length ? `aliases: ${node.aliases.join(', ')}` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              />
            </ListItemButton>
          ))}
          {nodes.length === 0 && (
            <Box sx={{ p: 3 }}>
              <Typography color="text.secondary">
                No memory nodes yet. Press + to create a root node.
              </Typography>
            </Box>
          )}
        </List>
      </Paper>

      <MemoryNodeDialog
        open={createOpen}
        submitting={creating}
        allowShared={isAdmin}
        onClose={() => setCreateOpen(false)}
        onSubmit={async ({ name, aliases, shared }) => {
          setCreating(true)
          try {
            const node = await memoryNodesApi.create({
              name,
              aliases,
              shared,
              parents: [],
              children: [],
              cards: [],
            })
            navigate(`/memory-node/${node.id}`)
          } finally {
            setCreating(false)
          }
        }}
      />
    </Stack>
  )
}
