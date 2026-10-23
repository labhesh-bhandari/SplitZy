import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, User, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { authAPI } from '../../services/api'
import Logo from '../../components/Logo/Logo'
import styles from './Auth.module.css'

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      const res = await authAPI.signup(form)
      login(res.data.access_token, res.data.user)
      toast.success(`Welcome to SplitZy, ${res.data.user.name}! 🎉`)
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Signup failed. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.blob1} />
      <div className={styles.blob2} />
      <div className={styles.blob3} />

      <div className={styles.authContainer}>
        {/* Left decorative panel */}
        <div className={styles.leftPanel}>
          <div className={styles.particles}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`${styles.particle} ${styles[`p${i + 1}`]}`} />
            ))}
          </div>

          <div className={styles.leftContent}>
            {/* ← pass light so text is white on the purple bg */}
            <Logo size={56} showText={true} animate={true} light={true} />
            <h1 className={styles.leftTitle}>
              Split expenses,<br />
              <span className={styles.leftTitleAccent}>not friendships</span>
            </h1>
            <p className={styles.leftSubtitle}>
              Track shared expenses and settle debts effortlessly. Never argue over money again.
            </p>
            <div className={styles.features}>
              {[
                { icon: '⚡', text: 'Instant settlement calculation' },
                { icon: '🧮', text: 'Smart debt minimization' },
                { icon: '🔒', text: 'Secure & private' },
              ].map((f, i) => (
                <div key={i} className={`${styles.featureItem} animate-fadeInUp delay-${i + 2}`}>
                  <span className={styles.featureIcon}>{f.icon}</span>
                  <span>{f.text}</span>
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
                <Sparkles size={13} />
                Free to use
              </div>
              <h2 className={styles.formTitle}>Create your account</h2>
              <p className={styles.formSubtitle}>
                Already have an account?{' '}
                <Link to="/login" className={styles.formLink}>Sign in</Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className="form-group">
                <label className="form-label" htmlFor="name">Full Name</label>
                <div className={styles.inputWrapper}>
                  <User size={16} className={styles.inputIcon} />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className={`form-input ${styles.paddedInput}`}
                    placeholder="Your full name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    autoFocus
                  />
                </div>
              </div>

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
                    placeholder="Min 6 characters"
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
                id="signup-submit-btn"
                type="submit"
                className={`btn btn-primary btn-lg ${styles.submitBtn}`}
                disabled={loading}
              >
                {loading ? (
                  <><div className="spinner" /> Creating account…</>
                ) : (
                  <>Create Account <ArrowRight size={18} /></>
                )}
              </button>
            </form>

            <p className={styles.terms}>
              By signing up, you agree to our{' '}
              <span className={styles.formLink}>Terms of Service</span> and{' '}
              <span className={styles.formLink}>Privacy Policy</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
