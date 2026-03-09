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

type Step = 'login' | 'reset_email' | 'reset_code' | 'reset_done'

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [step, setStep] = useState<Step>('login')
  const [resetEmail, setResetEmail] = useState('')
  const [resetCode, setResetCode] = useState(['', '', '', '', '', ''])
  const [resetNewPassword, setResetNewPassword] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState('')

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

  async function handleLogin() {
    if (!email || !password) { setError('Заполните все поля'); return }
    setLoading(true)
    setError('')
    try {
      const form = new URLSearchParams()
      form.append('username', email)
      form.append('password', password)
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form,
      })
      const data = await res.json()
      if (!res.ok) { setError(data.detail || 'Неверный email или пароль'); return }
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

  async function handleResetRequest() {
    if (!resetEmail) { setResetError('Введите email'); return }
    setResetLoading(true)
    setResetError('')
    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      })
      if (!res.ok) { const d = await res.json(); setResetError(d.detail || 'Ошибка'); return }
      setStep('reset_code')
    } catch {
      setResetError('Сервер недоступен')
    } finally {
      setResetLoading(false)
    }
  }

  function handleCodeInput(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const next = [...resetCode]
    next[index] = value.slice(-1)
    setResetCode(next)
    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus()
    }
  }

  function handleCodeKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !resetCode[index] && index > 0) {
      document.getElementById(`code-${index - 1}`)?.focus()
    }
  }

  async function handleResetConfirm() {
    const code = resetCode.join('')
    if (code.length < 6) { setResetError('Введите все 6 цифр кода'); return }
    if (!resetNewPassword || resetNewPassword.length < 8) { setResetError('Пароль должен быть не менее 8 символов'); return }
    setResetLoading(true)
    setResetError('')
    try {
      const res = await fetch(`${API}/auth/reset-password/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, code, new_password: resetNewPassword }),
      })
      const data = await res.json()
      if (!res.ok) { setResetError(data.detail || 'Неверный или истёкший код'); return }
      setStep('reset_done')
    } catch {
      setResetError('Сервер недоступен')
    } finally {
      setResetLoading(false)
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

  const primaryBtn = (loading: boolean): React.CSSProperties => ({
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
  })

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <nav style={{ background: theme.navbar, display: 'flex', alignItems: 'center', padding: '0 32px', height: 68, borderBottom: `1px solid ${theme.secondary}` }}>
        <a href="/" style={{ fontSize: '1.3rem', fontWeight: 800, color: theme.accent, textDecoration: 'none' }}>PRIVAX</a>
      </nav>

      <main style={{ maxWidth: 480, margin: '0 auto', padding: '40px 16px' }}>
        <div style={{ background: theme.navbar, borderRadius: 28, padding: '36px 28px', border: `1px solid ${theme.secondary}` }}>

          {/* ── ЛОГИН ── */}
          {step === 'login' && (
            <>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: theme.accent, marginBottom: 8 }}>Добро пожаловать</h2>
              <p style={{ fontSize: '0.85rem', color: theme.dim, marginBottom: 28 }}>Войдите в свой аккаунт Privax</p>

              {error && (
                <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: '0.82rem', color: '#ff6b6b' }}>
                  {error}
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: '0.75rem', color: theme.dim, letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>EMAIL</label>
                <input type="email" placeholder="you@example.com" value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  style={inputStyle} />
              </div>

              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: '0.75rem', color: theme.dim, letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>ПАРОЛЬ</label>
                <input type="password" placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  style={inputStyle} />
              </div>

              <div style={{ textAlign: 'right', marginBottom: 20 }}>
                <button onClick={() => { setStep('reset_email'); setResetError('') }}
                  style={{ background: 'none', border: 'none', color: theme.dim, fontSize: '0.78rem', cursor: 'pointer', padding: 0 }}
                  onMouseEnter={e => e.currentTarget.style.color = theme.accent}
                  onMouseLeave={e => e.currentTarget.style.color = theme.dim}>
                  Забыли пароль?
                </button>
              </div>

              <button onClick={handleLogin} disabled={loading} style={primaryBtn(loading)}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.accent } }}
                onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = theme.accent; e.currentTarget.style.color = theme.navbar } }}>
                {loading ? 'ВХОДИМ...' : 'ВОЙТИ'}
              </button>

              <p style={{ textAlign: 'center', fontSize: '0.82rem', color: theme.dim, marginTop: 16 }}>
                Нет аккаунта?{' '}
                <a href="/register" style={{ color: theme.accent, textDecoration: 'none', fontWeight: 600 }}>Зарегистрироваться</a>
              </p>
            </>
          )}

          {/* ── СБРОС: EMAIL ── */}
          {step === 'reset_email' && (
            <>
              <button onClick={() => setStep('login')}
                style={{ ...btnBase, background: 'none', border: 'none', color: theme.dim, fontSize: '0.8rem', padding: 0, marginBottom: 20 }}>
                ← Назад
              </button>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: theme.accent, marginBottom: 8 }}>Сброс пароля</h2>
              <p style={{ fontSize: '0.85rem', color: theme.dim, marginBottom: 24 }}>Введите email — вышлем код подтверждения</p>

              {resetError && (
                <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: '0.82rem', color: '#ff6b6b' }}>
                  {resetError}
                </div>
              )}

              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: '0.75rem', color: theme.dim, letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>EMAIL</label>
                <input type="email" placeholder="you@example.com" value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleResetRequest()}
                  style={inputStyle} />
              </div>

              <button onClick={handleResetRequest} disabled={resetLoading} style={primaryBtn(resetLoading)}>
                {resetLoading ? 'ОТПРАВЛЯЕМ...' : 'ПОЛУЧИТЬ КОД'}
              </button>
            </>
          )}

          {/* ── СБРОС: КОД ── */}
          {step === 'reset_code' && (
            <>
              <button onClick={() => setStep('reset_email')}
                style={{ ...btnBase, background: 'none', border: 'none', color: theme.dim, fontSize: '0.8rem', padding: 0, marginBottom: 20 }}>
                ← Назад
              </button>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: theme.accent, marginBottom: 8 }}>Введите код</h2>
              <p style={{ fontSize: '0.85rem', color: theme.dim, marginBottom: 28 }}>
                Код отправлен на <span style={{ color: theme.accent }}>{resetEmail}</span>
              </p>

              {resetError && (
                <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: '0.82rem', color: '#ff6b6b' }}>
                  {resetError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
                {resetCode.map((digit, i) => (
                  <input key={i} id={`code-${i}`} type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={e => handleCodeInput(i, e.target.value)}
                    onKeyDown={e => handleCodeKeyDown(i, e)}
                    style={{ width: 48, height: 56, background: theme.card, border: `1px solid ${digit ? theme.accent : theme.secondary}`, borderRadius: 12, color: theme.accent, fontSize: '1.4rem', fontWeight: 700, textAlign: 'center', outline: 'none', transition: '0.15s' }} />
                ))}
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: '0.75rem', color: theme.dim, letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>НОВЫЙ ПАРОЛЬ</label>
                <input type="password" placeholder="Минимум 8 символов" value={resetNewPassword}
                  onChange={e => setResetNewPassword(e.target.value)} style={inputStyle} />
              </div>

              <button onClick={handleResetConfirm} disabled={resetLoading} style={primaryBtn(resetLoading)}>
                {resetLoading ? 'ПРОВЕРЯЕМ...' : 'СМЕНИТЬ ПАРОЛЬ'}
              </button>
            </>
          )}

          {/* ── СБРОС: ГОТОВО ── */}
          {step === 'reset_done' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>✓</div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: theme.accent, marginBottom: 8 }}>Пароль изменён</h2>
              <p style={{ fontSize: '0.85rem', color: theme.dim, marginBottom: 28 }}>Войдите с новым паролем</p>
              <button
                onClick={() => { setStep('login'); setResetCode(['', '', '', '', '', '']); setResetNewPassword('') }}
                style={{ ...primaryBtn(false), background: theme.accent, color: theme.navbar }}>
                ВОЙТИ
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

export default Login