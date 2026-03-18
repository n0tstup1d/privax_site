import { BrowserRouter, Routes, Route, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'

import { API, isTokenValid, clearTokens } from './Api'

interface Plan {
  id: number
  name: string
  display_name: string | null
  price_per_month: number
  duration_days: number
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
import AppsPage from './pages/Apps'
import GuidesPage from './pages/Guides'

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


function getEmailFromToken(): string | null {
  // Токены теперь в httpOnly cookies — email не доступен в JS.
  // Возвращаем null, компонент покажет заглушку.
  return null
}

// ─── SVG фон — сетка точек ──────────────────────────────────────────
function DotGrid({ id = 'a' }: { id?: string }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={`dots-${id}`} x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.9" fill="rgba(255,255,255,0.055)" />
          </pattern>
          <radialGradient id={`fade-${id}`} cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="100%" stopColor={C.bg} stopOpacity="0.95" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill={`url(#dots-${id})`} />
        <rect width="100%" height="100%" fill={`url(#fade-${id})`} />
      </svg>
    </div>
  )
}

// ─── Счётчик с анимацией ────────────────────────────────────────────
function CountUp({ to, duration = 1600, decimals = 0, prefix = '', suffix = '' }: {
  to: number; duration?: number; decimals?: number; prefix?: string; suffix?: string
}) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const start = performance.now()
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1)
          // easeOutExpo
          const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
          setVal(parseFloat((ease * to).toFixed(decimals)))
          if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [to, duration, decimals])

  return <span ref={ref}>{prefix}{val.toFixed(decimals)}{suffix}</span>
}

// ─── Хук появления в зоне видимости ────────────────────────────────
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); obs.disconnect() }
    }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

// ─── Анимированная сетка тарифов ────────────────────────────────────
function PlansGrid({ plans, featuredId, loggedIn, navigate }: {
  plans: Plan[]; featuredId: number | null; loggedIn: boolean; navigate: (p: string) => void
}) {
  const { ref, inView } = useInView(0.1)
  return (
    <div ref={ref}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginBottom: 24 }}>
        {plans.map((plan, i) => {
          const featured = plan.id === featuredId
          const delay = `${i * 0.12}s`
          return (
            <div key={plan.id}
              className={featured ? 'plan-card-featured' : ''}
              style={{
                background: C.card, borderRadius: 22, padding: '32px 28px',
                border: `1px solid ${C.border}`,
                display: 'flex', flexDirection: 'column', gap: 0,
                position: 'relative',
                opacity: inView ? 1 : 0,
                transform: inView ? 'translateY(0) scale(1)' : 'translateY(32px) scale(0.97)',
                transition: `opacity 0.6s ease ${delay}, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}, box-shadow 0.2s`,
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px) scale(1)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.35)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = 'none' }}>

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
                  <CountUp to={plan.final_price} duration={1200 + i * 150} suffix=" ₽" />
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6 }}>
                  <span style={{ fontSize:'1rem', fontWeight:800, color: featured ? C.green : C.accent }}>
                    {plan.duration_days < 30 ? `${plan.duration_days} дней` : plan.duration_days < 60 ? '1 месяц' : plan.duration_days < 120 ? '3 месяца' : plan.duration_days < 300 ? 'Полгода' : '1 год'}
                  </span>
                  {plan.duration_days >= 30 && (
                    <span style={{ fontSize:'0.72rem', color:C.dim }}>
                      · {Math.round(plan.final_price / (plan.duration_days / 30))} ₽/мес
                    </span>
                  )}
                </div>
                {plan.discount_percent > 0 && (
                  <div style={{ marginTop: 10, fontSize: '0.72rem', background: C.greenDim, color: C.green, border: `1px solid rgba(0,229,160,0.25)`, borderRadius: 6, padding: '3px 10px', display: 'inline-block', fontWeight: 700 }}>
                    Экономия {plan.discount_percent}%
                  </div>
                )}
              </div>

              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, marginBottom: 20 }}>
                {['Нулевое логирование', 'Автообновление конфигурации', 'Все платформы', 'Поддержка 24/7'].map((f, fi) => (
                  <div key={f} style={{
                    display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10,
                    opacity: inView ? 1 : 0,
                    transform: inView ? 'translateX(0)' : 'translateX(-10px)',
                    transition: `opacity 0.4s ease ${parseFloat(delay) + 0.25 + fi * 0.06}s, transform 0.4s ease ${parseFloat(delay) + 0.25 + fi * 0.06}s`,
                  }}>
                    <span style={{ color: C.green, fontSize: '0.75rem', fontWeight: 800 }}>✓</span>
                    <span style={{ fontSize: '0.82rem', color: C.dimHi }}>{f}</span>
                  </div>
                ))}
              </div>

              <button onClick={() => navigate(loggedIn ? '/plans' : '/login')}
                style={{
                  marginTop: 'auto', background: C.green, color: C.bg, border: 'none',
                  borderRadius: 12, padding: '14px 0', fontWeight: 700, fontSize: '0.88rem',
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
                  transition: 'box-shadow 0.2s, transform 0.15s',
                  boxShadow: featured ? `0 0 28px rgba(0,229,160,0.5)` : `0 0 16px rgba(0,229,160,0.28)`,
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 36px rgba(0,229,160,0.65)`; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = featured ? `0 0 28px rgba(0,229,160,0.5)` : `0 0 16px rgba(0,229,160,0.28)`; e.currentTarget.style.transform = 'none' }}>
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
    </div>
  )
}

// ─── Анимированная сетка возможностей ───────────────────────────────
function FeaturesGrid({ features }: { features: { icon: string; title: string; desc: string }[] }) {
  const { ref, inView } = useInView(0.08)
  return (
    <>
      <style>{`
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 14px;
        }
        .feature-card {
          transition: border-color 0.25s, transform 0.25s, box-shadow 0.25s !important;
          display: flex; gap: 18px; align-items: flex-start;
        }
        .feature-card:hover {
          border-color: rgba(0,229,160,0.22) !important;
          transform: translateY(-3px) !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.28), 0 0 0 1px rgba(0,229,160,0.08) !important;
        }
        /* На мобилке — 2 колонки, карточка вертикальная */
        @media (max-width: 600px) {
          .features-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
          }
          .feature-card {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
            padding: 18px 16px !important;
          }
          .feature-card-icon {
            width: 38px !important; height: 38px !important;
          }
          .feature-card-title {
            font-size: 0.82rem !important;
            margin-bottom: 4px !important;
          }
          .feature-card-desc {
            font-size: 0.76rem !important;
            line-height: 1.5 !important;
          }
        }
      `}</style>
      <div ref={ref} className="features-grid">
        {features.map((f, i) => (
          <div key={i} className="feature-card" style={{
            background: C.card, borderRadius: 20, padding: '28px 24px',
            border: `1px solid ${C.border}`,
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateY(0)' : 'translateY(28px)',
            transition: `opacity 0.55s ease ${i * 0.08}s, transform 0.55s cubic-bezier(0.22,1,0.36,1) ${i * 0.08}s, border-color 0.25s, box-shadow 0.25s`,
          }}>
            <div className="feature-card-icon" style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: 'rgba(0,229,160,0.07)', border: '1px solid rgba(0,229,160,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
            }}>
              {f.icon}
            </div>
            <div>
              <div className="feature-card-title" style={{ fontSize: '0.95rem', fontWeight: 700, color: C.accent, marginBottom: 6 }}>{f.title}</div>
              <div className="feature-card-desc" style={{ fontSize: '0.85rem', color: C.dimHi, lineHeight: 1.65 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

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
  // Считаем залогиненным если есть хоть какой-то токен.
  const loggedIn = !!localStorage.getItem('logged_in')
  const email = loggedIn ? getEmailFromToken() : null

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
      <style>{`
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
        @keyframes glowFromBottom {
          from { opacity:0; transform: translateX(-50%) translateY(100px) scale(0.5); }
          to   { opacity:1; transform: translateX(-50%) translateY(0) scale(1); }
        }
        @keyframes glowFromTopLeft {
          from { opacity:0; transform: translate(-60px, -60px) scale(0.5); }
          to   { opacity:1; transform: translate(0,0) scale(1); }
        }
        @keyframes glowFromRight {
          from { opacity:0; transform: translate(60px, 0) scale(0.5); }
          to   { opacity:1; transform: translate(0,0) scale(1); }
        }
        @keyframes glowFromTop {
          from { opacity:0; transform: translateX(-50%) translateY(-80px) scale(0.5); }
          to   { opacity:1; transform: translateX(-50%) translateY(0) scale(1); }
        }
        @keyframes glowFromBottomRight {
          from { opacity:0; transform: translate(60px, 60px) scale(0.5); }
          to   { opacity:1; transform: translate(0,0) scale(1); }
        }
        @keyframes glowFromLeft {
          from { opacity:0; transform: translate(-60px, 0) scale(0.5); }
          to   { opacity:1; transform: translate(0,0) scale(1); }
        }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .feature-card:hover { border-color: rgba(0,229,160,0.2) !important; transform: translateY(-2px) !important; }
        .plan-card-featured { border-color: rgba(0,229,160,0.3) !important; }
      `}</style>

      <main style={{ flex: 1 }}>

        {/* ── HERO ── */}
        <section style={{ position: 'relative', background: C.surface, borderBottom: `1px solid ${C.border}`, overflow: 'hidden' }}>
          <DotGrid id="hero" />

          {/* Главное свечение — снизу по центру */}
          <div style={{
            position: 'absolute', bottom: -120, left: '50%', transform: 'translateX(-50%)',
            width: 900, height: 500,
            background: `radial-gradient(ellipse, rgba(0,229,160,0.17) 0%, rgba(0,229,160,0.04) 45%, transparent 70%)`,
            pointerEvents: 'none',
            animation: 'glowFromBottom 1.4s cubic-bezier(0.22,1,0.36,1) both',
          }} />

          {/* Акцент — верхний левый угол */}
          <div style={{
            position: 'absolute', top: -80, left: -100,
            width: 480, height: 380,
            background: `radial-gradient(ellipse, rgba(0,229,160,0.08) 0%, transparent 65%)`,
            pointerEvents: 'none',
            animation: 'glowFromTopLeft 1.6s cubic-bezier(0.22,1,0.36,1) 0.1s both',
          }} />

          {/* Тонкий акцент — правый край */}
          <div style={{
            position: 'absolute', top: '30%', right: -60,
            width: 300, height: 300,
            background: `radial-gradient(ellipse, rgba(0,229,160,0.05) 0%, transparent 70%)`,
            pointerEvents: 'none',
            animation: 'glowFromRight 1.6s cubic-bezier(0.22,1,0.36,1) 0.2s both',
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
                {
                  val: <CountUp to={0} suffix="" />,
                  label: 'логов активности',
                  delay: '0.5s',
                },
                {
                  val: <CountUp to={99.9} decimals={1} suffix="%" duration={1800} />,
                  label: 'uptime серверов',
                  delay: '0.65s',
                },
                {
                  val: <><span style={{ fontSize: '1rem', fontWeight: 600 }}>от </span><CountUp to={10} suffix="ms" duration={1400} /></>,
                  label: 'задержка',
                  delay: '0.8s',
                },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center', animation: `fadeUp 0.6s ease ${s.delay} both` }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: C.green, letterSpacing: '-0.02em' }}>{s.val}</div>
                  <div style={{ fontSize: '0.75rem', color: C.dim, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── ВОЗМОЖНОСТИ ── */}
        <section id="features" style={{ padding: '96px 24px 96px', background: C.bg, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ maxWidth: 1140, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <div style={{ fontSize: '0.62rem', color: C.green, letterSpacing: '0.28em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>Возможности</div>
              <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, color: C.accent, letterSpacing: '-0.02em' }}>Почему Privax</h2>
            </div>
            <FeaturesGrid features={features} />
          </div>
        </section>

        {/* ── ТАРИФЫ ── */}
        <section id="plans" style={{ position: 'relative', padding: '80px 24px 120px', background: C.surface, overflow: 'hidden' }}>
          <DotGrid id="plans" />

          {/* Свечение — сверху по центру, входит с границы */}
          <div style={{
            position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
            width: 800, height: 440,
            background: `radial-gradient(ellipse, rgba(0,229,160,0.14) 0%, rgba(0,229,160,0.04) 50%, transparent 70%)`,
            pointerEvents: 'none',
            animation: 'glowFromTop 1.4s cubic-bezier(0.22,1,0.36,1) both',
          }} />

          {/* Акцент — нижний правый */}
          <div style={{
            position: 'absolute', bottom: -60, right: -80,
            width: 440, height: 360,
            background: `radial-gradient(ellipse, rgba(0,229,160,0.09) 0%, transparent 65%)`,
            pointerEvents: 'none',
            animation: 'glowFromBottomRight 1.6s cubic-bezier(0.22,1,0.36,1) 0.15s both',
          }} />

          {/* Тонкий акцент — левый край по центру */}
          <div style={{
            position: 'absolute', top: '40%', left: -60,
            width: 280, height: 280,
            background: `radial-gradient(ellipse, rgba(0,229,160,0.05) 0%, transparent 70%)`,
            pointerEvents: 'none',
            animation: 'glowFromLeft 1.6s cubic-bezier(0.22,1,0.36,1) 0.25s both',
          }} />

          <div style={{ maxWidth: 1140, margin: '0 auto', position: 'relative', zIndex: 1 }}>
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
              <PlansGrid plans={previewPlans} featuredId={featuredId} loggedIn={loggedIn} navigate={navigate} />
            )}
          </div>
        </section>

      </main>

      <FooterComponent />
    </div>
  )
}

function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [loggedIn, setLoggedIn] = useState(
    () => !!localStorage.getItem('logged_in')
  )

  // Следим за сменой маршрута — обновляем статус авторизации
  useEffect(() => {
    setLoggedIn(!!localStorage.getItem('logged_in'))
  }, [location.pathname])

  function handleLogout() {
    localStorage.removeItem('logged_in')
    setLoggedIn(false)
    navigate('/')
  }

  // На главной — scrollEffect, на остальных нет
  const isHome = location.pathname === '/'

  return (
    <>
      {loggedIn
        ? <NavbarAuth onLogout={handleLogout} />
        : <NavbarPublic scrollEffect={isHome} />}
      <Outlet />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<EmailVerify />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/guides" element={<GuidesPage />} />
          <Route path="/apps" element={<AppsPage />} />
          <Route path="/support" element={<PrivateRoute><SupportPage /></PrivateRoute>} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App