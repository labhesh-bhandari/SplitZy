import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: 16,
        color: 'var(--text-secondary)',
      }}>
        <div
          className="spinner spinner-brand"
          style={{ width: 40, height: 40, borderWidth: 4 }}
        />
        <p>Loading SplitZy…</p>
      </div>
    )
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />
}
