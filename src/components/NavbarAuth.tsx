import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { C } from './Theme'
import { apiFetch } from '../Api'

interface Props {
  balance?: number
  onLogout: () => void
}

export interface Notification {
  id: number
  title: string
  body: string
  date: string   // ISO string
  read: boolean
  type: 'info' | 'success' | 'warning'
}

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ─── Утилиты ────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = (now.getTime() - d.getTime()) / 1000
  if (diff < 60)   return 'только что'
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function formatDateFull(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function typeColor(type: Notification['type']) {
  if (type === 'success') return C.green
  if (type === 'warning') return '#f5a623'
  return C.dimHi
}
function typeDot(type: Notification['type']) {
  if (type === 'success') return '✓'
  if (type === 'warning') return '!'
  return 'i'
}

// ─── SVG иконки ─────────────────────────────────────────────────────
function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

// ─── Дропдаун уведомлений ────────────────────────────────────────────
function NotifDropdown({ notifications, onMarkAllRead, onViewAll, onClose, loading }: {
  notifications: Notification[]
  onMarkAllRead: () => void
  onViewAll: () => void
  onClose: () => void
  loading?: boolean
}) {
  const preview = notifications.slice(0, 5)
  const hasUnread = notifications.some(n => !n.read)

  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 10px)', right: 0,
      width: 340, background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.5)', zIndex: 300,
      overflow: 'hidden',
    }}>
      {/* Шапка */}
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: C.accent }}>Уведомления</span>
        {hasUnread && (
          <button onClick={onMarkAllRead}
            style={{ background: 'none', border: 'none', fontSize: '0.75rem', color: C.green, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
            Отметить все как прочитанные
          </button>
        )}
      </div>

      {/* Список */}
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: '36px 20px', textAlign: 'center', color: C.dim, fontSize: '0.85rem' }}>
            Загрузка...
          </div>
        ) : preview.length === 0 ? (
          <div style={{ padding: '36px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: 10 }}>🔔</div>
            <div style={{ fontSize: '0.85rem', color: C.dim }}>Пока у вас нет уведомлений</div>
          </div>
        ) : preview.map(n => (
          <div key={n.id} style={{
            padding: '13px 18px', borderBottom: `1px solid ${C.border}`,
            background: n.read ? 'transparent' : 'rgba(0,229,160,0.03)',
            display: 'flex', gap: 12, alignItems: 'flex-start',
            transition: 'background 0.15s',
          }}>
            {/* Иконка типа */}
            <div style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginTop: 1,
              background: `${typeColor(n.type)}18`,
              border: `1px solid ${typeColor(n.type)}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', fontWeight: 800, color: typeColor(n.type),
            }}>
              {typeDot(n.type)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ fontSize: '0.83rem', fontWeight: n.read ? 500 : 700, color: C.accent }}>{n.title}</span>
                {!n.read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, flexShrink: 0, marginTop: 5, boxShadow: `0 0 5px ${C.green}` }} />}
              </div>
              <div style={{ fontSize: '0.78rem', color: C.dim, marginTop: 2, lineHeight: 1.4 }}>{n.body}</div>
              <div style={{ fontSize: '0.72rem', color: C.dim, marginTop: 5, opacity: 0.7 }}>{formatDate(n.date)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Кнопка все уведомления */}
      <div style={{ padding: '12px 18px', display: 'flex', justifyContent: 'center' }}>
        <button onClick={() => { onViewAll(); onClose() }}
          style={{ width: 'auto', minWidth: 180, background: C.green, border: 'none', borderRadius: 10, padding: '10px', fontSize: '0.82rem', fontWeight: 700, color: C.bg, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' as const, transition: 'box-shadow 0.2s, transform 0.15s', boxShadow: `0 0 16px rgba(0,229,160,0.3)` }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 24px rgba(0,229,160,0.55)`; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 0 16px rgba(0,229,160,0.3)`; e.currentTarget.style.transform = 'none' }}>
          Все уведомления →
        </button>
      </div>
    </div>
  )
}

// ─── Страница всех уведомлений ───────────────────────────────────────
function AllNotificationsPage({ notifications, onClose, onMarkAllRead }: {
  notifications: Notification[]
  onClose: () => void
  onMarkAllRead: () => void
}) {
  const hasUnread = notifications.some(n => !n.read)

  // Группировка по дате
  const groups: Record<string, Notification[]> = {}
  notifications.forEach(n => {
    const day = new Date(n.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    if (!groups[day]) groups[day] = []
    groups[day].push(n)
  })

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(13,15,16,0.85)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '80px 20px 40px', overflowY: 'auto',
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width: '100%', maxWidth: 560, background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, overflow: 'hidden' }}>

        {/* Шапка */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: C.accent }}>Все уведомления</div>
            <div style={{ fontSize: '0.78rem', color: C.dim, marginTop: 2 }}>{notifications.length} записей</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {hasUnread && (
              <button onClick={onMarkAllRead}
                style={{ background: 'none', border: `1px solid rgba(0,229,160,0.3)`, color: C.green, borderRadius: 8, padding: '6px 12px', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                Прочитать все
              </button>
            )}
            <button onClick={onClose}
              style={{ background: C.card, border: `1px solid ${C.border}`, color: C.dim, borderRadius: 8, padding: '6px 12px', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit' }}>
              ✕ Закрыть
            </button>
          </div>
        </div>

        {/* Список с группировкой */}
        <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '2.4rem', marginBottom: 12 }}>🔔</div>
              <div style={{ fontSize: '0.92rem', color: C.dim }}>Пока у вас не было уведомлений</div>
            </div>
          ) : Object.entries(groups).map(([day, items]) => (
            <div key={day}>
              <div style={{ padding: '10px 24px', fontSize: '0.7rem', color: C.dim, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                {day}
              </div>
              {items.map(n => (
                <div key={n.id} style={{
                  padding: '16px 24px', borderBottom: `1px solid ${C.border}`,
                  background: n.read ? 'transparent' : 'rgba(0,229,160,0.03)',
                  display: 'flex', gap: 14, alignItems: 'flex-start',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                    background: `${typeColor(n.type)}18`,
                    border: `1px solid ${typeColor(n.type)}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 800, color: typeColor(n.type),
                  }}>
                    {typeDot(n.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: n.read ? 500 : 700, color: C.accent }}>{n.title}</span>
                      {!n.read && <span style={{ fontSize: '0.68rem', color: C.green, fontWeight: 700, flexShrink: 0 }}>NEW</span>}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: C.dimHi, marginTop: 4, lineHeight: 1.5 }}>{n.body}</div>
                    <div style={{ fontSize: '0.73rem', color: C.dim, marginTop: 6 }}>{formatDateFull(n.date)}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Основной компонент ──────────────────────────────────────────────
export default function NavbarAuth({ balance, onLogout }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [bellOpen,    setBellOpen]    = useState(false)
  const [showAllPage, setShowAllPage] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notifsLoading, setNotifsLoading] = useState(false)
  const bellRefDt = useRef<HTMLDivElement>(null)
  const bellRefMb = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.read).length
  const hasUnread   = unreadCount > 0

  const navLinks = [
    { label: 'Главная',        key: '/',          fn: () => navigate('/') },
    { label: 'Тарифы',         key: '/plans',     fn: () => navigate('/plans') },
    { label: 'Приложения',     key: '/apps',      fn: () => navigate('/apps') },
    { label: 'Инструкции',      key: '/guides',    fn: () => navigate('/guides') },
    { label: 'Личный кабинет', key: '/dashboard', fn: () => navigate('/dashboard') },
    { label: 'Вопросы',        key: '/faq',       fn: () => navigate('/faq') },
    { label: 'Поддержка',      key: '/support',   fn: () => navigate('/support') },
  ]

  const isActive = (key: string) => location.pathname === key

  const markAllRead = async () => {
    setNotifications(ns => ns.map(n => ({ ...n, read: true })))
    try {
      await apiFetch('/users/notifications/read-all', { method: 'POST' })
    } catch {}
  }

  useEffect(() => {
    if (!localStorage.getItem('logged_in')) return
    setNotifsLoading(true)
    apiFetch('/users/notifications')
      .then(r => r.ok ? r.json() : [])
      .then((data: any[]) => setNotifications(
        Array.isArray(data) ? data.map(n => ({
          id:    n.id,
          title: n.title,
          body:  n.message,
          date:  n.created_at,
          read:  n.is_read,
          type:  'info' as const,
        })) : []
      ))
      .catch(() => {})
      .finally(() => setNotifsLoading(false))
  }, [])

  // Закрыть мобильное меню при растяжении экрана выше 800px
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 800) setMenuOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Закрыть дропдаун при клике вне обоих враперов
  useEffect(() => {
    if (!bellOpen) return
    function handler(e: MouseEvent) {
      const target = e.target as Node
      const insideDt = bellRefDt.current?.contains(target)
      const insideMb = bellRefMb.current?.contains(target)
      if (!insideDt && !insideMb) setBellOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [bellOpen])

  const BellButton = ({ refProp }: { refProp: React.RefObject<HTMLDivElement | null> }) => (
    <div ref={refProp} style={{ position: 'relative' }}>
      <button
        className="nauth-bell"
        onClick={() => setBellOpen(o => !o)}
        title="Уведомления"
        style={{ background: bellOpen ? C.card : 'transparent' }}
      >
        <BellIcon />
        {hasUnread && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            minWidth: 17, height: 17, borderRadius: 9,
            background: C.green, color: C.bg,
            fontSize: '0.6rem', fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `2px solid ${C.surface}`,
            boxShadow: `0 0 8px rgba(0,229,160,0.6)`,
            padding: '0 3px',
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {bellOpen && (
        <NotifDropdown
          notifications={notifications}
          loading={notifsLoading}
          onMarkAllRead={markAllRead}
          onViewAll={() => setShowAllPage(true)}
          onClose={() => setBellOpen(false)}
        />
      )}
    </div>
  )

  return (
    <>
      <style>{`
        .nauth-dt { display: none !important; }
        .nauth-burger { display: flex !important; }
        @media (min-width: 800px) {
          .nauth-dt { display: flex !important; }
          .nauth-burger { display: none !important; }
        }
        .nauth-bell {
          position: relative; display: flex; align-items: center; justify-content: center;
          width: 36px; height: 36px; border-radius: 10px;
          border: 1px solid ${C.border}; color: ${C.dim};
          cursor: pointer; transition: border-color 0.2s, color 0.2s, background 0.2s;
        }
        .nauth-bell:hover { border-color: ${C.borderHi}; color: ${C.accent}; }
      `}</style>

      <nav style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '0 20px', height: 66, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 200 }}>

        <span onClick={() => navigate('/')} style={{ fontSize: '1.25rem', fontWeight: 900, color: C.accent, letterSpacing: '0.06em', cursor: 'pointer', fontFamily: 'monospace' }}>
          PRIVAX
        </span>

        {/* Desktop */}
        <div className="nauth-dt" style={{ gap: 24, alignItems: 'center' }}>
          {navLinks.map(l => (
            <span key={l.key} onClick={l.fn}
              style={{ fontSize: '0.82rem', fontWeight: isActive(l.key) ? 700 : 400, color: isActive(l.key) ? C.accent : C.dim, cursor: 'pointer', transition: 'color 0.2s', whiteSpace: 'nowrap' }}
              onMouseEnter={e => e.currentTarget.style.color = C.accent}
              onMouseLeave={e => e.currentTarget.style.color = isActive(l.key) ? C.accent : C.dim}>
              {l.label}
            </span>
          ))}

          <span style={{ width: 1, height: 16, background: C.border, display: 'block', flexShrink: 0 }} />

          <BellButton refProp={bellRefDt} />

          <button onClick={onLogout}
            style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.dim, padding: '7px 16px', borderRadius: 10, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 0.2s, color 0.2s', whiteSpace: 'nowrap' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,94,94,0.4)'; e.currentTarget.style.color = C.red }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.dim }}>
            Выйти
          </button>
        </div>

        {/* Burger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="nauth-burger">
          <BellButton refProp={bellRefMb} />
          <button onClick={() => setMenuOpen(o => !o)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', flexDirection: 'column', gap: 5, padding: '8px 4px', alignItems: 'flex-end', display: 'flex' }}>
            <span style={{ display: 'block', width: 22, height: 2, background: C.accent, transition: '0.2s', transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none', transformOrigin: 'center' }} />
            <span style={{ display: 'block', width: 16, height: 2, background: C.accent, transition: '0.2s', opacity: menuOpen ? 0 : 1 }} />
            <span style={{ display: 'block', width: 22, height: 2, background: C.accent, transition: '0.2s', transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none', transformOrigin: 'center' }} />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ position: 'fixed', top: 66, left: 0, right: 0, zIndex: 199, background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '12px 20px 20px' }}>
          {navLinks.map(l => (
            <span key={l.key} onClick={() => { l.fn(); setMenuOpen(false) }}
              style={{ display: 'block', padding: '13px 0', fontSize: '0.95rem', color: isActive(l.key) ? C.accent : C.dimHi, fontWeight: isActive(l.key) ? 700 : 400, cursor: 'pointer', borderBottom: `1px solid ${C.border}` }}>
              {l.label}
            </span>
          ))}
          <div style={{ marginTop: 14 }}>
            <button onClick={() => { onLogout(); setMenuOpen(false) }}
              style={{ width: '100%', background: 'transparent', color: C.red, border: '1px solid rgba(255,94,94,0.3)', borderRadius: 12, padding: '13px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit' }}>
              Выйти
            </button>
          </div>
        </div>
      )}

      {/* Страница всех уведомлений */}
      {showAllPage && (
        <AllNotificationsPage
          notifications={notifications}
          onClose={() => setShowAllPage(false)}
          onMarkAllRead={markAllRead}
        />
      )}
    </>
  )
}