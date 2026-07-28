import { useMemo, useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
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
import Typography from '@mui/material/Typography'
import type { Card } from '../types/models'

type SortKey = 'id' | 'count' | 'practiceCount' | 'usageType'

function preview(card: Card): string {
  const first = card.question[0]
  if (!first) return '—'
  return first.text || first.code || first.formula || first.imagePath || first.type
}

interface CardsTableProps {
  cards: Card[]
  onOpen: (card: Card) => void
  onCreate: () => void
  onDelete: (ids: number[]) => void
}

export function CardsTable({ cards, onOpen, onCreate, onDelete }: CardsTableProps) {
  const [selected, setSelected] = useState<number[]>([])
  const [orderBy, setOrderBy] = useState<SortKey>('id')
  const [order, setOrder] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

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

  return (
    <Paper variant="outlined">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5 }}>
        <Typography variant="h6">Cards</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            color="error"
            startIcon={<DeleteIcon />}
            disabled={selected.length === 0}
            onClick={() => {
              onDelete(selected)
              setSelected([])
            }}
          >
            Delete
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={onCreate}>
            New card
          </Button>
        </Box>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
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
              </TableCell>
              {([
                ['id', 'ID'],
                ['count', 'Count'],
                ['practiceCount', 'Practice'],
                ['usageType', 'Usage'],
              ] as const).map(([key, label]) => (
                <TableCell key={key}>
                  <TableSortLabel
                    active={orderBy === key}
                    direction={orderBy === key ? order : 'asc'}
                    onClick={() => toggleSort(key)}
                  >
                    {label}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell>Shared</TableCell>
              <TableCell>Preview</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {pageRows.map((card) => (
              <TableRow key={card.id} hover selected={selected.includes(card.id)}>
                <TableCell padding="checkbox">
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
                </TableCell>
                <TableCell>{card.id}</TableCell>
                <TableCell>{card.count}</TableCell>
                <TableCell>{card.practiceCount}</TableCell>
                <TableCell>{card.usageType}</TableCell>
                <TableCell>
                  {card.shared ? <Chip size="small" color="info" label="shared" /> : '—'}
                </TableCell>
                <TableCell sx={{ maxWidth: 280 }}>
                  <Typography noWrap variant="body2">
                    {preview(card)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => onOpen(card)} aria-label="open card">
                    →
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {pageRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>
                  <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    No cards yet
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
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10))
          setPage(0)
        }}
      />
    </Paper>
  )
}
