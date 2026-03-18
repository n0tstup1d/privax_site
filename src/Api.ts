/**
 * Api.ts — все запросы к бэкенду.
 *
 * Токены теперь в httpOnly cookies — JS их не видит вообще.
 * Кука ставится бэкендом при login/register/refresh.
 *
 * Главное изменение: credentials: 'include' в каждом запросе —
 * браузер автоматически прикладывает cookie к запросу.
 * Никакого localStorage, никаких токенов в JS.
 */

// В dev — Vite proxy (/api → localhost:8000), cookies работают как same-origin
// В prod — задай VITE_API_URL= в .env если бэкенд на другом домене
const API = import.meta.env.VITE_API_URL || '/api'

export { API }


// ─── Refresh — один промис на все параллельные вызовы ────────────────

let _refreshing: Promise<boolean> | null = null

export async function doRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',   // браузер сам прикладывает refresh_token cookie
    })
    // Бэкенд сам обновит cookies при успехе
    return res.ok
  } catch {
    return false
  }
}

export async function ensureAuth(): Promise<boolean> {
  // Сначала проверяем живую сессию через /auth/me
  // Если 200 — токен валиден, не нужно рефрешить
  // Если 401 — токен истёк, делаем refresh
  try {
    const check = await fetch(`${API}/auth/me`, {
      method: 'GET',
      credentials: 'include',
    })
    if (check.ok) return true
    if (check.status !== 401) return false
  } catch {
    return false
  }

  // access_token истёк — рефрешим (один промис на всех)
  if (!_refreshing) {
    _refreshing = doRefresh().finally(() => { _refreshing = null })
  }
  return _refreshing
}


// ─── apiFetch — единая точка всех запросов к API ────────────────────

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const url = path.startsWith('http') ? path : `${API}${path}`

  // credentials: 'include' — браузер прикладывает httpOnly cookie автоматически
  // НЕ нужно руками добавлять Authorization header
  const reqInit: RequestInit = {
    ...init,
    credentials: 'include',
  }

  let res = await fetch(url, reqInit)

  // 401 — access_token истёк, пробуем refresh
  if (res.status === 401) {
    if (!_refreshing) {
      _refreshing = doRefresh().finally(() => { _refreshing = null })
    }
    const ok = await _refreshing

    if (ok) {
      // Повторяем оригинальный запрос — бэкенд уже поставил новый access_token cookie
      res = await fetch(url, reqInit)
    } else {
      // refresh тоже истёк — чистим флаг и редиректим на логин
      localStorage.removeItem('logged_in')
      window.location.href = '/login'
    }
  }

  return res
}


// ─── Совместимость — старые функции работы с токенами ────────────────
// Оставлены пустыми чтобы не ломать код который их вызывает.
// Токены теперь в cookies — JS с ними не работает.

/** @deprecated Токены в httpOnly cookies, localStorage не используется */
export const getToken   = () => ''
/** @deprecated */
export const getRefresh = () => ''
/** @deprecated */
export const saveTokens = (_a: string, _r: string) => {}
/** @deprecated */
export const clearTokens = () => {}
/** @deprecated */
export const isAccessTokenValid = () => true
/** @deprecated */
export const isTokenValid = isAccessTokenValid