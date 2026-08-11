import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { CardItem } from '../types/models'
import { MarkdownContent } from './MarkdownContent'

function highlightText(text: string, index: number | null | undefined) {
  if (index == null || index < 0 || index >= text.length) return text
  return (
    <>
      {text.slice(0, index)}
      <Box component="mark" sx={{ bgcolor: 'warning.light', px: 0.25 }}>
        {text[index]}
      </Box>
      {text.slice(index + 1)}
    </>
  )
}

export function CardItemView({ item }: { item: CardItem }) {
  switch (item.type) {
    case 'TEXT':
      return <Typography sx={{ whiteSpace: 'pre-wrap' }}>{item.text}</Typography>
    case 'TEXT_WITH_HIGHLIGHTED_SYMBOL':
    case 'WORD_WITH_STRESS':
      return (
        <Typography sx={{ whiteSpace: 'pre-wrap' }}>
          {highlightText(item.text ?? '', item.index)}
        </Typography>
      )
    case 'CODE':
      return (
        <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#1e1e1e', overflow: 'auto' }}>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <Chip size="small" label={item.extension || 'код'} />
          </Stack>
          <Box
            component="pre"
            sx={{ m: 0, color: '#d4d4d4', fontFamily: 'ui-monospace, monospace', fontSize: 13 }}
          >
            {item.code}
          </Box>
        </Paper>
      )
    case 'FORMULA':
      return (
        <Typography
          sx={{
            fontFamily: 'ui-monospace, monospace',
            bgcolor: 'action.hover',
            px: 1.5,
            py: 1,
            borderRadius: 1,
          }}
        >
          {item.formula}
        </Typography>
      )
    case 'IMAGE':
      return item.imagePath ? (
        <Box
          component="img"
          src={item.imagePath}
          alt="карточка"
          sx={{ maxWidth: item.width || '100%', borderRadius: 1 }}
        />
      ) : (
        <Typography color="text.secondary">Нет изображения</Typography>
      )
    case 'MARKDOWN':
      return <MarkdownContent source={item.text ?? ''} />
    default:
      return <Typography color="text.secondary">{item.type}</Typography>
  }
}
