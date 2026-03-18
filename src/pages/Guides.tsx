import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const C = {
  bg: '#0d0f10', surface: '#111416', card: '#161a1d',
  border: '#242a2e', borderHi: '#2e3840', accent: '#ffffff',
  dim: '#8a9aaa', dimHi: '#b0c0cc',
  green: '#00e5a0', greenDim: 'rgba(0,229,160,0.1)',
}

interface AppDownload {
  name: string
  url: string
  store: string
}

interface GuideApp {
  name: string
  downloads: AppDownload[]
  steps: string[]
}

interface GuideSection {
  id: string
  emoji: string
  label: string
  color: string
  apps: GuideApp[]
}

const GUIDES: GuideSection[] = [
  {
    id: 'ios',
    emoji: '🍎',
    label: 'iPhone / iPad',
    color: '#c8cdd0',
    apps: [
      {
        name: 'V2RayTun',
        downloads: [
          { name: 'App Store', url: 'https://apps.apple.com/app/v2raytun/id6476628951', store: 'App Store' },
        ],
        steps: [
          'Скачайте V2RayTun из App Store',
          'В личном кабинете нажмите «Скопировать ключ доступа»',
          'Откройте V2RayTun — нажмите «+» в правом верхнем углу',
          'Выберите «Вставить из буфера обмена»',
          'Нажмите «Сохранить» — сервер появится в списке',
          'Нажмите на сервер, затем кнопку подключения',
        ],
      },
    ],
  },
  {
    id: 'android',
    emoji: '🤖',
    label: 'Android',
    color: '#3DDC84',
    apps: [
      {
        name: 'V2RayTun',
        downloads: [
          { name: 'Google Play', url: 'https://play.google.com/store/apps/details?id=com.v2raytun.android', store: 'Google Play' },
        ],
        steps: [
          'Скачайте V2RayTun из Google Play',
          'В личном кабинете нажмите «Скопировать ключ доступа»',
          'Откройте V2RayTun — нажмите «+» в правом верхнем углу',
          'Выберите «Вставить из буфера обмена»',
          'Нажмите «Сохранить» — сервер появится в списке',
          'Нажмите на сервер, затем кнопку подключения',
        ],
      },
      {
        name: 'Happ',
        downloads: [
          { name: 'Google Play', url: 'https://play.google.com/store/apps/details?id=com.happproxy', store: 'Google Play' },
        ],
        steps: [
          'Скачайте Happ из Google Play',
          'В личном кабинете нажмите «Скопировать ключ доступа»',
          'Откройте Happ',
          'Нажмите кнопку «Из буфера» внизу главного экрана',
          'Конфигурация добавится автоматически',
          'Нажмите кнопку подключения',
        ],
      },
    ],
  },
  {
    id: 'windows',
    emoji: '🪟',
    label: 'Windows',
    color: '#0078d4',
    apps: [
      {
        name: 'Happ',
        downloads: [
          { name: 'Скачать .exe', url: 'https://github.com/Happ-proxy/happ-desktop/releases/latest/download/setup-Happ.x64.exe', store: 'GitHub' },
        ],
        steps: [
          'Скачайте Happ и установите',
          'В личном кабинете нажмите «Скопировать ключ доступа»',
          'В Happ нажмите кнопку «Из буфера» внизу главного экрана',
          'Конфигурация добавится автоматически',
          'Нажмите кнопку подключения',
        ],
      },
      {
        name: 'V2RayTun',
        downloads: [
          { name: 'Microsoft Store', url: 'https://apps.microsoft.com/detail/9pjf1rnl2kr4', store: 'Microsoft Store' },
        ],
        steps: [
          'Установите V2RayTun из Microsoft Store',
          'В личном кабинете нажмите «Скопировать ключ доступа»',
          'Откройте V2RayTun — нажмите «+» в правом верхнем углу',
          'Выберите «Вставить из буфера обмена»',
          'Нажмите «Сохранить» — сервер появится в списке',
          'Нажмите на сервер, затем кнопку подключения',
        ],
      },
      {
        name: 'V2RayN',
        downloads: [
          { name: 'Скачать .exe', url: 'https://github.com/2dust/v2rayN/releases/latest', store: 'GitHub' },
        ],
        steps: [
          'Скачайте V2RayN с GitHub и распакуйте архив',
          'Запустите v2rayN.exe',
          'В личном кабинете нажмите «Скопировать ключ доступа»',
          'В V2RayN нажмите «Серверы» → «Импорт из буфера обмена»',
          'Нажмите F2 или кнопку подключения в трее',
        ],
      },
    ],
  },
  {
    id: 'macos',
    emoji: '💻',
    label: 'macOS',
    color: '#a0a0a0',
    apps: [
      {
        name: 'V2RayTun',
        downloads: [
          { name: 'Mac App Store', url: 'https://apps.apple.com/us/app/v2raytun/id6476628951?platform=mac', store: 'App Store' },
        ],
        steps: [
          'Скачайте V2RayTun из Mac App Store',
          'В личном кабинете нажмите «Скопировать ключ доступа»',
          'Откройте V2RayTun — нажмите «+» в правом верхнем углу',
          'Выберите «Вставить из буфера обмена»',
          'Нажмите «Сохранить» — сервер появится в списке',
          'Нажмите на сервер, затем кнопку подключения',
        ],
      },
      {
        name: 'Happ',
        downloads: [
          { name: 'Mac App Store', url: 'https://apps.apple.com/us/app/happ-proxy-utility/id6504287215?platform=mac', store: 'App Store' },
        ],
        steps: [
          'Скачайте Happ из Mac App Store',
          'В личном кабинете нажмите «Скопировать ключ доступа»',
          'Откройте Happ',
          'Нажмите кнопку «Из буфера» внизу главного экрана',
          'Конфигурация добавится автоматически',
          'Нажмите кнопку подключения',
        ],
      },
    ],
  },
  {
    id: 'linux',
    emoji: '🐧',
    label: 'Linux',
    color: '#ffb700',
    apps: [
      {
        name: 'V2RayN',
        downloads: [
          { name: 'x64 .deb', url: 'https://v2rayn.2dust.link/v2rayN-linux-64.deb', store: 'Direct' },
          { name: 'arm64 .deb', url: 'https://v2rayn.2dust.link/v2rayN-linux-arm64.deb', store: 'Direct' },
        ],
        steps: [
          'Скачайте .deb пакет под вашу архитектуру',
          'Установите: sudo dpkg -i v2rayN-linux-64.deb',
          'Запустите V2RayN',
          'В личном кабинете нажмите «Скопировать ключ доступа»',
          'В V2RayN нажмите «Серверы» → «Импорт из буфера обмена»',
          'Нажмите кнопку подключения',
        ],
      },
    ],
  },
]

function DownloadButton({ dl }: { dl: AppDownload }) {
  return (
    <a href={dl.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
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
        {dl.name}
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

function AppGuide({ app, isLast, sectionColor }: { app: GuideApp; isLast: boolean; sectionColor: string }) {
  return (
    <div style={{
      borderBottom: isLast ? 'none' : `1px solid ${C.border}`,
      padding: '20px 0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div style={{
          fontSize: '0.68rem', fontWeight: 700, color: sectionColor,
          letterSpacing: '0.15em', textTransform: 'uppercase' as const,
        }}>
          {app.name}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {app.downloads.map(dl => <DownloadButton key={dl.name} dl={dl} />)}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {app.steps.map((step, i) => (
          <StepItem key={i} num={i + 1} text={step} />
        ))}
      </div>
    </div>
  )
}

export default function GuidesPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('ios')

  useEffect(() => {
    const hash = location.hash.replace('#', '')
    if (hash && GUIDES.find(g => g.id === hash)) {
      setActiveTab(hash)
    }
  }, [location.hash])

  const activeSection = GUIDES.find(g => g.id === activeTab) || GUIDES[0]

  return (
    <main style={{ flex: 1, maxWidth: 720, margin: '0 auto', width: '100%', padding: '40px 20px 64px' }}>
      <style>{`
        .guide-tab { transition: all 0.18s; }
        .guide-tab:hover { border-color: rgba(0,229,160,0.4) !important; color: #fff !important; }
      `}</style>

      {/* Заголовок */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: '0.7rem', color: C.green, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 10 }}>
          Инструкции
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: C.accent, margin: '0 0 12px' }}>
          Как подключиться
        </h1>
        <p style={{ fontSize: '0.88rem', color: C.dimHi, lineHeight: 1.7, margin: 0 }}>
          Выберите платформу и следуйте инструкции. Сначала скопируйте ключ доступа в личном кабинете.
        </p>
      </div>

      {/* Вкладки */}
      <div style={{
        display: 'flex', gap: 6, flexWrap: 'wrap',
        marginBottom: 24,
        padding: '10px 12px',
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16,
      }}>
        {GUIDES.map(g => {
          const isActive = g.id === activeTab
          return (
            <button
              key={g.id}
              className="guide-tab"
              onClick={() => { setActiveTab(g.id); navigate(`#${g.id}`, { replace: true }) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: isActive ? `${g.color}18` : 'transparent',
                border: `1px solid ${isActive ? g.color + '60' : C.border}`,
                borderRadius: 10, padding: '8px 14px',
                fontSize: '0.82rem', fontWeight: isActive ? 700 : 500,
                color: isActive ? g.color : C.dim,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: isActive ? `0 0 12px ${g.color}20` : 'none',
              }}
            >
              <span style={{ fontSize: '1rem' }}>{g.emoji}</span>
              {g.label}
            </button>
          )
        })}
      </div>

      {/* Контент активной вкладки */}
      <div style={{
        background: C.surface, borderRadius: 20,
        border: `1px solid ${C.border}`,
        overflow: 'hidden',
      }}>
        {/* Шапка */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '18px 24px', borderBottom: `1px solid ${C.border}`,
          background: C.card,
        }}>
          <span style={{ fontSize: '1.4rem' }}>{activeSection.emoji}</span>
          <span style={{ fontSize: '1rem', fontWeight: 800, color: activeSection.color }}>{activeSection.label}</span>
        </div>

        {/* Приложения */}
        <div style={{ padding: '0 24px' }}>
          {activeSection.apps.map((app, i) => (
            <AppGuide
              key={app.name}
              app={app}
              isLast={i === activeSection.apps.length - 1}
              sectionColor={activeSection.color}
            />
          ))}
        </div>
      </div>

      {/* Подсказка */}
      <div style={{ marginTop: 16, padding: '14px 18px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: '1rem', flexShrink: 0 }}>💬</span>
        <p style={{ fontSize: '0.8rem', color: C.dimHi, lineHeight: 1.5, margin: 0 }}>
          Возникли трудности?{' '}
          <span onClick={() => navigate('/support')} style={{ color: C.green, cursor: 'pointer', fontWeight: 600 }}>
            Напишите в поддержку →
          </span>
        </p>
      </div>
    </main>
  )
}