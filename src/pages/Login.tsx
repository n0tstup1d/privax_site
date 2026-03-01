import { useState } from 'react'

const theme = {
  bg: '#e1e3e4',
  navbar: '#16191b',
  card: '#1c1f22',
  accent: '#ffffff',
  secondary: '#3d4449',
  dim: '#70797d',
}

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    // Проверка что поля не пустые
    if (!email || !password) {
      setError('Заполните все поля')
      return
    }

    setLoading(true)
    setError('')

    try {
      // FastAPI ожидает form-data для логина (OAuth2)
      const form = new URLSearchParams()
      form.append('username', email)
      form.append('password', password)

      const res = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form,
      })

      const data = await res.json()

      if (!res.ok) {
        // Бэкенд вернул ошибку
        setError(data.detail || 'Неверный email или пароль')
        return
      }

      // Сохраняем токены
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)

      // Редирект в личный кабинет
      window.location.href = '/dashboard'

    } catch {
      setError('Сервер недоступен. Попробуйте позже.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    background: theme.card,
    border: `1px solid ${theme.secondary}`,
    borderRadius: 12,
    padding: '14px 16px',
    color: theme.accent,
    fontSize: '0.9rem',
    outline: 'none',
  }

  return (
    <div style={{background: theme.bg, minHeight: '100vh', fontFamily: 'system-ui, sans-serif'}}>

      <nav style={{
        background: theme.navbar,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 32px',
        height: 68,
        borderBottom: `1px solid ${theme.secondary}`,
      }}>
        <a href="/" style={{fontSize: '1.3rem', fontWeight: 800, color: theme.accent, textDecoration: 'none'}}>
          PRIVAX
        </a>
      </nav>

      <main style={{maxWidth: 480, margin: '0 auto', padding: '40px 16px'}}>
        <div style={{
          background: theme.navbar,
          borderRadius: 28,
          padding: '36px 28px',
          border: `1px solid ${theme.secondary}`,
        }}>

          <h2 style={{fontSize: '1.6rem', fontWeight: 800, color: theme.accent, marginBottom: 8}}>
            Добро пожаловать
          </h2>
          <p style={{fontSize: '0.85rem', color: theme.dim, marginBottom: 28}}>
            Войдите в свой аккаунт Privax
          </p>

          {/* Ошибка */}
          {error && (
            <div style={{
              background: 'rgba(255,80,80,0.1)',
              border: '1px solid rgba(255,80,80,0.3)',
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 16,
              fontSize: '0.82rem',
              color: '#ff6b6b',
            }}>
              {error}
            </div>
          )}

          {/* Email */}
          <div style={{marginBottom: 14}}>
            <label style={{fontSize: '0.75rem', color: theme.dim, letterSpacing: '0.1em', display: 'block', marginBottom: 8}}>
              EMAIL
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={inputStyle}
            />
          </div>

          {/* Пароль */}
          <div style={{marginBottom: 24}}>
            <label style={{fontSize: '0.75rem', color: theme.dim, letterSpacing: '0.1em', display: 'block', marginBottom: 8}}>
              ПАРОЛЬ
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={inputStyle}
            />
          </div>

          {/* Кнопка */}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? 'transparent' : theme.accent,
              color: loading ? theme.accent : theme.navbar,
              border: `1px solid ${theme.accent}`,
              borderRadius: 14,
              padding: '16px 0',
              fontWeight: 800,
              fontSize: '0.85rem',
              letterSpacing: '0.15em',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: '0.2s',
              opacity: loading ? 0.7 : 1,
              textAlign: 'center' as const
            }}
            onMouseEnter={e => {
              if (!loading) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = theme.accent
              }
            }}
            onMouseLeave={e => {
              if (!loading) {
                e.currentTarget.style.background = theme.accent
                e.currentTarget.style.color = theme.navbar
              }
            }}>
            {loading ? 'ВХОДИМ...' : 'ВОЙТИ'}
          </button>

          <p style={{textAlign: 'center', fontSize: '0.82rem', color: theme.dim, marginTop: 16}}>
            Нет аккаунта?{' '}
            <a href="/register" style={{color: theme.accent, textDecoration: 'none', fontWeight: 600}}>
              Зарегистрироваться
            </a>
          </p>

        </div>
      </main>
    </div>
  )
}

export default Login