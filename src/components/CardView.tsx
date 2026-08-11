import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useAuth } from '../auth/AuthContext'
import type { Card } from '../types/models'
import { CardItemView } from './CardItemView'

interface CardViewProps {
  card: Card
  showAnswer?: boolean
}

export function CardView({ card, showAnswer = true }: CardViewProps) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Typography variant="overline" color="text.secondary">
          Вопрос{isAdmin ? ` · #${card.id}` : ''}
        </Typography>
        {isAdmin && card.shared && <Chip size="small" color="info" label="общий" />}
      </Stack>
      <Stack spacing={1.5} sx={{ mt: 1 }}>
        {card.question.map((item) => (
          <CardItemView key={item.id} item={item} />
        ))}
      </Stack>

      {showAnswer && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="overline" color="text.secondary">
            Ответ
          </Typography>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            {card.answer.map((item) => (
              <CardItemView key={item.id} item={item} />
            ))}
          </Stack>
        </>
      )}

      <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="caption">повторений: {card.count}</Typography>
      </Box>
    </Paper>
  )
}
