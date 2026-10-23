import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Calculator, CheckCircle, AlertTriangle, RefreshCw, Users } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { settlementsAPI, groupsAPI } from '../../services/api'
import styles from './SettlementsPage.module.css'

export default function SettlementsPage() {
  const { groupId } = useParams()
  const navigate = useNavigate()

  const [group, setGroup] = useState(null)
  const [settlement, setSettlement] = useState(null)
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)

  const fetchData = async () => {
    try {
      const groupRes = await groupsAPI.getOne(groupId)
      setGroup(groupRes.data)

      // Try to get existing settlement
      try {
        const settlementRes = await settlementsAPI.get(groupId)
        setSettlement(settlementRes.data)
      } catch (e) {
        if (e.response?.status !== 404) throw e
        // No settlement yet - will calculate
      }
    } catch (err) {
      toast.error('Failed to load data')
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [groupId])

  // Auto calculate if no settlement or stale
  useEffect(() => {
    if (!loading && group) {
      if (!settlement || settlement.is_stale) {
        handleCalculate()
      }
    }
  }, [loading])

  const handleCalculate = async () => {
    setCalculating(true)
    try {
      const res = await settlementsAPI.calculate(groupId)
      setSettlement(res.data)
      // Update group status
      const groupRes = await groupsAPI.getOne(groupId)
      setGroup(groupRes.data)
      toast.success('Settlements calculated! ✨')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Calculation failed'
      toast.error(msg)
    } finally {
      setCalculating(false)
    }
  }

  const getAvatarColor = (name) => {
    const colors = [
      'linear-gradient(135deg, #7c3aed, #2563eb)',
      'linear-gradient(135deg, #2563eb, #06b6d4)',
      'linear-gradient(135deg, #06b6d4, #10b981)',
      'linear-gradient(135deg, #f59e0b, #ef4444)',
      'linear-gradient(135deg, #10b981, #06b6d4)',
      'linear-gradient(135deg, #8b5cf6, #ec4899)',
    ]
    const idx = name.charCodeAt(0) % colors.length
    return colors[idx]
  }

  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.loadingSpinner}>
          <div className="spinner spinner-brand" style={{ width: 40, height: 40, borderWidth: 4 }} />
          <p>Loading settlements…</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <button
            className={`btn btn-ghost ${styles.backBtn}`}
            onClick={() => navigate(`/groups/${groupId}`)}
          >
            <ArrowLeft size={16} />
            Back to Group
          </button>

          <div className={styles.pageTitle}>
            <div className={styles.titleIcon}>
              <Calculator size={28} />
            </div>
            <div>
              <h1 className={styles.title}>Final Settlements</h1>
              <p className={styles.subtitle}>{group?.title}</p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.body}>
        {calculating ? (
          <div className={styles.calculating}>
            <div className={styles.calcAnimation}>
              <div className={styles.calcIcon}>
                <Calculator size={40} />
              </div>
              <div className={styles.calcDots}>
                <span /><span /><span />
              </div>
            </div>
            <h3>Calculating optimal settlements…</h3>
            <p>Using smart debt minimization algorithm</p>
          </div>
        ) : !settlement ? (
          <div className={styles.noSettlement}>
            <Calculator size={48} />
            <h3>No settlements yet</h3>
            <p>Click below to calculate the optimal settlements</p>
            <button className="btn btn-primary btn-lg" onClick={handleCalculate}>
              <Calculator size={18} />
              Calculate Now
            </button>
          </div>
        ) : (
          <>
            {/* Status banner */}
            {settlement.is_stale && (
              <div className={styles.staleBanner}>
                <AlertTriangle size={18} />
                <div>
                  <strong>Expenses have been modified</strong>
                  <p>These settlements may be outdated. Recalculate for accurate results.</p>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleCalculate}
                  disabled={calculating}
                >
                  <RefreshCw size={14} />
                  Recalculate
                </button>
              </div>
            )}

            {/* Summary */}
            <div className={styles.summaryCard}>
              <div className={styles.summaryIconWrapper}>
                <CheckCircle size={20} />
              </div>
              <div>
                <h3>Settlement Summary</h3>
                <p>
                  {settlement.transactions.length === 0
                    ? 'Everyone is settled! No payments needed. 🎉'
                    : `${settlement.transactions.length} transaction${settlement.transactions.length !== 1 ? 's' : ''} needed to settle all debts`}
                </p>
              </div>
              <div className={styles.calcTime}>
                Calculated {new Date(settlement.calculated_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>

            {/* Transactions */}
            {settlement.transactions.length === 0 ? (
              <div className={styles.allSettled}>
                <div className={styles.confetti}>🎊</div>
                <h2>All Settled Up!</h2>
                <p>Everyone paid their fair share. No transactions needed.</p>
              </div>
            ) : (
              <div className={styles.transactionsList}>
                <h2 className={styles.transTitle}>
                  <Users size={18} /> Who pays whom
                </h2>
                {settlement.transactions.map((txn, idx) => (
                  <div
                    key={idx}
                    className={`${styles.transactionCard} animate-fadeInUp`}
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className={styles.transIndex}>{idx + 1}</div>

                    {/* From person */}
                    <div className={styles.personBlock}>
                      <div
                        className={styles.personAvatar}
                        style={{ background: getAvatarColor(txn.from_member) }}
                      >
                        {txn.from_member.charAt(0).toUpperCase()}
                      </div>
                      <div className={styles.personInfo}>
                        <span className={styles.personName}>{txn.from_member}</span>
                        <span className={styles.personRole}>Pays</span>
                      </div>
                    </div>

                    {/* Amount arrow */}
                    <div className={styles.arrowBlock}>
                      <div className={styles.amountBubble}>
                        ₹{txn.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </div>
                      <ArrowRight className={styles.arrowIcon} size={24} />
                    </div>

                    {/* To person */}
                    <div className={styles.personBlock}>
                      <div
                        className={styles.personAvatar}
                        style={{ background: getAvatarColor(txn.to_member) }}
                      >
                        {txn.to_member.charAt(0).toUpperCase()}
                      </div>
                      <div className={styles.personInfo}>
                        <span className={styles.personName}>{txn.to_member}</span>
                        <span className={styles.personRole}>Receives</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recalculate button */}
            <div className={styles.actions}>
              <button
                id="recalculate-btn"
                className="btn btn-secondary"
                onClick={handleCalculate}
                disabled={calculating}
              >
                <RefreshCw size={15} />
                Recalculate
              </button>
              <button
                className="btn btn-primary"
                onClick={() => navigate(`/groups/${groupId}`)}
              >
                Back to Expenses
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
