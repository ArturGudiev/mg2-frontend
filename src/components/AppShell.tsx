import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ExploreIcon from '@mui/icons-material/Explore'
import LogoutIcon from '@mui/icons-material/Logout'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { memoryNodesApi } from '../api'
import { useAuth } from '../auth/AuthContext'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [navOpen, setNavOpen] = useState(false)
  const [navInput, setNavInput] = useState('')
  const [navError, setNavError] = useState('')
  const [accountAnchor, setAccountAnchor] = useState<null | HTMLElement>(null)

  const goNavigate = async () => {
    const value = navInput.trim()
    if (!value) return
    setNavError('')

    try {
      if (/^c\s+\d+$/i.test(value)) {
        const id = Number(value.split(/\s+/)[1])
        setNavOpen(false)
        navigate(`/card/${id}`)
        return
      }
      if (/^\d+$/.test(value)) {
        setNavOpen(false)
        navigate(`/memory-node/${value}`)
        return
      }
      const node = await memoryNodesApi.getByAlias(value)
      setNavOpen(false)
      navigate(`/memory-node/${node.id}`)
    } catch (err) {
      setNavError(err instanceof Error ? err.message : 'Не найдено')
    }
  }

  const closeAccountMenu = () => setAccountAnchor(null)

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky">
        <Toolbar sx={{ gap: 1 }}>
          <Typography
            variant="h6"
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            Memory Guard
          </Typography>
          {user && (
            <>
              <Typography variant="body2" sx={{ opacity: 0.85, display: { xs: 'none', sm: 'block' } }}>
                {user.name}
                {user.role === 'admin' && ' · админ'}
              </Typography>
              {user.role === 'admin' && (
                <Button color="inherit" startIcon={<ExploreIcon />} onClick={() => setNavOpen(true)}>
                  Перейти
                </Button>
              )}
              <IconButton
                color="inherit"
                aria-label="выйти"
                onClick={() => logout()}
                sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
              >
                <LogoutIcon />
              </IconButton>
              <IconButton
                color="inherit"
                aria-label="аккаунт"
                aria-controls={accountAnchor ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={accountAnchor ? 'true' : undefined}
                onClick={(e) => setAccountAnchor(e.currentTarget)}
                sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
              >
                <LogoutIcon />
              </IconButton>
              <Menu
                id="account-menu"
                anchorEl={accountAnchor}
                open={Boolean(accountAnchor)}
                onClose={closeAccountMenu}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem disabled sx={{ opacity: '1 !important', cursor: 'default' }}>
                  <ListItemText
                    primary={user.name}
                    secondary={user.role === 'admin' ? 'админ' : undefined}
                  />
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    closeAccountMenu()
                    logout()
                  }}
                >
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Выйти" />
                </MenuItem>
              </Menu>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ p: { xs: 1.5, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
        {children}
      </Box>

      <Dialog open={navOpen} onClose={() => setNavOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Перейти</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label="ID, псевдоним или c &lt;cardId&gt;"
            value={navInput}
            onChange={(e) => setNavInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void goNavigate()
            }}
            helperText="Примеры: 12 · root · c 45"
          />
          {navError && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {navError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNavOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={() => void goNavigate()}>
            Перейти
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
