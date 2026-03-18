import { useNavigate } from 'react-router-dom'
import Footer from '../components/Footer'
import { C } from '../components/Theme'

interface Section { title: string; content: string[] }

interface LegalPageProps {
  title: string
  subtitle: string
  updated: string
  badge?: string
  sections: Section[]
}

export default function LegalPage({ title, subtitle, updated, badge, sections }: LegalPageProps) {
  const navigate = useNavigate()

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.accent, display: 'flex', flexDirection: 'column', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

      <main style={{ flex: 1, maxWidth: 760, margin: '0 auto', padding: '56px 24px 96px', width: '100%', animation: 'fadeUp 0.45s ease both' }}>

        {/* Назад */}
        <button onClick={() => navigate(-1)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 10, padding: '7px 14px', color: C.dim, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 36, transition: 'border-color 0.2s, color 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderHi; e.currentTarget.style.color = C.accent }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.dim }}>
          ← Назад
        </button>

        {/* Шапка */}
        <div style={{ marginBottom: 40 }}>
          {badge && (
            <div style={{ fontSize: '0.62rem', color: C.green, letterSpacing: '0.28em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>{badge}</div>
          )}
          <h1 style={{ fontSize: 'clamp(1.7rem, 4vw, 2.4rem)', fontWeight: 900, color: C.accent, lineHeight: 1.1, marginBottom: 12, letterSpacing: '-0.02em' }}>
            {title}
          </h1>
          <p style={{ fontSize: '0.88rem', color: C.dim, lineHeight: 1.7, marginBottom: 10 }}>{subtitle}</p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '4px 12px', fontSize: '0.72rem', color: C.dim }}>
            📅 Обновлено: {updated}
          </div>
        </div>

        {/* Разделы */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {sections.map((s, i) => (
            <div key={i} style={{ borderTop: `1px solid ${C.border}`, padding: '28px 0' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: C.accent, marginBottom: 14, letterSpacing: '-0.01em' }}>
                <span style={{ color: C.green, marginRight: 10, fontFamily: 'monospace', fontSize: '0.78rem' }}>{String(i + 1).padStart(2, '0')}.</span>
                {s.title}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {s.content.map((para, pi) => (
                  <p key={pi} style={{ fontSize: '0.88rem', color: C.dim, lineHeight: 1.8, margin: 0 }}>{para}</p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Контакты */}
        <div style={{ marginTop: 32, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '1.1rem' }}>📬</span>
          <p style={{ fontSize: '0.82rem', color: C.dim, lineHeight: 1.6, margin: 0 }}>
            По вопросам, связанным с данным документом, обращайтесь на{' '}
            <a href="mailto:legal@privax.ru" style={{ color: C.green, textDecoration: 'none', fontWeight: 600 }}>legal@privax.ru</a>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
