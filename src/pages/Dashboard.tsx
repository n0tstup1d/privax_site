import { useState, useEffect } from 'react'
import { apiFetch, API } from '../api'
import { createPortal } from 'react-dom'
import { SupportModal } from './Support'
import { useToast } from '../components/Toast'
import { useNavigate } from 'react-router-dom'
import NavbarAuth from '../components/NavbarAuth'
import Footer from '../components/Footer'
import { KeyOnboardingModal, shouldShowOnboarding } from '../components/KeyOnboardingModal'

const C = {
  bg:        '#0d0f10',
  surface:   '#111416',
  card:      '#161a1d',
  border:    '#242a2e',
  borderHi:  '#2e3840',
  accent:    '#ffffff',
  dim:       '#8a9aaa',
  dimHi:     '#b0c0cc',
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
  next_reset_at?: string | null
  grace_period_end?: string | null
  plan_id?: number
  plan_duration_days?: number | null
  tier_level?: number | null
  server_name?: string | null
  server_ip?: string | null
}
interface Plan {
  id: number; name: string; display_name: string | null
  duration_days: number; final_price: number; price_per_month: number; tier_level: number
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
        <div style={{ fontSize:'0.75rem', color:C.dim, textAlign:'center', lineHeight:1.5 }}>Отсканируйте в приложении</div>
        <button onClick={onClose} style={{ width:'100%', background:'transparent', border:`1px solid ${C.border}`, color:C.dimHi, borderRadius:12, padding:'10px 0', fontSize:'0.82rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'border-color 0.2s, color 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor=C.accent; e.currentTarget.style.color=C.accent }}
          onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.dimHi }}>Закрыть</button>
      </div>
    </div>
  )
}

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

function ResetSuccessModal({ vlessLink, nextResetAt, onClose }: { vlessLink: string|null; nextResetAt: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const nextReset = new Date(nextResetAt).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:C.surface, borderRadius:24, padding:'36px 28px', border:`1px solid rgba(0,229,160,0.25)`, width:'100%', maxWidth:400, boxShadow:`0 0 60px rgba(0,229,160,0.12)`, animation:'fadeUp 0.35s cubic-bezier(0.34,1.3,0.64,1) both' }}>

        {/* Иконка успеха */}
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ width:64, height:64, background:C.greenDim, border:`1px solid rgba(0,229,160,0.3)`, borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', position:'relative' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            <span style={{ position:'absolute', top:-6, right:-6, width:20, height:20, background:C.green, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.65rem', fontWeight:900, color:C.bg }}>✓</span>
          </div>
          <div style={{ fontSize:'1.25rem', fontWeight:900, color:C.accent, marginBottom:8 }}>Устройства сброшены</div>
          <div style={{ fontSize:'0.85rem', color:C.dim, lineHeight:1.6 }}>
            Все подключения отключены.<br/>Новый ключ доступа сгенерирован.
          </div>
        </div>

        {/* Кнопка копирования ключа (скрытый блок с ключом, только кнопка) */}
        {vlessLink && (
          <button
            onClick={() => { navigator.clipboard.writeText(vlessLink); setCopied(true); setTimeout(() => setCopied(false), 2500) }}
            style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, background: copied ? C.green : 'transparent', color: copied ? C.bg : C.green, border:`1px solid rgba(0,229,160,0.4)`, borderRadius:12, padding:'12px 0', fontWeight:700, fontSize:'0.88rem', cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s', marginBottom:16 }}>
            {copied ? '✓ Скопировано!' : '🔑 Скопировать ключ'}
          </button>
        )}

        {/* Инфо о кулдауне */}
        <div style={{ background:C.card, borderRadius:12, padding:'12px 14px', border:`1px solid ${C.border}`, display:'flex', gap:10, alignItems:'center', marginBottom:20 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <div style={{ fontSize:'0.78rem', color:C.dim, lineHeight:1.5 }}>
            Следующий сброс доступен<br/>
            <span style={{ color:C.dimHi, fontWeight:600 }}>{nextReset}</span>
          </div>
        </div>

        <button onClick={onClose} style={{ width:'100%', background:C.green, color:C.bg, border:'none', borderRadius:13, padding:'14px 0', fontWeight:800, fontSize:'0.9rem', cursor:'pointer', fontFamily:'inherit', boxShadow:`0 0 20px ${C.greenGlow}`, textAlign:'center' as const }}>
          Готово
        </button>
      </div>
    </div>
  )
}



// ─── RenewModal ─────────────────────────────────────────────────────
function RenewModal({ sub, plans, onClose, onSuccess }: {
  sub: Subscription
  plans: Plan[]
  onClose: () => void
  onSuccess: () => void
}) {
  // Планы того же тира, отсортированные по длительности
  const tierPlans = plans
    .filter(p => p.tier_level === (sub as any).tier_level || plans.length <= 3)
    .sort((a, b) => a.duration_days - b.duration_days)

  // Базовый план (1 месяц или минимальный)
  const basePlan = tierPlans.find(p => p.duration_days <= 31) ?? tierPlans[0]

  // Слайдер: минимум 1 месяц, максимум 12
  const [months, setMonths] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const now = new Date()
  const isInGrace = sub.grace_period_end && new Date(sub.grace_period_end) > now
  const graceEnd = sub.grace_period_end ? new Date(sub.grace_period_end) : null

  // Подбираем лучший план под выбранное кол-во месяцев
  // Ищем план с duration_days >= months*30, или берём базовый и умножаем
  const targetDays = months * 30
  const matchedPlan = tierPlans.reduce<Plan | null>((best, p) => {
    if (p.duration_days <= targetDays + 5) {
      if (!best || p.duration_days > best.duration_days) return p
    }
    return best
  }, null) ?? basePlan

  // Цена: если есть точный план — его цена, иначе price_per_month * months
  const pricePerMonth = basePlan?.price_per_month ?? 0
  const totalPrice = matchedPlan && matchedPlan.duration_days >= targetDays - 5
    ? matchedPlan.final_price
    : Math.round(pricePerMonth * months)

  const planToUse = matchedPlan ?? basePlan

  async function handleRenew() {
    if (!planToUse) return
    setLoading(true); setError("")
    try {
      const res = await apiFetch(`/subscriptions/${sub.id}/renew`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: planToUse.id })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.detail || "Ошибка продления"); return }
      onSuccess()
    } catch { setError("Ошибка соединения") } finally { setLoading(false) }
  }

  const sliderPct = ((months - 1) / 11) * 100

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position:"fixed", inset:0, background:"rgba(13,15,16,0.88)", backdropFilter:"blur(6px)", zIndex:400, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}>
      <div style={{ background:C.surface, borderRadius:24, border:`1px solid ${C.border}`, width:"100%", maxWidth:420, padding:"28px 28px 24px", boxShadow:"0 24px 64px rgba(0,0,0,0.5)" }}>

        {/* Шапка */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
          <div>
            <div style={{ fontSize:"1rem", fontWeight:800, color:C.accent }}>Продление подписки</div>
            <div style={{ fontSize:"0.75rem", color:C.dim, marginTop:3 }}>{sub.plan}</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:C.dim, cursor:"pointer", fontSize:"1.1rem", lineHeight:1, padding:0 }}>✕</button>
        </div>

        {/* Grace period предупреждение */}
        {isInGrace && graceEnd && (
          <div style={{ background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.25)", borderRadius:12, padding:"10px 14px", marginBottom:18, fontSize:"0.78rem", color:"#f59e0b", display:"flex", gap:8, alignItems:"flex-start" }}>
            <span style={{ flexShrink:0 }}>⚠</span>
            <span>Подписка истекла. Успейте продлить до <strong>{graceEnd.toLocaleString("ru-RU",{day:"numeric",month:"long",hour:"2-digit",minute:"2-digit"})}</strong></span>
          </div>
        )}

        {/* Карточка с ценой */}
        <div style={{ background:C.greenDim, border:`1px solid rgba(0,229,160,0.25)`, borderRadius:16, padding:"18px 20px", marginBottom:22 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ fontSize:"0.92rem", fontWeight:700, color:C.accent }}>{months === 1 ? "1 месяц" : `${months} месяца${months >= 5 ? "" : months >= 2 ? "" : ""}`}</div>
              <div style={{ fontSize:"0.72rem", color:C.dim, marginTop:3 }}>{months * 30} дней доступа</div>
            </div>
            <div style={{ textAlign:"right" as const }}>
              <div style={{ fontSize:"1.4rem", fontWeight:900, color:C.green, letterSpacing:"-0.02em" }}>{totalPrice} ₽</div>
              {months > 1 && <div style={{ fontSize:"0.7rem", color:C.dim, marginTop:2 }}>{pricePerMonth} ₽/мес</div>}
            </div>
          </div>
        </div>

        {/* Слайдер */}
        <div style={{ marginBottom:22 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <span style={{ fontSize:"0.72rem", color:C.dim, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase" as const }}>Период</span>
            <span style={{ fontSize:"0.82rem", fontWeight:700, color:C.accent }}>
              {months === 1 ? "1 месяц" : months < 5 ? `${months} месяца` : `${months} месяцев`}
            </span>
          </div>
          <div style={{ position:"relative" as const }}>
            <input
              type="range"
              min={1} max={12} step={1}
              value={months}
              onChange={e => setMonths(Number(e.target.value))}
              style={{ width:"100%", appearance:"none" as any, WebkitAppearance:"none", height:4, borderRadius:2, outline:"none", cursor:"pointer",
                background:`linear-gradient(to right, ${C.green} ${sliderPct}%, ${C.border} ${sliderPct}%)` }}
            />
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
            <span style={{ fontSize:"0.65rem", color:C.dim }}>1 мес</span>
            <span style={{ fontSize:"0.65rem", color:C.dim }}>6 мес</span>
            <span style={{ fontSize:"0.65rem", color:C.dim }}>12 мес</span>
          </div>
        </div>

        {error && (
          <div style={{ background:"rgba(255,94,94,0.08)", border:"1px solid rgba(255,94,94,0.25)", borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:"0.78rem", color:C.red }}>{error}</div>
        )}

        <button
          onClick={handleRenew}
          disabled={!planToUse || loading}
          style={{ width:"100%", background:C.green, color:C.bg, border:"none", borderRadius:14, padding:"14px 0", fontWeight:800, fontSize:"0.9rem", cursor:"pointer", fontFamily:"inherit", boxShadow:`0 0 20px ${C.greenGlow}`, opacity:loading ? 0.7 : 1, display:"flex", alignItems:"center", justifyContent:"center", textAlign:"center" as const }}
        >
          {loading ? "Продляем..." : `Продлить за ${totalPrice} ₽`}
        </button>
        <div style={{ fontSize:"0.72rem", color:C.dim, textAlign:"center" as const, marginTop:10 }}>Средства спишутся с баланса</div>

      </div>
    </div>
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
  const [now, setNow] = useState(Date.now())

  const [oldPw,  setOldPw]  = useState('')
  const [newPw,  setNewPw]  = useState('')

  // Рефералка
  interface ReferralData {
    referral_code: string
    referral_link: string
    total_referred: number
    bonuses_earned: number
    pending: number
    bonus_days_per_referral: number
  }
  const [referralData, setReferralData] = useState<ReferralData | null>(null)
  const [referralCopied, setReferralCopied] = useState(false)
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
  const [resetSuccessData, setResetSuccessData] = useState<{ vless_link: string|null; next_reset_at: string } | null>(null)
  const [serverStatus, setServerStatus] = useState<Record<number, boolean | null>>({}) // configId -> online|null(loading)


  const [autoRenewLoading,setAutoRenewLoading]= useState<string|null>(null)
  const [renewSub, setRenewSub] = useState<Subscription | null>(null)
  const [renewPlans, setRenewPlans] = useState<Plan[]>([])
  const [addSubDevices, setAddSubDevices] = useState<Device[] | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingVless, setOnboardingVless] = useState<string | null>(null)

  const [histFilter, setHistFilter] = useState<'all'|'credit'|'debit'>('all')
  const [expandedInv, setExpandedInv] = useState<number|null>(null)

  useEffect(() => {
    loadData()
  }, [])

  // Проверяем статус серверов для активных подписок
  useEffect(() => {
    const checkServers = async () => {
      const active = activeSubs.filter((s) => s.is_active && !s.expired)
      for (const sub of active) {
        // Берём id первого устройства (config id) для запроса статуса
        const configId = sub.devices?.[0]?.id
        const groupId = sub.group_id
        if (!configId) continue
        setServerStatus(prev => ({ ...prev, [groupId]: null }))
        try {
          const r = await apiFetch(`/subscriptions/${configId}/server-status`)
          if (r.ok) {
            const data = await r.json()
            setServerStatus(prev => ({ ...prev, [groupId]: data.online }))
          }
        } catch {
          setServerStatus(prev => ({ ...prev, [groupId]: false }))
        }
      }
    }
    if (activeSubs.length > 0) checkServers()
  }, [activeSubs])

  // Тик для живого обратного отсчёта
  useEffect(() => {
    const minLeft = activeSubs.reduce((min, s) => {
      const ms = new Date(s.expires_at).getTime() - Date.now()
      return ms < min ? ms : min
    }, Infinity)
    const interval = minLeft < 3600000 ? 1000 : 60000
    const id = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(id)
  }, [activeSubs])

  async function loadData() {
    try {
      const [res, plansRes, refRes] = await Promise.all([
        apiFetch("/users/me"),
        fetch(`${API}/subscriptions/plans`),
        apiFetch("/referral/me")
      ])
      if (!res.ok) return
      const me = await res.json()
      setEmail(me.email); setBalance(me.balance)
      setInvoices(me.payment_history || [])
      setActiveSubs(me.subscriptions?.active || [])
      setExpiredSubs(me.subscriptions?.expired || [])
      if (plansRes.ok) {
        const plansData = await plansRes.json()
        if (Array.isArray(plansData)) setRenewPlans(plansData)
      }
      if (refRes.ok) {
        const refData = await refRes.json()
        setReferralData(refData)
      }
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
      setTimeout(() => { localStorage.removeItem('logged_in'); navigate('/login') }, 1500)
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
      if (!res.ok) {
        // Кулдаун — показываем время
        if (res.status === 429 && data.detail?.code === 'RESET_COOLDOWN') {
          setResetError(`Следующий сброс: ${new Date(data.detail.next_reset_at).toLocaleString('ru-RU', { day:'numeric', month:'long', hour:'2-digit', minute:'2-digit' })}`)
        } else {
          setResetError(data.detail?.message || data.detail || 'Ошибка сброса')
        }
        return
      }
      // Обновляем ссылку в стейте
      setActiveSubs(prev => prev.map(sub => {
        const first = sub.devices?.[0]
        if (first && first.id === configId) {
          return {
            ...sub,
            next_reset_at: data.next_reset_at,
            devices: sub.devices.map(d => d.id===configId ? { ...d, vless_link:data.vless_link, sub_url:data.sub_url } : d)
          }
        }
        return sub
      }))
      setResetConfirmId(null)
      setOpenSettingsId(null)
      // Показываем модалку успеха
      setResetSuccessData({ vless_link: data.vless_link, next_reset_at: data.next_reset_at })
    } catch { setResetError('Сервер недоступен') } finally { setResetLoadingId(null) }
  }

  function logout() { localStorage.removeItem('logged_in'); navigate('/') }
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

  return (
    <div style={{ background:C.bg, minHeight:'100vh', fontFamily:'"DM Sans", system-ui, sans-serif', color:C.accent, display:'flex', flexDirection:'column' }}>
      <style>{`
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes settingsIn { from{opacity:0;transform:scale(0.92) translateY(-6px)} to{opacity:1;transform:scale(1) translateY(0)} }
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
      {showOnboarding && <KeyOnboardingModal vlessLink={onboardingVless} onClose={() => setShowOnboarding(false)} />}
      {resetSuccessData && (
        <ResetSuccessModal
          vlessLink={resetSuccessData.vless_link}
          nextResetAt={resetSuccessData.next_reset_at}
          onClose={() => setResetSuccessData(null)}
        />
      )}

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

        {/* ── Рефералка — под профилем, только если данные загружены ── */}
        {referralData && (
          <div style={{ background:C.surface, borderRadius:22, padding:'20px 24px', border:`1px solid ${C.border}` }}>
            <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:14 }}>
              <div style={{ fontSize:'0.62rem', color:C.green, letterSpacing:'0.22em', textTransform:'uppercase', fontWeight:700 }}>
                Реферальная программа
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:6 }}>
                  {[
                    { label:'По ссылке', value: referralData.total_referred },
                    { label:'Ждут оплаты', value: referralData.pending },
                    { label:'Бонусов', value: referralData.bonuses_earned },
                  ].map(s => (
                    <div key={s.label} style={{ background: s.value > 0 ? 'rgba(0,229,160,0.08)' : C.card, border:`1px solid ${s.value > 0 ? 'rgba(0,229,160,0.3)' : C.border}`, borderRadius:10, padding:'8px 6px', textAlign:'center', boxShadow: s.value > 0 ? '0 0 12px rgba(0,229,160,0.15)' : 'none', transition:'all 0.2s' }}>
                      <div style={{ fontSize:'1.1rem', fontWeight:800, color: s.value > 0 ? C.green : C.dim }}>{s.value}</div>
                      <div style={{ fontSize:'0.62rem', color: s.value > 0 ? C.dimHi : C.dim, marginTop:2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'10px 14px' }}>
                <div style={{ fontSize:'1.2rem', fontWeight:900, color:C.green, lineHeight:1 }}>15%</div>
                <div style={{ fontSize:'0.7rem', color:C.dim, marginTop:4, lineHeight:1.4 }}>скидка другу на первую покупку</div>
              </div>
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'10px 14px' }}>
                <div style={{ fontSize:'1.2rem', fontWeight:900, color:C.green, lineHeight:1 }}>{referralData.bonus_days_per_referral} дн.</div>
                <div style={{ fontSize:'0.7rem', color:C.dim, marginTop:4, lineHeight:1.4 }}>вам бесплатно после его оплаты</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <div style={{ flex:1, background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'10px 14px', fontSize:'0.78rem', color:C.dimHi, fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {referralData.referral_link}
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(referralData.referral_link); setReferralCopied(true); setTimeout(() => setReferralCopied(false), 2000) }}
                style={{ flexShrink:0, background: referralCopied ? C.green : C.card, color: referralCopied ? C.bg : C.accent, border:`1px solid ${referralCopied ? C.green : C.border}`, borderRadius:12, padding:'10px 16px', fontSize:'0.8rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s', whiteSpace:'nowrap' }}
              >
                {referralCopied ? '✓ Скопировано' : 'Скопировать'}
              </button>
            </div>
          </div>
        )}

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
                  const msLeft      = new Date(sub.expires_at).getTime() - now
                  const hoursLeft   = msLeft / 3600000
                  const minutesLeft = msLeft / 60000
                  const isExpiring3h  = sub.is_active && hoursLeft > 0 && hoursLeft <= 3
                  const isExpiring24h = sub.is_active && hoursLeft > 3 && hoursLeft <= 24
                  const subPlans = renewPlans.filter(p => p.tier_level === (sub as any).tier_level || renewPlans.length > 0)
                  const canRenew = (sub.plan_duration_days ?? 30) >= 30

                  const serverOnline = serverStatus[sub.group_id]
                  return (
                    <div key={orderId} className="sub-card-active" style={{ background:C.surface, borderRadius:22, padding:'22px 24px', border:`1px solid ${C.border}`, position:'relative' }}>


                      {/* ── Баннер истечения ── */}
                      {isExpiring3h && canRenew && (
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, background:"rgba(255,94,94,0.08)", border:"1px solid rgba(255,94,94,0.25)", borderRadius:14, padding:"11px 14px", marginBottom:14 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <span style={{ fontSize:"1rem" }}>🔴</span>
                            <div>
                              <div style={{ fontSize:"0.78rem", fontWeight:700, color:C.red }}>Осталось менее 3 часов!</div>
                              <div style={{ fontSize:"0.7rem", color:C.dim, marginTop:1 }}>Продлите сейчас, чтобы не потерять доступ</div>
                            </div>
                          </div>
                          <button onClick={() => setRenewSub(sub)} style={{ background:C.red, color:"#fff", border:"none", borderRadius:10, padding:"7px 14px", fontSize:"0.75rem", fontWeight:700, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" as const, display:"flex", alignItems:"center", justifyContent:"center" }}>Продлить</button>
                        </div>
                      )}
                      {isExpiring24h && canRenew && (
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.25)", borderRadius:14, padding:"11px 14px", marginBottom:14 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <span style={{ fontSize:"1rem" }}>⚠️</span>
                            <div>
                              <div style={{ fontSize:"0.78rem", fontWeight:700, color:"#f59e0b" }}>Подписка заканчивается через 24 часа</div>
                              <div style={{ fontSize:"0.7rem", color:C.dim, marginTop:1 }}>Истекает {new Date(sub.expires_at).toLocaleString("ru-RU",{day:"numeric",month:"long",hour:"2-digit",minute:"2-digit"})}</div>
                            </div>
                          </div>
                          <button onClick={() => setRenewSub(sub)} style={{ background:"#f59e0b", color:"#000", border:"none", borderRadius:10, padding:"7px 14px", fontSize:"0.75rem", fontWeight:700, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" as const, display:"flex", alignItems:"center", justifyContent:"center" }}>Продлить</button>
                        </div>
                      )}
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                        <div>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                            <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:C.greenDim, border:`1px solid rgba(0,229,160,0.2)`, borderRadius:20, padding:'3px 10px' }}>
                              <span style={{ width:6, height:6, borderRadius:'50%', background:C.green, display:'block' }} />
                              <span style={{ fontSize:'0.62rem', color:C.green, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' }}>Защищено</span>
                            </div>
                            {/* Статус сервера */}
                            <span
                              title={serverOnline === null ? 'Проверяем сервер...' : serverOnline ? 'Сервер работает' : 'Сервер недоступен'}
                              style={{ display:'inline-flex', alignItems:'center', gap:5, background: serverOnline === false ? 'rgba(255,94,94,0.1)' : serverOnline === true ? 'rgba(0,229,160,0.08)' : 'rgba(138,154,170,0.1)', border:`1px solid ${serverOnline === false ? 'rgba(255,94,94,0.3)' : serverOnline === true ? 'rgba(0,229,160,0.2)' : 'rgba(138,154,170,0.2)'}`, borderRadius:20, padding:'3px 10px' }}>
                              <span style={{ width:6, height:6, borderRadius:'50%', background: serverOnline === null ? C.dim : serverOnline ? C.green : C.red, display:'block', boxShadow: serverOnline === true ? `0 0 5px ${C.green}` : serverOnline === false ? `0 0 5px ${C.red}` : 'none' }} />
                              <span style={{ fontSize:'0.62rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' as const, color: serverOnline === null ? C.dim : serverOnline ? C.green : C.red }}>
                                {serverOnline === null ? 'Проверка...' : serverOnline ? 'Онлайн' : 'Недоступен'}
                              </span>
                            </span>
                          </div>
                          <div style={{ fontSize:'1rem', fontWeight:700, color:C.accent }}>{sub.plan}</div>
                        </div>
                        <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                          <div style={{ textAlign:'right' }}>
                            <div style={{ fontSize:'0.65rem', color:C.dim, marginBottom:4 }}>
                              {msLeft <= 0 ? 'Истекло' : 'Осталось'}
                            </div>
                            <div style={{ fontSize:'1.4rem', fontWeight:900, letterSpacing:'-0.02em',
                              color: msLeft <= 0 ? C.dim : hoursLeft <= 3 ? C.red : hoursLeft <= 24 ? '#f59e0b' : daysLeft <= 7 ? '#f59e0b' : C.accent }}>
                              {msLeft <= 0
                                ? <span style={{ fontSize:'0.85rem', fontWeight:700 }}>Готово</span>
                                : hoursLeft >= 24
                                  ? <>{daysLeft}<span style={{ fontSize:'0.75rem', fontWeight:500, color:C.dim }}> дн.</span></>
                                  : minutesLeft >= 60
                                    ? <>{Math.floor(hoursLeft)}<span style={{ fontSize:'0.75rem', fontWeight:500, color:C.dim }}> ч.</span></>
                                    : <>{Math.ceil(minutesLeft)}<span style={{ fontSize:'0.75rem', fontWeight:500, color:C.dim }}> мин.</span></>
                              }
                            </div>
                          </div>
                          {/* ── Кнопка шестерёнки ── */}
                          <button onClick={() => setOpenSettingsId(openSettingsId === String(orderId) ? null : String(orderId))}
                            title="Настройки подписки"
                            style={{ width:34, height:34, borderRadius:10, background: C.green, color:C.bg, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.2s', boxShadow:'0 0 14px rgba(0,229,160,0.3)' }}
                            onMouseEnter={e => { e.currentTarget.style.boxShadow='0 0 24px rgba(0,229,160,0.55)'; e.currentTarget.style.transform='translateY(-1px)' }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow='0 0 14px rgba(0,229,160,0.3)'; e.currentTarget.style.transform='none' }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Мета */}
                      <div className="sub-meta" style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(255,255,255,0.05)', border:`1px solid ${C.border}`, borderRadius:8, padding:'4px 10px' }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.dimHi} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          <span style={{ fontSize:'0.75rem', color:C.dimHi, fontWeight:600 }}>до {fmtDate(sub.expires_at)}</span>
                        </span>
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
                                serverOnline === false ? (
                                  <button onClick={() => { setSupportSubject(`Проблема с сервером по подписке ${sub.plan}`); setTab('support') }}
                                    style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'rgba(255,94,94,0.1)', color:C.red, border:`1px solid rgba(255,94,94,0.3)`, borderRadius:12, padding:'11px 0', fontSize:'0.82rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s' }}
                                    onMouseEnter={e => { e.currentTarget.style.background='rgba(255,94,94,0.18)' }}
                                    onMouseLeave={e => { e.currentTarget.style.background='rgba(255,94,94,0.1)' }}>
                                    ⚠️ Сервер недоступен — написать в поддержку
                                  </button>
                                ) : (
                                <div style={{ display:'flex', gap:8 }}>
                                  <button onClick={() => { navigator.clipboard.writeText(dev.vless_link!); setCopiedId(dev.id); setTimeout(() => setCopiedId(null), 2000); if (shouldShowOnboarding()) { setOnboardingVless(dev.vless_link); setShowOnboarding(true) } }}
                                    style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, background: C.green, color: C.bg, border:'none', borderRadius:12, padding:'11px 0', fontSize:'0.82rem', fontWeight:800, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s', boxShadow:'0 0 18px rgba(0,229,160,0.3)', opacity: copiedId===dev.id ? 0.85 : 1 }}
                                    onMouseEnter={e => { e.currentTarget.style.boxShadow='0 0 28px rgba(0,229,160,0.55)'; e.currentTarget.style.transform='translateY(-1px)' }}
                                    onMouseLeave={e => { e.currentTarget.style.boxShadow='0 0 18px rgba(0,229,160,0.3)'; e.currentTarget.style.transform='none' }}>
                                    {copiedId===dev.id ? '✓ Скопировано' : '🔑 Скопировать ключ доступа'}
                                  </button>
                                  <button onClick={() => setQrLink(dev.vless_link!)}
                                    style={{ width:44, flexShrink:0, background:C.green, color:C.bg, border:'none', borderRadius:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s', boxShadow:'0 0 14px rgba(0,229,160,0.3)' }}
                                    title="QR-код"
                                    onMouseEnter={e => { e.currentTarget.style.boxShadow='0 0 24px rgba(0,229,160,0.55)'; e.currentTarget.style.transform='translateY(-1px)' }}
                                    onMouseLeave={e => { e.currentTarget.style.boxShadow='0 0 14px rgba(0,229,160,0.3)'; e.currentTarget.style.transform='none' }}>
                                    <QrIcon />
                                  </button>
                                </div>
                                )
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
                          <div onClick={() => { setOpenSettingsId(null); setResetConfirmId(null) }}
                            style={{ position:'fixed', inset:0, zIndex:99 }} />

                          <div style={{ position:'absolute', top:14, right:14, zIndex:100, width:270, background:C.card, border:`1px solid ${C.borderHi}`, borderRadius:16, boxShadow:'0 16px 48px rgba(0,0,0,0.55)', padding:'8px', animation:'settingsIn 0.2s cubic-bezier(0.34,1.3,0.64,1) both' }}>

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


                            {/* Продление - только для тарифов >= 30 дней */}
                            {canRenew && (
                              <>
                                <button onClick={() => { setRenewSub(sub); setOpenSettingsId(null) }}
                                  style={{ width:"100%", boxSizing:"border-box" as const, display:"flex", alignItems:"center", gap:10, background:"transparent", border:"none", color:C.green, borderRadius:10, padding:"10px", fontSize:"0.83rem", fontWeight:600, cursor:"pointer", fontFamily:"inherit", transition:"background 0.15s", textAlign:"left" as const }}
                                  onMouseEnter={e => { e.currentTarget.style.background=C.greenDim }}
                                  onMouseLeave={e => { e.currentTarget.style.background="transparent" }}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
                                  Продлить подписку
                                </button>
                                <div style={{ height:1, background:C.border, margin:"4px 0" }} />
                              </>
                            )}
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
                            {(() => {
                              const isOnCooldown = sub.next_reset_at && new Date(sub.next_reset_at) > new Date()
                              const cooldownUntil = sub.next_reset_at ? new Date(sub.next_reset_at) : null

                              if (isOnCooldown && cooldownUntil) {
                                return (
                                  <div style={{ padding:'10px', borderRadius:10, background:'rgba(255,255,255,0.03)', border:`1px solid ${C.border}` }}>
                                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                      <span style={{ fontSize:'0.78rem', fontWeight:600, color:C.dim }}>Сброс недоступен</span>
                                    </div>
                                    <div style={{ fontSize:'0.72rem', color:C.dim, lineHeight:1.5 }}>
                                      Следующий сброс:<br/>
                                      <span style={{ color:C.dimHi }}>{cooldownUntil.toLocaleString('ru-RU', { day:'numeric', month:'long', hour:'2-digit', minute:'2-digit' })}</span>
                                    </div>
                                  </div>
                                )
                              }

                              return resetConfirmId === firstDevId ? (
                                <div style={{ padding:'10px', background:C.redDim, borderRadius:10, border:`1px solid rgba(255,94,94,0.2)` }}>
                                  <div style={{ fontSize:'0.8rem', fontWeight:700, color:C.accent, marginBottom:4 }}>Подтвердить сброс?</div>
                                  <div style={{ fontSize:'0.72rem', color:C.dim, marginBottom:10, lineHeight:1.5 }}>Все устройства отключатся. Выдаётся новый ключ.</div>
                                  {resetError && <div style={{ fontSize:'0.72rem', color:C.red, marginBottom:8 }}>{resetError}</div>}
                                  <div style={{ display:'flex', gap:6 }}>
                                    <button onClick={() => { setResetConfirmId(null); setResetError('') }}
                                      style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'transparent', border:`1px solid ${C.border}`, color:C.dim, borderRadius:8, padding:'7px 0', fontSize:'0.78rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                                      Отмена
                                    </button>
                                    <button onClick={() => handleReset(firstDevId)} disabled={resetLoadingId===firstDevId}
                                      style={{ flex:2, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,94,94,0.2)', border:'1px solid rgba(255,94,94,0.4)', color:C.red, borderRadius:8, padding:'7px 0', fontSize:'0.78rem', fontWeight:700, cursor: resetLoadingId===firstDevId ? 'not-allowed' : 'pointer', fontFamily:'inherit', opacity: resetLoadingId===firstDevId ? 0.7 : 1 }}>
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
                              )
                            })()}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}

                {expiredSubs.map(sub => {
                  const nowDate = new Date()
                  const inGrace = sub.grace_period_end && new Date(sub.grace_period_end) > nowDate
                  const canRenewExpired = (sub.plan_duration_days ?? 30) >= 30
                  const graceEnd = sub.grace_period_end ? new Date(sub.grace_period_end) : null
                  const hoursLeft = graceEnd ? (graceEnd.getTime() - nowDate.getTime()) / 3600000 : 0
                  return (
                    <div key={sub.id} style={{ background:C.surface, borderRadius:22, padding:"20px 24px", border:`1px solid ${inGrace ? "rgba(245,158,11,0.3)" : C.border}`, position:"relative" as const }}>
                      {inGrace && (
                        <div style={{ position:"absolute" as const, top:-1, left:0, right:0, height:3, borderRadius:"22px 22px 0 0", background:"linear-gradient(90deg,#f59e0b,rgba(245,158,11,0.3))" }} />
                      )}
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom: inGrace ? 14 : 0 }}>
                        <div>
                          <div style={{ display:"inline-flex", alignItems:"center", gap:5, background: inGrace ? "rgba(245,158,11,0.1)" : "rgba(255,94,94,0.08)", border:`1px solid ${inGrace ? "rgba(245,158,11,0.3)" : "rgba(255,94,94,0.2)"}`, borderRadius:20, padding:"2px 9px", marginBottom:6 }}>
                            <span style={{ width:5, height:5, borderRadius:"50%", background: inGrace ? "#f59e0b" : C.red, display:"block" }} />
                            <span style={{ fontSize:"0.6rem", color: inGrace ? "#f59e0b" : C.red, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" as const }}>{inGrace ? "Grace period" : "Истекла"}</span>
                          </div>
                          <div style={{ fontSize:"0.95rem", fontWeight:700, color:C.accent }}>{sub.plan}</div>
                          <div style={{ fontSize:"0.72rem", color:C.dim, marginTop:2 }}>Истекла {fmtDate(sub.expires_at)}</div>
                        </div>
                        {inGrace && canRenewExpired && (
                          <button onClick={() => setRenewSub(sub)} style={{ flexShrink:0, background:"#f59e0b", color:"#000", border:"none", borderRadius:12, padding:"9px 18px", fontSize:"0.8rem", fontWeight:800, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center" }}>Продлить →</button>
                        )}
                      </div>
                      {inGrace && graceEnd && (
                        <div style={{ background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.15)", borderRadius:10, padding:"9px 12px", fontSize:"0.75rem", color:"#f59e0b", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <span>⏳ Данные удалятся через {hoursLeft < 24 ? `${Math.ceil(hoursLeft)} ч.` : `${Math.ceil(hoursLeft/24)} дн.`}</span>
                          <span style={{ color:C.dim }}>до {graceEnd.toLocaleString("ru-RU",{day:"numeric",month:"long",hour:"2-digit",minute:"2-digit"})}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
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

            <div style={{ background:C.card, borderRadius:16, padding:'14px 18px', border:`1px solid ${C.border}`, display:'flex', gap:10, alignItems:'flex-start' }}>
              <span style={{ fontSize:'0.9rem', flexShrink:0, marginTop:1 }}>🔒</span>
              <p style={{ fontSize:'0.78rem', color:C.dim, lineHeight:1.6, margin:0 }}>
                Ваши действия на платформе не логируются и защищены сквозным шифрованием. Администрация Privax не имеет доступа к вашим ключам.
              </p>
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

      {renewSub && (
        <RenewModal
          sub={renewSub}
          plans={renewPlans}
          onClose={() => setRenewSub(null)}
          onSuccess={() => {
            setRenewSub(null)
            toast.success("Подписка продлена!")
            loadData()
          }}
        />
      )}
    </div>
  )
}