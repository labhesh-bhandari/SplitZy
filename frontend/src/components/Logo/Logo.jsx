import styles from './Logo.module.css'

export default function Logo({ size = 36, showText = true, animate = true, light = false }) {
  return (
    <div className={styles.logoWrapper} style={{ '--size': `${size}px` }}>
      <div className={`${styles.logoIcon} ${animate ? styles.animated : ''}`}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="logoGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={light ? '#e0c4ff' : '#7c3aed'} />
              <stop offset="50%" stopColor={light ? '#93c5fd' : '#2563eb'} />
              <stop offset="100%" stopColor={light ? '#67e8f9' : '#06b6d4'} />
            </linearGradient>
            <linearGradient id="logoGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#67e8f9" />
              <stop offset="100%" stopColor={light ? '#e0c4ff' : '#7c3aed'} />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background circle */}
          <circle cx="50" cy="50" r="46" fill="url(#logoGrad1)" opacity={light ? 0.25 : 0.12} />

          {/* S letter path */}
          <path
            d="M35 30 C35 22 65 22 65 35 C65 42 50 45 50 50 C50 55 65 58 65 65 C65 78 35 78 35 70"
            stroke="url(#logoGrad1)"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            filter="url(#glow)"
            className={styles.sPath}
          />

          {/* Lightning bolt */}
          <path
            d="M58 18 L42 52 L55 52 L42 82"
            stroke="url(#logoGrad2)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            filter="url(#glow)"
            className={styles.boltPath}
          />

          {/* Orbiting dot */}
          <circle cx="50" cy="50" r="3.5" fill="#67e8f9" className={styles.orbitDot} />

          {/* Decorative dots */}
          <circle cx="22" cy="50" r="2.5" fill={light ? '#e0c4ff' : '#7c3aed'} opacity="0.7" className={styles.dot1} />
          <circle cx="78" cy="50" r="2.5" fill="#67e8f9" opacity="0.7" className={styles.dot2} />
        </svg>
      </div>

      {showText && (
        <span className={`${styles.logoText} ${light ? styles.logoTextLight : ''}`}>
          Split<span className={`${styles.logoTextAccent} ${light ? styles.logoTextAccentLight : ''}`}>Zy</span>
        </span>
      )}
    </div>
  )
}
