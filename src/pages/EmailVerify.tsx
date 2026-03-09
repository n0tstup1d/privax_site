import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const theme = {
  bg: '#e1e3e4',
  navbar: '#16191b',
  card: '#1c1f22',
  accent: '#ffffff',
  secondary: '#3d4449',
  dim: '#9aa3a8',
}

const btnBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: '0.2s',
}

function EmailVerify() {
  const navigate = useNavigate()
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [shaking, setShaking] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Если уже верифицирован — сразу в дашборд
  useEffect(() => {
    if (localStorage.getItem('email_verified') === 'true') {
      navigate('/dashboard')
      return
    }
    // Нет токена — на логин
    if (!localStorage.getItem('access_token')) {
      navigate('/login')
      return
    }
    // Фокус на первое поле
    setTimeout(() => inputRefs.current[0]?.focus(), 100)
  }, [])

  function handleInput(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const next = [...digits]
    next[index] = value.slice(-1)
    setDigits(next)
    setError('')

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Проверяем когда заполнены все 6
    const filled = next.join('')
    if (filled.length === 6) {
      verify(filled)
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits]
        next[index] = ''
        setDigits(next)
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus()
  }

  // Вставка из буфера — удобно если код скопировали
  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = ['', '', '', '', '', '']
    pasted.split('').forEach((ch, i) => { next[i] = ch })
    setDigits(next)
    const focusIndex = Math.min(pasted.length, 5)
    inputRefs.current[focusIndex]?.focus()
    if (pasted.length === 6) verify(pasted)
  }

  function verify(code: string) {
    // Заглушка: любые 6 цифр — впускаем
    if (code.length === 6) {
      localStorage.setItem('email_verified', 'true')
      navigate('/dashboard')
    }
  }

  function handleResend() {
    // Заглушка
    setDigits(['', '', '', '', '', ''])
    setError('')
    setTimeout(() => inputRefs.current[0]?.focus(), 50)
  }

  function handleSubmit() {
    const code = digits.join('')
    if (code.length < 6) {
      setError('Введите все 6 цифр')
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
      return
    }
    verify(code)
  }

  const email = (() => {
    try {
      const token = localStorage.getItem('access_token')!
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.email || payload.sub || ''
    } catch { return '' }
  })()

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0) }
          20%       { transform: translateX(-8px) }
          40%       { transform: translateX(8px) }
          60%       { transform: translateX(-5px) }
          80%       { transform: translateX(5px) }
        }
        .shake { animation: shake 0.4s ease; }
      `}</style>

      <nav style={{
        background: theme.navbar,
        display: 'flex',
        alignItems: 'center',
        padding: '0 32px',
        height: 68,
        borderBottom: `1px solid ${theme.secondary}`,
      }}>
        <a href="/" style={{ fontSize: '1.3rem', fontWeight: 800, color: theme.accent, textDecoration: 'none' }}>
          PRIVAX
        </a>
      </nav>

      <main style={{ maxWidth: 480, margin: '0 auto', padding: '40px 16px' }}>
        <div style={{ background: theme.navbar, borderRadius: 28, padding: '40px 28px', border: `1px solid ${theme.secondary}`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* Иконка */}
          <div style={{
            width: 64, height: 64,
            background: theme.card,
            border: `1px solid ${theme.secondary}`,
            borderRadius: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem',
            marginBottom: 24,
          }}>
            ✉️
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: theme.accent, marginBottom: 10, textAlign: 'center' }}>
            Подтвердите почту
          </h2>

          <p style={{ fontSize: '0.85rem', color: theme.dim, textAlign: 'center', lineHeight: 1.6, marginBottom: 32, maxWidth: 300 }}>
            Мы отправили 6-значный код на{' '}
            {email
              ? <span style={{ color: theme.accent, fontWeight: 600 }}>{email}</span>
              : 'вашу почту'
            }
          </p>

          {/* Поля для цифр */}
          <div
            className={shaking ? 'shake' : ''}
            style={{ display: 'flex', gap: 10, marginBottom: 12 }}
            onPaste={handlePaste}
          >
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleInput(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                style={{
                  width: 52,
                  height: 60,
                  background: theme.card,
                  border: `1.5px solid ${digit ? theme.accent : theme.secondary}`,
                  borderRadius: 14,
                  color: theme.accent,
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  outline: 'none',
                  transition: '0.15s',
                  caretColor: 'transparent',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = theme.accent }}
                onBlur={e => { if (!digit) e.currentTarget.style.borderColor = theme.secondary }}
              />
            ))}
          </div>

          {/* Ошибка */}
          {error && (
            <div style={{ fontSize: '0.8rem', color: '#ff6b6b', marginBottom: 16, textAlign: 'center' }}>
              {error}
            </div>
          )}

          {/* Кнопка подтвердить */}
          <button
            onClick={handleSubmit}
            style={{
              ...btnBase,
              width: '100%',
              background: theme.accent,
              color: theme.navbar,
              border: `1px solid ${theme.accent}`,
              borderRadius: 14,
              padding: '16px 0',
              fontWeight: 800,
              fontSize: '0.85rem',
              letterSpacing: '0.15em',
              marginTop: 8,
              marginBottom: 16,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.accent }}
            onMouseLeave={e => { e.currentTarget.style.background = theme.accent; e.currentTarget.style.color = theme.navbar }}
          >
            ПОДТВЕРДИТЬ
          </button>

          {/* Повторная отправка */}
          <p style={{ fontSize: '0.82rem', color: theme.dim, textAlign: 'center' }}>
            Не получили код?{' '}
            <button
              onClick={handleResend}
              style={{ background: 'none', border: 'none', color: theme.accent, fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', padding: 0 }}
            >
              Отправить снова
            </button>
          </p>

        </div>
      </main>
    </div>
  )
}

export default EmailVerify