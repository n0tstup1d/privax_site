import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { API } from '../Api'

const C = {
  bg: '#0d0f10', surface: '#111416', card: '#161a1d',
  border: '#242a2e', borderHi: '#2e3840', accent: '#ffffff',
  dim: '#8a9aaa', dimHi: '#b0c0cc',
  green: '#00e5a0', greenDim: 'rgba(0,229,160,0.1)',
}

interface ApiStep { id: number; text: string; hint: string | null; sort_order: number }
interface ApiApp { id: number; name: string; store_name: string; download_url: string; is_primary: boolean; sort_order: number; steps: ApiStep[] }
interface ApiPlatform {
  id: number; key: string; label: string; subtitle: string; emoji: string
  icon_url: string | null; color: string; category: string; sort_order: number
  is_visible: boolean; apps: ApiApp[]
}

function DownloadButton({ name, url }: { name: string; url: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
      <button
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: C.green, color: C.bg, border: 'none',
          borderRadius: 8, padding: '6px 12px',
          fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
          fontFamily: 'inherit', transition: 'box-shadow 0.2s, transform 0.15s',
          boxShadow: '0 0 12px rgba(0,229,160,0.25)',
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 20px rgba(0,229,160,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 12px rgba(0,229,160,0.25)'; e.currentTarget.style.transform = 'none' }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        {name}
      </button>
    </a>
  )
}

function StepItem({ num, text }: { num: number; text: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
        background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.68rem', fontWeight: 800, color: C.green,
      }}>
        {num}
      </div>
      <div style={{ fontSize: '0.85rem', color: C.accent, lineHeight: 1.6, paddingTop: 3 }}>
        {text}
      </div>
    </div>
  )
}

function AppGuide({ app, isLast, sectionColor }: { app: ApiApp; isLast: boolean; sectionColor: string }) {
  return (
    <div style={{ borderBottom: isLast ? 'none' : `1px solid ${C.border}`, padding: '20px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: sectionColor, letterSpacing: '0.15em', textTransform: 'uppercase' as const }}>
          {app.name}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <DownloadButton name={app.store_name || 'Скачать'} url={app.download_url} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {app.steps.map((step, i) => (
          <StepItem key={step.id} num={i + 1} text={step.text} />
        ))}
      </div>
    </div>
  )
}

export default function GuidesPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [platforms, setPlatforms] = useState<ApiPlatform[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('')

  useEffect(() => {
    fetch(`${API}/guides/platforms`)
      .then(r => r.json())
      .then((d: ApiPlatform[]) => {
        const data = Array.isArray(d) ? d : []
        setPlatforms(data)
        if (data.length > 0) {
          const hash = location.hash.replace('#', '')
          const found = data.find(g => g.key === hash)
          setActiveTab(found ? found.key : data[0].key)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const hash = location.hash.replace('#', '')
    if (hash && platforms.find(g => g.key === hash)) {
      setActiveTab(hash)
    }
  }, [location.hash, platforms])

  const activeSection = platforms.find(g => g.key === activeTab) || platforms[0]

  if (loading) {
    return (
      <main style={{ flex: 1, maxWidth: 720, margin: '0 auto', width: '100%', padding: '40px 20px 64px' }}>
        <div style={{ background: C.surface, borderRadius: 20, padding: '48px', textAlign: 'center', color: C.dim, border: `1px solid ${C.border}` }}>
          Загрузка инструкций...
        </div>
      </main>
    )
  }

  if (!activeSection) {
    return (
      <main style={{ flex: 1, maxWidth: 720, margin: '0 auto', width: '100%', padding: '40px 20px 64px' }}>
        <div style={{ background: C.surface, borderRadius: 20, padding: '48px', textAlign: 'center', color: C.dim, border: `1px solid ${C.border}` }}>
          Инструкции пока не добавлены
        </div>
      </main>
    )
  }

  return (
    <main style={{ flex: 1, maxWidth: 720, margin: '0 auto', width: '100%', padding: '40px 20px 64px' }}>
      <style>{`
        .guide-tab { transition: all 0.18s; }
        .guide-tab:hover { border-color: rgba(0,229,160,0.4) !important; color: #fff !important; }
      `}</style>

      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: '0.7rem', color: C.green, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 10 }}>Инструкции</div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: C.accent, margin: '0 0 12px' }}>Как подключиться</h1>
        <p style={{ fontSize: '0.88rem', color: C.dimHi, lineHeight: 1.7, margin: 0 }}>Выберите платформу и следуйте инструкции. Сначала скопируйте ключ доступа в личном кабинете.</p>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24, padding: '10px 12px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16 }}>
        {platforms.map(g => {
          const isActive = g.key === activeTab
          return (
            <button key={g.key} className="guide-tab"
              onClick={() => { setActiveTab(g.key); navigate(`#${g.key}`, { replace: true }) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: isActive ? `${g.color}18` : 'transparent',
                border: `1px solid ${isActive ? g.color + '60' : C.border}`,
                borderRadius: 10, padding: '8px 14px',
                fontSize: '0.82rem', fontWeight: isActive ? 700 : 500,
                color: isActive ? g.color : C.dim,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: isActive ? `0 0 12px ${g.color}20` : 'none',
              }}>
              <span style={{ fontSize: '1rem' }}>{g.emoji}</span>
              {g.label}
            </button>
          )
        })}
      </div>

      <div style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 24px', borderBottom: `1px solid ${C.border}`, background: C.card }}>
          <span style={{ fontSize: '1.4rem' }}>{activeSection.emoji}</span>
          <span style={{ fontSize: '1rem', fontWeight: 800, color: activeSection.color }}>{activeSection.label}</span>
        </div>
        <div style={{ padding: '0 24px' }}>
          {activeSection.apps.map((app, i) => (
            <AppGuide key={app.id} app={app} isLast={i === activeSection.apps.length - 1} sectionColor={activeSection.color} />
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16, padding: '14px 18px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: '1rem', flexShrink: 0 }}>💬</span>
        <p style={{ fontSize: '0.8rem', color: C.dimHi, lineHeight: 1.5, margin: 0 }}>
          Возникли трудности?{' '}
          <span onClick={() => navigate('/support')} style={{ color: C.green, cursor: 'pointer', fontWeight: 600 }}>Напишите в поддержку →</span>
        </p>
      </div>
    </main>
  )
}