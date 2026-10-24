import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, Plus, Edit2, Trash2, Users, Receipt,
  Calculator, TrendingUp, ChevronRight,
  CheckCircle2, RefreshCw, IndianRupee
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { groupsAPI, expensesAPI } from '../../services/api'
import AddEditExpenseModal from '../../components/Modals/AddEditExpenseModal'
import styles from './GroupDetailPage.module.css'

export default function GroupDetailPage() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [group, setGroup] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [expenseModal, setExpenseModal] = useState({ open: false, expense: null })
  const [deletingId, setDeletingId] = useState(null)

  // FIX #2: Guard so the ?addExpense=true auto-open only fires once
  const hasAutoOpened = useRef(false)

  const fetchData = async () => {
    try {
      const [groupRes, expensesRes] = await Promise.all([
        groupsAPI.getOne(groupId),
        expensesAPI.getAll(groupId),
      ])
      setGroup(groupRes.data)
      setExpenses(expensesRes.data)
    } catch (err) {
      toast.error('Failed to load group data')
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [groupId])

  // Auto-open add expense modal once when coming from dashboard "Add Expense" button
  useEffect(() => {
    if (
      !loading &&
      group &&
      searchParams.get('addExpense') === 'true' &&
      !hasAutoOpened.current
    ) {
      hasAutoOpened.current = true
      // Clear the query param so it doesn't re-trigger on re-renders
      setSearchParams({}, { replace: true })
      setExpenseModal({ open: true, expense: null })
    }
  }, [loading]) // Only depend on loading — intentionally not on group/searchParams

  const refreshGroup = () => {
    groupsAPI.getOne(groupId).then((r) => setGroup(r.data))
  }

  const handleExpenseSaved = (savedExpense, isEdit) => {
    if (isEdit) {
      setExpenses((prev) => prev.map((e) => (e.id === savedExpense.id ? savedExpense : e)))
      toast.success('Expense updated! ✅')
    } else {
      setExpenses((prev) => [...prev, savedExpense])
      toast.success('Expense added! 🎉')
    }
    refreshGroup()
    setExpenseModal({ open: false, expense: null })
  }

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Delete this expense?')) return
    setDeletingId(expenseId)
    try {
      await expensesAPI.delete(groupId, expenseId)
      setExpenses((prev) => prev.filter((e) => e.id !== expenseId))
      refreshGroup()
      toast.success('Expense deleted')
    } catch {
      toast.error('Failed to delete expense')
    } finally {
      setDeletingId(null)
    }
  }

  const settlementBtnConfig = () => {
    if (!group) return {}
    switch (group.settlement_status) {
      case 'calculated':
        return { label: 'View Final Settlements', icon: <CheckCircle2 size={16} />, cls: styles.btnSettleView }
      case 'stale':
        return { label: 'Recalculate Settlements', icon: <RefreshCw size={16} />, cls: styles.btnSettleStale }
      default:
        return { label: 'Calculate Final Settlements', icon: <Calculator size={16} />, cls: '' }
    }
  }

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0)
  const btnCfg = settlementBtnConfig()

  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.loadingSpinner}>
          <div className="spinner spinner-brand" style={{ width: 44, height: 44, borderWidth: 4 }} />
          <p>Loading group…</p>
        </div>
      </div>
    )
  }

  if (!group) return null

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <button
            className={`btn btn-ghost ${styles.backBtn}`}
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft size={16} />
            Dashboard
          </button>

          <div className={styles.groupHero}>
            <div className={styles.groupAvatar}>
              {group.title.charAt(0).toUpperCase()}
            </div>
            <div className={styles.groupTitleBlock}>
              <h1 className={styles.groupTitle}>{group.title}</h1>
              <div className={styles.groupMeta}>
                <span className={styles.metaItem}><Users size={14} />{group.members.length} members</span>
                <span className={styles.metaSep}>·</span>
                <span className={styles.metaItem}><Receipt size={14} />{expenses.length} expense{expenses.length !== 1 ? 's' : ''}</span>
              </div>
            </div>

            <div className={styles.totalBox}>
              <IndianRupee size={18} className={styles.totalIcon} />
              <div>
                <span className={styles.totalVal}>
                  {totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
                <span className={styles.totalLbl}>Total Spent</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.body}>
        {/* Members */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}><Users size={17} /> Members</h2>
          <div className={styles.memberChips}>
            {group.members.map((m, i) => (
              <div key={i} className={`${styles.memberChip} animate-fadeInUp`} style={{ animationDelay: `${i * 0.04}s` }}>
                <div className={styles.chipAvatar}>{m.charAt(0).toUpperCase()}</div>
                <span>{m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Expenses */}
        <div className={styles.section}>
          <div className={styles.expensesHeader}>
            <h2 className={styles.sectionTitle}><Receipt size={17} /> Expenses</h2>
            <button
              id="add-expense-modal-btn"
              className="btn btn-primary"
              onClick={() => setExpenseModal({ open: true, expense: null })}
            >
              <Plus size={16} />
              Add Expense
            </button>
          </div>

          {expenses.length === 0 ? (
            <div className={styles.emptyExpenses}>
              <div className={styles.emptyIcon}><Receipt size={36} /></div>
              <p>No expenses yet — add the first one!</p>
              <button
                className="btn btn-primary"
                onClick={() => setExpenseModal({ open: true, expense: null })}
              >
                <Plus size={16} /> Add Expense
              </button>
            </div>
          ) : (
            <div className={styles.expensesList}>
              {expenses.map((expense, idx) => (
                <div
                  key={expense.id}
                  className={`${styles.expenseRow} animate-fadeInUp`}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className={styles.expenseLeft}>
                    <div className={styles.expenseIcon}>
                      {expense.label.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.expenseInfo}>
                      <span className={styles.expenseLabel}>{expense.label}</span>
                      <div className={styles.expenseMeta}>
                        <strong className={styles.payer}>{expense.paid_by}</strong>
                        <span> paid · split among </span>
                        <strong>{expense.split_among.length}</strong>
                      </div>
                      <div className={styles.splitPeople}>
                        {expense.split_among.map((p, i) => (
                          <span key={i} className={styles.splitChip}>{p}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className={styles.expenseRight}>
                    <div className={styles.expenseAmounts}>
                      <span className={styles.expenseAmount}>
                        ₹{expense.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </span>
                      <span className={styles.expenseShare}>
                        ₹{expense.share_per_person.toLocaleString('en-IN', { maximumFractionDigits: 2 })}/person
                      </span>
                    </div>
                    <div className={styles.expenseActions}>
                      <button
                        id={`edit-expense-${expense.id}`}
                        className={`btn btn-ghost btn-sm ${styles.actionBtn}`}
                        onClick={() => setExpenseModal({ open: true, expense })}
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        id={`delete-expense-${expense.id}`}
                        className={`btn btn-ghost btn-sm ${styles.actionBtn} ${styles.deleteBtn}`}
                        onClick={() => handleDeleteExpense(expense.id)}
                        disabled={deletingId === expense.id}
                        title="Delete"
                      >
                        {deletingId === expense.id
                          ? <div className="spinner spinner-brand" style={{ width: 14, height: 14 }} />
                          : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Settlement CTA */}
        {expenses.length > 0 && (
          <div className={styles.settlementCTA}>
            <div className={styles.ctaGlow} />
            <div className={styles.ctaInfo}>
              <div className={styles.ctaIconWrap}><TrendingUp size={22} /></div>
              <div>
                <p className={styles.ctaTitle}>Ready to settle up?</p>
                <p className={styles.ctaSub}>Calculate minimal transactions to clear all debts</p>
              </div>
            </div>
            <button
              id="settlement-btn"
              className={`btn btn-primary ${styles.ctaBtn} ${btnCfg.cls}`}
              onClick={() => navigate(`/groups/${groupId}/settlements`)}
            >
              {btnCfg.icon}
              {btnCfg.label}
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {expenseModal.open && (
        <AddEditExpenseModal
          groupId={groupId}
          members={group.members}
          expense={expenseModal.expense}
          onClose={() => setExpenseModal({ open: false, expense: null })}
          onSaved={handleExpenseSaved}
        />
      )}
    </div>
  )
}
