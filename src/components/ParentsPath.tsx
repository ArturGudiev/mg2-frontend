import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { MemoryNodePathItem } from '../types/models'

interface ParentsPathProps {
  path: MemoryNodePathItem[]
  onNavigate: (id: number) => void
}

export function ParentsPath({ path, onNavigate }: ParentsPathProps) {
  if (path.length === 0) return null

  return (
    <Box sx={{ pb: 2 }}>
      {path.map((item, index) => {
        const isCurrent = index === path.length - 1
        return (
          <Box key={item.id} sx={{ pl: `${index * 0.5}rem` }}>
            <Typography
              variant="h6"
              component="button"
              type="button"
              onClick={() => {
                if (!isCurrent) onNavigate(item.id)
              }}
              sx={{
                all: 'unset',
                cursor: isCurrent ? 'default' : 'pointer',
                display: 'inline-block',
                py: 0.25,
                px: isCurrent ? 0 : 0.75,
                borderRadius: 1,
                fontFamily: '"Fraunces", Georgia, serif',
                fontWeight: isCurrent ? 650 : 500,
                color: isCurrent ? 'text.primary' : 'text.secondary',
                '&:hover': isCurrent
                  ? undefined
                  : {
                      border: '1px solid',
                      borderColor: 'primary.main',
                      color: 'primary.main',
                    },
              }}
            >
              {item.name}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}
