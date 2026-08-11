import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { MemoryNodePathItem } from '../types/models'

interface ParentsPathProps {
  path: MemoryNodePathItem[]
  onNavigate: (id: number) => void
}

export function ParentsPath({ path, onNavigate }: ParentsPathProps) {
  // API returns root → current; page title already shows the current name.
  const ancestors = path.slice(0, -1)
  if (ancestors.length === 0) return null

  return (
    <Box sx={{ pb: 2 }}>
      {ancestors.map((item, index) => (
        <Box key={item.id} sx={{ pl: `${index * 0.5}rem` }}>
          <Typography
            variant="h6"
            component="button"
            type="button"
            onClick={() => onNavigate(item.id)}
            sx={{
              all: 'unset',
              cursor: 'pointer',
              display: 'inline-block',
              py: 0.25,
              px: 0.75,
              borderRadius: 1,
              fontFamily: '"Fraunces", Georgia, serif',
              fontWeight: 500,
              color: 'text.secondary',
              '&:hover': {
                border: '1px solid',
                borderColor: 'primary.main',
                color: 'primary.main',
              },
            }}
          >
            {item.name}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}
