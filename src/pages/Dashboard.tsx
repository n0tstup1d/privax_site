import { useState, useEffect } from 'react'
import { apiFetch, getToken, isTokenValid, saveTokens, clearTokens, API } from '../api'
import { createPortal } from 'react-dom'
import { SupportModal } from './Support'
import { useToast } from '../components/Toast'
import { useNavigate } from 'react-router-dom'
import NavbarAuth from '../components/NavbarAuth'
import Footer from '../components/Footer'

const C = {
  bg:        '#0d0f10',
  surface:   '#111416',
  card:      '#161a1d',
  border:    '#242a2e',
  borderHi:  '#2e3840',
  accent:    '#ffffff',
  dim:       '#8a9aaa',   // ярче чем было (#6b7a84)
  dimHi:     '#b0c0cc',  // ярче чем было (#9aaab4)
  green:     '#00e5a0',
  greenDim:  'rgba(0,229,160,0.1)',
  greenGlow: 'rgba(0,229,160,0.22)',
  red:       '#ff5e5e',
  redDim:    'rgba(255,94,94,0.1)',
}

interface Device {
  id: number; device_index: number; device_name: string
  vless_link: string | null; sub_url: string | null
  is_active: boolean; country_code: string
}
interface Subscription {
  id: number; group_id: string; sub_url: string | null; vless_link: string | null
  plan: string; expires_at: string; days_left: number
  expired: boolean; is_active: boolean; auto_renew: boolean
  devices: Device[]; devices_used: number; devices_total: number
}
interface Invoice {
  id: number; amount: number; status: string; type: string; plan: string | null; date: string
}

function strengthScore(pw: string) {
  if (!pw) return 0
  let s = 0
  if (pw.length >= 8) s++; if (pw.length >= 12) s++
  if (/[A-Z]/.test(pw)) s++; if (/[0-9]/.test(pw)) s++; if (/[^A-Za-z0-9]/.test(pw)) s++
  return s
}
function StrengthBar({ pw }: { pw: string }) {
  const s = strengthScore(pw)
  if (!pw) return null
  const colors = ['','#ff5e5e','#ff5e5e','#f59e0b',C.green,C.green]
  const labels = ['','Очень слабый','Слабый','Средний','Надёжный','Отличный']
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
        {[1,2,3,4,5].map(i => <div key={i} style={{ flex:1, height:3, borderRadius:2, background: i<=s ? colors[s] : C.border, transition:'background 0.3s' }} />)}
      </div>
      <div style={{ fontSize:'0.7rem', color: colors[s] }}>{labels[s]}</div>
    </div>
  )
}

function TopUpModal({ onClose }: { onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:C.surface, borderRadius:24, padding:'36px 28px', border:`1px solid ${C.border}`, width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ width:56, height:56, background:C.greenDim, border:`1px solid rgba(0,229,160,0.2)`, borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.6rem', margin:'0 auto 16px' }}>💳</div>
          <div style={{ fontSize:'1.2rem', fontWeight:800, color:C.accent, marginBottom:8 }}>Пополнение баланса</div>
          <div style={{ fontSize:'0.85rem', color:C.dim, lineHeight:1.6 }}>Пополнение осуществляется через поддержку</div>
        </div>
        <div style={{ background:C.card, borderRadius:16, padding:'4px 0', marginBottom:20, border:`1px solid ${C.border}` }}>
          {[{ label:'Telegram', val:'@privax_support', icon:'✈️' }, { label:'Email', val:'support@privax.ru', icon:'✉️' }].map((item, i, arr) => (
            <div key={item.label} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderBottom: i<arr.length-1 ? `1px solid ${C.border}` : 'none' }}>
              <span style={{ fontSize:'1rem' }}>{item.icon}</span>
              <div>
                <div style={{ fontSize:'0.65rem', color:C.dim, letterSpacing:'0.1em', marginBottom:2 }}>{item.label}</div>
                <div style={{ fontSize:'0.9rem', fontWeight:600, color:C.accent }}>{item.val}</div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={onClose} style={{ width:'100%', background:C.green, color:C.bg, border:'none', borderRadius:13, padding:'14px 0', fontWeight:800, fontSize:'0.9rem', cursor:'pointer', fontFamily:'inherit', boxShadow:`0 0 20px ${C.greenGlow}` }}>Понятно</button>
      </div>
    </div>
  )
}

function QrModal({ value, onClose }: { value: string; onClose: () => void }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=${encodeURIComponent(value)}`
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:C.surface, borderRadius:24, padding:'28px', border:`1px solid ${C.border}`, display:'flex', flexDirection:'column', alignItems:'center', gap:14, maxWidth:280 }}>
        <div style={{ fontSize:'0.7rem', color:C.dim, letterSpacing:'0.15em', textTransform:'uppercase' }}>Токен для подключения</div>
        <img src={url} alt="QR" width={220} height={220} style={{ borderRadius:12, background:'#fff', display:'block' }} />
        <div style={{ fontSize:'0.75rem', color:C.dim, textAlign:'center', lineHeight:1.5 }}>Отсканируйте в AmneziaVPN или Hiddify</div>
        <button onClick={onClose} style={{ width:'100%', background:'transparent', border:`1px solid ${C.border}`, color:C.dimHi, borderRadius:12, padding:'10px 0', fontSize:'0.82rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'border-color 0.2s, color 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor=C.accent; e.currentTarget.style.color=C.accent }}
          onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.dimHi }}>Закрыть</button>
      </div>
    </div>
  )
}

// SVG иконка QR-кода
function QrIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none"/>
      <rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none"/>
      <rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none"/>
      <path d="M14 14h3v3h-3z" fill="currentColor" stroke="none"/>
      <path d="M17 14h4"/>
      <path d="M17 17v4"/>
      <path d="M21 17h-4v4"/>
    </svg>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const toast = useToast()
  const [supportSubject, setSupportSubject] = useState<string | null>(null)
  const [openSettingsId, setOpenSettingsId] = useState<string | null>(null)
  const [tab, setTab] = useState<'subscriptions'|'history'|'security'>('subscriptions')
  const [email, setEmail] = useState('')
  const [balance, setBalance] = useState(0)
  const [activeSubs, setActiveSubs] = useState<Subscription[]>([])
  const [expiredSubs, setExpiredSubs] = useState<Subscription[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  const [oldPw,  setOldPw]  = useState('')
  const [newPw,  setNewPw]  = useState('')
  const [newPw2, setNewPw2] = useState('')
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)

  const [copiedId, setCopiedId] = useState<number|null>(null)
  const [qrLink,   setQrLink]   = useState<string|null>(null)
  const [showTopUp,setShowTopUp]= useState(false)
  const [resetConfirmId,  setResetConfirmId]  = useState<number|null>(null)
  const [resetLoadingId,  setResetLoadingId]  = useState<number|null>(null)
  const [resetError,      setResetError]      = useState('')
  const [autoRenewLoading,setAutoRenewLoading]= useState<string|null>(null)

  const [histFilter, setHistFilter] = useState<'all'|'credit'|'debit'>('all')
  const [expandedInv, setExpandedInv] = useState<number|null>(null)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) { navigate('/login'); return }
    try {
      const p = JSON.parse(atob(token.split('.')[1]))
      if (p.exp < Date.now()/1000) { localStorage.removeItem('access_token'); navigate('/login'); return }
    } catch { navigate('/login'); return }
    loadData()
  }, [])

  async function loadData() {
    const token = localStorage.getItem('access_token')
    try {
      const res = await apiFetch('/users/me')
      if (res.status === 401) { localStorage.removeItem('access_token'); navigate('/login'); return }
      const me = await res.json()
      setEmail(me.email); setBalance(me.balance)
      setInvoices(me.payment_history || [])
      setActiveSubs(me.subscriptions?.active || [])
      setExpiredSubs(me.subscriptions?.expired || [])
    } catch {} finally { setLoading(false) }
  }

  async function handleChangePassword() {
    
    if (!oldPw||!newPw||!newPw2) { toast.error('Заполните все поля'); return }
    if (newPw !== newPw2)         { toast.error('Пароли не совпадают'); return }
    if (newPw.length < 8)         { toast.error('Минимум 8 символов'); return }
    setPwLoading(true)
    try {
      const res = await apiFetch(`/auth/change-password`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ old_password:oldPw, new_password:newPw }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.detail || 'Ошибка'); return }
      toast.success('Ключ доступа обновлён')
      setTimeout(() => { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); navigate('/login') }, 1500)
    } catch { toast.error('Сервер недоступен') } finally { setPwLoading(false) }
  }

  async function handleAutoRenew(configId: number, groupId: string) {
    setAutoRenewLoading(groupId)
    try {
      const res = await apiFetch(`/subscriptions/${configId}/auto-renew`, { method:'PATCH' })
      const data = await res.json()
      if (!res.ok) return
      setActiveSubs(prev => prev.map(s => (s.group_id ?? String((s as any).id)) === groupId ? { ...s, auto_renew: data.auto_renew } : s))
    } catch {} finally { setAutoRenewLoading(null) }
  }

  async function handleReset(configId: number) {
    setResetLoadingId(configId); setResetError('')
    try {
      const res = await apiFetch(`/subscriptions/${configId}/reset`, { method:'POST' })
      const data = await res.json()
      if (!res.ok) { setResetError(data.detail||'Ошибка сброса'); return }
      setActiveSubs(prev => prev.map(sub => {
        const first = sub.devices?.[0]
        if (first && first.id === configId) return { ...sub, devices: sub.devices.map(d => d.id===configId ? { ...d, vless_link:data.vless_link, sub_url:data.sub_url } : d) }
        return sub
      }))
      setResetConfirmId(null)
    } catch { setResetError('Сервер недоступен') } finally { setResetLoadingId(null) }
  }

  function logout() { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); navigate('/') }
  function fmtDate(iso: string) { return new Date(iso).toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' }) }

  const isCredit = (inv: Invoice) => inv.type === 'Пополнение баланса' || (inv.amount > 0 && !inv.type.includes('Покупка') && !inv.type.includes('Списание'))
  const filteredInvoices = invoices.filter(inv => {
    if (histFilter === 'credit') return isCredit(inv)
    if (histFilter === 'debit')  return !isCredit(inv)
    return true
  })

  const inputBase: React.CSSProperties = {
    width:'100%', boxSizing:'border-box',
    background:C.card, border:`1px solid ${C.border}`,
    borderRadius:12, padding:'13px 16px',
    color:C.accent, fontSize:'0.93rem',
    outline:'none', fontFamily:'inherit',
    transition:'border-color 0.2s',
  }

  if (loading) return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:C.dim, fontSize:'0.9rem' }}>Загрузка...</div>
    </div>
  )

  const tabs = [
    { key:'subscriptions' as const, label:'Подписки' },
    { key:'history'       as const, label:'История' },
    { key:'security'      as const, label:'Безопасность' },
  ]


  async function closeTicket(ticketId: number) {
    const token = localStorage.getItem('access_token')
    await apiFetch(`/support/tickets/${ticketId}/close`, { method: 'POST' })
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'closed' } : t))
  }


  return (
    <div style={{ background:C.bg, minHeight:'100vh', fontFamily:'"DM Sans", system-ui, sans-serif', color:C.accent, display:'flex', flexDirection:'column' }}>
      <style>{`
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .dash-input:focus { border-color: ${C.borderHi} !important; }
        .dash-input::placeholder { color: ${C.dim}; }
        .dash-input:-webkit-autofill { -webkit-box-shadow:0 0 0 40px ${C.card} inset !important; -webkit-text-fill-color:${C.accent} !important; }
        .inv-row { cursor: pointer; transition: background 0.15s; }
        .inv-row:hover { background: rgba(255,255,255,0.03) !important; }
        .sub-card-active { border-color: rgba(0,229,160,0.2) !important; }
        .hist-filter-btn { transition: background 0.2s, color 0.2s, border-color 0.2s; }
        @media (max-width: 480px) {
          .profile-card { flex-direction: column !important; align-items: stretch !important; }
          .profile-card-right { flex-direction: row !important; justify-content: space-between !important; align-items: center !important; }
          .profile-card-balance { text-align: left !important; }
          .profile-card-btns { flex-direction: row !important; }
          .hist-filters { flex-wrap: wrap !important; }
          .sub-meta { flex-direction: column !important; gap: 4px !important; }
          .sub-meta-id { margin-left: 0 !important; }
          .footer-grid { flex-direction: column !important; gap: 32px !important; }
          .footer-links { gap: 32px !important; }
          .footer-bottom { flex-direction: column !important; gap: 8px !important; }
        }
      `}</style>

      {qrLink    && <QrModal value={qrLink} onClose={() => setQrLink(null)} />}
      {showTopUp && <TopUpModal onClose={() => setShowTopUp(false)} />}

      <NavbarAuth onLogout={logout} />

      <main style={{ flex:1, maxWidth:680, margin:'0 auto', width:'100%', padding:'32px 20px 48px', display:'flex', flexDirection:'column', gap:14 }}>

        {/* ── Профиль ── */}
        <div className="profile-card" style={{ background:C.surface, borderRadius:22, padding:'22px 24px', border:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', gap:16 }}>
          <div>
            <div style={{ fontSize:'0.62rem', color:C.dim, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:5 }}>Аккаунт</div>
            <div style={{ fontSize:'1rem', fontWeight:600, color:C.accent }}>{email}</div>
          </div>
          <div className="profile-card-right" style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div className="profile-card-balance" style={{ textAlign:'right' }}>
              <div style={{ fontSize:'0.62rem', color:C.dim, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:4 }}>Баланс</div>
              {/* уменьшенный шрифт баланса */}
              <div style={{ fontSize:'1.05rem', fontWeight:800, color:C.accent, letterSpacing:'-0.01em' }}>{balance.toLocaleString('ru-RU')} ₽</div>
            </div>
            <div className="profile-card-btns" style={{ display:'flex', flexDirection:'column', gap:7 }}>
              <button onClick={() => setShowTopUp(true)}
                style={{ background:'transparent', border:`1px solid rgba(0,229,160,0.35)`, color:C.green, borderRadius:10, padding:'7px 14px', fontSize:'0.75rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'background 0.2s', whiteSpace:'nowrap' }}
                onMouseEnter={e => e.currentTarget.style.background=C.greenDim}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                + Пополнить
              </button>
              <button onClick={() => navigate('/plans')}
                style={{ background:C.green, color:C.bg, border:'none', borderRadius:10, padding:'7px 14px', fontSize:'0.75rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
                Купить →
              </button>
            </div>
          </div>
        </div>

        {/* ── Вкладки ── */}
        <div style={{ display:'flex', gap:6, background:C.surface, borderRadius:16, padding:5, border:`1px solid ${C.border}` }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ flex:1, padding:'10px 8px', borderRadius:12, border:'none', fontWeight:600, fontSize:'0.8rem', cursor:'pointer', fontFamily:'inherit', transition:'background 0.2s, color 0.2s', textAlign:'center' as const,
                background: tab===t.key ? C.accent : 'transparent',
                color:       tab===t.key ? C.bg     : C.dim,
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ════ ПОДПИСКИ ════ */}
        {tab === 'subscriptions' && (
          <div style={{ display:'flex', flexDirection:'column', gap:12, animation:'fadeUp 0.4s ease both' }}>
            {activeSubs.length === 0 && expiredSubs.length === 0 ? (
              <div style={{ background:C.surface, borderRadius:22, padding:'48px 28px', border:`1px solid ${C.border}`, textAlign:'center' }}>
                <div style={{ fontSize:'2.2rem', marginBottom:14 }}>🔒</div>
                <div style={{ fontSize:'1rem', fontWeight:700, color:C.accent, marginBottom:8 }}>Нет активных узлов</div>
                <div style={{ fontSize:'0.85rem', color:C.dim, marginBottom:24 }}>Выберите тариф, чтобы начать защиту</div>
                <button onClick={() => navigate('/plans')}
                  style={{ background:C.green, color:C.bg, border:'none', borderRadius:13, padding:'14px 32px', fontWeight:800, fontSize:'0.88rem', cursor:'pointer', fontFamily:'inherit', boxShadow:`0 0 20px ${C.greenGlow}` }}>
                  Выбрать тариф →
                </button>
              </div>
            ) : (
              <>
                {activeSubs.map(sub => {
                  const devices: Device[] = sub.devices?.length > 0 ? sub.devices : sub.vless_link ? [{ id:(sub as any).id??0, device_index:1, device_name:'Устройство 1', vless_link:sub.vless_link, sub_url:sub.sub_url, is_active:true, country_code:'?' }] : []
                  const firstDevId = devices[0]?.id ?? null
                  const maxDev     = sub.devices_total || (sub as any).max_devices || null
                  const orderId    = sub.group_id ?? (sub as any).id
                  const daysLeft   = sub.days_left

                  return (
                    <div key={orderId} className="sub-card-active" style={{ background:C.surface, borderRadius:22, padding:'22px 24px', border:`1px solid ${C.border}`, position:'relative' }}>

                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                        <div>
                          <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:C.greenDim, border:`1px solid rgba(0,229,160,0.2)`, borderRadius:20, padding:'3px 10px', marginBottom:8 }}>
                            <span style={{ width:6, height:6, borderRadius:'50%', background:C.green, display:'block' }} />
                            <span style={{ fontSize:'0.62rem', color:C.green, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' }}>Защищено</span>
                          </div>
                          <div style={{ fontSize:'1rem', fontWeight:700, color:C.accent }}>{sub.plan}</div>
                        </div>
                        <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                          <div style={{ textAlign:'right' }}>
                            <div style={{ fontSize:'0.65rem', color:C.dim, marginBottom:4 }}>Осталось</div>
                            <div style={{ fontSize:'1.4rem', fontWeight:900, color: daysLeft <= 3 ? C.red : daysLeft <= 7 ? '#f59e0b' : C.accent, letterSpacing:'-0.02em' }}>{daysLeft}<span style={{ fontSize:'0.75rem', fontWeight:500, color:C.dim }}> дн.</span></div>
                          </div>
                          <button onClick={() => setOpenSettingsId(openSettingsId === String(orderId) ? null : String(orderId))}
                            title="Настройки подписки"
                            style={{ width:34, height:34, borderRadius:10, background: openSettingsId===String(orderId) ? C.greenDim : C.card, border:`1px solid ${openSettingsId===String(orderId) ? 'rgba(0,229,160,0.35)' : C.border}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.2s', color: openSettingsId===String(orderId) ? C.green : C.dim }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(0,229,160,0.35)'; e.currentTarget.style.color=C.green; e.currentTarget.style.background=C.greenDim }}
                            onMouseLeave={e => { if(openSettingsId!==String(orderId)){ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.dim; e.currentTarget.style.background=C.card }}}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Мета */}
                      <div className="sub-meta" style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
                        {/* Дата окончания */}
                        <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(255,255,255,0.05)', border:`1px solid ${C.border}`, borderRadius:8, padding:'4px 10px' }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.dimHi} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          <span style={{ fontSize:'0.75rem', color:C.dimHi, fontWeight:600 }}>до {fmtDate(sub.expires_at)}</span>
                        </span>
                        {/* Устройства */}
                        {maxDev && (
                          <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:C.greenDim, border:`1px solid rgba(0,229,160,0.2)`, borderRadius:8, padding:'4px 10px' }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                            <span style={{ fontSize:'0.75rem', color:C.green, fontWeight:700 }}>до {maxDev} устройств</span>
                          </span>
                        )}
                        <span className="sub-meta-id" style={{ fontSize:'0.72rem', color:C.dim, marginLeft:'auto', fontFamily:'monospace', letterSpacing:'0.05em', background:C.card, padding:'2px 8px', borderRadius:6 }}>
                          #{String(orderId).slice(-6).toUpperCase()}
                        </span>
                      </div>

                      {devices.length > 0 ? (
                        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                          {devices.map(dev => (
                            <div key={dev.id}>
                              {devices.length > 1 && (
                                <div style={{ fontSize:'0.68rem', color:C.dim, marginBottom:4 }}>
                                  {dev.device_name}{dev.country_code !== '?' ? ` · ${dev.country_code}` : ''}
                                </div>
                              )}
                              {dev.vless_link ? (
                                <div style={{ display:'flex', gap:8 }}>
                                  <button onClick={() => { navigator.clipboard.writeText(dev.vless_link!); setCopiedId(dev.id); setTimeout(() => setCopiedId(null), 2000) }}
                                    style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, background: copiedId===dev.id ? C.green : C.card, color: copiedId===dev.id ? C.bg : C.accent, border:`1px solid ${copiedId===dev.id ? C.green : C.border}`, borderRadius:12, padding:'11px 0', fontSize:'0.82rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}
                                    onMouseEnter={e => { if(copiedId!==dev.id){ e.currentTarget.style.borderColor=C.borderHi }}}
                                    onMouseLeave={e => { if(copiedId!==dev.id){ e.currentTarget.style.borderColor=C.border }}}>
                                    {copiedId===dev.id ? '✓ Скопировано' : '🔑 Ключ доступа'}
                                  </button>
                                  {/* SVG иконка QR */}
                                  <button onClick={() => setQrLink(dev.vless_link!)}
                                    style={{ width:44, flexShrink:0, background:C.card, color:C.dimHi, border:`1px solid ${C.border}`, borderRadius:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'border-color 0.2s, color 0.2s' }}
                                    title="QR-код"
                                    onMouseEnter={e => { e.currentTarget.style.borderColor=C.borderHi; e.currentTarget.style.color=C.accent }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.dimHi }}>
                                    <QrIcon />
                                  </button>
                                </div>
                              ) : (
                                <div style={{ fontSize:'0.8rem', color:C.dim, padding:'10px 0' }}>Конфигурация формируется...</div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize:'0.8rem', color:C.dim }}>Конфигурация формируется...</div>
                      )}

                      {/* ─── Дропдаун настроек ─── */}
                      {firstDevId !== null && openSettingsId === String(orderId) && (
                        <>
                          {/* Оверлей — клик закрывает */}
                          <div onClick={() => { setOpenSettingsId(null); setResetConfirmId(null) }}
                            style={{ position:'fixed', inset:0, zIndex:99 }} />

                          <div style={{ position:'absolute', top:14, right:14, zIndex:100, width:270, background:C.card, border:`1px solid ${C.borderHi}`, borderRadius:16, boxShadow:'0 16px 48px rgba(0,0,0,0.55)', padding:'8px', animation:'settingsIn 0.2s cubic-bezier(0.34,1.3,0.64,1) both' }}>

                            {/* Заголовок */}
                            <div style={{ padding:'8px 10px 10px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:`1px solid ${C.border}`, marginBottom:6 }}>
                              <span style={{ fontSize:'0.62rem', color:C.green, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase' }}>Настройки</span>
                              <button onClick={() => { setOpenSettingsId(null); setResetConfirmId(null) }}
                                style={{ background:'none', border:'none', color:C.dim, cursor:'pointer', fontSize:'0.9rem', padding:0, lineHeight:1 }}>✕</button>
                            </div>

                            {/* Авто-продление */}
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 10px', borderRadius:10 }}>
                              <div>
                                <div style={{ fontSize:'0.82rem', fontWeight:600, color:C.accent }}>Авто-продление</div>
                                <div style={{ fontSize:'0.7rem', color:C.dim, marginTop:1 }}>Спишется в день истечения</div>
                              </div>
                              <button onClick={() => handleAutoRenew(firstDevId, String(orderId))} disabled={autoRenewLoading===String(orderId)}
                                style={{ width:40, height:22, borderRadius:11, border:'none', cursor:'pointer', position:'relative', transition:'background 0.25s', flexShrink:0, background: sub.auto_renew ? C.green : C.border, opacity: autoRenewLoading===String(orderId) ? 0.6 : 1 }}>
                                <span style={{ position:'absolute', top:2, left: sub.auto_renew ? 20 : 2, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left 0.2s', display:'block' }} />
                              </button>
                            </div>

                            <div style={{ height:1, background:C.border, margin:'4px 0' }} />

                            {/* Поддержка */}
                            <button onClick={() => { setSupportSubject(`Вопрос по подписке ${sub.plan} #${orderId}`); setOpenSettingsId(null) }}
                              style={{ width:'100%', boxSizing:'border-box', display:'flex', alignItems:'center', gap:10, background:'transparent', border:'none', color:C.dimHi, borderRadius:10, padding:'10px', fontSize:'0.83rem', fontWeight:500, cursor:'pointer', fontFamily:'inherit', transition:'background 0.15s, color 0.15s', textAlign:'left' as const }}
                              onMouseEnter={e => { e.currentTarget.style.background=C.surface; e.currentTarget.style.color=C.accent }}
                              onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color=C.dimHi }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                              Написать в поддержку
                            </button>

                            <div style={{ height:1, background:C.border, margin:'4px 0' }} />

                            {/* Сброс */}
                            {resetConfirmId === firstDevId ? (
                              <div style={{ padding:'10px', background:C.redDim, borderRadius:10, border:`1px solid rgba(255,94,94,0.2)` }}>
                                <div style={{ fontSize:'0.8rem', fontWeight:700, color:C.accent, marginBottom:4 }}>Подтвердить сброс?</div>
                                <div style={{ fontSize:'0.72rem', color:C.dim, marginBottom:10, lineHeight:1.5 }}>Все устройства отключатся. Выдаётся новый ключ.</div>
                                {resetError && <div style={{ fontSize:'0.72rem', color:C.red, marginBottom:8 }}>{resetError}</div>}
                                <div style={{ display:'flex', gap:6 }}>
                                  <button onClick={() => { setResetConfirmId(null); setResetError('') }}
                                    style={{ flex:1, background:'transparent', border:`1px solid ${C.border}`, color:C.dim, borderRadius:8, padding:'7px 0', fontSize:'0.78rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit', textAlign:'center' as const }}>
                                    Отмена
                                  </button>
                                  <button onClick={() => handleReset(firstDevId)} disabled={resetLoadingId===firstDevId}
                                    style={{ flex:2, background:'rgba(255,94,94,0.2)', border:'1px solid rgba(255,94,94,0.4)', color:C.red, borderRadius:8, padding:'7px 0', fontSize:'0.78rem', fontWeight:700, cursor: resetLoadingId===firstDevId ? 'not-allowed' : 'pointer', fontFamily:'inherit', textAlign:'center' as const, opacity: resetLoadingId===firstDevId ? 0.7 : 1 }}>
                                    {resetLoadingId===firstDevId ? 'Сбрасываем...' : '⚠ Сбросить'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => { setResetConfirmId(firstDevId); setResetError('') }}
                                style={{ width:'100%', boxSizing:'border-box', display:'flex', alignItems:'center', gap:10, background:'transparent', border:'none', color:C.red, borderRadius:10, padding:'10px', fontSize:'0.83rem', fontWeight:500, cursor:'pointer', fontFamily:'inherit', transition:'background 0.15s', textAlign:'left' as const, opacity:0.8 }}
                                onMouseEnter={e => { e.currentTarget.style.background='rgba(255,94,94,0.08)'; e.currentTarget.style.opacity='1' }}
                                onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.opacity='0.8' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                Сбросить все устройства
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}

                {expiredSubs.map(sub => (
                  <div key={sub.id} style={{ background:C.surface, borderRadius:22, padding:'18px 24px', border:`1px solid ${C.border}`, opacity:0.5, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ fontSize:'0.62rem', color:C.red, letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:4 }}>Истекла</div>
                      <div style={{ fontSize:'0.95rem', fontWeight:600, color:C.accent }}>{sub.plan}</div>
                    </div>
                    <div style={{ fontSize:'0.78rem', color:C.dim }}>{fmtDate(sub.expires_at)}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ════ ИСТОРИЯ ════ */}
        {tab === 'history' && (
          <div style={{ display:'flex', flexDirection:'column', gap:12, animation:'fadeUp 0.4s ease both' }}>
            <div className="hist-filters" style={{ display:'flex', gap:7 }}>
              {([['all','Все'],['credit','Пополнения'],['debit','Списания']] as const).map(([key, label]) => (
                <button key={key} className="hist-filter-btn" onClick={() => setHistFilter(key)}
                  style={{ background: histFilter===key ? C.accent : C.surface, color: histFilter===key ? C.bg : C.dim, border:`1px solid ${histFilter===key ? C.accent : C.border}`, borderRadius:10, padding:'7px 14px', fontSize:'0.78rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                  {label}
                </button>
              ))}
            </div>

            <div style={{ background:C.surface, borderRadius:22, border:`1px solid ${C.border}`, overflow:'hidden' }}>
              <div style={{ padding:'16px 22px', borderBottom:`1px solid ${C.border}` }}>
                <div style={{ fontSize:'0.85rem', fontWeight:700, color:C.accent }}>История операций</div>
              </div>
              {filteredInvoices.length === 0 ? (
                <div style={{ padding:'40px', textAlign:'center', color:C.dim, fontSize:'0.85rem' }}>
                  {invoices.length === 0 ? 'Операций пока нет' : 'Нет операций в этой категории'}
                </div>
              ) : (
                filteredInvoices.map((inv, i) => {
                  const credit = isCredit(inv)
                  const expanded = expandedInv === inv.id
                  return (
                    <div key={inv.id}>
                      <div className="inv-row" onClick={() => setExpandedInv(expanded ? null : inv.id)}
                        style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 22px', borderBottom: i < filteredInvoices.length-1 || expanded ? `1px solid ${C.border}` : 'none', background: expanded ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                          <div style={{ width:34, height:34, borderRadius:10, background: credit ? C.greenDim : C.card, border:`1px solid ${credit ? 'rgba(0,229,160,0.2)' : C.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.9rem', flexShrink:0 }}>
                            {credit ? '↓' : '↑'}
                          </div>
                          <div>
                            <div style={{ fontSize:'0.88rem', fontWeight:600, color:C.accent }}>
                              {credit ? 'Пополнение баланса' : inv.plan ? 'Активация узла' : 'Списание'}
                            </div>
                            {inv.plan && <div style={{ fontSize:'0.72rem', color:C.dim, marginTop:1 }}>{inv.plan}</div>}
                            <div style={{ fontSize:'0.72rem', color:C.dim, marginTop:1 }}>{fmtDate(inv.date)}</div>
                          </div>
                        </div>
                        <div style={{ textAlign:'right', flexShrink:0 }}>
                          <div style={{ fontSize:'0.95rem', fontWeight:700, color: credit ? C.green : C.accent }}>
                            {credit ? '+' : '−'}{Math.abs(inv.amount)} ₽
                          </div>
                          <div style={{ fontSize:'0.7rem', marginTop:2, display:'flex', alignItems:'center', gap:4, justifyContent:'flex-end' }}>
                            {inv.status === 'paid'
                              ? <><span style={{ color:C.green }}>✓</span><span style={{ color:C.green }}>Выполнено</span></>
                              : <><span style={{ color:C.red }}>✕</span><span style={{ color:C.red }}>Отменено</span></>
                            }
                          </div>
                        </div>
                      </div>
                      {expanded && (
                        <div style={{ padding:'12px 22px 16px', borderBottom: i < filteredInvoices.length-1 ? `1px solid ${C.border}` : 'none', background:'rgba(255,255,255,0.015)' }}>
                          <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
                            {[['ID операции', `#${inv.id}`], ['Дата', fmtDate(inv.date)], ['Метод', 'Баланс Privax'], ['Статус', inv.status === 'paid' ? 'Выполнено' : 'Отменено']].map(([k, v]) => (
                              <div key={k}>
                                <div style={{ fontSize:'0.65rem', color:C.dim, marginBottom:3 }}>{k}</div>
                                <div style={{ fontSize:'0.82rem', color:C.dimHi, fontFamily: k==='ID операции' ? 'monospace' : 'inherit' }}>{v}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* ════ БЕЗОПАСНОСТЬ ════ */}
        {tab === 'security' && (
          <div style={{ display:'flex', flexDirection:'column', gap:12, animation:'fadeUp 0.4s ease both' }}>

            <div style={{ background:C.surface, borderRadius:22, padding:'24px', border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:'0.62rem', color:C.green, letterSpacing:'0.22em', textTransform:'uppercase', fontWeight:700, marginBottom:16 }}>Ключ доступа</div>
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:'0.8rem', color:C.dimHi, fontWeight:600, display:'block', marginBottom:7 }}>Текущий пароль</label>
                <div style={{ position:'relative' }}>
                  <input className="dash-input" type={showOld ? 'text' : 'password'} placeholder="••••••••" value={oldPw} onChange={e => setOldPw(e.target.value)} style={{ ...inputBase, paddingRight:44 }} />
                  <button onClick={() => setShowOld(v=>!v)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:C.dim, fontSize:'1rem', padding:0 }}>{showOld ? '🙈' : '👁'}</button>
                </div>
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:'0.8rem', color:C.dimHi, fontWeight:600, display:'block', marginBottom:7 }}>Новый пароль</label>
                <div style={{ position:'relative' }}>
                  <input className="dash-input" type={showNew ? 'text' : 'password'} placeholder="Минимум 8 символов" value={newPw} onChange={e => setNewPw(e.target.value)} style={{ ...inputBase, paddingRight:44 }} />
                  <button onClick={() => setShowNew(v=>!v)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:C.dim, fontSize:'1rem', padding:0 }}>{showNew ? '🙈' : '👁'}</button>
                </div>
                <StrengthBar pw={newPw} />
              </div>
              <div style={{ marginBottom:22 }}>
                <label style={{ fontSize:'0.8rem', color:C.dimHi, fontWeight:600, display:'block', marginBottom:7 }}>Подтвердите новый пароль</label>
                <input className="dash-input" type="password" placeholder="Повторите пароль" value={newPw2} onChange={e => setNewPw2(e.target.value)}
                  style={{ ...inputBase, borderColor: newPw2 && newPw !== newPw2 ? 'rgba(255,94,94,0.5)' : C.border }} />
                {newPw2 && newPw !== newPw2 && <div style={{ fontSize:'0.72rem', color:C.red, marginTop:5 }}>Пароли не совпадают</div>}
              </div>
              <button onClick={handleChangePassword} disabled={pwLoading}
                style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', background: pwLoading ? 'transparent' : C.green, color: pwLoading ? C.green : C.bg, border:`1px solid ${C.green}`, borderRadius:13, padding:'14px 0', fontWeight:800, fontSize:'0.9rem', cursor: pwLoading ? 'not-allowed' : 'pointer', fontFamily:'inherit', boxShadow: pwLoading ? 'none' : `0 0 16px ${C.greenGlow}`, transition:'background 0.2s, box-shadow 0.2s' }}>
                {pwLoading ? 'Обновляем...' : 'Обновить ключ доступа →'}
              </button>
            </div>

            <div style={{ background:C.surface, borderRadius:22, padding:'22px 24px', border:`1px solid ${C.border}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:'0.62rem', color:C.green, letterSpacing:'0.22em', textTransform:'uppercase', fontWeight:700, marginBottom:8 }}>Двойная защита</div>
                  <div style={{ fontSize:'0.92rem', fontWeight:700, color:C.accent, marginBottom:4 }}>Двухфакторная аутентификация</div>
                  <div style={{ fontSize:'0.8rem', color:C.dim }}>Подключите Telegram-бот или Google Authenticator</div>
                </div>
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:'4px 10px', fontSize:'0.7rem', color:C.dim, flexShrink:0, marginLeft:16 }}>Скоро</div>
              </div>
            </div>

            <div style={{ background:C.surface, borderRadius:22, padding:'22px 24px', border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:'0.62rem', color:C.green, letterSpacing:'0.22em', textTransform:'uppercase', fontWeight:700, marginBottom:14 }}>Активные сессии</div>
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:C.card, borderRadius:14, border:`1px solid ${C.border}`, marginBottom:12 }}>
                <div style={{ width:36, height:36, background:C.greenDim, border:`1px solid rgba(0,229,160,0.2)`, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', flexShrink:0 }}>💻</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'0.85rem', fontWeight:600, color:C.accent }}>Текущий сеанс</div>
                  <div style={{ fontSize:'0.72rem', color:C.dim }}>Веб-браузер · Активен сейчас</div>
                </div>
                <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:C.greenDim, border:`1px solid rgba(0,229,160,0.2)`, borderRadius:20, padding:'3px 9px' }}>
                  <span style={{ width:5, height:5, borderRadius:'50%', background:C.green, display:'block' }} />
                  <span style={{ fontSize:'0.65rem', color:C.green, fontWeight:600 }}>Онлайн</span>
                </div>
              </div>
              <button style={{ width:'100%', background:'transparent', border:`1px solid rgba(255,94,94,0.25)`, color:C.dim, borderRadius:11, padding:'10px 0', fontSize:'0.8rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'border-color 0.2s, color 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(255,94,94,0.5)'; e.currentTarget.style.color=C.red }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,94,94,0.25)'; e.currentTarget.style.color=C.dim }}>
                Завершить все сеансы
              </button>
            </div>

            <div style={{ background:C.card, borderRadius:16, padding:'14px 18px', border:`1px solid ${C.border}`, display:'flex', gap:10, alignItems:'flex-start' }}>
              <span style={{ fontSize:'0.9rem', flexShrink:0, marginTop:1 }}>🔒</span>
              <p style={{ fontSize:'0.78rem', color:C.dim, lineHeight:1.6, margin:0 }}>
                Ваши действия на платформе не логируются и защищены сквозным шифрованием. Администрация Privax не имеет доступа к вашим ключам.
              </p>
            </div>

            <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:16 }}>
              <button style={{ background:'transparent', border:'none', color:C.dim, fontSize:'0.78rem', cursor:'pointer', padding:0, fontFamily:'inherit', transition:'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color=C.red}
                onMouseLeave={e => e.currentTarget.style.color=C.dim}>
                Удалить аккаунт и все данные
              </button>
            </div>
          </div>
        )}

      </main>

      <Footer />

      {supportSubject !== null && createPortal(
        <SupportModal
          onClose={() => setSupportSubject(null)}
          initialSubject={supportSubject}
          initialType="question"
        />,
        document.body
      )}
    </div>
  )
}