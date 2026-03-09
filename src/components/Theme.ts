export const C = {
  bg:        '#0d0f10',
  surface:   '#111416',
  card:      '#161a1d',
  border:    '#242a2e',
  borderHi:  '#2e3840',
  accent:    '#ffffff',
  dim:       '#8a9aaa',
  dimHi:     '#b0c0cc',
  green:     '#00e5a0',
  greenDim:  'rgba(0,229,160,0.1)',
  greenGlow: 'rgba(0,229,160,0.25)',
  red:       '#ff5e5e',
  redDim:    'rgba(255,94,94,0.1)',
}

export function isTokenValid(): boolean {
  const token = localStorage.getItem('access_token')
  if (!token) return false
  try {
    const p = JSON.parse(atob(token.split('.')[1]))
    return p.exp > Math.floor(Date.now() / 1000)
  } catch { return false }
}