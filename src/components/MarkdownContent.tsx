import Box from '@mui/material/Box'
import Markdown from 'react-markdown'

const markdownSx = {
  '& h1, & h2, & h3, & h4, & h5, & h6': {
    mt: 1.5,
    mb: 0.75,
    fontWeight: 600,
    lineHeight: 1.3,
  },
  '& h1': { fontSize: '1.5rem' },
  '& h2': { fontSize: '1.25rem' },
  '& h3': { fontSize: '1.1rem' },
  '& p': { my: 0.75, lineHeight: 1.6 },
  '& ul, & ol': { my: 0.75, pl: 2.5 },
  '& li': { my: 0.25 },
  '& blockquote': {
    my: 1,
    pl: 1.5,
    borderLeft: '3px solid',
    borderColor: 'divider',
    color: 'text.secondary',
  },
  '& code': {
    fontFamily: 'ui-monospace, monospace',
    fontSize: '0.875em',
    bgcolor: 'action.hover',
    px: 0.5,
    py: 0.15,
    borderRadius: 0.5,
  },
  '& pre': {
    my: 1,
    p: 1.5,
    overflow: 'auto',
    bgcolor: '#1e1e1e',
    borderRadius: 1,
  },
  '& pre code': {
    bgcolor: 'transparent',
    p: 0,
    color: '#d4d4d4',
  },
  '& a': { color: 'primary.main' },
  '& img': { maxWidth: '100%', borderRadius: 1 },
  '& table': { borderCollapse: 'collapse', width: '100%', my: 1 },
  '& th, & td': { border: '1px solid', borderColor: 'divider', px: 1, py: 0.5 },
  '& hr': { my: 1.5, borderColor: 'divider' },
  '& > :first-child': { mt: 0 },
  '& > :last-child': { mb: 0 },
} as const

export function MarkdownContent({ source }: { source: string }) {
  return (
    <Box sx={markdownSx}>
      <Markdown>{source}</Markdown>
    </Box>
  )
}
