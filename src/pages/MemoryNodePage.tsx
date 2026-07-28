import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import { cardsApi, memoryNodesApi } from '../api'
import { useAuth } from '../auth/AuthContext'
import { CardDialog } from '../components/CardDialog'
import { CardsSelector } from '../components/CardsSelector'
import { CardsTable } from '../components/CardsTable'
import { MemoryNodeDialog } from '../components/MemoryNodeDialog'
import { ParentsPath } from '../components/ParentsPath'
import type {
  Card,
  CardItemInput,
  CardsGroup,
  CardsPriority,
  MemoryNode,
  MemoryNodePathItem,
} from '../types/models'

export function MemoryNodePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const nodeId = Number(id)

  const [node, setNode] = useState<MemoryNode | null>(null)
  const [parentsPath, setParentsPath] = useState<MemoryNodePathItem[]>([])
  const [children, setChildren] = useState<MemoryNode[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [priority, setPriority] = useState<CardsPriority | null>(null)
  const [group, setGroup] = useState<CardsGroup | null>(null)
  const [createCardOpen, setCreateCardOpen] = useState(false)
  const [createChildOpen, setCreateChildOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [creatingChild, setCreatingChild] = useState(false)

  const load = useCallback(async () => {
    if (!Number.isFinite(nodeId) || nodeId <= 0) {
      setError('Invalid memory node id')
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const [current, path] = await Promise.all([
        memoryNodesApi.get(nodeId),
        memoryNodesApi.parentsPath(nodeId).catch(() => [] as MemoryNodePathItem[]),
      ])
      setNode(current)
      setParentsPath(path)
      const [childNodes, cardList] = await Promise.all([
        current.children.length ? memoryNodesApi.getByIds(current.children) : Promise.resolve([]),
        current.cards.length ? cardsApi.getByIds(current.cards) : Promise.resolve([]),
      ])
      setChildren(childNodes)
      setCards(cardList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load memory node')
    } finally {
      setLoading(false)
    }
  }, [nodeId])

  useEffect(() => {
    void load()
  }, [load])

  const filteredCards = useMemo(() => {
    let list = cards
    if (priority) {
      const set = new Set(priority.cards)
      list = list.filter((c) => set.has(c.id))
    }
    if (group) {
      const set = new Set(group.cards)
      list = list.filter((c) => set.has(c.id))
    }
    return list
  }, [cards, priority, group])

  const createCard = async (question: CardItemInput[], answer: CardItemInput[]) => {
    setSaving(true)
    try {
      await cardsApi.create({ _id: nodeId, question, answer })
      await load()
    } finally {
      setSaving(false)
    }
  }

  const deleteCards = async (ids: number[]) => {
    await cardsApi.remove(ids)
    await load()
  }

  const toggleShared = async (shared: boolean) => {
    if (!node) return
    try {
      const updated = await memoryNodesApi.update({ id: node.id, shared })
      setNode(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update shared flag')
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!node) {
    return <Alert severity="error">{error || 'Memory node not found'}</Alert>
  }

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
        {node.parents[0] != null && (
          <Button
            startIcon={<ArrowUpwardIcon />}
            onClick={() => navigate(`/memory-node/${node.parents[0]}`)}
          >
            Parent
          </Button>
        )}
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          {node.name}{' '}
          <Typography component="span" color="text.secondary" variant="h5">
            #{node.id}
          </Typography>
        </Typography>
        {node.shared && <Chip size="small" color="info" label="shared" />}
        {isAdmin && user?.id === node.userId && (
          <FormControlLabel
            control={
              <Switch
                checked={node.shared}
                onChange={(e) => void toggleShared(e.target.checked)}
              />
            }
            label="Share with everyone"
          />
        )}
        {node.aliases.map((alias) => (
          <Chip key={alias} label={alias} size="small" />
        ))}
      </Box>

      <ParentsPath
        path={parentsPath}
        onNavigate={(id) => navigate(`/memory-node/${id}`)}
      />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
        {node.priorities?.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              label="Priority"
              value={priority?.name ?? ''}
              onChange={(e) => {
                const next = node.priorities.find((p) => p.name === e.target.value) ?? null
                setPriority(next)
              }}
            >
              {node.priorities.map((p) => (
                <MenuItem key={p.name} value={p.name}>
                  {p.number} {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        {priority && (
          <Button size="small" onClick={() => setPriority(null)}>
            Clear priority
          </Button>
        )}
        {node.groups?.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Group</InputLabel>
            <Select
              label="Group"
              value={group?.name ?? ''}
              onChange={(e) => {
                const next = node.groups.find((g) => g.name === e.target.value) ?? null
                setGroup(next)
              }}
            >
              {node.groups.map((g) => (
                <MenuItem key={g.name} value={g.name}>
                  {g.name} ({g.cards.length})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        {group && (
          <Button size="small" onClick={() => setGroup(null)}>
            Clear group
          </Button>
        )}
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
          alignItems: 'start',
        }}
      >
        <Stack spacing={2}>
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
              <Typography variant="h6">Children</Typography>
              <IconButton
                color="primary"
                aria-label="add child memory node"
                onClick={() => setCreateChildOpen(true)}
              >
                <AddIcon />
              </IconButton>
            </Box>
            <List dense>
              {children.map((child) => (
                <ListItemButton
                  key={child.id}
                  onClick={() => navigate(`/memory-node/${child.id}`)}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>
                          {child.name} (#{child.id})
                        </span>
                        {child.shared && <Chip size="small" label="shared" color="info" />}
                      </Box>
                    }
                    secondary={`${child.cards.length} cards`}
                  />
                </ListItemButton>
              ))}
              {children.length === 0 && (
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography color="text.secondary" variant="body2">
                    No children yet. Press + to add one.
                  </Typography>
                </Box>
              )}
            </List>
          </Paper>

          <CardsTable
            cards={filteredCards}
            onOpen={(card) => navigate(`/card/${card.id}`)}
            onCreate={() => setCreateCardOpen(true)}
            onDelete={(ids) => void deleteCards(ids)}
          />
        </Stack>

        <Stack spacing={2}>
          <CardsSelector
            memoryNodeId={node.id}
            cards={filteredCards}
            selectedPriority={priority}
            selectedGroup={group}
          />
        </Stack>
      </Box>

      <CardDialog
        open={createCardOpen}
        title="New card"
        submitting={saving}
        onClose={() => setCreateCardOpen(false)}
        onSubmit={createCard}
      />

      <MemoryNodeDialog
        open={createChildOpen}
        title="New child node"
        submitting={creatingChild}
        defaultShared={node.shared}
        allowShared={isAdmin}
        onClose={() => setCreateChildOpen(false)}
        onSubmit={async ({ name, aliases, shared }) => {
          setCreatingChild(true)
          try {
            const child = await memoryNodesApi.create({
              name,
              aliases,
              shared,
              parents: [node.id],
              children: [],
              cards: [],
            })
            await load()
            navigate(`/memory-node/${child.id}`)
          } finally {
            setCreatingChild(false)
          }
        }}
      />
    </Stack>
  )
}
