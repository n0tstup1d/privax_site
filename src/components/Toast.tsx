import { createContext, useContext, useState, useCallback, useRef } from 'react'

const C = {
  bg: '#0d0f10', surface: '#111416', card: '#161a1d',
  border: '#242a2e', accent: '#ffffff',
  dim: '#8a9aaa',
  green: '#00e5a0', greenDim: 'rgba(0,229,160,0.12)',
  red: '#ff5e5e',   redDim: 'rgba(255,94,94,0.12)',
  orange: '#f5a623', orangeDim: 'rgba(245,166,35,0.1)',
}

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: number
  type: ToastType
  message: string
}

interface ToastCtx {
  success: (msg: string) => void
  error:   (msg: string) => void
  info:    (msg: string) => void
  warning: (msg: string) => void
}

const ToastContext = createContext<ToastCtx | null>(null)

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error:   '✕',
  info:    'i',
  warning: '⚠',
}

const COLORS: Record<ToastType, { border: string; icon: string; bg: string }> = {
  success: { border: 'rgba(0,229,160,0.35)',  icon: C.green,  bg: C.greenDim  },
  error:   { border: 'rgba(255,94,94,0.35)',  icon: C.red,    bg: C.redDim    },
  warning: { border: 'rgba(245,166,35,0.35)', icon: C.orange, bg: C.orangeDim },
  info:    { border: 'rgba(255,255,255,0.15)', icon: C.dim,   bg: 'rgba(255,255,255,0.04)' },
}

let _nextId = 1

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({})

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current[id])
    delete timers.current[id]
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const show = useCallback((type: ToastType, message: string) => {
    const id = _nextId++
    setToasts(prev => [...prev.slice(-4), { id, type, message }])
    timers.current[id] = setTimeout(() => dismiss(id), 4000)
  }, [dismiss])

  const ctx: ToastCtx = {
    success: (m) => show('success', m),
    error:   (m) => show('error',   m),
    info:    (m) => show('info',    m),
    warning: (m) => show('warning', m),
  }

  return (
    <ToastContext.Provider value={ctx}>
      {children}

      {/* Контейнер тостов */}
      <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end', pointerEvents: 'none' }}>
        <style>{`
          @keyframes toastIn  { from { opacity:0; transform:translateX(24px) scale(0.95); } to { opacity:1; transform:translateX(0) scale(1); } }
          @keyframes toastOut { from { opacity:1; transform:translateX(0); } to { opacity:0; transform:translateX(24px); } }
          @keyframes toastProgress { from { opacity:0.6; } to { opacity:0; transform:scaleX(0); transform-origin: left; } }
        `}</style>

        {toasts.map(t => {
          const col = COLORS[t.type]
          return (
            <div key={t.id}
              style={{ pointerEvents: 'all', display: 'flex', alignItems: 'center', gap: 12, background: C.surface, border: `1px solid ${col.border}`, borderRadius: 14, padding: '13px 16px', minWidth: 240, maxWidth: 340, boxShadow: '0 8px 32px rgba(0,0,0,0.45)', animation: 'toastIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both', cursor: 'pointer' }}
              onClick={() => dismiss(t.id)}>

              {/* Иконка */}
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: col.bg, border: `1px solid ${col.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 900, color: col.icon, flexShrink: 0, fontFamily: 'monospace' }}>
                {ICONS[t.type]}
              </div>

              {/* Сообщение */}
              <span style={{ fontSize: '0.84rem', color: C.accent, lineHeight: 1.45, flex: 1, fontFamily: '"DM Sans", system-ui, sans-serif' }}>
                {t.message}
              </span>

              {/* Прогресс-бар */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, borderRadius: '0 0 14px 14px', background: col.border, animation: 'toastProgress 4s linear forwards' }} />
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastCtx {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}