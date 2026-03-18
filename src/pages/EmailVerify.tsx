import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Footer from '../components/Footer'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const C = {
  bg:        '#0d0f10',
  surface:   '#111416',
  card:      '#161a1d',
  border:    '#242a2e',
  borderHi:  '#2e3840',
  accent:    '#ffffff',
  dim:       '#8a9aaa',
  dimHi:     '#b0c0cc',
  green:     '#00e5a0',
  greenDim:  'rgba(0,229,160,0.1)',
  greenGlow: 'rgba(0,229,160,0.25)',
  red:       '#ff5e5e',
}

export default function EmailVerify() {
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = (location.state as any)?.from || '/dashboard'
  const [digits, setDigits]       = useState(['', '', '', '', '', ''])
  const [error, setError]         = useState('')
  const [shaking, setShaking]     = useState(false)
  const [success, setSuccess]     = useState(false)
  const [resent, setResent]       = useState(false)
  const [countdown, setCountdown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const email = (() => {
    try {
      const token = localStorage.getItem('access_token')!
      const p = JSON.parse(atob(token.split('.')[1]))
      return p.email || p.sub || ''
    } catch { return '' }
  })()

  useEffect(() => {
    if (localStorage.getItem('email_verified') === 'true') { navigate(redirectTo, { replace: true }); return }
    if (!localStorage.getItem('access_token'))             { navigate('/login');     return }
    setTimeout(() => inputRefs.current[0]?.focus(), 120)
  }, [])

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  function handleInput(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const next = [...digits]; next[index] = value.slice(-1); setDigits(next)
    setError('')
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
    const filled = next.join('')
    if (filled.length === 6) verify(filled)
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits]; next[index] = ''; setDigits(next)
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    }
    if (e.key === 'ArrowLeft'  && index > 0) inputRefs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus()
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = ['', '', '', '', '', '']
    pasted.split('').forEach((ch, i) => { next[i] = ch })
    setDigits(next)
    inputRefs.current[Math.min(pasted.length, 5)]?.focus()
    if (pasted.length === 6) verify(pasted)
  }

  function verify(code: string) {
    if (code.length === 6) {
      setSuccess(true)
      setTimeout(() => {
        localStorage.setItem('email_verified', 'true')
        navigate(redirectTo, { replace: true })
      }, 700)
    }
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

  function handleResend() {
    setDigits(['', '', '', '', '', ''])
    setError('')
    setResent(true)
    setCountdown(60)
    setTimeout(() => { setResent(false); inputRefs.current[0]?.focus() }, 2000)
  }

  const allFilled = digits.every(d => d !== '')

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: '"DM Sans", system-ui, sans-serif', color: C.accent, display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes fadeUp  { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shake   { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
        @keyframes ping    { 75%,100%{transform:scale(2.2);opacity:0} }
        @keyframes checkIn { from{transform:scale(0.5);opacity:0} to{transform:scale(1);opacity:1} }
        .digit-input:focus  { border-color: ${C.green} !important; box-shadow: 0 0 0 3px rgba(0,229,160,0.12); }
        .digit-input.filled { border-color: ${C.green} !important; }
        .digit-input.error  { border-color: rgba(255,94,94,0.6) !important; }
        .shake              { animation: shake 0.4s ease; }
      `}</style>


      <main style={{ flex: 1, maxWidth: 460, margin: '0 auto', width: '100%', padding: '72px 24px 80px' }}>
        <div style={{ background: C.surface, borderRadius: 24, padding: '44px 36px', border: `1px solid ${C.border}`, animation: 'fadeUp 0.5s ease both', textAlign: 'center' }}>

          <div style={{
            width: 68, height: 68,
            background: success ? C.greenDim : C.card,
            border: `1px solid ${success ? 'rgba(0,229,160,0.3)' : C.border}`,
            borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.9rem', margin: '0 auto 24px',
            transition: 'background 0.3s, border-color 0.3s',
            boxShadow: success ? `0 0 24px ${C.greenGlow}` : 'none',
          }}>
            <span style={{ animation: success ? 'checkIn 0.3s ease' : 'none' }}>
              {success ? '✓' : '✉️'}
            </span>
          </div>

          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: C.accent, marginBottom: 10, letterSpacing: '-0.01em' }}>
            {success ? 'Почта подтверждена!' : 'Подтвердите почту'}
          </h1>

          <p style={{ fontSize: '0.88rem', color: C.dim, lineHeight: 1.65, maxWidth: 320, margin: '0 auto 32px' }}>
            {success
              ? <span style={{ color: C.green }}>Переходим в личный кабинет...</span>
              : <>Мы отправили 6-значный код на{' '}
                  {email ? <span style={{ color: C.accent, fontWeight: 600 }}>{email}</span> : 'вашу почту'}
                </>
            }
          </p>

          {!success && (
            <>
              <div className={shaking ? 'shake' : ''} style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: error ? 12 : 24 }} onPaste={handlePaste}>
                {digits.map((digit, i) => (
                  <input key={i} ref={el => { inputRefs.current[i] = el }}
                    className={`digit-input${digit ? ' filled' : ''}${error ? ' error' : ''}`}
                    type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={e => handleInput(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    style={{ width: 48, height: 58, background: C.card, border: `1.5px solid ${digit ? C.green : C.border}`, borderRadius: 13, color: C.accent, fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s', caretColor: 'transparent', fontFamily: 'monospace' }}
                  />
                ))}
              </div>

              {error && (
                <div style={{ fontSize: '0.8rem', color: C.red, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <span>⚠</span> {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 24 }}>
                {digits.map((d, i) => (
                  <div key={i} style={{ width: 20, height: 3, borderRadius: 2, background: d ? C.green : C.border, transition: 'background 0.2s' }} />
                ))}
              </div>

              <button onClick={handleSubmit} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: allFilled ? C.green : C.card, color: allFilled ? C.bg : C.dim, border: `1px solid ${allFilled ? C.green : C.border}`, borderRadius: 13, padding: '15px 0', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s, color 0.2s, box-shadow 0.2s', boxShadow: allFilled ? `0 0 20px ${C.greenGlow}` : 'none', marginBottom: 20 }}>
                Подтвердить →
              </button>

              <div style={{ fontSize: '0.83rem', color: C.dim }}>
                {resent ? (
                  <span style={{ color: C.green }}>✓ Код отправлен повторно</span>
                ) : countdown > 0 ? (
                  <span>Повторная отправка через <span style={{ color: C.dimHi, fontWeight: 600 }}>{countdown}с</span></span>
                ) : (
                  <>Не пришло письмо?{' '}
                    <button onClick={handleResend} style={{ background: 'none', border: 'none', color: C.accent, fontWeight: 700, fontSize: '0.83rem', cursor: 'pointer', padding: 0 }}>
                      Отправить снова
                    </button>
                  </>
                )}
              </div>

              <div style={{ marginTop: 24, padding: '14px 16px', background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, display: 'flex', gap: 10, alignItems: 'flex-start', textAlign: 'left' }}>
                <span style={{ fontSize: '0.9rem', flexShrink: 0, marginTop: 1 }}>💡</span>
                <p style={{ fontSize: '0.77rem', color: C.dim, lineHeight: 1.55, margin: 0 }}>
                  Если письмо не пришло, проверьте папку <span style={{ color: C.dimHi }}>Спам</span> или <span style={{ color: C.dimHi }}>Промоакции</span>. Код действителен 15 минут.
                </p>
              </div>
            </>
          )}

        </div>
      </main>

      <Footer />
    </div>
  )
}