import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'

const theme = {
  bg: '#e1e3e4',
  navbar: '#16191b',
  card: '#1c1f22',
  accent: '#ffffff',
  secondary: '#3d4449',
  dim: '#70797d',
}

function Home() {
  return (
    <div style={{background: theme.bg, minHeight: '100vh', fontFamily: 'system-ui, sans-serif', color: theme.accent}}>

      <nav style={{
        background: theme.navbar,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 32px',
        height: 68,
        borderBottom: `1px solid ${theme.secondary}`,
      }}>
        <span style={{fontSize: '1.3rem', fontWeight: 800, color: theme.accent, letterSpacing: '0.02em'}}>
          PRIVAX
        </span>

        <div style={{display: 'flex', gap: 32}}>
          {['Возможности', 'Тарифы'].map(link => (
            <a key={link} href="#" style={{fontSize: '0.85rem', color: theme.dim, textDecoration: 'none', fontWeight: 500}}
              onMouseEnter={e => e.currentTarget.style.color = theme.accent}
              onMouseLeave={e => e.currentTarget.style.color = theme.dim}>
              {link}
            </a>
          ))}
        </div>

        <a href="/login" style={{
          background: theme.accent,
          color: theme.navbar,
          border: 'none',
          padding: '10px 24px',
          borderRadius: 12,
          fontWeight: 700,
          fontSize: '0.75rem',
          letterSpacing: '0.1em',
          textDecoration: 'none',
          cursor: 'pointer',
        }}>
          ВОЙТИ
        </a>
      </nav>

      <main style={{maxWidth: 480, margin: '0 auto', padding: '40px 16px', display: 'flex', flexDirection: 'column', gap: 16}}>

        <div style={{background: theme.navbar, borderRadius: 28, padding: '40px 32px', border: `1px solid ${theme.secondary}`, textAlign: 'center'}}>
          <div style={{fontSize: '0.65rem', color: theme.dim, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12}}>
            Personal Encryption
          </div>
          <h1 style={{fontSize: '2.2rem', fontWeight: 800, color: theme.accent, lineHeight: 1.1, marginBottom: 16}}>
            Ваши данные —<br/>только ваши
          </h1>
          <p style={{fontSize: '0.95rem', color: theme.dim, lineHeight: 1.6, marginBottom: 24}}>
            Privax шифрует весь ваш трафик и скрывает цифровой след.
          </p>
          <a href="/login" style={{
            display: 'block',
            background: theme.accent,
            color: theme.navbar,
            borderRadius: 16,
            padding: '18px 0',
            fontWeight: 800,
            fontSize: '0.9rem',
            textDecoration: 'none',
            letterSpacing: '0.15em',
          }}>
            НАЧАТЬ ЗАЩИТУ
          </a>
        </div>

        <div style={{background: theme.card, borderRadius: 28, border: `1px solid ${theme.secondary}`, overflow: 'hidden'}}>
          {[
            {icon: '🔒', title: 'Шифрование', desc: 'AES-256 Military Grade'},
            {icon: '👁️', title: 'Анонимность', desc: 'Без логов и слежки'},
            {icon: '⚡', title: 'Скорость', desc: 'До 1 Гбит/с'},
          ].map((item, i, arr) => (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 20, padding: '20px 24px', borderBottom: i < arr.length - 1 ? `1px solid ${theme.secondary}` : 'none'}}>
              <span style={{fontSize: '1.4rem'}}>{item.icon}</span>
              <div>
                <div style={{fontSize: '0.9rem', fontWeight: 600, color: theme.accent}}>{item.title}</div>
                <div style={{fontSize: '0.8rem', color: theme.dim}}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{background: theme.card, borderRadius: 28, padding: '24px 28px', border: `1px solid ${theme.secondary}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <div style={{fontSize: '0.7rem', color: theme.dim, textTransform: 'uppercase', fontWeight: 600}}>Тариф</div>
            <div style={{fontSize: '1.4rem', fontWeight: 800, color: theme.accent}}>299 ₽<span style={{fontSize: '0.85rem', fontWeight: 400, color: theme.dim}}>/мес</span></div>
          </div>
          <button style={{background: 'transparent', border: `1px solid ${theme.accent}`, color: theme.accent, borderRadius: 14, padding: '12px 20px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'}}>
            Выбрать →
          </button>
        </div>

      </main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App