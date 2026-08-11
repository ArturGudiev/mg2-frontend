import type { ReactElement } from 'react'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import type { Card } from '../types/models'
import { CardView } from './CardView'

interface CardHoverPreviewProps {
  card: Card
  children: ReactElement
}

export function CardHoverPreview({ card, children }: CardHoverPreviewProps) {
  return (
    <Tooltip
      title={
        <Box sx={{ maxWidth: 420, maxHeight: 360, overflow: 'auto' }}>
          <CardView card={card} showAnswer />
        </Box>
      }
      placement="top"
      enterDelay={250}
      leaveDelay={100}
      slotProps={{
        tooltip: {
          sx: {
            bgcolor: 'background.paper',
            color: 'text.primary',
            p: 0,
            maxWidth: 'none',
            boxShadow: 6,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
          },
        },
      }}
    >
      {children}
    </Tooltip>
  )
}
