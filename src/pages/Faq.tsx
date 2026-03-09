import { useState, useEffect } from 'react'
import { apiFetch, getToken, isTokenValid, saveTokens, clearTokens, API } from '../api'
import { useNavigate, useParams } from 'react-router-dom'
import NavbarPublic from '../components/NavbarPublic'
import NavbarAuth from '../components/NavbarAuth'
import Footer from '../components/Footer'

const C = {
  bg: '#0d0f10', surface: '#111416', card: '#161a1d',
  border: '#242a2e', borderHi: '#2e3840', accent: '#ffffff',
  dim: '#8a9aaa', dimHi: '#b0c0cc',
  green: '#00e5a0', greenDim: 'rgba(0,229,160,0.1)', greenGlow: 'rgba(0,229,160,0.25)',
  red: '#ff5e5e',
}



interface Article {
  id: number
  title: string
  slug: string
  category: string
  content: string
  is_published: boolean
  created_at: string
  updated_at: string
  images: { id: number; filename: string; mime_type: string; url: string }[]
}

// ─── Markdown парсер ─────────────────────────────────────────────────
function parseMarkdown(md: string, images: {id: number; url: string; filename: string}[]): React.ReactNode[] {
  const lines = md.split('\n')
  const nodes: React.ReactNode[] = []
  let i = 0
  let key = 0

  const inlineKey = () => key++

  function parseInline(text: string): React.ReactNode[] {
    const parts: React.ReactNode[] = []
    // Regex для: **bold**, *italic*, `code`, ![alt](url_or_img_id), [link](url)
    const re = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))/g
    let last = 0
    let m: RegExpExecArray | null

    while ((m = re.exec(text)) !== null) {
      if (m.index > last) parts.push(text.slice(last, m.index))

      if (m[1]) { // **bold**
        parts.push(<strong key={inlineKey()} style={{ color: C.accent, fontWeight: 700 }}>{m[2]}</strong>)
      } else if (m[3]) { // *italic*
        parts.push(<em key={inlineKey()} style={{ color: C.dimHi }}>{m[4]}</em>)
      } else if (m[5]) { // `code`
        parts.push(<code key={inlineKey()} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 5, padding: '1px 7px', fontSize: '0.85em', color: C.green, fontFamily: 'monospace' }}>{m[6]}</code>)
      } else if (m[7]) { // [link](url)
        parts.push(<a key={inlineKey()} href={m[9]} target="_blank" rel="noreferrer" style={{ color: C.green, textDecoration: 'underline' }}>{m[8]}</a>)
      }
      last = m.index + m[0].length
    }
    if (last < text.length) parts.push(text.slice(last))
    return parts
  }

  while (i < lines.length) {
    const line = lines[i]

    // Заголовки
    if (line.startsWith('### ')) {
      nodes.push(<h3 key={key++} style={{ fontSize: '1rem', fontWeight: 700, color: C.accent, margin: '24px 0 8px' }}>{line.slice(4)}</h3>)
    } else if (line.startsWith('## ')) {
      nodes.push(<h2 key={key++} style={{ fontSize: '1.25rem', fontWeight: 800, color: C.accent, margin: '32px 0 10px', paddingBottom: 8, borderBottom: `1px solid ${C.border}` }}>{line.slice(3)}</h2>)
    } else if (line.startsWith('# ')) {
      nodes.push(<h1 key={key++} style={{ fontSize: '1.5rem', fontWeight: 900, color: C.accent, margin: '0 0 16px' }}>{line.slice(2)}</h1>)

    // Блок кода ```
    } else if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]); i++
      }
      nodes.push(
        <div key={key++} style={{ margin: '16px 0', borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.border}` }}>
          {lang && <div style={{ background: C.card, padding: '6px 14px', fontSize: '0.72rem', color: C.dim, borderBottom: `1px solid ${C.border}`, fontFamily: 'monospace' }}>{lang}</div>}
          <pre style={{ background: '#0a0c0d', margin: 0, padding: '16px', overflowX: 'auto', fontSize: '0.85rem', color: C.dimHi, fontFamily: 'monospace', lineHeight: 1.6 }}>
            <code>{codeLines.join('\n')}</code>
          </pre>
        </div>
      )

    // Картинка из БД: ![alt](img:ID)
    } else if (/^!\[.*\]\(img:\d+\)/.test(line)) {
      const m = line.match(/^!\[(.*)\]\(img:(\d+)\)/)
      if (m) {
        const imgId = Number(m[2])
        const imgMeta = images.find(i => i.id === imgId)
        if (imgMeta) nodes.push(
          <figure key={key++} style={{ margin: '20px 0', textAlign: 'center' }}>
            <img
              src={`${API}${imgMeta.url}`}
              alt={m[1]}
              style={{ maxWidth: '100%', borderRadius: 12, border: `1px solid ${C.border}` }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            {m[1] && <figcaption style={{ marginTop: 8, fontSize: '0.78rem', color: C.dim }}>{m[1]}</figcaption>}
          </figure>
        )
      }

    // Внешняя картинка: ![alt](https://...)
    } else if (/^!\[.*\]\(https?:\/\//.test(line)) {
      const m = line.match(/^!\[(.*)\]\((https?:\/\/[^)]+)\)/)
      if (m) {
        nodes.push(
          <figure key={key++} style={{ margin: '20px 0', textAlign: 'center' }}>
            <img src={m[2]} alt={m[1]} style={{ maxWidth: '100%', borderRadius: 12, border: `1px solid ${C.border}` }} />
            {m[1] && <figcaption style={{ marginTop: 8, fontSize: '0.78rem', color: C.dim }}>{m[1]}</figcaption>}
          </figure>
        )
      }

    // > цитата / info-блок
    } else if (line.startsWith('> ')) {
      nodes.push(
        <div key={key++} style={{ margin: '16px 0', padding: '14px 18px', background: C.greenDim, borderLeft: `3px solid ${C.green}`, borderRadius: '0 10px 10px 0' }}>
          <p style={{ margin: 0, fontSize: '0.88rem', color: C.dimHi, lineHeight: 1.65 }}>{parseInline(line.slice(2))}</p>
        </div>
      )

    // ⚠ предупреждение
    } else if (line.startsWith('⚠ ') || line.startsWith('⚠️ ')) {
      const text = line.replace(/^⚠️?\s/, '')
      nodes.push(
        <div key={key++} style={{ margin: '16px 0', padding: '14px 18px', background: 'rgba(245,166,35,0.08)', borderLeft: '3px solid #f5a623', borderRadius: '0 10px 10px 0' }}>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#f5a623', lineHeight: 1.65 }}>⚠ {parseInline(text)}</p>
        </div>
      )

    // Список - / *
    } else if (/^[-*] /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(lines[i].slice(2)); i++
      }
      nodes.push(
        <ul key={key++} style={{ margin: '12px 0', paddingLeft: 0, listStyle: 'none' }}>
          {items.map((item, idx) => (
            <li key={idx} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8, fontSize: '0.9rem', color: C.dimHi, lineHeight: 1.6 }}>
              <span style={{ color: C.green, fontWeight: 800, marginTop: 1, flexShrink: 0 }}>✓</span>
              <span>{parseInline(item)}</span>
            </li>
          ))}
        </ul>
      )
      continue

    // Нумерованный список
    } else if (/^\d+\. /.test(line)) {
      const items: string[] = []
      let num = 1
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, '')); i++
      }
      nodes.push(
        <ol key={key++} style={{ margin: '12px 0', paddingLeft: 0, listStyle: 'none', counterReset: 'faq-ol' }}>
          {items.map((item, idx) => (
            <li key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 8, fontSize: '0.9rem', color: C.dimHi, lineHeight: 1.6 }}>
              <span style={{ color: C.green, fontWeight: 800, minWidth: 20, flexShrink: 0 }}>{idx + 1}.</span>
              <span>{parseInline(item)}</span>
            </li>
          ))}
        </ol>
      )
      continue

    // Горизонтальная линия
    } else if (/^---+$/.test(line.trim())) {
      nodes.push(<hr key={key++} style={{ border: 'none', borderTop: `1px solid ${C.border}`, margin: '28px 0' }} />)

    // Пустая строка
    } else if (line.trim() === '') {
      nodes.push(<div key={key++} style={{ height: 8 }} />)

    // Обычный текст
    } else {
      nodes.push(
        <p key={key++} style={{ margin: '0 0 12px', fontSize: '0.9rem', color: C.dimHi, lineHeight: 1.75 }}>
          {parseInline(line)}
        </p>
      )
    }
    i++
  }
  return nodes
}

// ─── Компонент просмотра статьи ──────────────────────────────────────
function ArticleView({ article, onBack }: { article: Article; onBack: () => void }) {
  const date = new Date(article.updated_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  return (
    <div style={{ animation: 'fadeUp 0.4s ease both' }}>
      <button onClick={onBack}
        style={{ background: 'none', border: 'none', color: C.dim, fontSize: '0.82rem', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 28, fontFamily: 'inherit' }}
        onMouseEnter={e => e.currentTarget.style.color = C.accent}
        onMouseLeave={e => e.currentTarget.style.color = C.dim}>
        ← Все статьи
      </button>

      <div style={{ marginBottom: 28 }}>
        <span style={{ fontSize: '0.68rem', color: C.green, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', background: C.greenDim, border: `1px solid rgba(0,229,160,0.2)`, borderRadius: 6, padding: '3px 10px' }}>
          {article.category}
        </span>
        <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', fontWeight: 900, color: C.accent, margin: '14px 0 8px', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
          {article.title}
        </h1>
        <div style={{ fontSize: '0.78rem', color: C.dim }}>Обновлено {date}</div>
      </div>

      <div style={{ background: C.surface, borderRadius: 16, padding: 'clamp(20px, 4vw, 36px)', border: `1px solid ${C.border}` }}>
        {parseMarkdown(article.content, article.images || [])}
      </div>
    </div>
  )
}

// ─── Главный компонент ───────────────────────────────────────────────
export default function FaqPage() {
  const navigate = useNavigate()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<Article | null>(null)
  const [search, setSearch]     = useState('')
  const loggedIn = isTokenValid()

  function handleLogout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    navigate('/')
  }

  useEffect(() => {
    apiFetch(`/faq`)
      .then(r => r.ok ? r.json() : [])
      .then(d => setArticles(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Группировка по категориям
  const filtered = articles.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase()) ||
    a.content.toLowerCase().includes(search.toLowerCase())
  )
  const categories = Array.from(new Set(filtered.map(a => a.category)))

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: '"DM Sans", system-ui, sans-serif', color: C.accent, display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .faq-card:hover { border-color: ${C.borderHi} !important; transform: translateY(-2px); }
      `}</style>

      {loggedIn
        ? <NavbarAuth onLogout={handleLogout} />
        : <NavbarPublic active="plans" />}

      <main style={{ flex: 1, maxWidth: 860, margin: '0 auto', width: '100%', padding: 'clamp(32px, 6vw, 64px) 20px 80px' }}>

        {selected ? (
          <ArticleView article={selected} onBack={() => setSelected(null)} />
        ) : (
          <>
            {/* Шапка */}
            <div style={{ textAlign: 'center', marginBottom: 48, animation: 'fadeUp 0.4s ease both' }}>
              <div style={{ fontSize: '0.62rem', color: C.green, letterSpacing: '0.28em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>
                Помощь
              </div>
              <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 900, color: C.accent, letterSpacing: '-0.02em', marginBottom: 12 }}>
                Часто задаваемые вопросы
              </h1>
              <p style={{ fontSize: '0.95rem', color: C.dim, maxWidth: 480, margin: '0 auto 28px' }}>
                Инструкции, ответы и советы по использованию Privax
              </p>

              {/* Поиск */}
              <div style={{ position: 'relative', maxWidth: 400, margin: '0 auto' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.dim, fontSize: '0.9rem', pointerEvents: 'none' }}>🔍</span>
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Поиск по статьям..."
                  style={{ width: '100%', boxSizing: 'border-box', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 16px 12px 40px', color: C.accent, fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
                  onFocus={e => e.target.style.borderColor = C.green}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </div>
            </div>

            {/* Контент */}
            {loading ? (
              <div style={{ textAlign: 'center', color: C.dim, padding: '60px 0' }}>Загрузка...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>🔍</div>
                <div style={{ color: C.dim, fontSize: '0.9rem' }}>
                  {search ? 'Ничего не найдено по запросу' : 'Статьи пока не добавлены'}
                </div>
              </div>
            ) : (
              categories.map(cat => (
                <div key={cat} style={{ marginBottom: 48, animation: 'fadeUp 0.4s ease both' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <span style={{ fontSize: '0.62rem', color: C.green, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>{cat}</span>
                    <div style={{ flex: 1, height: 1, background: C.border }} />
                    <span style={{ fontSize: '0.72rem', color: C.dim }}>{filtered.filter(a => a.category === cat).length} статей</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                    {filtered.filter(a => a.category === cat).map(article => (
                      <div key={article.id}
                        className="faq-card"
                        onClick={() => setSelected(article)}
                        style={{ background: C.card, borderRadius: 16, padding: '22px 20px', border: `1px solid ${C.border}`, cursor: 'pointer', transition: 'border-color 0.2s, transform 0.2s' }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: C.accent, marginBottom: 8, lineHeight: 1.3 }}>
                          {article.title}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: C.dim, lineHeight: 1.55, marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {article.content.replace(/[#*`>!\[\]()]/g, '').slice(0, 120)}...
                        </div>
                        <span style={{ fontSize: '0.75rem', color: C.green, fontWeight: 600 }}>Читать →</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}