import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const theme = {
  bg: '#e1e3e4',
  navbar: '#16191b',
  card: '#1c1f22',
  accent: '#ffffff',
  secondary: '#3d4449',
  dim: '#9aa3a8',
}

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const btnBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: '0.2s',
}

interface Subscription {
  id: number
  sub_url: string | null
  vless_link: string | null
  plan: string
  expires_at: string
  days_left: number
  expired: boolean
  is_active: boolean
  auto_renew: boolean
}

interface Invoice {
  id: number
  amount: number
  status: string
  type: string
  plan: string | null
  date: string
}

// Модал пополнения
function TopUpModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: theme.navbar, borderRadius: 28, padding: '36px 28px', border: `1px solid ${theme.secondary}`, width: '100%', maxWidth: 400 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>💳</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: theme.accent, marginBottom: 8 }}>Пополнение баланса</div>
          <div style={{ fontSize: '0.85rem', color: theme.dim, lineHeight: 1.6 }}>
            На данный момент пополнение осуществляется через поддержку
          </div>
        </div>

        <div style={{ background: theme.card, borderRadius: 16, padding: '20px', marginBottom: 24 }}>
          {[
            { label: 'Telegram', value: '@privax_support', icon: '✈️' },
            { label: 'Email', value: 'support@privax.ru', icon: '✉️' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: item.label === 'Telegram' ? `1px solid ${theme.secondary}` : 'none' }}>
              <span style={{ fontSize: '1rem' }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: '0.65rem', color: theme.dim, letterSpacing: '0.1em', marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: theme.accent }}>{item.value}</div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={onClose} style={{ ...btnBase, width: '100%', background: theme.accent, color: theme.navbar, border: '1px solid transparent', borderRadius: 14, padding: '14px 0', fontWeight: 800, fontSize: '0.85rem' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.accent; e.currentTarget.style.borderColor = theme.accent }}
          onMouseLeave={e => { e.currentTarget.style.background = theme.accent; e.currentTarget.style.color = theme.navbar; e.currentTarget.style.borderColor = 'transparent' }}>
          Понятно
        </button>
      </div>
    </div>
  )
}

// QR модал
function QrModal({ value, onClose }: { value: string; onClose: () => void }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=${encodeURIComponent(value)}`
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: theme.navbar, borderRadius: 24, padding: '28px 28px 20px', border: `1px solid ${theme.secondary}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, maxWidth: 280 }}>
        <div style={{ fontSize: '0.7rem', color: theme.dim, letterSpacing: '0.15em', textTransform: 'uppercase' }}>QR для подключения</div>
        <img src={qrUrl} alt="QR" width={220} height={220} style={{ borderRadius: 12, background: '#fff', display: 'block' }} />
        <div style={{ fontSize: '0.72rem', color: theme.dim, textAlign: 'center', lineHeight: 1.5 }}>Отсканируйте в AmneziaVPN или Hiddify</div>
        <button onClick={onClose} style={{ ...btnBase, width: '100%', background: 'transparent', border: `1px solid ${theme.secondary}`, color: theme.dim, borderRadius: 12, padding: '10px 0', fontSize: '0.8rem', fontWeight: 600 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.color = theme.accent }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = theme.secondary; e.currentTarget.style.color = theme.dim }}>
          Закрыть
        </button>
      </div>
    </div>
  )
}

function Dashboard() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'subscriptions' | 'history' | 'security'>('subscriptions')
  const [email, setEmail] = useState('')
  const [balance, setBalance] = useState(0)
  const [activeSubscriptions, setActiveSubscriptions] = useState<Subscription[]>([])
  const [expiredSubscriptions, setExpiredSubscriptions] = useState<Subscription[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  // Смена пароля
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPassword2, setNewPassword2] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')

  // Модалы
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [qrLink, setQrLink] = useState<string | null>(null)
  const [showTopUp, setShowTopUp] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) { navigate('/login'); return }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.exp < Math.floor(Date.now() / 1000)) {
        localStorage.removeItem('access_token'); navigate('/login'); return
      }
    } catch { navigate('/login'); return }
    loadData()
  }, [])

  async function loadData() {
    const token = localStorage.getItem('access_token')
    const headers = { Authorization: `Bearer ${token}` }
    try {
      const res = await fetch(`${API}/users/me`, { headers })
      if (res.status === 401) { localStorage.removeItem('access_token'); navigate('/login'); return }
      const me = await res.json()
      setEmail(me.email)
      setBalance(me.balance)
      setInvoices(me.payment_history || [])
      setActiveSubscriptions(me.subscriptions?.active || [])
      setExpiredSubscriptions(me.subscriptions?.expired || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleChangePassword() {
    setPwError(''); setPwSuccess('')
    if (!oldPassword || !newPassword || !newPassword2) { setPwError('Заполните все поля'); return }
    if (newPassword !== newPassword2) { setPwError('Новые пароли не совпадают'); return }
    if (newPassword.length < 8) { setPwError('Минимум 8 символов'); return }
    setPwLoading(true)
    try {
      const res = await fetch(`${API}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      })
      const data = await res.json()
      if (!res.ok) { setPwError(data.detail || 'Ошибка'); return }
      setPwSuccess('Пароль изменён. Сейчас выйдем...')
      setTimeout(() => {
        localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); navigate('/login')
      }, 1500)
    } catch { setPwError('Сервер недоступен') }
    finally { setPwLoading(false) }
  }

  function copyVless(sub: Subscription) {
    if (!sub.vless_link) return
    navigator.clipboard.writeText(sub.vless_link)
    setCopiedId(sub.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function logout() {
    localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); navigate('/')
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: theme.card, border: `1px solid ${theme.secondary}`,
    borderRadius: 12, padding: '14px 16px', color: theme.accent,
    fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
  }

  if (loading) {
    return (
      <div style={{ background: theme.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: theme.dim, fontSize: '0.9rem' }}>Загрузка...</div>
      </div>
    )
  }

  const tabs = [
    { key: 'subscriptions', label: 'Подписки' },
    { key: 'history', label: 'История платежей' },
    { key: 'security', label: 'Безопасность' },
  ] as const

  return (
    <div style={{ background: theme.bg, minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>

      {qrLink && <QrModal value={qrLink} onClose={() => setQrLink(null)} />}
      {showTopUp && <TopUpModal onClose={() => setShowTopUp(false)} />}

      {/* Navbar */}
      <nav style={{ background: theme.navbar, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 32px', height: 68, borderBottom: `1px solid ${theme.secondary}` }}>
        <a href="/" style={{ fontSize: '1.3rem', fontWeight: 800, color: theme.accent, textDecoration: 'none' }}>PRIVAX</a>
        <span style={{ fontSize: '0.82rem', color: theme.dim }}>{email}</span>
        <button onClick={logout}
          style={{ ...btnBase, background: 'transparent', border: `1px solid ${theme.secondary}`, color: theme.dim, padding: '8px 20px', borderRadius: 10, fontSize: '0.8rem' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#ff6b6b'; e.currentTarget.style.color = '#ff6b6b' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = theme.secondary; e.currentTarget.style.color = theme.dim }}>
          Выйти
        </button>
      </nav>

      <main style={{ maxWidth: 480, margin: '0 auto', padding: '32px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Карточка профиля */}
        <div style={{ background: theme.navbar, borderRadius: 28, padding: '22px 24px', border: `1px solid ${theme.secondary}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: '0.65rem', color: theme.dim, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>Аккаунт</div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: theme.accent }}>{email}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.65rem', color: theme.dim, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>Баланс</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: theme.accent }}>{balance} ₽</div>
            </div>
          </div>

          {/* Кнопки действий */}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              onClick={() => setShowTopUp(true)}
              style={{ ...btnBase, flex: 1, background: 'transparent', border: `1px solid ${theme.secondary}`, color: theme.dim, borderRadius: 12, padding: '11px 0', fontSize: '0.78rem', fontWeight: 600 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#4ade80'; e.currentTarget.style.color = '#4ade80' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = theme.secondary; e.currentTarget.style.color = theme.dim }}>
              + Пополнить
            </button>
            <button
              onClick={() => navigate('/plans')}
              style={{ ...btnBase, flex: 2, background: theme.accent, color: theme.navbar, border: '1px solid transparent', borderRadius: 12, padding: '11px 0', fontSize: '0.78rem', fontWeight: 700 }}
              onMouseEnter={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.accent; e.currentTarget.style.borderColor = theme.accent }}
              onMouseLeave={e => { e.currentTarget.style.background = theme.accent; e.currentTarget.style.color = theme.navbar; e.currentTarget.style.borderColor = 'transparent' }}>
              Купить подписку →
            </button>
          </div>
        </div>

        {/* Вкладки */}
        <div style={{ display: 'flex', gap: 8 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ ...btnBase, flex: 1, padding: '12px 8px', borderRadius: 14, border: 'none', fontWeight: 600, fontSize: '0.75rem', lineHeight: 1.3, background: tab === t.key ? theme.accent : theme.card, color: tab === t.key ? theme.navbar : theme.dim }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── ПОДПИСКИ ── */}
        {tab === 'subscriptions' && (
          <>
            {activeSubscriptions.length === 0 && expiredSubscriptions.length === 0 ? (
              <div style={{ background: theme.navbar, borderRadius: 28, padding: '40px 28px', border: `1px solid ${theme.secondary}`, textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>🔒</div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: theme.accent, marginBottom: 8 }}>Нет активных подписок</div>
                <div style={{ fontSize: '0.85rem', color: theme.dim, marginBottom: 24 }}>Выберите тариф чтобы начать</div>
                <button onClick={() => navigate('/plans')}
                  style={{ ...btnBase, width: '100%', background: theme.accent, color: theme.navbar, border: '1px solid transparent', borderRadius: 14, padding: '14px 0', fontWeight: 800, fontSize: '0.82rem', letterSpacing: '0.1em' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.accent; e.currentTarget.style.borderColor = theme.accent }}
                  onMouseLeave={e => { e.currentTarget.style.background = theme.accent; e.currentTarget.style.color = theme.navbar; e.currentTarget.style.borderColor = 'transparent' }}>
                  ВЫБРАТЬ ТАРИФ
                </button>
              </div>
            ) : (
              <>
                {activeSubscriptions.map(sub => (
                  <div key={sub.id} style={{ background: theme.navbar, borderRadius: 28, padding: '24px 28px', border: `1px solid ${theme.secondary}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: '#4ade80', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>● Активна</div>
                        <div style={{ fontSize: '1rem', fontWeight: 600, color: theme.accent }}>{sub.plan}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.65rem', color: theme.dim, marginBottom: 4 }}>Осталось</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: theme.accent }}>{sub.days_left} дн.</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: theme.dim, marginBottom: 16 }}>
                      Действует до {formatDate(sub.expires_at)}
                    </div>
                    {sub.vless_link ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => copyVless(sub)}
                          style={{ ...btnBase, flex: 1, background: copiedId === sub.id ? '#4ade80' : theme.accent, color: theme.navbar, border: 'none', borderRadius: 12, padding: '12px 0', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', transition: '0.2s' }}>
                          {copiedId === sub.id ? '✓ Скопировано' : 'Скопировать ссылку'}
                        </button>
                        <button onClick={() => setQrLink(sub.vless_link!)}
                          style={{ ...btnBase, width: 46, flexShrink: 0, background: theme.card, color: theme.accent, border: `1px solid ${theme.secondary}`, borderRadius: 12, padding: '12px 0', fontSize: '1.1rem' }}
                          title="QR-код"
                          onMouseEnter={e => { e.currentTarget.style.borderColor = theme.accent }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = theme.secondary }}>
                          ⊞
                        </button>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: theme.dim }}>Ссылка формируется...</div>
                    )}
                  </div>
                ))}

                {expiredSubscriptions.map(sub => (
                  <div key={sub.id} style={{ background: theme.card, borderRadius: 28, padding: '24px 28px', border: `1px solid ${theme.secondary}`, opacity: 0.65 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: '#ff6b6b', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>● Истекла</div>
                        <div style={{ fontSize: '1rem', fontWeight: 600, color: theme.accent }}>{sub.plan}</div>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: theme.dim }}>{formatDate(sub.expires_at)}</div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {/* ── ИСТОРИЯ ПЛАТЕЖЕЙ ── */}
        {tab === 'history' && (
          <>
            <div style={{ background: theme.navbar, borderRadius: 28, padding: '20px 24px', border: `1px solid ${theme.secondary}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: theme.dim, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>Баланс</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: theme.accent }}>{balance} ₽</div>
              </div>
              <button onClick={() => setShowTopUp(true)}
                style={{ ...btnBase, background: 'transparent', border: `1px solid #4ade80`, color: '#4ade80', borderRadius: 12, padding: '10px 18px', fontSize: '0.78rem', fontWeight: 700 }}
                onMouseEnter={e => { e.currentTarget.style.background = '#4ade8022' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                + Пополнить
              </button>
            </div>

            <div style={{ background: theme.card, borderRadius: 28, border: `1px solid ${theme.secondary}`, overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: `1px solid ${theme.secondary}` }}>
                <div style={{ fontSize: '0.75rem', color: theme.dim, letterSpacing: '0.15em', textTransform: 'uppercase' }}>История</div>
              </div>
              {invoices.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: theme.dim, fontSize: '0.85rem' }}>Платежей пока нет</div>
              ) : (
                invoices.map((inv, i) => (
                  <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: i < invoices.length - 1 ? `1px solid ${theme.secondary}` : 'none' }}>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: theme.accent }}>{inv.type}</div>
                      {inv.plan && <div style={{ fontSize: '0.72rem', color: theme.dim, marginTop: 2 }}>{inv.plan}</div>}
                      <div style={{ fontSize: '0.72rem', color: theme.dim, marginTop: 2 }}>{formatDate(inv.date)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: inv.type === 'Пополнение баланса' ? '#4ade80' : theme.accent }}>
                        {inv.type === 'Пополнение баланса' ? '+' : '-'}{inv.amount} ₽
                      </div>
                      <div style={{ fontSize: '0.7rem', color: inv.status === 'paid' ? '#4ade80' : '#ff6b6b', marginTop: 2 }}>
                        {inv.status === 'paid' ? 'Оплачено' : inv.status}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* ── БЕЗОПАСНОСТЬ ── */}
        {tab === 'security' && (
          <div style={{ background: theme.navbar, borderRadius: 28, padding: '28px', border: `1px solid ${theme.secondary}` }}>
            <div style={{ fontSize: '0.65rem', color: theme.dim, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 20 }}>Смена пароля</div>

            {pwError && <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: '0.82rem', color: '#ff6b6b' }}>{pwError}</div>}
            {pwSuccess && <div style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: '0.82rem', color: '#4ade80' }}>{pwSuccess}</div>}

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: '0.72rem', color: theme.dim, letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>ТЕКУЩИЙ ПАРОЛЬ</label>
              <input type="password" placeholder="••••••••" value={oldPassword} onChange={e => setOldPassword(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: '0.72rem', color: theme.dim, letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>НОВЫЙ ПАРОЛЬ</label>
              <input type="password" placeholder="Минимум 8 символов" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: '0.72rem', color: theme.dim, letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>ПОВТОРИТЕ НОВЫЙ ПАРОЛЬ</label>
              <input type="password" placeholder="••••••••" value={newPassword2} onChange={e => setNewPassword2(e.target.value)}
                style={{ ...inputStyle, borderColor: newPassword2 && newPassword !== newPassword2 ? 'rgba(255,80,80,0.5)' : theme.secondary }} />
            </div>

            <button onClick={handleChangePassword} disabled={pwLoading}
              style={{ ...btnBase, width: '100%', background: pwLoading ? 'transparent' : theme.accent, color: pwLoading ? theme.accent : theme.navbar, border: `1px solid ${theme.accent}`, borderRadius: 14, padding: '16px 0', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.1em', cursor: pwLoading ? 'not-allowed' : 'pointer' }}
              onMouseEnter={e => { if (!pwLoading) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.accent } }}
              onMouseLeave={e => { if (!pwLoading) { e.currentTarget.style.background = theme.accent; e.currentTarget.style.color = theme.navbar } }}>
              {pwLoading ? 'СОХРАНЯЕМ...' : 'СОХРАНИТЬ ПАРОЛЬ'}
            </button>
          </div>
        )}

      </main>
    </div>
  )
}

export default Dashboard