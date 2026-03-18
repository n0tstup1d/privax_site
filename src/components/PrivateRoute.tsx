import { useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { ensureAuth } from '../Api'

type State = 'checking' | 'ok' | 'redirect'

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [state, setState] = useState<State>('checking')

  useEffect(() => {
    ensureAuth().then(ok => setState(ok ? 'ok' : 'redirect'))
  }, [])

  if (state === 'checking') {
    // Минимальная заглушка пока проверяем/обновляем токен
    return (
      <div style={{
        background: '#0d0f10', minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ color: '#6b7a84', fontSize: '0.85rem' }}>...</div>
      </div>
    )
  }

  if (state === 'redirect') {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}