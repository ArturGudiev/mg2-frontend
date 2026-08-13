import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import { cardsApi, memoryNodesApi } from '../api'
import { useAuth } from '../auth/AuthContext'
import { CardDialog } from '../components/CardDialog'
import { CardsSelector } from '../components/CardsSelector'
import { CardsTable } from '../components/CardsTable'
import { MemoryNodeDialog } from '../components/MemoryNodeDialog'
import { NodeBrowser } from '../components/NodeBrowser'
import { ParentsPath } from '../components/ParentsPath'
import type {
  Card,
  CardItem,
  CardItemInput,
  CardsGroup,
  CardsPriority,
  MemoryNode,
  MemoryNodePathItem,
} from '../types/models'

function cardItemSearchText(item: CardItem): string {
  return [item.text, item.code, item.formula].filter(Boolean).join(' ')
}

function cardMatchesText(card: Card, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const items = [...card.question, ...card.answer]
  return items.some((item) => cardItemSearchText(item).toLowerCase().includes(q))
}

const CARDS_ROWS_OPTIONS = [5, 10, 25, 50] as const

function parseCardsPage(raw: string | null): number {
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0
}

function parseCardsRows(raw: string | null): number {
  const n = Number(raw)
  return (CARDS_ROWS_OPTIONS as readonly number[]).includes(n) ? n : 10
}

export function MemoryNodePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
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
  const [cardTextFilter, setCardTextFilter] = useState('')
  const [createCardOpen, setCreateCardOpen] = useState(false)
  const [createChildOpen, setCreateChildOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [creatingChild, setCreatingChild] = useState(false)
  const [settingsAnchor, setSettingsAnchor] = useState<null | HTMLElement>(null)

  const cardsPage = parseCardsPage(searchParams.get('page'))
  const cardsRowsPerPage = parseCardsRows(searchParams.get('rows'))

  const patchCardsPaging = useCallback(
    (patch: { page?: number; rows?: number }) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          const page = patch.page !== undefined ? patch.page : parseCardsPage(next.get('page'))
          const rows = patch.rows !== undefined ? patch.rows : parseCardsRows(next.get('rows'))
          if (page <= 0) next.delete('page')
          else next.set('page', String(page))
          if (rows === 10) next.delete('rows')
          else next.set('rows', String(rows))
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const load = useCallback(async () => {
    if (!Number.isFinite(nodeId) || nodeId <= 0) {
      setError('Неверный идентификатор раздела памяти')
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
      setError(err instanceof Error ? err.message : 'Не удалось загрузить раздел памяти')
    } finally {
      setLoading(false)
    }
  }, [nodeId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setPriority(null)
    setGroup(null)
    setCardTextFilter('')
  }, [nodeId])

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
    if (cardTextFilter.trim()) {
      list = list.filter((c) => cardMatchesText(c, cardTextFilter))
    }
    return list
  }, [cards, priority, group, cardTextFilter])

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
    try {
      await cardsApi.remove(ids)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось удалить карточки')
      throw err
    }
  }

  const toggleShared = async (shared: boolean) => {
    if (!node) return
    try {
      const updated = await memoryNodesApi.update({ id: node.id, shared })
      setNode(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось обновить флаг общего доступа')
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
    return <Alert severity="error">{error || 'Раздел памяти не найден'}</Alert>
  }

  return (
    <Stack spacing={2}>
      <Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          {node.parents[0] != null && (
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(`/memory-node/${node.parents[0]}`)}
            >
              Назад
            </Button>
          )}
          <Typography variant="h4" sx={{ flexGrow: 1 }}>
            {node.name}
          </Typography>
          {isAdmin && node.shared && <Chip size="small" color="info" label="общий" />}
          {isAdmin && user?.id === node.userId && (
            <>
              <IconButton
                aria-label="настройки раздела"
                onClick={(e) => setSettingsAnchor(e.currentTarget)}
              >
                <MoreVertIcon />
              </IconButton>
              <Menu
                anchorEl={settingsAnchor}
                open={Boolean(settingsAnchor)}
                onClose={() => setSettingsAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem
                  onClick={() => {
                    void toggleShared(!node.shared)
                    setSettingsAnchor(null)
                  }}
                >
                  <ListItemIcon>
                    <Switch size="small" edge="start" checked={node.shared} tabIndex={-1} disableRipple />
                  </ListItemIcon>
                  <ListItemText primary="Общий доступ" secondary="Доступ только по приглашению (не всем)" />
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
        {(isAdmin || node.aliases.length > 0) && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {isAdmin && `#${node.id}`}
            {isAdmin && node.aliases.length > 0 && ' · '}
            {node.aliases.length > 0 && node.aliases.join(', ')}
          </Typography>
        )}
        {node.description?.trim() && (
          <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
            {node.description}
          </Typography>
        )}
      </Box>

      <ParentsPath
        path={parentsPath}
        onNavigate={(id) => navigate(`/memory-node/${id}`)}
      />

      {error && <Alert severity="error">{error}</Alert>}

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
          gridTemplateAreas: {
            xs: `
              "nodes"
              "practice"
              "cards"
            `,
            lg: `
              "nodes nodes"
              "cards practice"
            `,
          },
          alignItems: 'start',
        }}
      >
        {(isAdmin || children.length > 0) && (
          <Box sx={{ gridArea: 'nodes' }}>
            <NodeBrowser
              children={children}
              isAdmin={isAdmin}
              onOpenChild={(child) => navigate(`/memory-node/${child.id}`)}
              onAddChild={() => setCreateChildOpen(true)}
            />
          </Box>
        )}

        {cards.length > 0 && (
          <Box sx={{ gridArea: 'practice' }}>
            <CardsSelector
              memoryNodeId={node.id}
              cards={filteredCards}
              selectedPriority={priority}
              selectedGroup={group}
            />
          </Box>
        )}

        {(isAdmin || cards.length > 0) && (
          <Box sx={{ gridArea: 'cards' }}>
            <CardsTable
              cards={filteredCards}
              isAdmin={isAdmin}
              textFilter={cardTextFilter}
              onTextFilterChange={(value) => {
                setCardTextFilter(value)
                if (cardsPage !== 0) patchCardsPaging({ page: 0 })
              }}
              page={cardsPage}
              rowsPerPage={cardsRowsPerPage}
              onPageChange={(p) => patchCardsPaging({ page: p })}
              onRowsPerPageChange={(n) => patchCardsPaging({ page: 0, rows: n })}
              onOpen={(card) =>
                navigate(`/card/${card.id}`, {
                  state: { returnTo: `${location.pathname}${location.search}` },
                })
              }
              onCreate={() => setCreateCardOpen(true)}
              onDelete={(ids) => void deleteCards(ids)}
            />
          </Box>
        )}
      </Box>

      <CardDialog
        open={createCardOpen}
        title="Новая карточка"
        submitting={saving}
        onClose={() => setCreateCardOpen(false)}
        onSubmit={createCard}
      />

      <MemoryNodeDialog
        open={createChildOpen}
        title="Новый дочерний раздел"
        submitting={creatingChild}
        defaultShared={node.shared}
        allowShared={isAdmin}
        onClose={() => setCreateChildOpen(false)}
        onSubmit={async ({ name, description, aliases, shared }) => {
          setCreatingChild(true)
          try {
            await memoryNodesApi.create({
              name,
              description,
              aliases,
              shared,
              parents: [node.id],
              children: [],
              cards: [],
            })
            await load()
          } finally {
            setCreatingChild(false)
          }
        }}
      />
    </Stack>
  )
}
