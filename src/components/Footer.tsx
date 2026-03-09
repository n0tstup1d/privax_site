import { useNavigate } from 'react-router-dom'
import { C } from './theme'

export default function Footer() {
  const navigate = useNavigate()
  const year = new Date().getFullYear()

  return (
    <footer style={{ background: C.surface, borderTop: `1px solid ${C.border}`, padding: '52px 24px 32px', marginTop: 40 }}>
      <style>{`
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
        @media (max-width: 480px) {
          .footer-grid  { flex-direction: column !important; gap: 32px !important; }
          .footer-links { gap: 32px !important; }
          .footer-bottom { flex-direction: column !important; gap: 8px !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1140, margin: '0 auto' }}>
        <div className="footer-grid" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 40, flexWrap: 'wrap', marginBottom: 44 }}>

          {/* Бренд */}
          <div style={{ minWidth: 180 }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: C.accent, letterSpacing: '0.06em', fontFamily: 'monospace', marginBottom: 12 }}>PRIVAX</div>
            <div style={{ fontSize: '0.82rem', color: C.dim, lineHeight: 1.7, maxWidth: 230 }}>
              Надёжное шифрование трафика с нулевым логированием. Ваша цифровая личность защищена.
            </div>
            <div style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,229,160,0.12)', border: `1px solid rgba(0,229,160,0.2)`, borderRadius: 20, padding: '5px 12px' }}>
              <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
                <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: C.green, animation: 'ping 1.8s cubic-bezier(0,0,0.2,1) infinite' }} />
                <span style={{ position: 'relative', display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: C.green }} />
              </span>
              <span style={{ fontSize: '0.7rem', color: C.green, fontWeight: 600, letterSpacing: '0.08em' }}>СИСТЕМА АКТИВНА</span>
            </div>
          </div>

          {/* Ссылки */}
          <div className="footer-links" style={{ display: 'flex', gap: 56, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.62rem', color: C.dim, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 16 }}>Сервис</div>
              {[
                { label: 'Главная',         fn: () => navigate('/') },
                { label: 'Тарифы',          fn: () => navigate('/plans') },
                { label: 'Личный кабинет',  fn: () => navigate('/dashboard') },
                { label: 'Регистрация',     fn: () => navigate('/register') },
              ].map(i => (
                <div key={i.label} style={{ marginBottom: 10 }}>
                  <span onClick={i.fn} style={{ fontSize: '0.85rem', color: C.dim, cursor: 'pointer', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = C.accent}
                    onMouseLeave={e => e.currentTarget.style.color = C.dim}>
                    {i.label}
                  </span>
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontSize: '0.62rem', color: C.dim, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 16 }}>Поддержка</div>
              {[
                { label: 'Telegram', href: 'https://t.me/privax_support' },
                { label: 'Email',    href: 'mailto:support@privax.ru' },
              ].map(i => (
                <div key={i.label} style={{ marginBottom: 10 }}>
                  <a href={i.href} target="_blank" rel="noreferrer"
                    style={{ fontSize: '0.85rem', color: C.dim, textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = C.accent}
                    onMouseLeave={e => e.currentTarget.style.color = C.dim}>
                    {i.label}
                  </a>
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontSize: '0.62rem', color: C.dim, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 16 }}>Правовое</div>
              {['Политика конфиденциальности', 'Условия использования', 'Политика возврата'].map(label => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <span style={{ fontSize: '0.85rem', color: C.dim, cursor: 'pointer', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = C.accent}
                    onMouseLeave={e => e.currentTarget.style.color = C.dim}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="footer-bottom" style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: '0.75rem', color: C.dim }}>© {year} Privax Technologies. Все права защищены.</div>
          <span style={{ fontSize: '0.72rem', color: C.dim }}>Принимаем: BTC · TON · USDT · ₽</span>
        </div>
      </div>
    </footer>
  )
}