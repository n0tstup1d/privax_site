import { Navigate, useLocation } from 'react-router-dom'

function isTokenValid(): boolean {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) return false
    const p = JSON.parse(atob(token.split('.')[1]))
    return p.exp > Math.floor(Date.now() / 1000)
  } catch { return false }
}

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  if (!isTokenValid()) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  return <>{children}</>
}