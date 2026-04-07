import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import NavbarAuth from '../components/NavbarAuth'
import NavbarPublic from '../components/NavbarPublic'
import FooterComponent from '../components/Footer'

import { API, apiFetch } from '../Api'

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
  greenDim:  'rgba(0,229,160,0.1)',
  greenGlow: 'rgba(0,229,160,0.25)',
  red:       '#ff5e5e',
  redDim:    'rgba(255,94,94,0.1)',
}

// Цвета тиров — по возрастанию «ценности»
const TIER_PALETTE = [
  { color: '#94a3b8', glow: 'rgba(148,163,184,0.2)', label: 'Стартовый' },
  { color: '#f6c90e', glow: 'rgba(246,201,14,0.2)',  label: 'Продвинутый' },
  { color: '#00e5a0', glow: 'rgba(0,229,160,0.2)',   label: 'Приоритетный' },
  { color: '#c084fc', glow: 'rgba(192,132,252,0.2)', label: 'Эксклюзивный' },
]
function tier(i: number) { return TIER_PALETTE[i % TIER_PALETTE.length] }

function durationLabel(days: number): string {
  if (days < 30) {
    if (days === 1)  return '1 день'
    if (days % 10 === 1 && days !== 11) return `${days} день`
    if ([2,3,4].includes(days % 10) && ![12,13,14].includes(days)) return `${days} дня`
    return `${days} дней`
  }
  const months = Math.round(days / 30)
  if (months === 1)  return '1 месяц'
  if (months === 3)  return '3 месяца'
  if (months === 6)  return 'Полгода'
  if (months === 12) return '1 год'
  if (months === 24) return '2 года'
  if ([2,3,4].includes(months % 10) && ![12,13,14].includes(months)) return `${months} месяца`
  return `${months} месяцев`
}

function isTokenValid() {
  return !!localStorage.getItem('logged_in')
}

interface Plan {
  id: number; name: string; display_name: string; description: string
  tier_level: number; price_per_month: number; duration_days: number
  discount_percent: number; final_price: number; base_price: number
  purchase_limit: number; max_sessions: number
  is_available: boolean; slots_total: number; slots_used: number; max_users_per_server: number
}

// ─── Модал покупки ───────────────────────────────────────────────────
function BuyModal({ plan, tierIndex, balance, isReferred, onConfirm, onClose, loading, error }: {
  plan: Plan; tierIndex: number; balance: number; isReferred: boolean
  onConfirm: (promo: string) => void; onClose: () => void
  loading: boolean; error: string
}) {
  const [promo, setPromo] = useState('')
  const REFERRAL_DISCOUNT = 15
  // Если пришёл по реферальной ссылке — скидка 15% применяется на бэке автоматически
  const effectivePrice = isReferred
    ? Math.round(plan.final_price * (1 - REFERRAL_DISCOUNT / 100) * 100) / 100
    : plan.final_price
  const enough = balance >= effectivePrice
  const { color, glow } = tier(tierIndex)

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
      <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxWidth:420, background:C.surface, borderRadius:24, padding:'36px 28px', border:`1px solid ${C.border}` }}>

        <div style={{ fontSize:'0.62rem', color, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:10, fontWeight:700 }}>Подтверждение активации</div>
        <div style={{ fontSize:'1.4rem', fontWeight:800, color:C.accent, marginBottom:4 }}>{plan.display_name || plan.name}</div>
        <div style={{ fontSize:'0.85rem', color:C.dim, marginBottom:24 }}>{durationLabel(plan.duration_days)} · до {plan.max_sessions} устройств</div>

        <div style={{ background:C.card, borderRadius:16, padding:'16px', marginBottom:16, border:`1px solid ${C.border}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
            <span style={{ fontSize:'0.8rem', color:C.dim }}>Ваш баланс</span>
            <span style={{ fontSize:'1rem', fontWeight:700, color: enough ? C.accent : C.red }}>{balance.toLocaleString('ru-RU')} ₽</span>
          </div>
          {(plan.discount_percent > 0 || isReferred) && (
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
              <span style={{ fontSize:'0.8rem', color:C.dim }}>Без скидки</span>
              <span style={{ fontSize:'0.9rem', color:C.dim, textDecoration:'line-through' }}>{Math.round(plan.base_price ?? plan.final_price)} ₽</span>
            </div>
          )}
          {isReferred && (
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
              <span style={{ fontSize:'0.8rem', color:C.green }}>Скидка по приглашению</span>
              <span style={{ fontSize:'0.9rem', fontWeight:700, color:C.green }}>−{REFERRAL_DISCOUNT}%</span>
            </div>
          )}
          <div style={{ display:'flex', justifyContent:'space-between', paddingTop:10, borderTop:`1px solid ${C.border}` }}>
            <span style={{ fontSize:'0.9rem', fontWeight:600, color:C.accent }}>К списанию</span>
            <span style={{ fontSize:'1.3rem', fontWeight:800, color }}>{effectivePrice} ₽</span>
          </div>
        </div>

        {/* Баннер реферальной скидки ИЛИ поле промокода */}
        {isReferred ? (
          <div style={{ background:C.greenDim, border:`1px solid rgba(0,229,160,0.25)`, borderRadius:12, padding:'11px 14px', marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:'1rem' }}>🎁</span>
            <div>
              <div style={{ fontSize:'0.82rem', fontWeight:700, color:C.green }}>Скидка 15% на первый заказ</div>
              <div style={{ fontSize:'0.74rem', color:C.dimHi }}>Применена автоматически как реферальному пользователю</div>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:'0.75rem', color:C.dimHi, fontWeight:600, display:'block', marginBottom:8 }}>Промокод (необязательно)</label>
            <input type="text" placeholder="SAVE20" value={promo} onChange={e => setPromo(e.target.value.toUpperCase())}
              style={{ width:'100%', background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'12px 14px', color:C.accent, fontSize:'0.9rem', fontFamily:'inherit', outline:'none', boxSizing:'border-box', transition:'border-color 0.2s' }}
              onFocus={e => e.currentTarget.style.borderColor=C.borderHi}
              onBlur={e  => e.currentTarget.style.borderColor=C.border} />
          </div>
        )}

        {!enough && (
          <div style={{ background:C.redDim, border:`1px solid rgba(255,94,94,0.3)`, borderRadius:12, padding:'10px 14px', marginBottom:16, fontSize:'0.82rem', color:C.red }}>
            ⚠ Недостаточно средств — не хватает {(effectivePrice - balance).toFixed(2)} ₽
          </div>
        )}

        {error && <div style={{ background:C.redDim, border:`1px solid rgba(255,94,94,0.3)`, borderRadius:12, padding:'10px 14px', marginBottom:16, fontSize:'0.82rem', color:C.red }}>{error}</div>}

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose}
            style={{ flex:1, padding:'13px 0', borderRadius:13, border:`1px solid ${C.border}`, background:'transparent', color:C.dim, fontWeight:600, fontSize:'0.88rem', cursor:'pointer', fontFamily:'inherit', transition:'border-color 0.2s, color 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor=C.borderHi; e.currentTarget.style.color=C.accent }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.dim }}>
            Отмена
          </button>
          <button onClick={() => onConfirm(isReferred ? '' : promo)} disabled={loading || !enough}
            style={{ flex:2, padding:'13px 0', borderRadius:13, border:`1px solid ${enough ? color : C.border}`, background: enough && !loading ? color : 'transparent', color: enough && !loading ? C.bg : C.dim, fontWeight:800, fontSize:'0.88rem', cursor: !enough||loading ? 'not-allowed' : 'pointer', opacity: !enough ? 0.5 : 1, fontFamily:'inherit', transition:'box-shadow 0.2s', boxShadow: enough && !loading ? `0 0 16px ${glow}` : 'none' }}>
            {loading ? 'Активируем...' : 'Активировать →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Модал успеха ────────────────────────────────────────────────────
// ─── Устройства для визарда после покупки ────────────────────────────────
const POST_BUY_DEVICES = [
  {
    id: 'iphone', label: 'iPhone / iPad', icon: '🍎',
    appName: 'V2RayTun', store: 'App Store',
    appUrl: 'https://apps.apple.com/app/v2raytun/id6476628951',
  },
  {
    id: 'android', label: 'Android', icon: '🤖',
    appName: 'V2RayTun', store: 'Google Play',
    appUrl: 'https://play.google.com/store/apps/details?id=com.v2raytun.android',
  },
  {
    id: 'windows', label: 'Windows', icon: '🖥',
    appName: 'Happ', store: 'Официальный сайт',
    appUrl: 'https://happ.to',
  },
  {
    id: 'mac', label: 'Mac', icon: '💻',
    appName: 'V2RayTun', store: 'Mac App Store',
    appUrl: 'https://apps.apple.com/us/app/v2raytun/id6476628951?platform=mac',
  },
]

function SuccessModal({ planName, onClose }: { planName: string; onClose: () => void }) {
  const [step, setStep] = useState<'congrats' | 'device' | 'app'>('congrats')
  const [device, setDevice] = useState<typeof POST_BUY_DEVICES[0] | null>(null)

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
      <div style={{ width:'100%', maxWidth:400, background:C.surface, borderRadius:24, border:`1px solid rgba(0,229,160,0.25)`, boxShadow:`0 0 60px rgba(0,229,160,0.12)`, overflow:'hidden', animation:'fadeUp 0.35s cubic-bezier(0.34,1.3,0.64,1) both' }}>

        {/* Прогресс-бар */}
        <div style={{ display:'flex', gap:4, padding:'16px 20px 0' }}>
          {(['congrats','device','app'] as const).map((s, i) => (
            <div key={s} style={{ flex:1, height:3, borderRadius:2, background: i <= ['congrats','device','app'].indexOf(step) ? C.green : C.border, transition:'background 0.3s' }} />
          ))}
        </div>

        {/* ── Шаг 1: Поздравление ── */}
        {step === 'congrats' && (
          <div style={{ padding:'28px 24px 24px', textAlign:'center' }}>
            <div style={{ width:64, height:64, background:C.greenDim, border:`1px solid rgba(0,229,160,0.3)`, borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px', boxShadow:`0 0 28px rgba(0,229,160,0.2)` }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div style={{ fontSize:'1.25rem', fontWeight:900, color:C.accent, marginBottom:8 }}>Подписка активирована!</div>
            <div style={{ fontSize:'0.85rem', color:C.dim, lineHeight:1.6, marginBottom:24 }}>
              <span style={{ color:C.accent, fontWeight:600 }}>{planName}</span> готова к использованию.<br/>
              Осталось скачать приложение и вставить ключ — займёт 2 минуты.
            </div>

            {/* 3 шага визуально */}
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:24, textAlign:'left' }}>
              {[
                { n:'1', text:'Выберите устройство', done: true },
                { n:'2', text:'Скачайте приложение', done: false },
                { n:'3', text:'Скопируйте ключ и подключитесь', done: false },
              ].map((item, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background: item.done ? 'rgba(0,229,160,0.07)' : C.card, border:`1px solid ${item.done ? 'rgba(0,229,160,0.25)' : C.border}`, borderRadius:10 }}>
                  <div style={{ width:24, height:24, borderRadius:'50%', background: item.done ? C.green : C.border, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ fontSize:'0.7rem', fontWeight:800, color: item.done ? C.bg : C.dim }}>{item.n}</span>
                  </div>
                  <span style={{ fontSize:'0.85rem', fontWeight:600, color: item.done ? C.accent : C.dim }}>{item.text}</span>
                </div>
              ))}
            </div>

            <button onClick={() => setStep('device')}
              style={{ width:'100%', padding:'14px 0', borderRadius:13, border:'none', background:C.green, color:C.bg, fontWeight:800, fontSize:'0.9rem', cursor:'pointer', fontFamily:'inherit', boxShadow:`0 0 20px rgba(0,229,160,0.3)` }}>
              Начать подключение →
            </button>
          </div>
        )}

        {/* ── Шаг 2: Выбор устройства ── */}
        {step === 'device' && (
          <div style={{ padding:'28px 24px 24px' }}>
            <div style={{ textAlign:'center', marginBottom:22 }}>
              <div style={{ fontSize:'1.05rem', fontWeight:800, color:C.accent, marginBottom:6 }}>На каком устройстве?</div>
              <div style={{ fontSize:'0.82rem', color:C.dim }}>Выберите — покажем нужное приложение</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
              {POST_BUY_DEVICES.map(d => (
                <button key={d.id} onClick={() => { setDevice(d); setStep('app') }}
                  style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:'16px 10px', cursor:'pointer', fontFamily:'inherit', display:'flex', flexDirection:'column', alignItems:'center', gap:8, transition:'border-color 0.15s, background 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(0,229,160,0.4)'; e.currentTarget.style.background='rgba(0,229,160,0.05)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.background=C.card }}>
                  <span style={{ fontSize:'1.8rem' }}>{d.icon}</span>
                  <span style={{ fontSize:'0.82rem', fontWeight:700, color:C.accent }}>{d.label}</span>
                </button>
              ))}
            </div>
            <button onClick={onClose}
              style={{ width:'100%', background:'transparent', border:`1px solid ${C.border}`, color:C.dim, borderRadius:11, padding:'10px 0', fontSize:'0.8rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              Разберусь сам →
            </button>
          </div>
        )}

        {/* ── Шаг 3: Скачать приложение ── */}
        {step === 'app' && device && (
          <div style={{ padding:'28px 24px 24px' }}>
            <button onClick={() => setStep('device')} style={{ background:'none', border:'none', color:C.dim, cursor:'pointer', fontSize:'0.82rem', padding:0, fontFamily:'inherit', marginBottom:20, display:'flex', alignItems:'center', gap:4 }}>← Назад</button>

            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontSize:'2.4rem', marginBottom:10 }}>{device.icon}</div>
              <div style={{ fontSize:'1.05rem', fontWeight:800, color:C.accent, marginBottom:6 }}>Скачайте {device.appName}</div>
              <div style={{ fontSize:'0.82rem', color:C.dim }}>Для {device.label} рекомендуем это приложение</div>
            </div>

            {/* Карточка приложения */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:'14px 16px', display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:C.greenDim, border:'1px solid rgba(0,229,160,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem', flexShrink:0 }}>📱</div>
              <div>
                <div style={{ fontSize:'0.92rem', fontWeight:700, color:C.accent }}>{device.appName}</div>
                <div style={{ fontSize:'0.72rem', color:C.dim, marginTop:2 }}>Бесплатно · {device.store}</div>
              </div>
            </div>

            <a href={device.appUrl} target="_blank" rel="noreferrer"
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:C.green, color:C.bg, borderRadius:13, padding:'14px 0', fontWeight:800, fontSize:'0.9rem', textDecoration:'none', marginBottom:10, boxShadow:`0 0 20px rgba(0,229,160,0.25)` }}>
              Скачать {device.appName} →
            </a>

            {/* Что дальше */}
            <div style={{ background:'rgba(0,229,160,0.06)', border:'1px solid rgba(0,229,160,0.2)', borderRadius:12, padding:'12px 14px', marginBottom:14 }}>
              <div style={{ fontSize:'0.75rem', fontWeight:700, color:C.green, marginBottom:6 }}>После установки:</div>
              <div style={{ fontSize:'0.78rem', color:C.dim, lineHeight:1.7 }}>
                Откройте приложение → нажмите «+» → выберите «Вставить из буфера обмена». Ключ доступа скопируйте в личном кабинете.
              </div>
            </div>

            <button onClick={onClose}
              style={{ width:'100%', background:C.surface, border:`1px solid ${C.border}`, color:C.dimHi, borderRadius:13, padding:'13px 0', fontWeight:700, fontSize:'0.88rem', cursor:'pointer', fontFamily:'inherit', transition:'border-color 0.15s, color 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=C.accent; e.currentTarget.style.color=C.accent }}
              onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.dimHi }}>
              Перейти в личный кабинет →
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

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

// ─── Страница тарифов ────────────────────────────────────────────────
export default function Plans() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Сохраняем ref из URL в localStorage чтобы не терялся
  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) localStorage.setItem('ref_code', ref.toUpperCase())
  }, [])

  function logout() {
    localStorage.removeItem('logged_in')
    navigate('/')
  }

  const [plans,      setPlans]     = useState<Plan[]>([])
  const [loading,    setLoading]   = useState(true)
  const [balance,    setBalance]   = useState(0)
  const [isLoggedIn, setLoggedIn]  = useState(() => isTokenValid())
  const [selPlan,    setSelPlan]   = useState<Plan | null>(null)
  const [selTierIdx, setSelTierIdx]= useState(0)
  const [buyLoading, setBuyLoad]   = useState(false)
  const [buyError,   setBuyError]  = useState('')
  const [successPlan,setSuccess]   = useState<string | null>(null)
  // Реферальная скидка: есть реферер + ещё не было покупок
  const [isReferred, setIsReferred] = useState(false)

  useEffect(() => {
    if (isTokenValid()) {
      setLoggedIn(true)
      apiFetch('/users/me')
        .then(r => r.ok ? r.json() : null).then(d => {
          if (!d) return
          setBalance(d.balance ?? 0)
          // Проверяем: есть реферер и ещё не было ни одной подписки
          const hasReferrer = !!d.referred_by_id
          const hasNoSubs   = (d.subscriptions?.active?.length ?? 0) === 0 && (d.subscriptions?.expired?.length ?? 0) === 0
          setIsReferred(hasReferrer && hasNoSubs)
        }).catch(() => {})
    } else {
      // Незалогинен — показываем скидку если есть ref в localStorage или URL
      const ref = searchParams.get('ref') || localStorage.getItem('ref_code')
      if (ref) setIsReferred(true)
    }
    fetch(`${API}/subscriptions/plans`)
      .then(r => r.json()).then(d => setPlans(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function handleBuy(promo: string) {
    if (!isLoggedIn) { navigate('/login'); return }
    if (!selPlan) return
    setBuyLoad(true); setBuyError('')
    try {
      const body: Record<string,string> = {}
      if (promo.trim()) body.promocode = promo.trim()
      const res  = await apiFetch(`/subscriptions/buy/${selPlan.id}`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) { setBuyError(data.detail || 'Ошибка'); return }
      setSuccess(selPlan.display_name || selPlan.name)
      setSelPlan(null)
      setBalance(b => Math.max(0, b - selPlan.final_price))
      localStorage.removeItem('ref_code')  // реф использован — чистим
    } catch { setBuyError('Сервер недоступен') }
    finally { setBuyLoad(false) }
  }

  const tierLevels = [...new Set(plans.map(p => p.tier_level))].sort()
  const byTier     = (t: number) => plans.filter(p => p.tier_level === t).sort((a,b) => a.final_price - b.final_price)

  // Описания тиров — замена "просто тестового сервера"
  const tierDescriptions: Record<number, string> = {
    0: 'Стартовый шлюз приватности — идеально для личного использования',
    1: 'Выделенный узел шифрования для рабочих станций',
    2: 'Приоритетный канал с резервированием мощностей',
    3: 'Эксклюзивный сегмент с максимальной изоляцией',
  }

  const included = [
    {
      icon: (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>),
      text: "Неограниченная скорость"
    },
    {
      icon: (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H5l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="none"/><line x1="9" y1="10" x2="15" y2="10"/></svg>),
      text: "Безлимитный трафик"
    },
    {
      icon: (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>),
      text: "До 5 устройств одновременно"
    },
    {
      icon: (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>),
      text: "Безотказная работа 24/7"
    },
    {
      icon: (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>),
      text: "Отзывчивая техподдержка"
    },
    {
      icon: (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>),
      text: "Скрытие реального IP-адреса"
    },
    {
      icon: (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>),
      text: "Шифрование трафика (AES-256)"
    },
    {
      icon: null,
      isOS: true,
      text: "iOS · Android · Windows · macOS · Linux"
    },
  ]

  return (
    <div style={{ background:C.bg, minHeight:'100vh', fontFamily:'"DM Sans", system-ui, sans-serif', color:C.accent, display:'flex', flexDirection:'column' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .plan-row { transition: background 0.15s; }
        .plan-row:hover { background: rgba(255,255,255,0.025) !important; }
        @media (max-width: 520px) {
          .plan-row {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
            padding: 16px 16px !important;
          }
          .plan-row-price {
            display: flex !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: center !important;
            gap: 12px !important;
          }
          .plan-row-price > div:first-child {
            text-align: left !important;
          }
          .plan-row-btn {
            width: auto !important;
            flex: 1 !important;
            max-width: 140px !important;
          }
          .plan-tier-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 4px !important;
            padding: 14px 16px !important;
          }
          .plan-tier-header span:last-child {
            font-size: 0.7rem !important;
          }
          .plan-included-grid {
            grid-template-columns: 1fr !important;
          }
          .plan-included-item {
            border-right: none !important;
          }
          .plan-included-os {
            flex-wrap: wrap !important;
            padding: 12px 16px !important;
          }
          .plan-ref-banner {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
            padding: 14px 16px !important;
          }
          .plan-ref-banner button {
            width: 100% !important;
            text-align: center !important;
            justify-content: center !important;
          }
          .plan-cta-banner {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
            text-align: center !important;
          }
          .plan-cta-banner button {
            width: 100% !important;
          }
        }
      `}</style>

      {selPlan && <BuyModal plan={selPlan} tierIndex={selTierIdx} balance={balance} isReferred={isReferred} onConfirm={handleBuy} onClose={() => { setSelPlan(null); setBuyError('') }} loading={buyLoading} error={buyError} />}
      {successPlan && <SuccessModal planName={successPlan} onClose={() => { setSuccess(null); navigate('/dashboard') }} />}

      {/* ── Контент ── */}
      <div style={{ position:'relative', flex:1, overflow:'hidden' }}>
        <DotGrid id="plans-page" />

        {/* Glow — верхний правый */}
        <div style={{ position:'absolute', top:-60, right:-80, width:500, height:420, background:`radial-gradient(ellipse, rgba(0,229,160,0.12) 0%, rgba(0,229,160,0.03) 50%, transparent 70%)`, pointerEvents:'none' }} />

        {/* Glow — нижний левый */}
        <div style={{ position:'absolute', bottom:-40, left:-60, width:420, height:360, background:`radial-gradient(ellipse, rgba(0,229,160,0.08) 0%, transparent 65%)`, pointerEvents:'none' }} />

        <main style={{ position:'relative', zIndex:1, maxWidth:680, margin:'0 auto', padding:'56px 20px 96px', animation:'fadeUp 0.5s ease both' }}>

        {/* Заголовок */}
        <div style={{ marginBottom:44 }}>
          <div style={{ fontSize:'0.62rem', color:C.green, letterSpacing:'0.28em', textTransform:'uppercase', fontWeight:700, marginBottom:12 }}>Тарифы</div>
          <h1 style={{ fontSize:'clamp(1.8rem, 4vw, 2.6rem)', fontWeight:900, color:C.accent, lineHeight:1.05, marginBottom:12, letterSpacing:'-0.02em' }}>
            Выберите уровень<br />защиты
          </h1>
          <p style={{ fontSize:'0.9rem', color:C.dimHi, lineHeight:1.7 }}>
            Нулевое логирование · Автообновление конфигурации · Поддержка всех платформ
          </p>
        </div>

        {/* Реферальный баннер — показываем только если есть скидка */}
        {isReferred && (
          <div className="plan-ref-banner" style={{ background:C.greenDim, border:`1px solid rgba(0,229,160,0.3)`, borderRadius:16, padding:'16px 20px', marginBottom:28, display:'flex', alignItems:'center', gap:14, boxShadow:`0 0 24px rgba(0,229,160,0.08)` }}>
            <div style={{ width:40, height:40, borderRadius:12, background:'rgba(0,229,160,0.15)', border:`1px solid rgba(0,229,160,0.25)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', flexShrink:0 }}>🎁</div>
            <div>
              <div style={{ fontSize:'0.92rem', fontWeight:800, color:C.green, marginBottom:3 }}>Скидка 15% на первый заказ применена</div>
              <div style={{ fontSize:'0.78rem', color:C.dimHi, lineHeight:1.5 }}>
                Вы пришли по реферальной ссылке — цены уже пересчитаны. Скидка действует только на тарифы без собственной акции.
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ background:C.surface, borderRadius:22, padding:'60px', textAlign:'center', color:C.dim, border:`1px solid ${C.border}` }}>
            Загрузка конфигураций...
          </div>
        ) : plans.length === 0 ? (
          <div style={{ background:C.surface, borderRadius:22, padding:'48px', textAlign:'center', border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:'2rem', marginBottom:12 }}>🚧</div>
            <div style={{ color:C.accent, fontWeight:600 }}>Конфигурации скоро появятся</div>
          </div>
        ) : (
          <>
            {/* Блок тарифов */}
            {tierLevels.map((tierLevel, ti) => {
              const { color, glow, label } = tier(ti)
              const tierPlans = byTier(tierLevel)
              const tierName  = tierPlans[0]?.display_name?.split(' ')[0] || tierPlans[0]?.name?.split(' ')[0] || label
              const tierDesc  = tierDescriptions[ti] || tierDescriptions[0]

              return (
                <div key={tierLevel} style={{ marginBottom:16 }}>
                  {/* Тир-заголовок */}
                  <div className="plan-tier-header" style={{ background:C.surface, borderRadius:'16px 16px 0 0', padding:'16px 22px', border:`1px solid ${C.border}`, borderBottom:'none', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:color, boxShadow:`0 0 8px ${glow}`, flexShrink:0 }} />
                      <span style={{ fontSize:'0.88rem', fontWeight:800, color }}>{tierName}</span>
                    </div>
                    <span style={{ fontSize:'0.75rem', color:C.dim }}>{tierDesc}</span>
                  </div>

                  {/* Строки планов */}
                  <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'0 0 16px 16px', overflow:'hidden' }}>
                    {tierPlans.map((plan, i) => {
                      const hasSale       = plan.discount_percent > 0
                      const unavailable   = !plan.is_available
                      const isLast        = i === tierPlans.length - 1
                      // Реферальная скидка применяется только если у тарифа нет своей скидки
                      const refApplies    = isReferred && !hasSale
                      const refPrice      = refApplies
                        ? Math.round(plan.final_price * (1 - 15 / 100) * 100) / 100
                        : plan.final_price
                      const basePrice     = plan.base_price ?? plan.final_price

                      return (
                        <div key={plan.id} className="plan-row"
                          style={{ display:'flex', alignItems:'center', gap:16, padding:'18px 22px', borderBottom: !isLast ? `1px solid ${C.border}` : 'none', opacity: unavailable ? 0.45 : 1 }}>

                          {/* Инфо */}
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                              <span style={{ fontSize:'1.15rem', fontWeight:900, color:C.accent, letterSpacing:'-0.01em' }}>{durationLabel(plan.duration_days)}</span>
                              {hasSale && (
                                <span style={{ fontSize:'0.65rem', background:C.greenDim, color:C.green, border:`1px solid rgba(0,229,160,0.25)`, borderRadius:6, padding:'2px 7px', fontWeight:700 }}>
                                  −{plan.discount_percent}%
                                </span>
                              )}
                              {refApplies && (
                                <span style={{ fontSize:'0.65rem', background:'rgba(0,229,160,0.15)', color:C.green, border:`1px solid rgba(0,229,160,0.3)`, borderRadius:6, padding:'2px 7px', fontWeight:700 }}>
                                  🎁 −15% для вас
                                </span>
                              )}
                              {isReferred && hasSale && (
                                <span style={{ fontSize:'0.65rem', background:'rgba(107,122,132,0.12)', color:C.dim, border:`1px solid ${C.border}`, borderRadius:6, padding:'2px 7px', fontWeight:600 }}>
                                  скидка уже включена
                                </span>
                              )}
                              {unavailable && (
                                <span style={{ fontSize:'0.65rem', background:C.redDim, color:C.red, border:`1px solid rgba(255,94,94,0.25)`, borderRadius:6, padding:'2px 7px', fontWeight:700 }}>Мест нет</span>
                              )}
                            </div>
                            {plan.description && (
                              <div style={{ fontSize:'0.82rem', color:C.dimHi, marginBottom:5, lineHeight:1.5, fontStyle:'italic' }}>{plan.description}</div>
                            )}
                            <div style={{ fontSize:'0.72rem', color:C.dim }}>
                              до {plan.max_sessions} устройств
                              {plan.max_users_per_server > 0 && <span style={{ marginLeft:8 }}>· пропускная способность выделенного канала</span>}
                            </div>
                          </div>

                          {/* Цена + Кнопка */}
                          <div className="plan-row-price" style={{ display:'flex', alignItems:'center', gap:16, flexShrink:0 }}>
                          <div style={{ textAlign:'right', flexShrink:0 }}>
                            {(hasSale || refApplies) && (
                              <div style={{ fontSize:'0.72rem', color:C.dim, textDecoration:'line-through', marginBottom:1 }}>
                                {basePrice} ₽
                              </div>
                            )}
                            <div style={{ fontSize:'1.25rem', fontWeight:900, color: refApplies ? C.green : color, letterSpacing:'-0.02em' }}>
                              {refApplies ? refPrice : plan.final_price} ₽
                            </div>
                            {plan.duration_days >= 30 && (
                              <div style={{ fontSize:'0.68rem', color:C.dim }}>
                                {Math.round((refApplies ? refPrice : plan.final_price) / (plan.duration_days / 30))} ₽/мес
                              </div>
                            )}
                          </div>

                          {/* Кнопка */}
                          <button className="plan-row-btn" disabled={unavailable}
                            onClick={() => {
                              if (!isLoggedIn) { navigate('/login'); return }
                              setSelTierIdx(ti); setSelPlan(plan); setBuyError('')
                            }}
                            style={{ flexShrink:0, width:96, padding:'11px 0', borderRadius:12, border:`1px solid ${unavailable ? C.border : color}`, background:'transparent', color: unavailable ? C.dim : color, fontWeight:700, fontSize:'0.82rem', cursor: unavailable ? 'not-allowed' : 'pointer', fontFamily:'inherit', transition:'background 0.2s, box-shadow 0.2s', boxShadow: unavailable ? 'none' : `0 0 10px ${glow}`, textAlign:'center' }}
                            onMouseEnter={e => { if(!unavailable){ e.currentTarget.style.background=`rgba(0,0,0,0.3)`; e.currentTarget.style.boxShadow=`0 0 20px ${glow}` }}}
                            onMouseLeave={e => { if(!unavailable){ e.currentTarget.style.background='transparent'; e.currentTarget.style.boxShadow=`0 0 10px ${glow}` }}}>
                            {unavailable ? 'Занято' : 'Выбрать'}
                          </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* Включено в каждый тариф */}
            <div style={{ background:C.surface, borderRadius:20, border:`1px solid ${C.border}`, overflow:'hidden', marginTop:8 }}>
              <div style={{ padding:'14px 22px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:C.green, display:'block', boxShadow:`0 0 6px ${C.greenGlow}` }} />
                <span style={{ fontSize:'0.72rem', color:C.dimHi, letterSpacing:'0.18em', textTransform:'uppercase', fontWeight:700 }}>Включено в каждый тариф</span>
              </div>
              <div className="plan-included-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(260px, 1fr))" }}>
                {included.map((f, i) => {
                  const isLast = i === included.length - 1
                  const isOdd = included.length % 2 !== 0
                  const noBottom = isLast || (isOdd && i === included.length - 1) || i >= included.length - (included.length % 2 === 0 ? 2 : 1)
                  const noRight = i % 2 !== 0 || included.length === 1
                  if ((f as any).isOS) {
                    return (
                      <div key={i} className="plan-included-os" style={{ gridColumn:"1 / -1", display:"flex", alignItems:"center", gap:14, padding:"14px 22px", borderTop:`1px solid ${C.border}`, flexWrap:"wrap" as const }}>
                        {[
                          { label:"iOS", icon:(<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.28.04-2.22-1.32-3.06-2.55C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>) },
                          { label:"Android", icon:(<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.523 15.341a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-9.046 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM2.405 8.1l1.97-3.41a.5.5 0 0 1 .866.5l-1.97 3.41A.5.5 0 0 1 2.405 8.1zm19.19 0a.5.5 0 0 1-.866-.5l-1.97-3.41a.5.5 0 1 1 .866-.5l1.97 3.41zM16.55 3.24l-1.14 1.97a6.5 6.5 0 0 0-6.82 0L7.45 3.24a.5.5 0 1 0-.866.5l1.12 1.94A6.5 6.5 0 0 0 5.5 10.5v1A1.5 1.5 0 0 0 7 13h10a1.5 1.5 0 0 0 1.5-1.5v-1a6.5 6.5 0 0 0-2.206-4.818l1.12-1.942a.5.5 0 1 0-.866-.5z"/></svg>) },
                          { label:"Windows", icon:(<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/></svg>) },
                          { label:"macOS", icon:(<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.28.04-2.22-1.32-3.06-2.55C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>) },
                          { label:"Linux", icon:(<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12.504 0c-.155 0-.315.008-.48.021C7.576.336 3.59 3.203 3.55 8.763c-.02 3.152.42 5.092 1.446 6.457.155.204.315.402.488.595.56.61 1.24 1.155 2.036 1.61-.5.956-1.26 2.017-2.17 3.192C4.48 21.73 4 22.65 4 23.5c0 .21.024.413.07.608.17.716.67 1.37 1.39 1.724.388.19.82.285 1.26.285.636 0 1.284-.2 1.844-.6C9.478 24.83 10.72 24 12 24c1.28 0 2.523.83 3.437 1.517.56.4 1.208.6 1.843.6.44 0 .872-.095 1.26-.285.72-.354 1.22-1.008 1.39-1.724.046-.195.07-.398.07-.608 0-.85-.48-1.77-1.35-2.883-.91-1.175-1.67-2.236-2.17-3.192.795-.455 1.476-1 2.036-1.61.173-.193.333-.391.488-.595 1.026-1.365 1.466-3.305 1.446-6.457C20.41 3.203 16.424.336 12.984.021 12.82.008 12.659 0 12.504 0zm.016 1.5c2.968 0 6.29 2.17 6.31 7.264.018 2.862-.37 4.55-1.204 5.656a5.22 5.22 0 0 1-.402.49c-.498.544-1.13 1.006-1.9 1.37a.75.75 0 0 0-.382.96c.56 1.205 1.403 2.39 2.35 3.607.75.97 1.204 1.72 1.204 2.153 0 .098-.01.19-.03.277-.09.38-.36.686-.73.87-.22.107-.46.16-.707.16-.373 0-.748-.117-1.077-.352C15.024 22.608 13.577 21.75 12 21.75c-1.577 0-3.024.858-3.953 1.525-.33.235-.704.352-1.077.352-.247 0-.488-.053-.706-.16-.37-.184-.64-.49-.73-.87a1.45 1.45 0 0 1-.03-.277c0-.433.454-1.183 1.204-2.153.947-1.218 1.79-2.402 2.35-3.607a.75.75 0 0 0-.382-.96c-.77-.364-1.402-.826-1.9-1.37a5.22 5.22 0 0 1-.402-.49C7.876 13.314 7.488 11.626 7.506 8.764 7.526 3.67 10.848 1.5 13.816 1.5h-.296z"/></svg>) },
                        ].map(os => (
                          <div key={os.label} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.05)", border:`1px solid ${C.border}`, borderRadius:8, padding:"5px 10px" }}>
                            <span style={{ color:C.green, display:"flex", alignItems:"center" }}>{os.icon}</span>
                            <span style={{ fontSize:"0.75rem", color:C.dimHi, fontWeight:600 }}>{os.label}</span>
                          </div>
                        ))}
                      </div>
                    )
                  }
                  return (
                    <div key={i} className="plan-included-item" style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"13px 22px", borderBottom: noBottom ? "none" : `1px solid ${C.border}`, borderRight: noRight ? "none" : `1px solid ${C.border}` }}>
                      <span style={{ color:C.green, flexShrink:0, marginTop:1, display:"flex", alignItems:"center" }}>{f.icon}</span>
                      <span style={{ fontSize:"0.82rem", color:C.dimHi, lineHeight:1.5 }}>{f.text}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Не авторизован — призыв */}
            {!isLoggedIn && (
              <div className="plan-cta-banner" style={{ marginTop:20, background:C.greenDim, border:`1px solid rgba(0,229,160,0.2)`, borderRadius:16, padding:'18px 22px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
                <div>
                  <div style={{ fontSize:'0.88rem', fontWeight:700, color:C.accent, marginBottom:3 }}>Для активации необходим аккаунт</div>
                  <div style={{ fontSize:'0.78rem', color:C.dim }}>Регистрация занимает меньше минуты</div>
                </div>
                <button onClick={() => navigate('/register')}
                  style={{ background:C.green, color:C.bg, border:'none', borderRadius:12, padding:'10px 22px', fontWeight:800, fontSize:'0.85rem', cursor:'pointer', fontFamily:'inherit', boxShadow:`0 0 16px ${C.greenGlow}`, whiteSpace:'nowrap' }}>
                  Создать аккаунт →
                </button>
              </div>
            )}
          </>
        )}
      </main>
      </div>

      <FooterComponent />
    </div>
  )
}