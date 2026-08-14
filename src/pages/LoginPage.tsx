import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'

export function LoginPage() {
  const { user, loading, login, register, verifyEmail, resendCode } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState(0)
  const [step, setStep] = useState<'auth' | 'verify'>('auth')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loginOrEmail, setLoginOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [addSampleCards, setAddSampleCards] = useState(true)
  const [code, setCode] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    return <Navigate to="/" replace />
  }

  const goToVerify = (targetEmail: string) => {
    setPendingEmail(targetEmail)
    setCode('')
    setError('')
    setInfo('')
    setStep('verify')
  }

  const submitAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setInfo('')
    try {
      if (tab === 0) {
        try {
          await login(loginOrEmail, password)
          navigate('/')
        } catch (err) {
          if (err instanceof ApiError && err.message === 'email not verified') {
            goToVerify(err.email || loginOrEmail)
            return
          }
          throw err
        }
      } else {
        if (password !== passwordConfirm) {
          setError('Пароли не совпадают')
          return
        }
        await register(name, email, password, addSampleCards)
        goToVerify(email)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка аутентификации')
    } finally {
      setSubmitting(false)
    }
  }

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setInfo('')
    try {
      await verifyEmail(pendingEmail, code)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неверный код')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    setSubmitting(true)
    setError('')
    setInfo('')
    try {
      await resendCode(pendingEmail)
      setInfo('Код отправлен повторно')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить код')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        px: 2,
        background:
          'radial-gradient(circle at 20% 20%, rgba(45,138,110,0.18), transparent 40%), radial-gradient(circle at 80% 0%, rgba(196,92,38,0.12), transparent 35%), #f3f0e8',
      }}
    >
      <Paper sx={{ width: '100%', maxWidth: 420, p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Memory Guard
        </Typography>

        {step === 'verify' ? (
          <>
            <Typography variant="h5" sx={{ mb: 1 }}>
              Проверочный код
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Код отправлен на {pendingEmail}
            </Typography>
            <Box component="form" onSubmit={submitCode}>
              <Stack spacing={2}>
                <TextField
                  label="Проверочный код"
                  required
                  autoFocus
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                {error && <Alert severity="error">{error}</Alert>}
                {info && <Alert severity="success">{info}</Alert>}
                <Button type="submit" variant="contained" size="large" disabled={submitting}>
                  Подтвердить
                </Button>
                <Button type="button" variant="text" disabled={submitting} onClick={handleResend}>
                  Отправить код ещё раз
                </Button>
                <Button
                  type="button"
                  variant="text"
                  color="inherit"
                  disabled={submitting}
                  onClick={() => {
                    setStep('auth')
                    setError('')
                    setInfo('')
                  }}
                >
                  Назад
                </Button>
              </Stack>
            </Box>
          </>
        ) : (
          <>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Войдите или зарегистрируйтесь, чтобы открыть разделы и карточки.
            </Typography>

            <Tabs
              value={tab}
              onChange={(_, v) => {
                setTab(v)
                setError('')
              }}
              sx={{ mb: 2 }}
            >
              <Tab label="Вход" />
              <Tab label="Регистрация" />
            </Tabs>

            <Box component="form" onSubmit={submitAuth}>
              <Stack spacing={2}>
                {tab === 1 && (
                  <>
                    <TextField
                      label="Имя"
                      required
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <TextField
                      label="Эл. почта"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <TextField
                      label="Пароль"
                      type="password"
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <TextField
                      label="Повторите пароль"
                      type="password"
                      required
                      autoComplete="new-password"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={addSampleCards}
                          onChange={(e) => setAddSampleCards(e.target.checked)}
                        />
                      }
                      label="Добавить тестовый набор карточек по осетинскому языку"
                    />
                  </>
                )}
                {tab === 0 && (
                  <>
                    <TextField
                      label="Логин или эл. почта"
                      required
                      autoComplete="username"
                      value={loginOrEmail}
                      onChange={(e) => setLoginOrEmail(e.target.value)}
                    />
                    <TextField
                      label="Пароль"
                      type="password"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </>
                )}
                {error && <Alert severity="error">{error}</Alert>}
                <Button type="submit" variant="contained" size="large" disabled={submitting}>
                  {tab === 0 ? 'Войти' : 'Создать аккаунт'}
                </Button>
              </Stack>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  )
}
