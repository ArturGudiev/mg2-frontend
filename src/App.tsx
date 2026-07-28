import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedLayout } from './auth/ProtectedLayout'
import { QuizProvider } from './store/QuizContext'
import { theme } from './theme/theme'
import { LoginPage } from './pages/LoginPage'
import { HomePage } from './pages/HomePage'
import { MemoryNodePage } from './pages/MemoryNodePage'
import { CardInspectorPage } from './pages/CardInspectorPage'
import { QuizPage } from './pages/QuizPage'

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <QuizProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/memory-node/:id" element={<MemoryNodePage />} />
                <Route path="/card/:id" element={<CardInspectorPage />} />
                <Route path="/quiz" element={<QuizPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </QuizProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
