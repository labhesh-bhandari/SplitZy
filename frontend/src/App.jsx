import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar/Navbar'
import LoginPage from './pages/Auth/LoginPage'
import SignupPage from './pages/Auth/SignupPage'
import DashboardPage from './pages/Dashboard/DashboardPage'
import GroupDetailPage from './pages/GroupDetail/GroupDetailPage'
import SettlementsPage from './pages/Settlements/SettlementsPage'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            gutter={10}
            toastOptions={{
              duration: 3500,
              style: {
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-light)',
                borderRadius: '16px',
                fontSize: '14px',
                fontWeight: '500',
                fontFamily: 'Inter, sans-serif',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
                padding: '14px 18px',
                maxWidth: '380px',
                lineHeight: '1.5',
              },
              success: {
                iconTheme: { primary: '#10b981', secondary: 'white' },
                style: {
                  background: 'var(--bg-card)',
                  borderLeft: '4px solid #10b981',
                  color: 'var(--text-primary)',
                },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: 'white' },
                duration: 4500,
                style: {
                  background: 'var(--bg-card)',
                  borderLeft: '4px solid #ef4444',
                  color: 'var(--text-primary)',
                },
              },
              loading: {
                iconTheme: { primary: '#7c3aed', secondary: 'var(--bg-tertiary)' },
                style: {
                  background: 'var(--bg-card)',
                  borderLeft: '4px solid #7c3aed',
                  color: 'var(--text-primary)',
                },
              },
            }}
          />

          <Routes>
            {/* Public routes - no navbar */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Protected routes - with navbar */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                    <Navbar />
                    <Routes>
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/groups/:groupId" element={<GroupDetailPage />} />
                      <Route path="/groups/:groupId/settlements" element={<SettlementsPage />} />
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
