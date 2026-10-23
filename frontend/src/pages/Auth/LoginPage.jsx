import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Zap } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { authAPI } from '../../services/api'
import Logo from '../../components/Logo/Logo'
import styles from './Auth.module.css'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authAPI.login(form)
      login(res.data.access_token, res.data.user)
      toast.success(`Welcome back, ${res.data.user.name}! 👋`)
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Check your credentials.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.authPage}>
      {/* Animated background blobs */}
      <div className={styles.blob1} />
      <div className={styles.blob2} />
      <div className={styles.blob3} />

      <div className={styles.authContainer}>
        {/* Left decorative panel */}
        <div className={styles.leftPanel}>
          {/* Floating particles */}
          <div className={styles.particles}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`${styles.particle} ${styles[`p${i + 1}`]}`} />
            ))}
          </div>

          <div className={styles.leftContent}>
            {/* ← pass light so text is white on the purple bg */}
            <Logo size={56} showText={true} animate={true} light={true} />
            <h1 className={styles.leftTitle}>
              Welcome back to<br />
              <span className={styles.leftTitleAccent}>SplitZy</span>
            </h1>
            <p className={styles.leftSubtitle}>
              Your groups and expenses are waiting. Pick up right where you left off.
            </p>
            <div className={styles.statsRow}>
              {[
                { value: '10k+', label: 'Happy users' },
                { value: '50k+', label: 'Expenses tracked' },
                { value: '₹1M+', label: 'Settled' },
              ].map((s, i) => (
                <div key={i} className={`${styles.statItem} animate-fadeInUp delay-${i + 2}`}>
                  <span className={styles.statValue}>{s.value}</span>
                  <span className={styles.statLabel}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className={styles.rightPanel}>
          <div className={`${styles.formCard} animate-scaleIn`}>
            <div className={styles.formHeader}>
              <div className={styles.formBadge}>
                <Zap size={13} />
                Secure login
              </div>
              <h2 className={styles.formTitle}>Sign in to SplitZy</h2>
              <p className={styles.formSubtitle}>
                Don't have an account?{' '}
                <Link to="/signup" className={styles.formLink}>Sign up free</Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <div className={styles.inputWrapper}>
                  <Mail size={16} className={styles.inputIcon} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className={`form-input ${styles.paddedInput}`}
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <div className={styles.inputWrapper}>
                  <Lock size={16} className={styles.inputIcon} />
                  <input
                    id="password"
                    name="password"
                    type={showPwd ? 'text' : 'password'}
                    className={`form-input ${styles.paddedInput} ${styles.passwordInput}`}
                    placeholder="Your password"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPwd((p) => !p)}
                    aria-label={showPwd ? 'Hide password' : 'Show password'}
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                id="login-submit-btn"
                type="submit"
                className={`btn btn-primary btn-lg ${styles.submitBtn}`}
                disabled={loading}
              >
                {loading ? (
                  <><div className="spinner" /> Signing in…</>
                ) : (
                  <>Sign In <ArrowRight size={18} /></>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
