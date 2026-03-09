import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const theme = {
  bg: '#e1e3e4',
  navbar: '#16191b',
  card: '#1c1f22',
  accent: '#ffffff',
  secondary: '#3d4449',
  dim: '#9aa3a8',
}

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const btnBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: '0.2s',
}

function Register() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        if (payload.exp > Math.floor(Date.now() / 1000)) {
          navigate('/dashboard')
        }
      } catch {}
    }
  }, [])

  async function handleRegister() {
    if (!email || !password || !password2) { setError('Заполните все поля'); return }
    if (password !== password2) { setError('Пароли не совпадают'); return }
    if (password.length < 8) { setError('Пароль должен быть не менее 8 символов'); return }

    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.detail || 'Ошибка регистрации'); return }

      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      localStorage.removeItem('email_verified')
      navigate('/verify')
    } catch {
      setError('Сервер недоступен. Попробуйте позже.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: theme.card,
    border: `1px solid ${theme.secondary}`,
    borderRadius: 12,
    padding: '14px 16px',
    color: theme.accent,
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <nav style={{ background: theme.navbar, display: 'flex', alignItems: 'center', padding: '0 32px', height: 68, borderBottom: `1px solid ${theme.secondary}` }}>
        <a href="/" style={{ fontSize: '1.3rem', fontWeight: 800, color: theme.accent, textDecoration: 'none' }}>PRIVAX</a>
      </nav>

      <main style={{ maxWidth: 480, margin: '0 auto', padding: '40px 16px' }}>
        <div style={{ background: theme.navbar, borderRadius: 28, padding: '36px 28px', border: `1px solid ${theme.secondary}` }}>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: theme.accent, marginBottom: 8 }}>Создать аккаунт</h2>
          <p style={{ fontSize: '0.85rem', color: theme.dim, marginBottom: 28 }}>Зарегистрируйтесь в Privax</p>

          {error && (
            <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: '0.82rem', color: '#ff6b6b' }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: '0.75rem', color: theme.dim, letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>EMAIL</label>
            <input type="email" placeholder="you@example.com" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRegister()}
              style={inputStyle} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: '0.75rem', color: theme.dim, letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>ПАРОЛЬ</label>
            <input type="password" placeholder="Минимум 8 символов" value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRegister()}
              style={inputStyle} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: '0.75rem', color: theme.dim, letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>ПОВТОРИТЕ ПАРОЛЬ</label>
            <input type="password" placeholder="••••••••" value={password2}
              onChange={e => setPassword2(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRegister()}
              style={{
                ...inputStyle,
                borderColor: password2 && password !== password2 ? 'rgba(255,80,80,0.5)' : theme.secondary,
              }} />
          </div>

          <button onClick={handleRegister} disabled={loading}
            style={{
              ...btnBase,
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
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.accent } }}
            onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = theme.accent; e.currentTarget.style.color = theme.navbar } }}>
            {loading ? 'СОЗДАЁМ...' : 'ЗАРЕГИСТРИРОВАТЬСЯ'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.82rem', color: theme.dim, marginTop: 16 }}>
            Уже есть аккаунт?{' '}
            <a href="/login" style={{ color: theme.accent, textDecoration: 'none', fontWeight: 600 }}>Войти</a>
          </p>

        </div>
      </main>
    </div>
  )
}

export default Register