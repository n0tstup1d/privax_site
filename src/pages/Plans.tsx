import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const theme = {
  bg: '#e1e3e4',       // серый фон страницы
  navbar: '#16191b',
  card: '#1c1f22',
  inner: '#242729',    // строки внутри блока
  accent: '#ffffff',
  secondary: '#3d4449',
  dim: '#9aa3a8',
  dimLight: '#c4cdd3',
}

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const btnBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: '0.2s',
}

interface Plan {
  id: number
  name: string
  tier_level: number
  price_per_month: number
  months: number
  discount_percent: number
  final_price: number
  max_sessions: number
}

const TIER_META: Record<number, { label: string; color: string }> = {
  1: { label: 'Silver',   color: '#a0aec0' },
  2: { label: 'Gold',     color: '#f6c90e' },
  3: { label: 'Platinum', color: '#76e4f7' },
}

const COMPARISON_ROWS: { label: string; values: Record<number, string> }[] = [
  { label: 'Серверы',   values: { 1: 'Стандартные',  2: 'Премиум',      3: 'Выделенные' } },
  { label: 'Скорость',  values: { 1: 'До 300 Мбит',  2: 'До 600 Мбит',  3: 'До 1 Гбит'  } },
  { label: 'Приоритет', values: { 1: 'Обычный',      2: 'Высокий',      3: 'Максимальный' } },
  { label: 'Поддержка', values: { 1: 'Чат',          2: 'Чат + email',  3: 'Приоритетная' } },
]

function monthLabel(m: number) {
  if (m === 1) return '1 месяц'
  if (m === 2) return '2 месяца'
  if (m === 3) return '3 месяца'
  if (m === 6) return '6 месяцев'
  if (m === 12) return '1 год'
  return `${m} мес.`
}

// ── Модал подтверждения покупки ──
function BuyModal({
  plan, balance, onConfirm, onClose, loading, error,
}: {
  plan: Plan; balance: number; onConfirm: (promo: string) => void
  onClose: () => void; loading: boolean; error: string
}) {
  const [promo, setPromo] = useState('')
  const enough = balance >= plan.final_price
  const origPrice = Math.round(plan.price_per_month * plan.months)

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: theme.navbar, borderRadius: 28, padding: '32px 28px', border: `1px solid ${theme.secondary}`, width: '100%', maxWidth: 420 }}>

        <div style={{ fontSize: '0.65rem', color: theme.dim, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>Подтверждение покупки</div>
        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: theme.accent, marginBottom: 4 }}>{plan.name}</div>
        <div style={{ fontSize: '0.85rem', color: theme.dim, marginBottom: 24 }}>
          {monthLabel(plan.months)} · до {plan.max_sessions} устройств
        </div>

        <div style={{ background: theme.card, borderRadius: 16, padding: '16px 20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: '0.8rem', color: theme.dim }}>Ваш баланс</span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: enough ? theme.accent : '#ff6b6b' }}>{balance} ₽</span>
          </div>
          {plan.discount_percent > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: '0.8rem', color: theme.dim }}>Без скидки</span>
              <span style={{ fontSize: '0.9rem', color: theme.dim, textDecoration: 'line-through' }}>{origPrice} ₽</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: `1px solid ${theme.secondary}` }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: theme.dimLight }}>К оплате</span>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: theme.accent }}>{plan.final_price} ₽</span>
          </div>
        </div>

        {!enough && (
          <div style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.25)', borderRadius: 12, padding: '10px 14px', marginBottom: 16, fontSize: '0.8rem', color: '#ff8080' }}>
            Недостаточно средств. Не хватает {Math.round((plan.final_price - balance) * 100) / 100} ₽
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: '0.65rem', color: theme.dim, letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>ПРОМОКОД (необязательно)</label>
          <input type="text" placeholder="Введите промокод" value={promo}
            onChange={e => setPromo(e.target.value.toUpperCase())}
            style={{ width: '100%', background: theme.card, border: `1px solid ${theme.secondary}`, borderRadius: 12, padding: '12px 16px', color: theme.accent, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {error && (
          <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: '0.82rem', color: '#ff6b6b' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose}
            style={{ ...btnBase, flex: 1, background: 'transparent', border: `1px solid ${theme.secondary}`, color: theme.dim, borderRadius: 14, padding: '14px 0', fontWeight: 600, fontSize: '0.82rem' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = theme.dimLight; e.currentTarget.style.color = theme.dimLight }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = theme.secondary; e.currentTarget.style.color = theme.dim }}>
            Отмена
          </button>
          <button onClick={() => onConfirm(promo)} disabled={loading || !enough}
            style={{ ...btnBase, flex: 2, background: enough && !loading ? theme.accent : theme.card, color: enough && !loading ? theme.navbar : theme.dim, border: `1px solid ${enough && !loading ? theme.accent : theme.secondary}`, borderRadius: 14, padding: '14px 0', fontWeight: 800, fontSize: '0.85rem', cursor: !enough || loading ? 'not-allowed' : 'pointer' }}
            onMouseEnter={e => { if (enough && !loading) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.accent } }}
            onMouseLeave={e => { if (enough && !loading) { e.currentTarget.style.background = theme.accent; e.currentTarget.style.color = theme.navbar } }}>
            {loading ? 'ПОКУПАЕМ...' : 'ОПЛАТИТЬ'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Модал успеха ──
function SuccessModal({ planName, onClose }: { planName: string; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div style={{ background: theme.navbar, borderRadius: 28, padding: '44px 32px', border: `1px solid ${theme.secondary}`, width: '100%', maxWidth: 360, textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎉</div>
        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: theme.accent, marginBottom: 10 }}>Подписка активирована!</div>
        <div style={{ fontSize: '0.88rem', color: theme.dim, lineHeight: 1.7, marginBottom: 28 }}>
          <span style={{ color: theme.dimLight, fontWeight: 600 }}>{planName}</span> успешно подключён.<br />
          Ссылка для подключения — в личном кабинете.
        </div>
        <button onClick={onClose}
          style={{ ...btnBase, width: '100%', background: theme.accent, color: theme.navbar, border: 'none', borderRadius: 14, padding: '16px 0', fontWeight: 800, fontSize: '0.85rem' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.accent; e.currentTarget.style.border = `1px solid ${theme.accent}` }}
          onMouseLeave={e => { e.currentTarget.style.background = theme.accent; e.currentTarget.style.color = theme.navbar; e.currentTarget.style.border = 'none' }}>
          В ЛИЧНЫЙ КАБИНЕТ
        </button>
      </div>
    </div>
  )
}

function Plans() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [buyLoading, setBuyLoading] = useState(false)
  const [buyError, setBuyError] = useState('')
  const [successPlan, setSuccessPlan] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        if (payload.exp > Math.floor(Date.now() / 1000)) {
          setIsLoggedIn(true)
          loadBalance(token)
        }
      } catch {}
    }
    loadPlans()
  }, [])

  async function loadPlans() {
    try {
      const res = await fetch(`${API}/subscriptions/plans`)
      const data = await res.json()
      setPlans(Array.isArray(data) ? data : [])
    } catch {}
    finally { setLoading(false) }
  }

  async function loadBalance(token: string) {
    try {
      const res = await fetch(`${API}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setBalance(data.balance ?? 0)
    } catch {}
  }

  async function handleBuy(promo: string) {
    if (!isLoggedIn) { navigate('/login'); return }
    if (!selectedPlan) return
    setBuyLoading(true); setBuyError('')
    try {
      const body: Record<string, string> = {}
      if (promo.trim()) body.promocode = promo.trim()
      const res = await fetch(`${API}/subscriptions/buy/${selectedPlan.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setBuyError(data.detail || 'Ошибка при покупке'); return }
      setSuccessPlan(selectedPlan.name)
      setSelectedPlan(null)
      setBalance(b => Math.max(0, b - selectedPlan.final_price))
    } catch { setBuyError('Сервер недоступен') }
    finally { setBuyLoading(false) }
  }

  const tiers = [...new Set(plans.map(p => p.tier_level))].sort()
  const plansByTier = (tier: number) =>
    plans.filter(p => p.tier_level === tier).sort((a, b) => a.final_price - b.final_price)
  const tierLevels = tiers.filter(t => plansByTier(t).length > 0)

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>

      {selectedPlan && (
        <BuyModal plan={selectedPlan} balance={balance}
          onConfirm={handleBuy} onClose={() => { setSelectedPlan(null); setBuyError('') }}
          loading={buyLoading} error={buyError} />
      )}
      {successPlan && (
        <SuccessModal planName={successPlan} onClose={() => { setSuccessPlan(null); navigate('/dashboard') }} />
      )}

      {/* Navbar */}
      <nav style={{ background: theme.navbar, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 32px', height: 68, borderBottom: `1px solid ${theme.secondary}` }}>
        <a href="/" style={{ fontSize: '1.3rem', fontWeight: 800, color: theme.accent, textDecoration: 'none' }}>PRIVAX</a>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          {isLoggedIn && <span style={{ fontSize: '0.85rem', color: theme.dim, fontWeight: 600 }}>{balance} ₽</span>}
          {isLoggedIn
            ? <a href="/dashboard" style={{ fontSize: '0.82rem', color: theme.dim, textDecoration: 'none', fontWeight: 500 }}
                onMouseEnter={e => e.currentTarget.style.color = theme.accent}
                onMouseLeave={e => e.currentTarget.style.color = theme.dim}>Личный кабинет</a>
            : <a href="/login" style={{ fontSize: '0.82rem', color: theme.accent, textDecoration: 'none', fontWeight: 700 }}>Войти</a>
          }
        </div>
      </nav>

      <main style={{ maxWidth: 560, margin: '0 auto', padding: '40px 16px 64px' }}>

        {/* Заголовок */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: '0.65rem', color: theme.navbar, opacity: 0.5, letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>
            Тарифы
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: theme.navbar, lineHeight: 1.1, margin: '0 0 12px' }}>
            Выберите свой план
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#5a6370', lineHeight: 1.7, margin: 0 }}>
            Все планы включают AES-256 шифрование и нулевое логирование
          </p>
        </div>

        {loading ? (
          <div style={{ background: theme.navbar, borderRadius: 28, padding: '60px', textAlign: 'center', color: theme.dim }}>
            Загрузка тарифов...
          </div>
        ) : plans.length === 0 ? (
          <div style={{ background: theme.navbar, borderRadius: 28, padding: '48px', textAlign: 'center', border: `1px solid ${theme.secondary}` }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>🚧</div>
            <div style={{ color: theme.accent, fontWeight: 600, marginBottom: 8 }}>Тарифы скоро появятся</div>
            <div style={{ color: theme.dim, fontSize: '0.88rem' }}>Следите за обновлениями</div>
          </div>
        ) : (
          <>
            {/* ── ОДИН БОЛЬШОЙ БЛОК СО ВСЕМИ ТАРИФАМИ ── */}
            <div style={{ background: theme.navbar, borderRadius: 28, border: `1px solid ${theme.secondary}`, overflow: 'hidden', marginBottom: 16 }}>

              {tierLevels.map((tier, tierIdx) => {
                const meta = TIER_META[tier] ?? { label: `Tier ${tier}`, color: theme.accent }
                const tierPlans = plansByTier(tier)
                const isLastTier = tierIdx === tierLevels.length - 1

                return (
                  <div key={tier}>
                    {/* Заголовок уровня */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '16px 24px',
                      background: theme.card,
                      borderBottom: `1px solid ${theme.secondary}`,
                      borderTop: tierIdx > 0 ? `2px solid ${theme.secondary}` : 'none',
                    }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: meta.color, flexShrink: 0, boxShadow: `0 0 6px ${meta.color}88` }} />
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: theme.accent }}>{meta.label}</span>
                      <span style={{ fontSize: '0.75rem', color: theme.dim }}>
                        {tier === 1 && '— стандартные серверы'}
                        {tier === 2 && '— премиум серверы'}
                        {tier === 3 && '— выделенные серверы'}
                      </span>
                    </div>

                    {/* Планы этого уровня */}
                    {tierPlans.map((plan, i) => {
                      const hasSale = plan.discount_percent > 0
                      const origPrice = Math.round(plan.price_per_month * plan.months)
                      const isLastPlan = i === tierPlans.length - 1

                      return (
                        <div key={plan.id} style={{
                          display: 'flex', alignItems: 'center', gap: 16,
                          padding: '18px 24px',
                          borderBottom: (!isLastPlan || !isLastTier) ? `1px solid ${theme.secondary}` : 'none',
                        }}>

                          {/* Период + устройства */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: theme.accent }}>
                                {monthLabel(plan.months)}
                              </span>
                              {hasSale && (
                                <span style={{ background: '#4ade8020', border: '1px solid #4ade8050', borderRadius: 8, padding: '2px 8px', fontSize: '0.67rem', fontWeight: 700, color: '#4ade80' }}>
                                  −{plan.discount_percent}%
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: theme.dim }}>
                              до {plan.max_sessions} устройств
                            </div>
                          </div>

                          {/* Цена */}
                          <div style={{ textAlign: 'right', flexShrink: 0, marginRight: 4 }}>
                            {hasSale && (
                              <div style={{ fontSize: '0.72rem', color: theme.dim, textDecoration: 'line-through', marginBottom: 1 }}>
                                {origPrice} ₽
                              </div>
                            )}
                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: theme.accent, lineHeight: 1.1 }}>
                              {plan.final_price} ₽
                            </div>
                            <div style={{ fontSize: '0.68rem', color: theme.dim }}>
                              {Math.round(plan.final_price / plan.months)} ₽/мес
                            </div>
                          </div>

                          {/* Кнопка */}
                          <button
                            onClick={() => {
                              if (!isLoggedIn) { navigate('/login'); return }
                              setSelectedPlan(plan); setBuyError('')
                            }}
                            style={{ ...btnBase, flexShrink: 0, background: theme.accent, color: theme.navbar, border: '1px solid transparent', borderRadius: 12, padding: '10px 18px', fontWeight: 700, fontSize: '0.82rem' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.accent; e.currentTarget.style.borderColor = theme.accent }}
                            onMouseLeave={e => { e.currentTarget.style.background = theme.accent; e.currentTarget.style.color = theme.navbar; e.currentTarget.style.borderColor = 'transparent' }}>
                            Купить
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>

            {/* ── Таблица различий (только если уровней > 1) ── */}
            {tierLevels.length > 1 && (
              <div style={{ background: theme.navbar, borderRadius: 28, border: `1px solid ${theme.secondary}`, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ padding: '16px 24px', borderBottom: `1px solid ${theme.secondary}`, background: theme.card }}>
                  <div style={{ fontSize: '0.7rem', color: theme.dim, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}>
                    Сравнение уровней
                  </div>
                </div>

                {/* Шапка */}
                <div style={{ display: 'grid', gridTemplateColumns: `1.4fr ${tierLevels.map(() => '1fr').join(' ')}`, borderBottom: `1px solid ${theme.secondary}` }}>
                  <div style={{ padding: '12px 24px' }} />
                  {tierLevels.map(tier => {
                    const meta = TIER_META[tier] ?? { label: `T${tier}`, color: theme.accent }
                    return (
                      <div key={tier} style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.72rem', color: meta.color, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          {meta.label}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Строки */}
                {COMPARISON_ROWS.map((row, ri, arr) => (
                  <div key={ri} style={{ display: 'grid', gridTemplateColumns: `1.4fr ${tierLevels.map(() => '1fr').join(' ')}`, borderBottom: ri < arr.length - 1 ? `1px solid ${theme.secondary}` : 'none' }}>
                    <div style={{ padding: '13px 24px', fontSize: '0.8rem', color: theme.dim, fontWeight: 500 }}>
                      {row.label}
                    </div>
                    {tierLevels.map(tier => (
                      <div key={tier} style={{ padding: '13px 8px', textAlign: 'center', fontSize: '0.8rem', color: theme.dimLight, fontWeight: 500 }}>
                        {row.values[tier] ?? '—'}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* ── Включено во все тарифы ── */}
            <div style={{ background: theme.navbar, borderRadius: 28, border: `1px solid ${theme.secondary}`, overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: `1px solid ${theme.secondary}`, background: theme.card }}>
                <div style={{ fontSize: '0.7rem', color: theme.dim, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700 }}>
                  Включено в каждый тариф
                </div>
              </div>
              {[
                { icon: '🔒', text: 'AES-256 шифрование военного класса' },
                { icon: '👁️', text: 'Нулевое логирование трафика' },
                { icon: '🔄', text: 'Автоматическое обновление конфигурации' },
                { icon: '📱', text: 'Поддержка AmneziaVPN, Hiddify, Sing-Box' },
              ].map((f, i, arr) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px', borderBottom: i < arr.length - 1 ? `1px solid ${theme.secondary}` : 'none' }}>
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>{f.icon}</span>
                  <span style={{ fontSize: '0.85rem', color: theme.dimLight }}>{f.text}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default Plans