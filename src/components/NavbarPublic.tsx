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

  const navLinks: { label: string; key: string; fn: () => void }[] = [
    { label: 'Тарифы',     key: '/plans',  fn: () => navigate('/plans') },
    { label: 'Приложения', key: '/apps',   fn: () => navigate('/apps') },
    { label: 'Вопросы',    key: '/faq',    fn: () => navigate('/faq') },
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
            TUGOKA
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
              style={{
                background: isActive('/login') ? C.green : 'transparent',
                color: isActive('/login') ? C.bg : C.accent,
                border: `1px solid ${isActive('/login') ? C.green : C.border}`,
                borderRadius: 10, padding: '8px 20px',
                fontSize: '0.82rem', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'background 0.2s, border-color 0.2s, color 0.2s',
              }}
              onMouseEnter={e => {
                if (!isActive('/login')) {
                  e.currentTarget.style.borderColor = C.green
                  e.currentTarget.style.color = C.green
                }
              }}
              onMouseLeave={e => {
                if (!isActive('/login')) {
                  e.currentTarget.style.borderColor = C.border
                  e.currentTarget.style.color = C.accent
                }
              }}>
              Войти
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
                style={{
                  width: '100%',
                  background: C.green, color: C.bg,
                  border: 'none', borderRadius: 12,
                  padding: '13px', fontSize: '0.9rem', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  textAlign: 'center' as const,
                }}>
                Войти
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  )
}