import { useState, useEffect } from 'react'
import { useToast } from '../components/Toast'
import { useNavigate, useLocation } from 'react-router-dom'
import Footer from '../components/Footer'

import { apiFetch } from '../Api'
const API = import.meta.env.VITE_API_URL || '/api'

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

type Step = 'login' | 'reset_email' | 'reset_code' | 'reset_done'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)

  const [step,             setStep]             = useState<Step>('login')
  const [resetEmail,       setResetEmail]       = useState('')
  const [resetCode,        setResetCode]        = useState(['','','','','',''])
  const [resetNewPw,       setResetNewPw]       = useState('')
  const [showResetPw,      setShowResetPw]      = useState(false)
  const [resetLoading,     setResetLoading]     = useState(false)

  useEffect(() => {
    // Если уже залогинен (есть флаг) — редирект на дашборд
    if (localStorage.getItem('logged_in')) navigate('/dashboard')
  }, [])

  async function handleLogin() {
    if (!email || !password) { toast.error('Заполните все поля'); return }
    setLoading(true)
    try {
      const form = new URLSearchParams()
      form.append('username', email); form.append('password', password)
      const res  = await apiFetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form,
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.detail || 'Неверный email или пароль'); return }
      // Токены теперь в httpOnly cookies — сохраняем только безопасный флаг
      localStorage.setItem('logged_in', '1')
      const from = (location.state as any)?.from || '/dashboard'
      navigate(from, { replace: true })
    } catch { toast.error('Сервер недоступен. Попробуйте позже.') }
    finally  { setLoading(false) }
  }

  async function handleResetRequest() {
    if (!resetEmail) { toast.error('Введите email'); return }
    setResetLoading(true)
    try {
      const res = await apiFetch('/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: resetEmail }) })
      if (!res.ok) { const d = await res.json(); toast.error(d.detail || 'Ошибка'); return }
      setStep('reset_code')
    } catch { toast.error('Сервер недоступен') }
    finally  { setResetLoading(false) }
  }

  function handleCodeInput(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const next = [...resetCode]; next[index] = value.slice(-1); setResetCode(next)
    if (value && index < 5) document.getElementById(`rc-${index + 1}`)?.focus()
  }
  function handleCodeKey(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !resetCode[index] && index > 0) document.getElementById(`rc-${index - 1}`)?.focus()
  }

  async function handleResetConfirm() {
    const code = resetCode.join('')
    if (code.length < 6) { toast.error('Введите все 6 цифр'); return }
    if (!resetNewPw || resetNewPw.length < 8) { toast.error('Минимум 8 символов'); return }
    setResetLoading(true)
    try {
      const res  = await apiFetch('/auth/reset-password/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: resetEmail, code, new_password: resetNewPw }) })
      const data = await res.json()
      if (!res.ok) { toast.error(data.detail || 'Неверный или истёкший код'); return }
      setStep('reset_done')
    } catch { toast.error('Сервер недоступен') }
    finally  { setResetLoading(false) }
  }

  const inputBase: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: 12, padding: '13px 16px',
    color: C.accent, fontSize: '0.93rem',
    outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  }

  const PrimaryBtn = ({ onClick, disabled, loading, label, loadingLabel }: { onClick: () => void, disabled?: boolean, loading: boolean, label: string, loadingLabel: string }) => (
    <button onClick={onClick} disabled={disabled || loading}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: loading ? 'transparent' : C.green,
        color: loading ? C.green : C.bg,
        border: `1px solid ${C.green}`,
        borderRadius: 13, padding: '15px 0',
        fontWeight: 800, fontSize: '0.95rem',
        cursor: loading || disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
        transition: 'background 0.2s, box-shadow 0.2s',
        boxShadow: loading ? 'none' : `0 0 20px ${C.greenGlow}`,
      }}>
      {loading ? loadingLabel : label}
    </button>
  )

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: '"DM Sans", system-ui, sans-serif', color: C.accent, display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .auth-input:focus { border-color: ${C.green} !important; box-shadow: 0 0 0 3px rgba(0,229,160,0.15), 0 0 12px rgba(0,229,160,0.1) !important; }
        .auth-input::placeholder { color: ${C.dim}; }
        .auth-input:-webkit-autofill { -webkit-box-shadow: 0 0 0 40px ${C.card} inset !important; -webkit-text-fill-color: ${C.accent} !important; }
        .back-btn { background: none; border: none; color: ${C.dim}; font-size: 0.82rem; cursor: pointer; padding: 0; display: flex; align-items: center; gap: 6px; margin-bottom: 24px; transition: color 0.2s; }
        .back-btn:hover { color: ${C.accent}; }
        @media (max-width: 400px) {
          .code-inputs input { width: 38px !important; height: 46px !important; font-size: 1.2rem !important; }
          .code-inputs { gap: 6px !important; }
        }
      `}</style>


      <main style={{ flex: 1, maxWidth: 460, margin: '0 auto', width: '100%', padding: '40px 16px 64px' }}>
        <div style={{ background: C.surface, borderRadius: 24, padding: 'clamp(24px, 5vw, 40px) clamp(20px, 5vw, 36px)', border: `1px solid ${C.border}`, animation: 'fadeUp 0.5s ease both' }}>

          {/* ── ЛОГИН ── */}
          {step === 'login' && (<>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: C.accent, marginBottom: 6, letterSpacing: '-0.01em' }}>Добро пожаловать</h1>
              <p style={{ fontSize: '0.88rem', color: C.dim }}>Войдите в аккаунт Privax</p>
            </div>


            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: '0.8rem', color: C.dimHi, fontWeight: 600, display: 'block', marginBottom: 8 }}>Email</label>
              <input className="auth-input" type="email" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} style={inputBase} />
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: '0.8rem', color: C.dimHi, fontWeight: 600, display: 'block', marginBottom: 8 }}>Пароль</label>
              <div style={{ position: 'relative' }}>
                <input className="auth-input" type={showPw ? 'text' : 'password'} maxLength={30} placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  style={{ ...inputBase, paddingRight: 44 }} />
                <button onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.dim, fontSize: '1rem', padding: 0 }}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginBottom: 20 }}>
              <button onClick={() => { setStep('reset_email') }}
                style={{ background: 'none', border: 'none', color: C.dim, fontSize: '0.8rem', cursor: 'pointer', padding: 0, transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = C.accent}
                onMouseLeave={e => e.currentTarget.style.color = C.dim}>
                Забыли пароль?
              </button>
            </div>

            <PrimaryBtn onClick={handleLogin} loading={loading} label="Войти →" loadingLabel="Входим..." />

            <div style={{ display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center', marginTop: 14 }}>
              <span style={{ fontSize: '0.9rem' }}>🔒</span>
              <span style={{ fontSize: '0.75rem', color: C.dim }}>Соединение защищено. Данные зашифрованы.</span>
            </div>

            <div style={{ height: 1, background: C.border, margin: '20px 0' }} />
            <p style={{ textAlign: 'center', fontSize: '0.85rem', color: C.dim }}>
              Нет аккаунта?{' '}
              <button onClick={() => navigate('/register')} style={{ background: 'none', border: 'none', color: C.accent, textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>Зарегистрироваться</button>
            </p>
          </>)}

          {/* ── СБРОС: EMAIL ── */}
          {step === 'reset_email' && (<>
            <button className="back-btn" onClick={() => setStep('login')}>← Назад</button>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: C.accent, marginBottom: 6 }}>Сброс пароля</h1>
              <p style={{ fontSize: '0.88rem', color: C.dim }}>Введите email — вышлем код подтверждения</p>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: '0.8rem', color: C.dimHi, fontWeight: 600, display: 'block', marginBottom: 8 }}>Email</label>
              <input className="auth-input" type="email" placeholder="you@example.com" value={resetEmail}
                onChange={e => setResetEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleResetRequest()} style={inputBase} />
            </div>
            <PrimaryBtn onClick={handleResetRequest} loading={resetLoading} label="Получить код →" loadingLabel="Отправляем..." />
          </>)}

          {/* ── СБРОС: КОД ── */}
          {step === 'reset_code' && (<>
            <button className="back-btn" onClick={() => setStep('reset_email')}>← Назад</button>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: C.accent, marginBottom: 6 }}>Введите код</h1>
              <p style={{ fontSize: '0.88rem', color: C.dim }}>
                Код отправлен на <span style={{ color: C.accent, fontWeight: 600 }}>{resetEmail}</span>
              </p>
            </div>
            <div className="code-inputs" style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
              {resetCode.map((digit, i) => (
                <input key={i} id={`rc-${i}`} type="text" inputMode="numeric" maxLength={1} value={digit}
                  onChange={e => handleCodeInput(i, e.target.value)} onKeyDown={e => handleCodeKey(i, e)}
                  style={{ width: 46, height: 54, background: C.card, border: `1.5px solid ${digit ? C.green : C.border}`, borderRadius: 12, color: C.accent, fontSize: '1.4rem', fontWeight: 700, textAlign: 'center', outline: 'none', transition: '0.15s', caretColor: 'transparent', fontFamily: 'monospace' }} />
              ))}
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: '0.8rem', color: C.dimHi, fontWeight: 600, display: 'block', marginBottom: 8 }}>Новый пароль</label>
              <div style={{ position: 'relative' }}>
                <input className="auth-input" type={showResetPw ? 'text' : 'password'} maxLength={30} placeholder="Минимум 8 символов" value={resetNewPw}
                  onChange={e => setResetNewPw(e.target.value)} style={{ ...inputBase, paddingRight: 44 }} />
                <button onClick={() => setShowResetPw(v => !v)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.dim, fontSize: '1rem', padding: 0 }}>
                  {showResetPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <PrimaryBtn onClick={handleResetConfirm} loading={resetLoading} label="Сменить пароль →" loadingLabel="Проверяем..." />
          </>)}

          {/* ── СБРОС: ГОТОВО ── */}
          {step === 'reset_done' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ width: 64, height: 64, background: C.greenDim, border: `1px solid rgba(0,229,160,0.25)`, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', margin: '0 auto 20px' }}>✓</div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: C.accent, marginBottom: 8 }}>Пароль изменён</h2>
              <p style={{ fontSize: '0.88rem', color: C.dim, marginBottom: 28 }}>Теперь войдите с новым паролем</p>
              <button onClick={() => { setStep('login'); setResetCode(['','','','','','']); setResetNewPw('') }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.green, color: C.bg, border: 'none', borderRadius: 13, padding: '15px 0', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 0 20px ${C.greenGlow}` }}>
                Войти →
              </button>
            </div>
          )}

        </div>
      </main>
      <Footer />
    </div>
  )
}