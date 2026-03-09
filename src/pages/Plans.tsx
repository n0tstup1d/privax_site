import { useState, useEffect } from 'react'
import { apiFetch, getToken, isTokenValid, saveTokens, clearTokens, API } from '../api'
import { useNavigate } from 'react-router-dom'
import NavbarAuth from '../components/NavbarAuth'
import NavbarPublic from '../components/NavbarPublic'
import Footer from '../components/Footer'

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
  greenGlow: 'rgba(0,229,160,0.25)',
  red:       '#ff5e5e',
  redDim:    'rgba(255,94,94,0.1)',
}

const TIER_PALETTE = [
  { color: '#94a3b8', glow: 'rgba(148,163,184,0.25)', label: 'Стартовый' },
  { color: '#f6c90e', glow: 'rgba(246,201,14,0.25)',  label: 'Продвинутый' },
  { color: '#00e5a0', glow: 'rgba(0,229,160,0.25)',   label: 'Приоритетный' },
  { color: '#c084fc', glow: 'rgba(192,132,252,0.25)', label: 'Эксклюзивный' },
]
function tier(i: number) { return TIER_PALETTE[i % TIER_PALETTE.length] }

function monthLabel(m: number) {
  if (m === 1)  return '1 месяц'
  if (m === 3)  return '3 месяца'
  if (m === 6)  return '6 месяцев'
  if (m === 12) return '1 год'
  return `${m} мес.`
}



interface Plan {
  id: number; name: string; display_name: string; description: string
  tier_level: number; price_per_month: number; months: number
  discount_percent: number; final_price: number; max_sessions: number
  is_available: boolean; slots_total: number; slots_used: number; max_users_per_server: number
}

// ─── Модал покупки ────────────────────────────────────────────────────
function BuyModal({ plan, tierIndex, balance, onConfirm, onClose, loading, error }: {
  plan: Plan; tierIndex: number; balance: number
  onConfirm: (promo: string) => void; onClose: () => void
  loading: boolean; error: string
}) {
  const [promo, setPromo] = useState('')
  const enough = balance >= plan.final_price
  const { color, glow } = tier(tierIndex)

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
      <div onClick={e => e.stopPropagation()} style={{ width:'100%', maxWidth:420, background:C.surface, borderRadius:24, padding:'36px 28px', border:`1px solid ${C.border}` }}>
        <div style={{ fontSize:'0.62rem', color, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:10, fontWeight:700 }}>Подтверждение активации</div>
        <div style={{ fontSize:'1.4rem', fontWeight:800, color:C.accent, marginBottom:4 }}>{plan.display_name || plan.name}</div>
        <div style={{ fontSize:'0.85rem', color:C.dim, marginBottom:24 }}>{monthLabel(plan.months)} · до {plan.max_sessions} устройств</div>

        <div style={{ background:C.card, borderRadius:16, padding:'16px', marginBottom:16, border:`1px solid ${C.border}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
            <span style={{ fontSize:'0.8rem', color:C.dim }}>Ваш баланс</span>
            <span style={{ fontSize:'1rem', fontWeight:700, color: enough ? C.accent : C.red }}>{balance.toLocaleString('ru-RU')} ₽</span>
          </div>
          {plan.discount_percent > 0 && (
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
              <span style={{ fontSize:'0.8rem', color:C.dim }}>Без скидки</span>
              <span style={{ fontSize:'0.9rem', color:C.dim, textDecoration:'line-through' }}>{Math.round(plan.price_per_month * plan.months)} ₽</span>
            </div>
          )}
          <div style={{ display:'flex', justifyContent:'space-between', paddingTop:10, borderTop:`1px solid ${C.border}` }}>
            <span style={{ fontSize:'0.9rem', fontWeight:600, color:C.accent }}>К списанию</span>
            <span style={{ fontSize:'1.3rem', fontWeight:800, color }}>{plan.final_price} ₽</span>
          </div>
        </div>

        {!enough && (
          <div style={{ background:C.redDim, border:`1px solid rgba(255,94,94,0.3)`, borderRadius:12, padding:'10px 14px', marginBottom:16, fontSize:'0.82rem', color:C.red }}>
            ⚠ Недостаточно средств — не хватает {(plan.final_price - balance).toFixed(2)} ₽
          </div>
        )}

        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:'0.75rem', color:C.dimHi, fontWeight:600, display:'block', marginBottom:8 }}>Промокод (необязательно)</label>
          <input type="text" placeholder="SAVE20" value={promo} onChange={e => setPromo(e.target.value.toUpperCase())}
            style={{ width:'100%', background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:'12px 14px', color:C.accent, fontSize:'0.9rem', fontFamily:'inherit', outline:'none', boxSizing:'border-box', transition:'border-color 0.2s' }}
            onFocus={e => e.currentTarget.style.borderColor=C.borderHi}
            onBlur={e  => e.currentTarget.style.borderColor=C.border} />
        </div>

        {error && <div style={{ background:C.redDim, border:`1px solid rgba(255,94,94,0.3)`, borderRadius:12, padding:'10px 14px', marginBottom:16, fontSize:'0.82rem', color:C.red }}>{error}</div>}

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose}
            style={{ flex:1, padding:'13px 0', borderRadius:13, border:`1px solid ${C.border}`, background:'transparent', color:C.dim, fontWeight:600, fontSize:'0.88rem', cursor:'pointer', fontFamily:'inherit', transition:'border-color 0.2s, color 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor=C.borderHi; e.currentTarget.style.color=C.accent }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.dim }}>
            Отмена
          </button>
          <button onClick={() => onConfirm(promo)} disabled={loading || !enough}
            style={{ flex:2, padding:'13px 0', borderRadius:13, border:`1px solid ${enough ? color : C.border}`, background: enough && !loading ? color : 'transparent', color: enough && !loading ? C.bg : C.dim, fontWeight:800, fontSize:'0.88rem', cursor: !enough||loading ? 'not-allowed' : 'pointer', opacity: !enough ? 0.5 : 1, fontFamily:'inherit', transition:'box-shadow 0.2s', boxShadow: enough && !loading ? `0 0 16px ${glow}` : 'none' }}>
            {loading ? 'Активируем...' : 'Активировать →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Модал успеха ─────────────────────────────────────────────────────
function SuccessModal({ planName, onClose }: { planName: string; onClose: () => void }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
      <div style={{ width:'100%', maxWidth:360, background:C.surface, borderRadius:24, padding:'48px 32px', textAlign:'center', border:`1px solid rgba(0,229,160,0.3)`, boxShadow:`0 0 40px rgba(0,229,160,0.15)` }}>
        <div style={{ width:64, height:64, background:C.greenDim, border:`1px solid rgba(0,229,160,0.3)`, borderRadius:20, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.8rem', margin:'0 auto 20px', boxShadow:`0 0 24px ${C.greenGlow}` }}>✓</div>
        <div style={{ fontSize:'1.4rem', fontWeight:800, color:C.green, marginBottom:10 }}>Узел активирован!</div>
        <div style={{ fontSize:'0.88rem', color:C.dimHi, lineHeight:1.7, marginBottom:28 }}>
          <span style={{ color:C.accent, fontWeight:600 }}>{planName}</span> подключён.<br />
          Ключ доступа доступен в личном кабинете.
        </div>
        <button onClick={onClose}
          style={{ width:'100%', padding:'14px 0', borderRadius:13, border:'none', background:C.green, color:C.bg, fontWeight:800, fontSize:'0.9rem', cursor:'pointer', fontFamily:'inherit', boxShadow:`0 0 20px ${C.greenGlow}` }}>
          В личный кабинет →
        </button>
      </div>
    </div>
  )
}

// ─── Страница тарифов ─────────────────────────────────────────────────
export default function Plans() {
  const navigate = useNavigate()
  const [plans,      setPlans]     = useState<Plan[]>([])
  const [loading,    setLoading]   = useState(true)
  const [balance,    setBalance]   = useState(0)
  const [email,      setEmail]     = useState('')
  const [isLoggedIn, setLoggedIn]  = useState(false)
  const [selPlan,    setSelPlan]   = useState<Plan | null>(null)
  const [selTierIdx, setSelTierIdx]= useState(0)
  const [buyLoading, setBuyLoad]   = useState(false)
  const [buyError,   setBuyError]  = useState('')
  const [successPlan,setSuccess]   = useState<string | null>(null)

  useEffect(() => {
    if (isTokenValid()) {
      setLoggedIn(true)
      apiFetch('/users/me')
        .then(r => r.json()).then(d => { setBalance(d.balance ?? 0); setEmail(d.email ?? '') }).catch(() => {})
    }
    apiFetch('/subscriptions/plans')
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
    } catch { setBuyError('Сервер недоступен') }
    finally { setBuyLoad(false) }
  }

  const tierLevels = [...new Set(plans.map(p => p.tier_level))].sort()
  const byTier     = (t: number) => plans.filter(p => p.tier_level === t).sort((a,b) => a.final_price - b.final_price)

  const tierDescriptions: Record<number, string> = {
    0: 'Стартовый шлюз приватности — идеально для личного использования',
    1: 'Выделенный узел шифрования для рабочих станций',
    2: 'Приоритетный канал с резервированием мощностей',
    3: 'Эксклюзивный сегмент с максимальной изоляцией',
  }

  const included = [
    { icon: '◎', text: 'Нулевое разглашение (Zero-Knowledge) ваших данных' },
    { icon: '⊘', text: 'Нулевое логирование активности (No-Log Policy)' },
    { icon: '⟳', text: 'Автообновление конфигурации без участия пользователя' },
    { icon: '⬡', text: 'Совместимость с open-source агентами шифрования' },
    { icon: '◈', text: 'Поддержка протоколов туннелирования уровня L7' },
    { icon: '◷', text: 'Динамическая ротация ключей доступа каждые 24 часа' },
    { icon: '◉', text: 'Серверы в нескольких юрисдикциях' },
  ]

  return (
    <div style={{ background:C.bg, minHeight:'100vh', fontFamily:'"DM Sans", system-ui, sans-serif', color:C.accent, display:'flex', flexDirection:'column' }}>
      <style>{`
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .plan-row { transition: background 0.15s; }
        .plan-row:hover { background: rgba(255,255,255,0.025) !important; }
        .nav-dt { display: none !important; }
        .nav-burger { display: flex !important; }
        @media (min-width: 640px) {
          .nav-dt { display: flex !important; }
          .nav-burger { display: none !important; }
        }
        @media (max-width: 480px) {
          .plan-row { flex-wrap: wrap !important; gap: 12px !important; padding: 14px 16px !important; }
          .plan-row-info { width: 100% !important; }
          .plan-row-price { flex: 1 !important; }
          .plan-row-btn { width: auto !important; flex: 1 !important; }
          .tier-header { flex-direction: column !important; align-items: flex-start !important; gap: 4px !important; }
          .tier-header-desc { font-size: 0.72rem !important; }
          .included-grid { grid-template-columns: 1fr !important; }
          .not-logged-cta { flex-direction: column !important; }
          .footer-grid { flex-direction: column !important; gap: 32px !important; }
          .footer-links { gap: 32px !important; }
          .footer-bottom { flex-direction: column !important; gap: 8px !important; }
        }
      `}</style>

      {selPlan && <BuyModal plan={selPlan} tierIndex={selTierIdx} balance={balance} onConfirm={handleBuy} onClose={() => { setSelPlan(null); setBuyError('') }} loading={buyLoading} error={buyError} />}
      {successPlan && <SuccessModal planName={successPlan} onClose={() => { setSuccess(null); navigate('/dashboard') }} />}

      {isLoggedIn
        ? <NavbarAuth balance={balance} onLogout={() => { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); navigate('/') }} />
        : <NavbarPublic />}

      <main style={{ flex:1, maxWidth:680, margin:'0 auto', width:'100%', padding:'56px 20px 64px', animation:'fadeUp 0.5s ease both' }}>

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
            {/* ── Блоки тарифов ── */}
            {tierLevels.map((tierLevel, ti) => {
              const { color, glow, label } = tier(ti)
              const tierPlans = byTier(tierLevel)
              const tierName  = tierPlans[0]?.display_name?.split(' ')[0] || tierPlans[0]?.name?.split(' ')[0] || label
              const tierDesc  = tierDescriptions[ti] || tierDescriptions[0]

              return (
                <div key={tierLevel} style={{
                  marginBottom:28,
                  borderRadius:16,
                  border:`1px solid ${C.border}`,
                  overflow:'hidden',
                  boxShadow:`0 0 28px ${glow}, 0 0 6px ${glow}`,
                }}>
                  {/* Тир-заголовок */}
                  <div className="tier-header" style={{
                    background:C.surface,
                    padding:'16px 22px',
                    borderBottom:`1px solid ${C.border}`,
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'space-between',
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:color, boxShadow:`0 0 8px ${glow}`, flexShrink:0 }} />
                      <span style={{ fontSize:'0.88rem', fontWeight:800, color }}>{tierName}</span>
                    </div>
                    <span className="tier-header-desc" style={{ fontSize:'0.75rem', color:C.dim }}>{tierDesc}</span>
                  </div>

                  {/* Строки планов */}
                  <div style={{
                    background:C.surface,
                    overflow:'hidden',
                  }}>
                    {tierPlans.map((plan, i) => {
                      const hasSale     = plan.discount_percent > 0
                      const unavailable = !plan.is_available
                      const isLast      = i === tierPlans.length - 1

                      return (
                        <div key={plan.id} className="plan-row"
                          style={{ display:'flex', alignItems:'center', gap:16, padding:'18px 22px', borderBottom: !isLast ? `1px solid ${C.border}` : 'none', opacity: unavailable ? 0.45 : 1 }}>

                          {/* Инфо */}
                          <div className="plan-row-info" style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                              <span style={{ fontSize:'0.95rem', fontWeight:700, color:C.accent }}>{monthLabel(plan.months)}</span>
                              {hasSale && (
                                <span style={{ fontSize:'0.65rem', background:C.greenDim, color:C.green, border:`1px solid rgba(0,229,160,0.25)`, borderRadius:6, padding:'2px 7px', fontWeight:700 }}>
                                  −{plan.discount_percent}%
                                </span>
                              )}
                              {unavailable && (
                                <span style={{ fontSize:'0.65rem', background:C.redDim, color:C.red, border:`1px solid rgba(255,94,94,0.25)`, borderRadius:6, padding:'2px 7px', fontWeight:700 }}>Мест нет</span>
                              )}
                            </div>
                            {plan.description && (
                              <div style={{ fontSize:'0.75rem', color:C.dim, marginBottom:3, lineHeight:1.4 }}>{plan.description}</div>
                            )}
                            <div style={{ fontSize:'0.72rem', color:C.dim }}>
                              до {plan.max_sessions} устройств
                              {plan.max_users_per_server > 0 && <span style={{ marginLeft:8 }}>· выделенный канал</span>}
                            </div>
                          </div>

                          {/* Цена */}
                          <div className="plan-row-price" style={{ textAlign:'right', flexShrink:0 }}>
                            {hasSale && (
                              <div style={{ fontSize:'0.72rem', color:C.dim, textDecoration:'line-through', marginBottom:1 }}>
                                {Math.round(plan.price_per_month * plan.months)} ₽
                              </div>
                            )}
                            <div style={{ fontSize:'1.25rem', fontWeight:900, color, letterSpacing:'-0.02em' }}>{plan.final_price} ₽</div>
                            <div style={{ fontSize:'0.68rem', color:C.dim }}>{Math.round(plan.final_price / plan.months)} ₽/мес</div>
                          </div>

                          {/* Кнопка — зелёная обводка + свечение */}
                          <button className="plan-row-btn" disabled={unavailable}
                            onClick={() => {
                              if (!isLoggedIn) { navigate('/login'); return }
                              setSelTierIdx(ti); setSelPlan(plan); setBuyError('')
                            }}
                            style={{
                              flexShrink:0,
                              width:96,
                              padding:'11px 0',
                              borderRadius:12,
                              border: unavailable ? `1px solid ${C.border}` : `1px solid ${C.green}`,
                              background: 'transparent',
                              color: unavailable ? C.dim : C.green,
                              fontWeight:700,
                              fontSize:'0.82rem',
                              cursor: unavailable ? 'not-allowed' : 'pointer',
                              fontFamily:'inherit',
                              transition:'background 0.2s, box-shadow 0.2s',
                              boxShadow: unavailable ? 'none' : `0 0 12px rgba(0,229,160,0.3)`,
                              textAlign:'center',
                            }}
                            onMouseEnter={e => { if(!unavailable){ e.currentTarget.style.background=C.greenDim; e.currentTarget.style.boxShadow=`0 0 22px rgba(0,229,160,0.5)` }}}
                            onMouseLeave={e => { if(!unavailable){ e.currentTarget.style.background='transparent'; e.currentTarget.style.boxShadow=`0 0 12px rgba(0,229,160,0.3)` }}}>
                            {unavailable ? 'Занято' : 'Купить'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* ── Включено в каждый тариф — больше отступ сверху ── */}
            <div style={{ background:C.surface, borderRadius:20, border:`1px solid ${C.border}`, overflow:'hidden', marginTop:48 }}>
              <div style={{ padding:'14px 22px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:C.green, display:'block', boxShadow:`0 0 6px ${C.greenGlow}` }} />
                <span style={{ fontSize:'0.72rem', color:C.dimHi, letterSpacing:'0.18em', textTransform:'uppercase', fontWeight:700 }}>Включено в каждый тариф</span>
              </div>
              <div className="included-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))' }}>
                {included.map((f, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'13px 22px', borderBottom: i < included.length - (included.length % 2 === 0 ? 2 : 1) ? `1px solid ${C.border}` : 'none', borderRight: i % 2 === 0 && included.length > 1 ? `1px solid ${C.border}` : 'none' }}>
                    <span style={{ fontSize:'0.95rem', color:C.green, flexShrink:0, marginTop:1, fontFamily:'monospace' }}>{f.icon}</span>
                    <span style={{ fontSize:'0.82rem', color:C.dimHi, lineHeight:1.5 }}>{f.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Не авторизован — призыв */}
            {!isLoggedIn && (
              <div className="not-logged-cta" style={{ marginTop:20, background:C.greenDim, border:`1px solid rgba(0,229,160,0.2)`, borderRadius:16, padding:'18px 22px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
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

      <Footer />
    </div>
  )
}