import { useToast } from '../components/Toast'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import NavbarPublic from '../components/NavbarPublic'
import Footer from '../components/Footer'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const C = {
  bg:        '#0d0f10',
  surface:   '#111416',
  card:      '#161a1d',
  border:    '#242a2e',
  borderHi:  '#2e3840',
  accent:    '#ffffff',
  dim:       '#6b7a84',
  dimHi:     '#9aaab4',
  green:     '#00e5a0',
  greenDim:  'rgba(0,229,160,0.1)',
  greenGlow: 'rgba(0,229,160,0.25)',
  red:       '#ff5e5e',
  redDim:    'rgba(255,94,94,0.1)',
}

function strengthScore(pw: string): number {
  if (!pw) return 0
  let s = 0
  if (pw.length >= 8)  s++
  if (pw.length >= 12) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return s
}

function StrengthBar({ password }: { password: string }) {
  const score = strengthScore(password)
  if (!password) return null
  const labels = ['', 'Очень слабый', 'Слабый', 'Средний', 'Надёжный', 'Отличный']
  const colors = ['', C.red, C.red, '#f59e0b', C.green, C.green]
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= score ? colors[score] : C.border,
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <div style={{ fontSize: '0.72rem', color: colors[score] }}>{labels[score]}</div>
    </div>
  )
}

const perks = [
  { icon: '🛡️', text: 'Шифрование трафика на уровне ядра' },
  { icon: '👁️', text: 'Нулевое логирование активности' },
  { icon: '🔄', text: 'Автоматическое обновление конфигурации' },
  { icon: '📱', text: 'Поддержка всех платформ' },
]

export default function Register() {
  const navigate = useNavigate()
  const toast = useToast()
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [password2, setPassword2] = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [showPw2, setShowPw2]     = useState(false)
  const [loading, setLoading]     = useState(false)

  useEffect(() => {
    try {
      const token = localStorage.getItem('access_token')
      if (token) {
        const p = JSON.parse(atob(token.split('.')[1]))
        if (p.exp > Date.now() / 1000) navigate('/dashboard')
      }
    } catch {}
  }, [])

  async function handleRegister() {
    if (!email || !password || !password2) { toast.error('Заполните все поля'); return }
    if (password !== password2) { toast.error('Пароли не совпадают'); return }
    if (password.length < 8)    { toast.error('Минимум 8 символов'); return }
    setLoading(true)
    try {
      const res  = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.detail || 'Ошибка регистрации'); return }
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      localStorage.removeItem('email_verified')
      navigate('/verify')
    } catch { toast.error('Сервер недоступен. Попробуйте позже.') }
    finally  { setLoading(false) }
  }

  const inputBase: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: 12, padding: '13px 16px',
    color: C.accent, fontSize: '0.93rem',
    outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: '"DM Sans", system-ui, sans-serif', color: C.accent, display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .auth-input:focus { border-color: ${C.green} !important; box-shadow: 0 0 0 3px rgba(0,229,160,0.15), 0 0 12px rgba(0,229,160,0.1) !important; }
        .auth-input::placeholder { color: ${C.dim}; }
        .auth-input:-webkit-autofill { -webkit-box-shadow: 0 0 0 40px ${C.card} inset !important; -webkit-text-fill-color: ${C.accent} !important; }
      `}</style>

      <NavbarPublic active="register" />

      <main style={{ flex: 1, maxWidth: 1000, margin: '0 auto', width: '100%', padding: '40px 16px 64px', display: 'flex', gap: 48, alignItems: 'flex-start', justifyContent: 'center' }}>

        {/* Левая колонка — преимущества (только десктоп) */}
        <div style={{ flex: 1, maxWidth: 380, paddingTop: 16, display: 'none' }} className="reg-perks">
          <div style={{ fontSize: '0.62rem', color: C.green, letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 16 }}>Что вы получаете</div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: C.accent, lineHeight: 1.15, marginBottom: 10, letterSpacing: '-0.02em' }}>
            Защита<br />без компромиссов
          </h2>
          <p style={{ fontSize: '0.88rem', color: C.dimHi, lineHeight: 1.7, marginBottom: 36 }}>
            Privax шифрует трафик на лету, незаметно для вас. Никаких логов — это не политика, это архитектура.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {perks.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 36, height: 36, background: C.greenDim, border: `1px solid rgba(0,229,160,0.2)`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                  {p.icon}
                </div>
                <div style={{ fontSize: '0.85rem', color: C.dimHi, lineHeight: 1.5, paddingTop: 8 }}>{p.text}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Форма */}
        <div style={{ width: '100%', maxWidth: 440, animation: 'fadeUp 0.5s ease both' }}>
          <div style={{ background: C.surface, borderRadius: 24, padding: 'clamp(24px, 5vw, 40px) clamp(20px, 5vw, 36px)', border: `1px solid ${C.border}` }}>

            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: C.accent, marginBottom: 6, letterSpacing: '-0.01em' }}>Создать аккаунт</h1>
              <p style={{ fontSize: '0.88rem', color: C.dim, lineHeight: 1.5 }}>Присоединитесь к Privax — это займёт минуту</p>
            </div>

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: '0.8rem', color: C.dimHi, fontWeight: 600, display: 'block', marginBottom: 8 }}>Email</label>
              <input className="auth-input" type="email" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRegister()}
                style={inputBase} />
            </div>

            {/* Пароль */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: '0.8rem', color: C.dimHi, fontWeight: 600, display: 'block', marginBottom: 8 }}>Пароль</label>
              <div style={{ position: 'relative' }}>
                <input className="auth-input" type={showPw ? 'text' : 'password'} maxLength={30} placeholder="Минимум 8 символов" value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRegister()}
                  style={{ ...inputBase, paddingRight: 44 }} />
                <button onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.dim, fontSize: '1rem', padding: 0, lineHeight: 1 }}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
              <StrengthBar password={password} />
            </div>

            {/* Повтор пароля */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: '0.8rem', color: C.dimHi, fontWeight: 600, display: 'block', marginBottom: 8 }}>Подтвердите пароль</label>
              <div style={{ position: 'relative' }}>
                <input className="auth-input" type={showPw2 ? 'text' : 'password'} maxLength={30} placeholder="Повторите пароль" value={password2}
                  onChange={e => setPassword2(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRegister()}
                  style={{
                    ...inputBase, paddingRight: 44,
                    borderColor: password2 && password !== password2 ? 'rgba(255,94,94,0.5)' : C.border,
                  }} />
                <button onClick={() => setShowPw2(v => !v)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.dim, fontSize: '1rem', padding: 0, lineHeight: 1 }}>
                  {showPw2 ? '🙈' : '👁'}
                </button>
              </div>
              {password2 && password !== password2 && (
                <div style={{ fontSize: '0.75rem', color: C.red, marginTop: 5 }}>Пароли не совпадают</div>
              )}
            </div>

            {/* Кнопка */}
            <button onClick={handleRegister} disabled={loading}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: loading ? 'transparent' : C.green,
                color: loading ? C.green : C.bg,
                border: `1px solid ${C.green}`,
                borderRadius: 13, padding: '15px 0',
                fontWeight: 800, fontSize: '0.95rem',
                cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                transition: 'background 0.2s, box-shadow 0.2s',
                boxShadow: loading ? 'none' : `0 0 20px ${C.greenGlow}`,
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.boxShadow = `0 0 32px ${C.greenGlow}`; e.currentTarget.style.background = C.green } }}
              onMouseLeave={e => { if (!loading) { e.currentTarget.style.boxShadow = `0 0 20px ${C.greenGlow}`; e.currentTarget.style.background = C.green } }}>
              {loading ? 'Создаём аккаунт...' : 'Зарегистрироваться →'}
            </button>

            {/* Микро-текст доверия */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center', marginTop: 14 }}>
              <span style={{ fontSize: '0.9rem' }}>🔒</span>
              <span style={{ fontSize: '0.75rem', color: C.dim, lineHeight: 1.4, textAlign: 'center' }}>
                Пароль хранится в зашифрованном виде. Мы не имеем к нему доступа.
              </span>
            </div>

            <div style={{ height: 1, background: C.border, margin: '20px 0' }} />

            <p style={{ textAlign: 'center', fontSize: '0.85rem', color: C.dim }}>
              Уже есть аккаунт?{' '}
              <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: C.accent, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>Войти</button>
            </p>
          </div>
        </div>
      </main>

      <style>{`
        @media (min-width: 720px) { .reg-perks { display: block !important; } }
      `}</style>
      <Footer />
    </div>
  )
}