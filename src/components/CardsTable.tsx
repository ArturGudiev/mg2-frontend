import { useEffect, useMemo, useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import type { Card } from '../types/models'
import { CardHoverPreview } from './CardHoverPreview'

type SortKey = 'count'

function preview(card: Card): string {
  const first = card.question[0]
  if (!first) return '—'
  return first.text || first.code || first.formula || first.imagePath || first.type
}

interface CardsTableProps {
  cards: Card[]
  canCreate?: boolean
  canDelete?: boolean
  textFilter?: string
  onTextFilterChange?: (value: string) => void
  page?: number
  rowsPerPage?: number
  onPageChange?: (page: number) => void
  onRowsPerPageChange?: (rowsPerPage: number) => void
  onOpen: (card: Card) => void
  onCreate: () => void
  onDelete: (ids: number[]) => void | Promise<void>
}

export function CardsTable({
  cards,
  canCreate = false,
  canDelete = false,
  textFilter,
  onTextFilterChange,
  page: pageProp,
  rowsPerPage: rowsPerPageProp,
  onPageChange,
  onRowsPerPageChange,
  onOpen,
  onCreate,
  onDelete,
}: CardsTableProps) {
  const [selected, setSelected] = useState<number[]>([])
  const [orderBy, setOrderBy] = useState<SortKey>('count')
  const [order, setOrder] = useState<'asc' | 'desc'>('asc')
  const [pageState, setPageState] = useState(0)
  const [rowsPerPageState, setRowsPerPageState] = useState(10)
  const [deleting, setDeleting] = useState(false)

  const controlled = onPageChange != null
  const page = controlled ? (pageProp ?? 0) : pageState
  const rowsPerPage = controlled ? (rowsPerPageProp ?? 10) : rowsPerPageState

  const setPage = (p: number) => {
    if (onPageChange) onPageChange(p)
    else setPageState(p)
  }

  const sorted = useMemo(() => {
    const copy = [...cards]
    copy.sort((a, b) => {
      const av = a[orderBy]
      const bv = b[orderBy]
      if (av === bv) return 0
      if (av == null) return 1
      if (bv == null) return -1
      const cmp = av < bv ? -1 : 1
      return order === 'asc' ? cmp : -cmp
    })
    return copy
  }, [cards, order, orderBy])

  const maxPage = Math.max(0, Math.ceil(sorted.length / rowsPerPage) - 1)
  useEffect(() => {
    if (page > maxPage) setPage(maxPage)
  }, [page, maxPage])

  const pageRows = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
  const allSelected = pageRows.length > 0 && pageRows.every((c) => selected.includes(c.id))

  const toggleSort = (key: SortKey) => {
    if (orderBy === key) {
      setOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    } else {
      setOrderBy(key)
      setOrder('asc')
    }
  }

  const handleDelete = () => {
    const ids = selected
    setDeleting(true)
    void Promise.resolve(onDelete(ids))
      .then(() => setSelected([]))
      .finally(() => setDeleting(false))
  }

  const deleteDisabled = selected.length === 0 || deleting

  return (
    <Paper variant="outlined">
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          flexWrap: { sm: 'wrap' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 1.5,
          p: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Typography variant="h6">Карточки</Typography>
          {canCreate && (
            <IconButton
              color="primary"
              onClick={onCreate}
              aria-label="новая карточка"
              sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
            >
              <AddIcon />
            </IconButton>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', minWidth: 0, flex: { sm: '0 1 auto' } }}>
          {onTextFilterChange != null && (
            <TextField
              size="small"
              label="Поиск"
              placeholder="Текст вопроса или ответа"
              value={textFilter ?? ''}
              onChange={(e) => onTextFilterChange(e.target.value)}
              sx={{
                flex: { xs: '0 0 16rem', sm: '0 0 auto' },
                width: { xs: '16rem', sm: 220 },
                minWidth: 0,
              }}
            />
          )}
          {canDelete && (
            <IconButton
            color="error"
            disabled={deleteDisabled}
            onClick={handleDelete}
            aria-label="удалить"
            sx={{ 
              display: { xs: 'inline-flex', sm: 'none' }, 
              ml: { xs: 'auto', sm: 0 },
              mr: { xs: '1rem', sm: 0 },
              right: 0, 
              flexShrink: 0,
              position: 'absolute',
            }}
          >
            <DeleteIcon />
          </IconButton>
          )}
          {canDelete && (
          <Button
            color="error"
            startIcon={<DeleteIcon />}
            disabled={deleteDisabled}
            onClick={handleDelete}
            sx={{ display: { xs: 'none', sm: 'inline-flex' }, flexShrink: 0 }}
          >
            Удалить
          </Button>
          )}
          {canCreate && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onCreate}
              sx={{ display: { xs: 'none', sm: 'inline-flex' }, flexShrink: 0 }}
            >
              Новая карточка
            </Button>
          )}
        </Box>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                {canDelete ? (
                <Checkbox
                  checked={allSelected}
                  indeterminate={selected.length > 0 && !allSelected}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelected((prev) => [
                        ...new Set([...prev, ...pageRows.map((c) => c.id)]),
                      ])
                    } else {
                      const pageIds = new Set(pageRows.map((c) => c.id))
                      setSelected((prev) => prev.filter((id) => !pageIds.has(id)))
                    }
                  }}
                />
                ) : null}
              </TableCell>
              <TableCell width={56} sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                №
              </TableCell>
              <TableCell>Карточка</TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'count'}
                  direction={orderBy === 'count' ? order : 'asc'}
                  onClick={() => toggleSort('count')}
                >
                  Count
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {pageRows.map((card, index) => (
              <TableRow
                key={card.id}
                hover
                selected={selected.includes(card.id)}
                onClick={() => onOpen(card)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell
                  padding="checkbox"
                  onClick={(e) => e.stopPropagation()}
                >
                  {canDelete ? (
                    <Checkbox
                      checked={selected.includes(card.id)}
                      onChange={(e) => {
                        setSelected((prev) =>
                          e.target.checked
                            ? [...prev, card.id]
                            : prev.filter((id) => id !== card.id),
                        )
                      }}
                    />
                  ) : null}
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                  {page * rowsPerPage + index + 1}
                </TableCell>
                <TableCell sx={{ maxWidth: 280 }}>
                  <CardHoverPreview card={card}>
                    <Typography
                      noWrap
                      variant="body2"
                      component="span"
                      sx={{ cursor: 'pointer', display: 'inline-block', maxWidth: '100%' }}
                    >
                      {preview(card)}
                    </Typography>
                  </CardHoverPreview>
                </TableCell>
                <TableCell>{card.count}</TableCell>
                <TableCell
                  align="right"
                  sx={{ display: { xs: 'none', sm: 'table-cell' } }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <IconButton size="small" onClick={() => onOpen(card)} aria-label="открыть карточку">
                    →
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {pageRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    Карточек пока нет
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={sorted.length}
        page={page}
        labelRowsPerPage="Карточек на странице:"
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          const next = parseInt(e.target.value, 10)
          if (onRowsPerPageChange) {
            onRowsPerPageChange(next)
          } else {
            setRowsPerPageState(next)
            setPageState(0)
          }
        }}
      />
    </Paper>
  )
}
