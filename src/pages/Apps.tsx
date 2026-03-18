import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Footer from '../components/Footer'
import { C } from '../components/Theme'

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

const TUTORIAL_URL = '/guides'

interface Platform {
  key: string
  label: string
  sub: string
  store: string
  icon: React.ReactNode
  color: string
  downloadUrl: string
  primaryLabel?: string
  secondaryUrl?: string
  secondaryLabel?: string
  secondaryStore?: string
}

const platforms: Platform[] = [
  {
    key: 'ios',
    label: 'iPhone & iPad',
    sub: 'iOS 14+',
    store: 'App Store',
    icon: (
      <div style={{width:26,height:26,background:"#c8cdd0",WebkitMaskImage:`url(https://cdnjs.cloudflare.com/ajax/libs/simple-icons/15.16.0/apple.svg)`,maskImage:`url(https://cdnjs.cloudflare.com/ajax/libs/simple-icons/15.16.0/apple.svg)`,WebkitMaskRepeat:"no-repeat",maskRepeat:"no-repeat",WebkitMaskSize:"contain",maskSize:"contain",WebkitMaskPosition:"center",maskPosition:"center"}} />
    ),
    color: '#c8cdd0',
    downloadUrl: 'https://apps.apple.com/app/v2raytun/id6476628951',
    primaryLabel: 'V2RayTun',
  },
  {
    key: 'android',
    label: 'Android',
    sub: 'Android 8.0+',
    store: 'Google Play',
    icon: (
      <div style={{width:26,height:26,background:"#3DDC84",WebkitMaskImage:`url(https://cdnjs.cloudflare.com/ajax/libs/simple-icons/15.16.0/android.svg)`,maskImage:`url(https://cdnjs.cloudflare.com/ajax/libs/simple-icons/15.16.0/android.svg)`,WebkitMaskRepeat:"no-repeat",maskRepeat:"no-repeat",WebkitMaskSize:"contain",maskSize:"contain",WebkitMaskPosition:"center",maskPosition:"center"}} />
    ),
    color: '#3DDC84',
    downloadUrl: 'https://play.google.com/store/apps/details?id=com.v2raytun.android',
    primaryLabel: 'V2RayTun',
    secondaryUrl: 'https://play.google.com/store/apps/details?id=com.happproxy',
    secondaryLabel: 'Happ',
    secondaryStore: 'Google Play',
  },
  {
    key: 'windows',
    label: 'Windows',
    sub: 'Windows 10 / 11',
    store: 'GitHub',
    icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#0078d4">
        <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.801"/>
      </svg>
    ),
    color: '#0078d4',
    downloadUrl: 'https://github.com/Happ-proxy/happ-desktop/releases/latest/download/setup-Happ.x64.exe',
    primaryLabel: 'Happ',
    secondaryUrl: 'https://github.com/2dust/v2rayN/releases/latest',
    secondaryLabel: 'V2RayN',
    secondaryStore: 'GitHub',
  },
  {
    key: 'macos',
    label: 'macOS',
    sub: 'macOS 12+',
    store: 'App Store',
    icon: (
      <div style={{width:26,height:26,background:"#a0a0a0",WebkitMaskImage:`url(https://cdnjs.cloudflare.com/ajax/libs/simple-icons/15.16.0/apple.svg)`,maskImage:`url(https://cdnjs.cloudflare.com/ajax/libs/simple-icons/15.16.0/apple.svg)`,WebkitMaskRepeat:"no-repeat",maskRepeat:"no-repeat",WebkitMaskSize:"contain",maskSize:"contain",WebkitMaskPosition:"center",maskPosition:"center"}} />
    ),
    color: '#a0a0a0',
    downloadUrl: 'https://apps.apple.com/us/app/v2raytun/id6476628951?platform=mac',
    primaryLabel: 'V2RayTun',
    secondaryUrl: 'https://apps.apple.com/us/app/happ-proxy-utility/id6504287215?platform=mac',
    secondaryLabel: 'Happ',
    secondaryStore: 'App Store',
  },
  {
    key: 'linux',
    label: 'Linux',
    sub: 'Ubuntu / Debian / Arch',
    store: 'Direct',
    icon: (
      <div style={{width:26,height:26,background:"#ffb700",WebkitMaskImage:`url(https://cdnjs.cloudflare.com/ajax/libs/simple-icons/15.16.0/linux.svg)`,maskImage:`url(https://cdnjs.cloudflare.com/ajax/libs/simple-icons/15.16.0/linux.svg)`,WebkitMaskRepeat:"no-repeat",maskRepeat:"no-repeat",WebkitMaskSize:"contain",maskSize:"contain",WebkitMaskPosition:"center",maskPosition:"center"}} />
    ),
    color: '#ffb700',
    downloadUrl: 'https://v2rayn.2dust.link/v2rayN-linux-64.deb',
    primaryLabel: 'V2RayN x64',
    secondaryUrl: 'https://v2rayn.2dust.link/v2rayN-linux-arm64.deb',
    secondaryLabel: 'V2RayN arm64',
    secondaryStore: 'x64 .deb / arm64 .deb',
  },
  {
    key: 'androidtv',
    label: 'Android TV',
    sub: 'Android TV / Fire TV',
    store: 'Google Play',
    icon: (
      <div style={{width:26,height:26,background:"#3DDC84",WebkitMaskImage:`url(https://cdnjs.cloudflare.com/ajax/libs/simple-icons/15.16.0/googletv.svg)`,maskImage:`url(https://cdnjs.cloudflare.com/ajax/libs/simple-icons/15.16.0/googletv.svg)`,WebkitMaskRepeat:"no-repeat",maskRepeat:"no-repeat",WebkitMaskSize:"contain",maskSize:"contain",WebkitMaskPosition:"center",maskPosition:"center"}} />
    ),
    color: '#3DDC84',
    downloadUrl: 'https://play.google.com/store/apps/details?id=com.happproxy',
    primaryLabel: 'Happ',
  },
  {
    key: 'appletv',
    label: 'Apple TV',
    sub: 'tvOS 16+',
    store: 'App Store',
    icon: (
      <div style={{width:26,height:26,background:"#c8cdd0",WebkitMaskImage:`url(https://cdnjs.cloudflare.com/ajax/libs/simple-icons/15.16.0/appletv.svg)`,maskImage:`url(https://cdnjs.cloudflare.com/ajax/libs/simple-icons/15.16.0/appletv.svg)`,WebkitMaskRepeat:"no-repeat",maskRepeat:"no-repeat",WebkitMaskSize:"contain",maskSize:"contain",WebkitMaskPosition:"center",maskPosition:"center"}} />
    ),
    color: '#c8cdd0',
    downloadUrl: 'https://apps.apple.com/us/app/happ-proxy-utility-for-tv/id6748297274',
    primaryLabel: 'Happ',
  },
]

function PlatformCard({ p, index }: { p: Platform; index: number }) {
  const { ref, inView } = useInView(0.1)

  const isGitHub = ['windows', 'linux'].includes(p.key)
  const dlSubtext = isGitHub ? 'Перейти на GitHub' : `Перейти в ${p.store}`
  const hasTwoDownloads = !!p.secondaryUrl
  const gridCols = hasTwoDownloads ? '1fr 1fr 1fr' : '1fr 1fr'
  const uid = p.key

  return (
    <div ref={ref} style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 24,
      opacity: inView ? 1 : 0,
      animation: inView ? `fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) ${index * 0.14}s both` : 'none',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <style>{`
        .pbtn-${uid} {
          text-decoration: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          box-sizing: border-box;
          transition: background 0.2s;
          background: transparent;
        }
        .pbtn-${uid}:hover {
          background: rgba(0,229,160,0.06);
        }
        .pbtn-${uid}:hover .pbtn-icon {
          background: #00e5a0 !important;
          border-color: #00e5a0 !important;
          color: #0d0f10 !important;
          transform: scale(1.08);
        }
        .pbtn-${uid}:hover .pbtn-label {
          color: #00e5a0 !important;
        }
      `}</style>

      {/* Шапка карточки */}
      <div style={{ padding: '24px 24px 20px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: `1px solid ${C.border}`, borderRadius: '24px 24px 0 0', overflow: 'hidden' }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16, flexShrink: 0,
          background: `${p.color}14`, border: `1px solid ${p.color}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: p.color,
        }}>
          {p.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: C.accent }}>{p.label}</div>
          <div style={{ fontSize: '0.75rem', color: C.dim, marginTop: 3 }}>{p.sub}</div>
        </div>
        <div style={{
          fontSize: '0.65rem', fontWeight: 700, color: C.dim,
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 8, padding: '4px 9px', letterSpacing: '0.04em',
        }}>{p.store}</div>
      </div>

      {/* Кнопки */}
      <div style={{ display: 'grid', gridTemplateColumns: gridCols, borderRadius: '0 0 24px 24px', overflow: 'hidden', flex: 1 }}>

        <a href={p.downloadUrl} target="_blank" rel="noopener noreferrer"
          className={`pbtn-${uid}`}
          style={{ padding: '20px 16px', gap: 10, borderRight: `1px solid ${C.border}` }}>
          <div className="pbtn-icon" style={{
            width: 40, height: 40, borderRadius: 12,
            background: C.greenDim, border: `1px solid rgba(0,229,160,0.2)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: C.green, transition: 'all 0.2s',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="pbtn-label" style={{ fontSize: '0.82rem', fontWeight: 700, color: C.accent, transition: 'color 0.2s' }}>{p.primaryLabel || 'Скачать'}</div>
            <div style={{ fontSize: '0.68rem', color: C.dim, marginTop: 2 }}>{dlSubtext}</div>
          </div>
        </a>

        {hasTwoDownloads && (
          <a href={p.secondaryUrl} target="_blank" rel="noopener noreferrer"
            className={`pbtn-${uid}`}
            style={{ padding: '20px 16px', gap: 10, borderRight: `1px solid ${C.border}` }}>
            <div className="pbtn-icon" style={{
              width: 40, height: 40, borderRadius: 12,
              background: C.greenDim, border: `1px solid rgba(0,229,160,0.2)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: C.green, transition: 'all 0.2s',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="pbtn-label" style={{ fontSize: '0.82rem', fontWeight: 700, color: C.accent, transition: 'color 0.2s' }}>{p.secondaryLabel}</div>
              <div style={{ fontSize: '0.68rem', color: C.dim, marginTop: 2 }}>{p.secondaryStore}</div>
            </div>
          </a>
        )}

        <a href={`${TUTORIAL_URL}#${p.key}`}
          className={`pbtn-${uid}`}
          style={{ padding: '20px 16px', gap: 10 }}>
          <div className="pbtn-icon" style={{
            width: 40, height: 40, borderRadius: 12,
            background: C.greenDim, border: `1px solid rgba(0,229,160,0.2)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: C.dim, transition: 'all 0.2s',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="pbtn-label" style={{ fontSize: '0.82rem', fontWeight: 700, color: C.dimHi, transition: 'color 0.2s' }}>Инструкция</div>
            <div style={{ fontSize: '0.68rem', color: C.dim, marginTop: 2 }}>Как настроить</div>
          </div>
        </a>

      </div>
    </div>
  )
}


export default function AppsPage() {
  const navigate = useNavigate()

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.accent, display: 'flex', flexDirection: 'column', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
      <style>{`
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }
        @keyframes glowFromBottom {
          from { opacity:0; transform: translateX(-50%) translateY(80px) scale(0.6); }
          to   { opacity:1; transform: translateX(-50%) translateY(0) scale(1); }
        }
        @keyframes glowFromTopLeft {
          from { opacity:0; transform: translate(-60px,-60px) scale(0.5); }
          to   { opacity:1; transform: translate(0,0) scale(1); }
        }
        @keyframes glowFromRight {
          from { opacity:0; transform: translate(60px,0) scale(0.5); }
          to   { opacity:1; transform: translate(0,0) scale(1); }
        }
      `}</style>

      <main style={{ flex: 1 }}>

        {/* ── HERO ── */}
        <section style={{ position: 'relative', background: C.surface, borderBottom: `1px solid ${C.border}`, overflow: 'hidden' }}>
          <DotGrid id="apps-hero" />
          <div style={{ position: 'absolute', bottom: -100, left: '50%', transform: 'translateX(-50%)', width: 800, height: 440, background: 'radial-gradient(ellipse, rgba(0,229,160,0.15) 0%, rgba(0,229,160,0.04) 45%, transparent 70%)', pointerEvents: 'none', animation: 'glowFromBottom 1.4s cubic-bezier(0.22,1,0.36,1) both' }} />
          <div style={{ position: 'absolute', top: -80, left: -100, width: 480, height: 380, background: 'radial-gradient(ellipse, rgba(0,229,160,0.07) 0%, transparent 65%)', pointerEvents: 'none', animation: 'glowFromTopLeft 1.6s cubic-bezier(0.22,1,0.36,1) 0.1s both' }} />
          <div style={{ position: 'absolute', top: '30%', right: -60, width: 300, height: 300, background: 'radial-gradient(ellipse, rgba(0,229,160,0.05) 0%, transparent 70%)', pointerEvents: 'none', animation: 'glowFromRight 1.6s cubic-bezier(0.22,1,0.36,1) 0.2s both' }} />

          <div style={{ position: 'relative', maxWidth: 1140, margin: '0 auto', padding: 'clamp(56px,10vw,96px) 20px clamp(52px,8vw,88px)', textAlign: 'center' }}>

            {/* Бейдж */}
            <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'center', animation: 'fadeUp 0.5s ease 0.05s both' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 20, padding: '6px 16px', fontSize: '0.7rem', fontWeight: 700, color: '#f59e0b', letterSpacing: '0.08em' }}>
                <span style={{ position: 'relative', display: 'inline-flex', width: 7, height: 7 }}>
                  <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#f59e0b', animation: 'ping 1.8s cubic-bezier(0,0,0.2,1) infinite' }} />
                  <span style={{ position: 'relative', display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#f59e0b' }} />
                </span>
                В РАЗРАБОТКЕ
              </div>
            </div>

            {/* Заголовок */}
            <div style={{ animation: 'fadeUp 0.5s ease 0.1s both' }}>
              <p style={{ fontSize: 'clamp(0.8rem,1.5vw,0.9rem)', color: C.dim, letterSpacing: '0.15em', textTransform: 'uppercase' as const, fontWeight: 600, marginBottom: 16 }}>
                Мы работаем над собственным приложением
              </p>
              <h1 style={{ fontSize: 'clamp(1.8rem,4.5vw,3rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 0 }}>
                А пока —<br />
                <span style={{ color: C.green }}>советуем скачать</span>
              </h1>
            </div>

            {/* Разделитель с подписью */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, maxWidth: 480, margin: '32px auto', animation: 'fadeUp 0.5s ease 0.18s both' }}>
              <div style={{ flex: 1, height: 1, background: C.border }} />
              <p style={{ fontSize: '0.88rem', color: '#9aaab4', lineHeight: 1.7, textAlign: 'center' as const, flexShrink: 0, maxWidth: 340 }}>
                Проверенные клиенты, которыми мы пользуемся сами.<br />Настройка занимает до 2 минут.
              </p>
              <div style={{ flex: 1, height: 1, background: C.border }} />
            </div>

            {/* CTA */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', animation: 'fadeUp 0.5s ease 0.26s both' }}>
              <button
                onClick={() => document.getElementById('download')?.scrollIntoView({ behavior: 'smooth' })}
                style={{ background: C.green, color: C.bg, border: 'none', borderRadius: 14, padding: '15px 36px', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 0 28px rgba(0,229,160,0.5)', transition: 'box-shadow 0.3s, transform 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 44px rgba(0,229,160,0.7)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 28px rgba(0,229,160,0.5)'; e.currentTarget.style.transform = 'none' }}
              >
                Выбрать платформу →
              </button>
              <button
                onClick={() => navigate('/support')}
                style={{ background: 'transparent', color: C.accent, border: `1px solid #2e3840`, borderRadius: 14, padding: '15px 36px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 0.2s, background 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#2e3840'; e.currentTarget.style.background = 'transparent' }}
              >
                Нужна помощь
              </button>
            </div>
          </div>
        </section>

        {/* ── КАРТОЧКИ ── */}
        <section id="download" style={{ padding: 'clamp(56px,8vw,96px) 24px', background: C.bg }}>
          <div style={{ maxWidth: 780, margin: '0 auto' }}>

            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <h2 style={{ fontSize: 'clamp(1.4rem,3vw,1.9rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 10 }}>
                Выберите платформу
              </h2>
              <p style={{ fontSize: '0.85rem', color: C.dim }}>
                Скачайте приложение и следуйте инструкции — мы всё расписали по шагам
              </p>
            </div>

            {/* Смартфоны */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '0 0 14px' }}>
              <div style={{ flex: 1, height: 1, background: C.border }} />
              <span style={{ fontSize: '0.7rem', color: C.dim, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Смартфоны</span>
              <div style={{ flex: 1, height: 1, background: C.border }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              {platforms.slice(0, 2).map((p, i) => <PlatformCard key={p.key} p={p} index={i} />)}
            </div>

            {/* Настольные */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '28px 0 14px' }}>
              <div style={{ flex: 1, height: 1, background: C.border }} />
              <span style={{ fontSize: '0.7rem', color: C.dim, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Настольные</span>
              <div style={{ flex: 1, height: 1, background: C.border }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              {platforms.slice(2, 5).map((p, i) => <PlatformCard key={p.key} p={p} index={i + 2} />)}
            </div>

            {/* Телевизоры */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '28px 0 14px' }}>
              <div style={{ flex: 1, height: 1, background: C.border }} />
              <span style={{ fontSize: '0.7rem', color: C.dim, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Телевизоры</span>
              <div style={{ flex: 1, height: 1, background: C.border }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              {platforms.slice(5).map((p, i) => <PlatformCard key={p.key} p={p} index={i + 5} />)}
            </div>

            {/* Подсказка снизу */}
            <div style={{ marginTop: 24, padding: '16px 20px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>💬</span>
              <p style={{ fontSize: '0.8rem', color: C.dim, lineHeight: 1.5, margin: 0 }}>
                Если что-то пошло не так —{' '}
                <span onClick={() => navigate('/support')} style={{ color: C.green, cursor: 'pointer', fontWeight: 600 }}>
                  напишите нам →
                </span>
                {' '}поможем быстро.
              </p>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  )
}