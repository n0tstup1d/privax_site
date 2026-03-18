import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { C } from './Theme'

interface Props {
  active?: 'home' | 'plans' | 'login' | 'register'
  scrollEffect?: boolean
}

export default function NavbarPublic({ scrollEffect = false }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const isActive = (path: string) => location.pathname === path

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 800) setMenuOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (!scrollEffect) return
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [scrollEffect])

  const navLinks = [
    { label: 'Главная',      key: '/',       fn: () => navigate('/') },
    { label: 'Тарифы',       key: '/plans',  fn: () => navigate('/plans') },
    { label: 'Приложения',   key: '/apps',   fn: () => navigate('/apps') },
    { label: 'Инструкции',    key: '/guides', fn: () => navigate('/guides') },
    { label: 'Поддержка',    key: '/support', fn: () => navigate('/support') },
  ]

  return (
    <>
      <style>{`
        .npub-dt { display: none !important; }
        .npub-burger { display: flex !important; }
        @media (min-width: 800px) {
          .npub-dt { display: flex !important; }
          .npub-burger { display: none !important; }
        }
      `}</style>

      <nav style={{
        position: 'sticky', top: 0, zIndex: 200,
        background: scrolled ? 'rgba(13,15,16,0.92)' : C.surface,
        borderBottom: `1px solid ${scrolled ? 'rgba(36,42,46,0.6)' : C.border}`,
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        transition: 'background 0.3s, border-color 0.3s',
      }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '0 20px', height: 66, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          <span onClick={() => navigate('/')} style={{ fontSize: '1.25rem', fontWeight: 900, color: C.accent, letterSpacing: '0.06em', cursor: 'pointer', fontFamily: 'monospace' }}>
            PRIVAX
          </span>

          {/* Desktop links */}
          <div className="npub-dt" style={{ gap: 32, alignItems: 'center' }}>
            {navLinks.map(l => (
              <span key={l.key} onClick={l.fn}
                style={{ fontSize: '0.85rem', fontWeight: isActive(l.key) ? 700 : 500, color: isActive(l.key) ? C.accent : C.dim, cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = C.accent}
                onMouseLeave={e => e.currentTarget.style.color = isActive(l.key) ? C.accent : C.dim}>
                {l.label}
              </span>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="npub-dt" style={{ gap: 10, alignItems: 'center' }}>
            <button onClick={() => navigate('/login')}
              style={{ background: 'transparent', color: C.dimHi, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 18px', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'color 0.2s, border-color 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.color = C.accent; e.currentTarget.style.borderColor = C.borderHi }}
              onMouseLeave={e => { e.currentTarget.style.color = C.dimHi; e.currentTarget.style.borderColor = C.border }}>
              Войти
            </button>
            <button onClick={() => navigate('/register')}
              style={{ background: C.green, color: C.bg, border: 'none', borderRadius: 10, padding: '8px 18px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 0 14px ${C.greenGlow}` }}>
              Начать →
            </button>
          </div>

          {/* Burger */}
          <button onClick={() => setMenuOpen(o => !o)} className="npub-burger"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', flexDirection: 'column', gap: 5, padding: '8px 4px', alignItems: 'flex-end' }}>
            <span style={{ display: 'block', width: 22, height: 2, background: C.accent, transition: '0.2s', transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none', transformOrigin: 'center' }} />
            <span style={{ display: 'block', width: 16, height: 2, background: C.accent, transition: '0.2s', opacity: menuOpen ? 0 : 1 }} />
            <span style={{ display: 'block', width: 22, height: 2, background: C.accent, transition: '0.2s', transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none', transformOrigin: 'center' }} />
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{ background: C.surface, borderTop: `1px solid ${C.border}`, padding: '12px 24px 24px', boxSizing: 'border-box' }}>
            {navLinks.map(l => (
              <span key={l.key} onClick={() => { l.fn(); setMenuOpen(false) }}
                style={{ display: 'block', padding: '14px 0', fontSize: '1rem', color: isActive(l.key) ? C.accent : C.dimHi, fontWeight: isActive(l.key) ? 700 : 400, cursor: 'pointer', borderBottom: `1px solid ${C.border}` }}>
                {l.label}
              </span>
            ))}
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => { navigate('/login'); setMenuOpen(false) }}
                style={{ background: C.greenDim, color: C.green, border: `1px solid rgba(0,229,160,0.35)`, borderRadius: 12, padding: '13px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box', textAlign: 'center' }}>
                Войти
              </button>
              <button onClick={() => { navigate('/register'); setMenuOpen(false) }}
                style={{ background: C.green, color: C.bg, border: 'none', borderRadius: 12, padding: '13px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box', textAlign: 'center' }}>
                Начать →
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  )
}