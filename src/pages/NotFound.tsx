import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Footer from '../components/Footer'

const C = {
  bg: '#0d0f10', surface: '#111416', card: '#161a1d',
  border: '#242a2e', accent: '#ffffff',
  dim: '#8a9aaa', dimHi: '#b0c0cc',
  green: '#00e5a0', greenDim: 'rgba(0,229,160,0.1)', greenGlow: 'rgba(0,229,160,0.25)',
}

function isTokenValid(): boolean {
  try {
    const p = JSON.parse(atob((localStorage.getItem('access_token') || '').split('.')[1]))
    return p.exp > Date.now() / 1000
  } catch { return false }
}

export default function NotFound() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const loggedIn  = isTokenValid()
  const [dots, setDots] = useState('')

  // Анимация точек в заголовке
  useEffect(() => {
    const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500)
    return () => clearInterval(id)
  }, [])


  const suggestions = [
    { label: 'Главная',        path: '/',          icon: '🏠' },
    { label: 'Тарифы',         path: '/plans',     icon: '📦' },
    { label: 'Личный кабинет', path: '/dashboard', icon: '⚙️' },
    { label: 'Поддержка',      path: '/support',   icon: '🛡' },
  ]

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: '"DM Sans", system-ui, sans-serif', color: C.accent, display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glitch1 { 0%,100%{clip-path:inset(0 0 96% 0)} 20%{clip-path:inset(33% 0 33% 0)} 40%{clip-path:inset(80% 0 0 0)} 60%{clip-path:inset(50% 0 30% 0)} 80%{clip-path:inset(10% 0 60% 0)} }
        @keyframes glitch2 { 0%,100%{clip-path:inset(80% 0 0 0);transform:translate(-3px,0)} 25%{clip-path:inset(0 0 70% 0);transform:translate(3px,0)} 50%{clip-path:inset(40% 0 30% 0);transform:translate(-2px,0)} 75%{clip-path:inset(60% 0 10% 0);transform:translate(2px,0)} }
        .not-found-card:hover { border-color: #2e3840 !important; transform: translateY(-2px); }
      `}</style>


      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>

        {/* Глитч-цифра 404 */}
        <div style={{ position: 'relative', marginBottom: 32, animation: 'fadeUp 0.5s ease both' }}>
          <div style={{ fontSize: 'clamp(7rem, 20vw, 12rem)', fontWeight: 900, color: C.surface, letterSpacing: '-0.05em', lineHeight: 1, userSelect: 'none', position: 'relative' }}>
            {/* Основной текст */}
            <span style={{ position: 'relative', zIndex: 1, background: `linear-gradient(135deg, ${C.accent} 0%, ${C.dimHi} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              404
            </span>
            {/* Глитч слой 1 */}
            <span style={{ position: 'absolute', inset: 0, color: C.green, animation: 'glitch1 3.5s infinite', opacity: 0.6, zIndex: 2 }}>
              404
            </span>
            {/* Глитч слой 2 */}
            <span style={{ position: 'absolute', inset: 0, color: '#ff5e5e', animation: 'glitch2 3.5s infinite 0.08s', opacity: 0.4, zIndex: 2 }}>
              404
            </span>
          </div>

          {/* Зелёная линия под цифрой */}
          <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${C.green}, transparent)`, borderRadius: 2, marginTop: -8, boxShadow: `0 0 16px ${C.greenGlow}` }} />
        </div>

        {/* Текст */}
        <div style={{ animation: 'fadeUp 0.5s 0.1s ease both', marginBottom: 40 }}>
          <div style={{ fontSize: '0.65rem', color: C.green, letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 14 }}>
            СТРАНИЦА НЕ НАЙДЕНА{dots}
          </div>
          <h1 style={{ fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', fontWeight: 800, color: C.accent, letterSpacing: '-0.02em', margin: '0 0 12px' }}>
            Похоже, этого узла не существует
          </h1>
          <p style={{ fontSize: '0.9rem', color: C.dim, maxWidth: 380, margin: '0 auto', lineHeight: 1.65 }}>
            Адрес <code style={{ color: C.dimHi, background: C.card, padding: '2px 7px', borderRadius: 5, fontSize: '0.82rem', border: `1px solid ${C.border}` }}>{location.pathname}</code> не найден.
            <br />Возможно, он был перемещён или никогда не существовал.
          </p>
        </div>

        {/* Кнопки навигации */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 52, animation: 'fadeUp 0.5s 0.2s ease both' }}>
          <button onClick={() => navigate(-1)}
            style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.dimHi, borderRadius: 11, padding: '10px 20px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 0.2s, color 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.dimHi; e.currentTarget.style.color = C.accent }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.dimHi }}>
            ← Назад
          </button>
          <button onClick={() => navigate('/')}
            style={{ background: C.green, color: C.bg, border: 'none', borderRadius: 11, padding: '10px 24px', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 0 20px ${C.greenGlow}`, transition: 'box-shadow 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 32px rgba(0,229,160,0.45)`}
            onMouseLeave={e => e.currentTarget.style.boxShadow = `0 0 20px ${C.greenGlow}`}>
            На главную →
          </button>
        </div>

        {/* Быстрые ссылки */}
        <div style={{ animation: 'fadeUp 0.5s 0.3s ease both', width: '100%', maxWidth: 480 }}>
          <div style={{ fontSize: '0.68rem', color: C.dim, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 14 }}>Куда пойти</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {suggestions.map(s => (
              <button key={s.path} onClick={() => navigate(s.path)}
                className="not-found-card"
                style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'border-color 0.2s, transform 0.2s', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.1rem' }}>{s.icon}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: C.dimHi }}>{s.label}</span>
                <span style={{ marginLeft: 'auto', color: C.dim, fontSize: '0.8rem' }}>→</span>
              </button>
            ))}
          </div>
        </div>

      </main>

      <Footer />
    </div>
  )
}