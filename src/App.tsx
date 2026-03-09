import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface Plan {
  id: number
  name: string
  display_name: string | null
  price_per_month: number
  months: number
  final_price: number
  tier_level: number
  discount_percent: number
}

import NavbarPublic from './components/NavbarPublic'
import NavbarAuth from './components/NavbarAuth'
import FooterComponent from './components/Footer'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Plans from './pages/Plans'
import EmailVerify from './pages/EmailVerify'
import FaqPage from './pages/Faq'
import SupportPage from './pages/Support'
import NotFound from './pages/NotFound'
import PrivateRoute from './components/PrivateRoute'

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
  greenDim:  'rgba(0,229,160,0.12)',
  greenGlow: 'rgba(0,229,160,0.25)',
}

function isTokenValid(): boolean {
  const token = localStorage.getItem('access_token')
  if (!token) return false
  try {
    const p = JSON.parse(atob(token.split('.')[1]))
    return p.exp > Math.floor(Date.now() / 1000)
  } catch { return false }
}

function getEmailFromToken(): string | null {
  const token = localStorage.getItem('access_token')
  if (!token) return null
  try {
    const p = JSON.parse(atob(token.split('.')[1]))
    return p.sub || p.email || null
  } catch { return null }
}

// ─── SVG фон — сетка точек ──────────────────────────────────────────
function DotGrid() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.06)" />
          </pattern>
          <radialGradient id="fade" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="100%" stopColor={C.bg} />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
        <rect width="100%" height="100%" fill="url(#fade)" />
      </svg>
    </div>
  )
}

// ─── Пульсирующий индикатор статуса ─────────────────────────────────
function StatusBadge() {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.greenDim, border: `1px solid rgba(0,229,160,0.2)`, borderRadius: 20, padding: '5px 12px' }}>
      <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
        <span style={{
          position: 'absolute', inset: 0, borderRadius: '50%', background: C.green,
          animation: 'ping 1.8s cubic-bezier(0,0,0.2,1) infinite',
        }} />
        <span style={{ position: 'relative', display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: C.green }} />
      </span>
      <span style={{ fontSize: '0.7rem', color: C.green, fontWeight: 600, letterSpacing: '0.08em' }}>СИСТЕМА АКТИВНА</span>
    </div>
  )
}

// ─── Главная страница ────────────────────────────────────────────────
function Home() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState<Plan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const loggedIn = isTokenValid()
  const email = loggedIn ? getEmailFromToken() : null

  function handleLogout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    navigate('/')
    window.location.reload()
  }

  useEffect(() => {
    fetch(`${API}/subscriptions/plans`)
      .then(r => r.json())
      .then(d => setPlans(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setPlansLoading(false))
  }, [])

  const features = [
    {
      icon: '🛡️',
      title: 'Цифровой суверенитет',
      desc: 'Ваша активность защищена от несанкционированного анализа третьими лицами и сетевыми посредниками',
    },
    {
      icon: '👁️',
      title: 'Нулевое логирование',
      desc: 'Мы технически не можем раскрыть ваши данные — их просто не существует в наших системах',
    },
    {
      icon: '⚡',
      title: 'Мгновенный отклик',
      desc: 'Без задержек в передаче данных — протоколы динамического туннелирования адаптируются к любой сетевой среде',
    },
    {
      icon: '🔄',
      title: 'Невидимое обновление',
      desc: 'Конфигурация обновляется автоматически. Вы не замечаете процесс — он просто работает',
    },
    {
      icon: '🖥️',
      title: 'Любое устройство',
      desc: 'Android, iOS, Windows, macOS, Linux — одна подписка, неограниченные сценарии использования',
    },
    {
      icon: '🌍',
      title: 'Глобальная сеть узлов',
      desc: 'Серверы в нескольких странах с автоматическим выбором оптимального маршрута',
    },
  ]

  const tierMap = new Map<number, Plan>()
  plans.forEach(p => { if (!tierMap.has(p.tier_level)) tierMap.set(p.tier_level, p) })
  const previewPlans = Array.from(tierMap.values()).slice(0, 3)

  // Определяем "рекомендуемый" тариф — средний по цене
  const sorted = [...previewPlans].sort((a, b) => a.final_price - b.final_price)
  const featuredId = sorted.length >= 2 ? sorted[Math.floor(sorted.length / 2)]?.id : null

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: '"DM Sans", system-ui, sans-serif', color: C.accent, display: 'flex', flexDirection: 'column' }}>
      {loggedIn
        ? <NavbarAuth active="dashboard" onLogout={handleLogout} />
        : <NavbarPublic scrollEffect active="home" />}

      <main style={{ flex: 1 }}>

        {/* ── HERO ── */}
        <section style={{ position: 'relative', background: C.surface, borderBottom: `1px solid ${C.border}`, overflow: 'hidden' }}>
          <DotGrid />

          {/* Градиентное свечение снизу */}
          <div style={{
            position: 'absolute', bottom: -80, left: '50%', transform: 'translateX(-50%)',
            width: 600, height: 300,
            background: `radial-gradient(ellipse, ${C.greenGlow} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', maxWidth: 1140, margin: '0 auto', padding: 'clamp(56px, 10vw, 100px) 20px clamp(48px, 8vw, 90px)', textAlign: 'center' }}>

            <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'center' }}>
              <StatusBadge />
            </div>

            <h1 className="animate-up" style={{ fontSize: 'clamp(2.4rem, 6vw, 4rem)', fontWeight: 900, color: C.accent, lineHeight: 1.05, marginBottom: 24, letterSpacing: '-0.02em' }}>
              Ваши данные —<br />
              <span style={{ color: C.green }}>только ваши</span>
            </h1>

            <p style={{ fontSize: 'clamp(1rem, 2vw, 1.15rem)', color: C.dimHi, lineHeight: 1.85, marginBottom: 44, maxWidth: 540, margin: '0 auto 44px' }}>
              Privax шифрует трафик на лету, незаметно для вас.<br />
              Никаких логов — и это не политика, это архитектура.
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate(loggedIn ? '/dashboard' : '/plans')}
                style={{ background: C.green, color: C.bg, border: 'none', borderRadius: 14, padding: '16px 36px', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.03em', boxShadow: `0 0 28px rgba(0,229,160,0.5), 0 0 10px rgba(0,229,160,0.3)`, transition: 'box-shadow 0.3s, transform 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 44px rgba(0,229,160,0.7), 0 0 18px rgba(0,229,160,0.5)`; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 0 28px rgba(0,229,160,0.5), 0 0 10px rgba(0,229,160,0.3)`; e.currentTarget.style.transform = 'none' }}>
                Посмотреть →
              </button>
              <button
                onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}
                style={{ background: 'transparent', color: C.accent, border: `1px solid ${C.borderHi}`, borderRadius: 14, padding: '16px 36px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 0.2s, background 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderHi; e.currentTarget.style.background = 'transparent' }}>
                Посмотреть тарифы
              </button>
            </div>

            {/* Мини-статистика */}
            <div className="hero-stats" style={{ display: 'flex', justifyContent: 'center', gap: 40, marginTop: 60, flexWrap: 'wrap' }}>
              {[
                { val: '0', label: 'логов активности' },
                { val: '99.9%', label: 'uptime серверов' },
                { val: 'от 10ms', label: 'задержка' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: C.green, letterSpacing: '-0.02em' }}>{s.val}</div>
                  <div style={{ fontSize: '0.75rem', color: C.dim, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── ВОЗМОЖНОСТИ ── */}
        <section id="features" style={{ padding: '100px 24px 88px' }}>
          <div style={{ maxWidth: 1140, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <div style={{ fontSize: '0.62rem', color: C.green, letterSpacing: '0.28em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>Возможности</div>
              <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, color: C.accent, letterSpacing: '-0.02em' }}>Почему Privax</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
              {features.map((f, i) => (
                <div key={i} className="feature-card" style={{
                  background: C.card, borderRadius: 20, padding: '28px 24px',
                  border: `1px solid ${C.border}`,
                  display: 'flex', gap: 18, alignItems: 'flex-start',
                  transition: 'border-color 0.2s, transform 0.2s',
                  animationDelay: `${i * 0.07}s`,
                }}>
                  <span style={{ fontSize: '1.4rem', flexShrink: 0, marginTop: 2 }}>{f.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: C.accent, marginBottom: 6 }}>{f.title}</div>
                    <div style={{ fontSize: '0.85rem', color: C.dimHi, lineHeight: 1.65 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── ТАРИФЫ ── */}
        <section id="plans" style={{ padding: '32px 24px 120px' }}>
          <div style={{ maxWidth: 1140, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{ fontSize: '0.62rem', color: C.green, letterSpacing: '0.28em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>Тарифы</div>
              <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, color: C.accent, letterSpacing: '-0.02em', marginBottom: 10 }}>Выберите свой уровень защиты</h2>
              <p style={{ fontSize: '0.92rem', color: C.dimHi }}>Нулевое логирование · Автообновление · Отмена в любой момент</p>
            </div>

            {plansLoading ? (
              <div style={{ background: C.card, borderRadius: 20, padding: '48px', textAlign: 'center', color: C.dim, border: `1px solid ${C.border}` }}>
                Загрузка тарифов...
              </div>
            ) : previewPlans.length === 0 ? null : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginBottom: 24 }}>
                  {previewPlans.map((plan) => {
                    const featured = plan.id === featuredId
                    return (
                      <div key={plan.id}
                        className={featured ? 'plan-card-featured' : ''}
                        style={{
                          background: C.card, borderRadius: 22, padding: '32px 28px',
                          border: `1px solid ${C.border}`,
                          display: 'flex', flexDirection: 'column', gap: 0,
                          position: 'relative', transition: 'transform 0.2s',
                        }}>

                        {featured && (
                          <div style={{
                            position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
                            background: C.green, color: C.bg, fontSize: '0.62rem', fontWeight: 800,
                            letterSpacing: '0.15em', padding: '4px 14px', borderRadius: '0 0 10px 10px',
                            textTransform: 'uppercase',
                          }}>
                            Рекомендуем
                          </div>
                        )}

                        <div style={{ marginBottom: 20 }}>
                          <div style={{ fontSize: '0.72rem', color: C.dim, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.1em', marginBottom: 8 }}>
                            {plan.display_name || plan.name}
                          </div>
                          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: featured ? C.green : C.accent, letterSpacing: '-0.02em', lineHeight: 1 }}>
                            {plan.final_price} ₽
                          </div>
                          <div style={{ fontSize: '0.82rem', color: C.dim, marginTop: 4 }}>
                            за {plan.months === 1 ? '1 месяц' : plan.months === 3 ? '3 месяца' : plan.months === 12 ? '1 год' : `${plan.months} мес`}
                          </div>
                          {plan.discount_percent > 0 && (
                            <div style={{ marginTop: 10, fontSize: '0.72rem', background: C.greenDim, color: C.green, border: `1px solid rgba(0,229,160,0.25)`, borderRadius: 6, padding: '3px 10px', display: 'inline-block', fontWeight: 700 }}>
                              Экономия {plan.discount_percent}%
                            </div>
                          )}
                        </div>

                        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, marginBottom: 20 }}>
                          {['Нулевое логирование', 'Автообновление конфигурации', 'Все платформы', 'Поддержка 24/7'].map(f => (
                            <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                              <span style={{ color: C.green, fontSize: '0.75rem', fontWeight: 800 }}>✓</span>
                              <span style={{ fontSize: '0.82rem', color: C.dimHi }}>{f}</span>
                            </div>
                          ))}
                        </div>

                        <button onClick={() => navigate(loggedIn ? '/plans' : '/login')}
                          style={{
                            marginTop: 'auto',
                            background: C.green,
                            color: C.bg,
                            border: 'none',
                            borderRadius: 12, padding: '14px 0',
                            fontWeight: 700, fontSize: '0.88rem',
                            cursor: 'pointer', fontFamily: 'inherit',
                            textAlign: 'center',
                            transition: 'box-shadow 0.2s, transform 0.15s',
                            boxShadow: featured ? `0 0 28px rgba(0,229,160,0.5)` : `0 0 16px rgba(0,229,160,0.28)`,
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.boxShadow = `0 0 36px rgba(0,229,160,0.65)`
                            e.currentTarget.style.transform = 'translateY(-1px)'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.boxShadow = featured ? `0 0 28px rgba(0,229,160,0.5)` : `0 0 16px rgba(0,229,160,0.28)`
                            e.currentTarget.style.transform = 'none'
                          }}>
                          Выбрать план →
                        </button>
                      </div>
                    )
                  })}
                </div>
                <div style={{ textAlign: 'center', marginTop: 32, paddingBottom: 16 }}>
                  <button onClick={() => navigate('/plans')}
                    style={{ background: C.green, color: C.bg, border: 'none', borderRadius: 12, padding: '11px 32px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'box-shadow 0.2s, transform 0.15s', boxShadow: `0 0 20px rgba(0,229,160,0.35)` }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 32px rgba(0,229,160,0.6)`; e.currentTarget.style.transform = 'translateY(-1px)' }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 0 20px rgba(0,229,160,0.35)`; e.currentTarget.style.transform = 'none' }}>
                    Все тарифы и детали →
                  </button>
                </div>
              </>
            )}
          </div>
        </section>

      </main>

      <FooterComponent />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<EmailVerify />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/support" element={<PrivateRoute><SupportPage /></PrivateRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App