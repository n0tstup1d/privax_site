import { useState } from 'react'
import { C } from './Theme'

const STORAGE_KEY = 'key_onboarding_dismissed'

export function shouldShowOnboarding(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== 'true'
}

export function dismissOnboarding() {
  localStorage.setItem(STORAGE_KEY, 'true')
}

// ─── Устройства ────────────────────────────────────────────────────────────

interface Device {
  id: string
  label: string
  icon: string
  appName: string
  appStore: string
  appUrl: string
  steps: { text: string; hint?: string }[]
}

const DEVICES: Device[] = [
  {
    id: 'iphone',
    label: 'iPhone / iPad',
    icon: '🍎',
    appName: 'V2RayTun',
    appStore: 'App Store',
    appUrl: 'https://apps.apple.com/app/v2raytun/id6476628951',
    steps: [
      { text: 'Откройте приложение V2RayTun' },
      { text: 'Нажмите кнопку «+» вверху справа' },
      { text: 'Выберите «Вставить из буфера обмена»', hint: 'Ключ уже скопирован — просто нажмите' },
      { text: 'Нажмите «Сохранить», затем включите переключатель' },
    ],
  },
  {
    id: 'android',
    label: 'Android',
    icon: '🤖',
    appName: 'V2RayTun',
    appStore: 'Google Play',
    appUrl: 'https://play.google.com/store/apps/details?id=com.v2raytun.android',
    steps: [
      { text: 'Откройте приложение V2RayTun' },
      { text: 'Нажмите кнопку «+» вверху справа' },
      { text: 'Выберите «Вставить из буфера обмена»', hint: 'Ключ уже скопирован — просто нажмите' },
      { text: 'Нажмите «Сохранить», затем включите переключатель' },
    ],
  },
  {
    id: 'windows',
    label: 'Windows',
    icon: '🖥',
    appName: 'Happ',
    appStore: 'официальный сайт',
    appUrl: 'https://happ.to',
    steps: [
      { text: 'Откройте программу Happ' },
      { text: 'Нажмите кнопку «Из буфера» внизу экрана', hint: 'Ключ уже скопирован — просто нажмите' },
      { text: 'Конфигурация добавится автоматически' },
      { text: 'Нажмите «Подключиться»' },
    ],
  },
  {
    id: 'mac',
    label: 'Mac',
    icon: '💻',
    appName: 'V2RayTun',
    appStore: 'Mac App Store',
    appUrl: 'https://apps.apple.com/app/v2raytun/id6476628951',
    steps: [
      { text: 'Откройте приложение V2RayTun' },
      { text: 'Нажмите «+» → «Вставить из буфера обмена»', hint: 'Ключ уже скопирован — просто нажмите' },
      { text: 'Нажмите «Сохранить»' },
      { text: 'Включите переключатель для подключения' },
    ],
  },
]

// ─── Иконка закрытия ───────────────────────────────────────────────────────

function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

// ─── Шаг «Выбери устройство» ───────────────────────────────────────────────

function StepDevice({ onSelect }: { onSelect: (d: Device) => void }) {
  return (
    <div style={{ padding: '28px 24px 24px', display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Иконка + заголовок */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{
          width: 60, height: 60, borderRadius: 18, margin: '0 auto 16px',
          background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem',
        }}>🔑</div>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: C.accent, marginBottom: 8 }}>
          Ключ скопирован!
        </div>
        <div style={{ fontSize: '0.85rem', color: C.dim, lineHeight: 1.6 }}>
          Выберите своё устройство — покажем как подключиться
        </div>
      </div>

      {/* 4 кнопки устройств */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {DEVICES.map(d => (
          <button
            key={d.id}
            onClick={() => onSelect(d)}
            style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
              padding: '18px 12px', cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              transition: 'border-color 0.2s, background 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(0,229,160,0.4)'
              e.currentTarget.style.background = 'rgba(0,229,160,0.05)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = C.border
              e.currentTarget.style.background = C.card
            }}
          >
            <span style={{ fontSize: '2rem' }}>{d.icon}</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: C.accent }}>{d.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Шаг «Скачай приложение» ───────────────────────────────────────────────

function StepDownload({ device, onNext, onBack }: { device: Device; onNext: () => void; onBack: () => void }) {
  return (
    <div style={{ padding: '28px 24px 24px', display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Назад */}
      <button onClick={onBack} style={{
        alignSelf: 'flex-start', background: 'none', border: 'none',
        color: C.dim, cursor: 'pointer', fontSize: '0.82rem', padding: 0,
        fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 20,
      }}>
        ← Назад
      </button>

      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: '2.8rem', marginBottom: 12 }}>{device.icon}</div>
        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: C.accent, marginBottom: 8 }}>
          Шаг 1 из 2 — скачайте приложение
        </div>
        <div style={{ fontSize: '0.85rem', color: C.dim, lineHeight: 1.6 }}>
          Для {device.label} нужно приложение <strong style={{ color: C.accent }}>{device.appName}</strong>
        </div>
      </div>

      {/* Карточка приложения */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
        padding: '18px 20px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
          background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
        }}>📱</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: C.accent, marginBottom: 3 }}>{device.appName}</div>
          <div style={{ fontSize: '0.75rem', color: C.dim }}>Бесплатно · {device.appStore}</div>
        </div>
      </div>

      <a
        href={device.appUrl}
        target="_blank"
        rel="noreferrer"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: C.green, color: C.bg, borderRadius: 13, padding: '14px 0',
          fontWeight: 800, fontSize: '0.9rem', textDecoration: 'none',
          marginBottom: 10, boxShadow: `0 0 20px rgba(0,229,160,0.25)`,
        }}
      >
        Скачать {device.appName} →
      </a>

      <button
        onClick={onNext}
        style={{
          width: '100%', background: 'transparent', border: `1px solid ${C.border}`,
          color: C.dimHi, borderRadius: 13, padding: '13px 0',
          fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit',
          transition: 'border-color 0.15s, color 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.dimHi }}
      >
        Уже установлено →
      </button>
    </div>
  )
}

// ─── Шаг «Подключись» ─────────────────────────────────────────────────────

function StepConnect({ device, onClose, onBack }: { device: Device; onClose: () => void; onBack: () => void }) {
  const [done, setDone] = useState<Record<number, boolean>>({})

  const allDone = device.steps.every((_, i) => done[i])

  return (
    <div style={{ padding: '28px 24px 24px', display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Назад */}
      <button onClick={onBack} style={{
        alignSelf: 'flex-start', background: 'none', border: 'none',
        color: C.dim, cursor: 'pointer', fontSize: '0.82rem', padding: 0,
        fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 20,
      }}>
        ← Назад
      </button>

      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <div style={{ fontSize: '2.8rem', marginBottom: 12 }}>{device.icon}</div>
        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: C.accent, marginBottom: 8 }}>
          Шаг 2 из 2 — подключитесь
        </div>
        <div style={{ fontSize: '0.85rem', color: C.dim }}>
          Отметьте каждый шаг по мере выполнения
        </div>
      </div>

      {/* Чеклист шагов */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
        {device.steps.map((step, i) => (
          <button
            key={i}
            onClick={() => setDone(prev => ({ ...prev, [i]: !prev[i] }))}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              background: done[i] ? 'rgba(0,229,160,0.07)' : C.card,
              border: `1px solid ${done[i] ? 'rgba(0,229,160,0.3)' : C.border}`,
              borderRadius: 12, padding: '13px 14px',
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              transition: 'all 0.2s',
            }}
          >
            {/* Чекбокс */}
            <div style={{
              width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
              border: `2px solid ${done[i] ? C.green : C.border}`,
              background: done[i] ? C.green : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}>
              {done[i] && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0d0f10" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>

            {/* Текст */}
            <div>
              <div style={{
                fontSize: '0.88rem', fontWeight: 600,
                color: done[i] ? C.dim : C.accent,
                textDecoration: done[i] ? 'line-through' : 'none',
                transition: 'all 0.2s',
              }}>
                {i + 1}. {step.text}
              </div>
              {step.hint && !done[i] && (
                <div style={{ fontSize: '0.75rem', color: C.green, marginTop: 3 }}>
                  {step.hint}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => { dismissOnboarding(); onClose() }}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: allDone ? C.green : 'transparent',
          color: allDone ? C.bg : C.dim,
          border: `1px solid ${allDone ? C.green : C.border}`,
          borderRadius: 13, padding: '14px 0',
          fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit',
          transition: 'all 0.3s',
          boxShadow: allDone ? `0 0 20px rgba(0,229,160,0.3)` : 'none',
        }}
      >
        {allDone ? '✓ Готово!' : 'Пропустить'}
      </button>
    </div>
  )
}

// ─── Основной компонент ────────────────────────────────────────────────────

type Step = 'device' | 'download' | 'connect'

export function KeyOnboardingModal({ vlessLink: _vlessLink, onClose }: { vlessLink: string | null; onClose: () => void }) {
  const [step, setStep] = useState<Step>('device')
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)

  function handleSelectDevice(d: Device) {
    setSelectedDevice(d)
    setStep('download')
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: C.surface, borderRadius: 24, border: `1px solid ${C.border}`,
          width: '100%', maxWidth: 420,
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)', overflow: 'hidden',
          animation: 'fadeUp 0.3s cubic-bezier(0.34,1.3,0.64,1) both',
        }}
      >
        {/* Кнопка закрытия */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'none', border: 'none', color: C.dim, cursor: 'pointer',
            padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center',
            transition: 'color 0.15s', zIndex: 1,
          }}
          onMouseEnter={e => e.currentTarget.style.color = C.accent}
          onMouseLeave={e => e.currentTarget.style.color = C.dim}
        >
          <IconClose />
        </button>

        {/* Прогресс (только на шагах 2 и 3) */}
        {step !== 'device' && (
          <div style={{ display: 'flex', gap: 4, padding: '16px 24px 0' }}>
            {(['download', 'connect'] as Step[]).map(s => (
              <div key={s} style={{
                flex: 1, height: 3, borderRadius: 2,
                background: s === step ? C.green : s === 'connect' && step === 'connect' ? C.green : C.border,
                transition: 'background 0.3s',
              }} />
            ))}
          </div>
        )}

        {step === 'device' && (
          <StepDevice onSelect={handleSelectDevice} />
        )}
        {step === 'download' && selectedDevice && (
          <StepDownload
            device={selectedDevice}
            onNext={() => setStep('connect')}
            onBack={() => setStep('device')}
          />
        )}
        {step === 'connect' && selectedDevice && (
          <StepConnect
            device={selectedDevice}
            onClose={onClose}
            onBack={() => setStep('download')}
          />
        )}
      </div>
    </div>
  )
}