const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ─── Токены ─────────────────────────────────────────────────────────
export const getToken   = () => localStorage.getItem('access_token')  || ''
export const getRefresh = () => localStorage.getItem('refresh_token') || ''
export const saveTokens = (a: string, r: string) => {
  localStorage.setItem('access_token',  a)
  localStorage.setItem('refresh_token', r)
}
export const clearTokens = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}
export function isTokenValid(): boolean {
  try {
    const p = JSON.parse(atob(getToken().split('.')[1]))
    return p.exp > Math.floor(Date.now() / 1000)
  } catch { return false }
}

// ─── Refresh — один промис на все параллельные запросы ───────────────
let _refreshing: Promise<boolean> | null = null

async function doRefresh(): Promise<boolean> {
  const rt = getRefresh()
  if (!rt) return false
  try {
    const res = await fetch(
      `${API}/auth/refresh?refresh_token=${encodeURIComponent(rt)}`,
      { method: 'POST' }
    )
    if (!res.ok) { clearTokens(); return false }
    const data = await res.json()
    saveTokens(data.access_token, data.refresh_token)
    return true
  } catch {
    clearTokens()
    return false
  }
}

// ─── apiFetch — единая точка всех запросов к API ────────────────────
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const url = path.startsWith('http') ? path : `${API}${path}`

  const withAuth = (): RequestInit => ({
    ...init,
    headers: { ...(init.headers || {}), Authorization: `Bearer ${getToken()}` },
  })

  let res = await fetch(url, withAuth())

  if (res.status === 401) {
    // Запускаем refresh только один раз, даже если параллельных запросов несколько
    if (!_refreshing) {
      _refreshing = doRefresh().finally(() => { _refreshing = null })
    }
    const ok = await _refreshing

    if (ok) {
      // Повторяем оригинальный запрос с новым токеном
      res = await fetch(url, withAuth())
    } else {
      // Refresh тоже 401 — выгоняем на логин
      clearTokens()
      window.location.href = '/login'
    }
  }

  return res
}

export { API }