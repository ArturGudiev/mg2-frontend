import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1b5e4a',
      light: '#2d8a6e',
      dark: '#0f3d30',
    },
    secondary: {
      main: '#c45c26',
    },
    background: {
      default: '#f3f0e8',
      paper: '#fffcf6',
    },
  },
  typography: {
    fontFamily: '"Source Sans 3", "Segoe UI", sans-serif',
    h4: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 650 },
    h5: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 650 },
    h6: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#12382d',
        },
      },
    },
  },
})
