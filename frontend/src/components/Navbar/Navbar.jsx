import { Link, useNavigate } from 'react-router-dom'
import { Sun, Moon, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import Logo from '../Logo/Logo'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth()
  const { toggleTheme, isDark } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className={styles.navbar}>
      <div className={styles.container}>
        <Link to={isAuthenticated ? '/dashboard' : '/'} className={styles.brand}>
          <Logo size={40} showText={true} animate={true} />
        </Link>

        <div className={styles.actions}>
          {/* ── Prominent theme toggle switch ── */}
          <button
            id="theme-toggle-btn"
            className={styles.themeToggle}
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            <span className={`${styles.themeToggleTrack} ${isDark ? styles.trackDark : ''}`}>
              <span className={`${styles.themeToggleThumb} ${isDark ? styles.thumbDark : ''}`}>
                {isDark ? <Moon size={12} /> : <Sun size={12} />}
              </span>
            </span>
            <span className={styles.themeLabel}>
              {isDark ? 'Dark' : 'Light'}
            </span>
          </button>

          {isAuthenticated ? (
            <div className={styles.userArea}>
              <div className={styles.userInfo}>
                <div className={styles.avatar}>
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className={styles.userName}>{user?.name}</span>
              </div>
              <button
                id="logout-btn"
                className={`btn btn-ghost ${styles.logoutBtn}`}
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className={styles.authLinks}>
              <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Get Started</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
