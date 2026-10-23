import { useState, useRef, useEffect } from 'react'
import { X, DollarSign, Save, ChevronDown, Check } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { expensesAPI } from '../../services/api'
import styles from './Modal.module.css'

/* Avatar colour palette — consistent across the app */
const AVATAR_COLORS = [
  'linear-gradient(135deg,#7c3aed,#2563eb)',
  'linear-gradient(135deg,#2563eb,#06b6d4)',
  'linear-gradient(135deg,#06b6d4,#10b981)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#10b981,#06b6d4)',
  'linear-gradient(135deg,#8b5cf6,#ec4899)',
  'linear-gradient(135deg,#3b82f6,#8b5cf6)',
  'linear-gradient(135deg,#ef4444,#f59e0b)',
]
const avatarColor = (name) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]

/* ── Fully custom single-select dropdown ─────────────────────── */
function MemberSelect({ members, value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  /* Close on outside click */
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className={`${styles.customDropdown} ${open ? styles.dropdownOpen : ''}`}>
      {/* Trigger */}
      <button
        type="button"
        id="paid-by"
        className={styles.dropdownTrigger}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className={styles.dropdownAvatar} style={{ background: avatarColor(value) }}>
          {value.charAt(0).toUpperCase()}
        </div>
        <span className={styles.dropdownValue}>{value}</span>
        <ChevronDown size={16} className={`${styles.dropdownChevron} ${open ? styles.chevronUp : ''}`} />
      </button>

      {/* Options panel */}
      {open && (
        <div className={styles.dropdownPanel} role="listbox">
          {members.map((member) => {
            const selected = member === value
            return (
              <button
                key={member}
                type="button"
                role="option"
                aria-selected={selected}
                className={`${styles.dropdownOption} ${selected ? styles.optionSelected : ''}`}
                onClick={() => { onChange(member); setOpen(false) }}
              >
                <div className={styles.dropdownAvatar} style={{ background: avatarColor(member) }}>
                  {member.charAt(0).toUpperCase()}
                </div>
                <span className={styles.dropdownOptionLabel}>{member}</span>
                {selected && <Check size={14} className={styles.optionCheck} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────── */

export default function AddEditExpenseModal({ groupId, members, expense, onClose, onSaved }) {
  const isEdit = !!expense

  const [form, setForm] = useState({
    label: expense?.label || '',
    amount: expense?.amount || '',
    paid_by: expense?.paid_by || members[0] || '',
    split_among: expense?.split_among || [],
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const toggleSplitMember = (member) => {
    setForm((prev) => {
      const current = prev.split_among
      if (current.includes(member)) {
        if (current.length === 1) { toast.error('At least one person must be in the split'); return prev }
        return { ...prev, split_among: current.filter((m) => m !== member) }
      }
      return { ...prev, split_among: [...current, member] }
    })
  }

  const selectAll = () => setForm((prev) => ({ ...prev, split_among: [...members] }))
  const clearAll  = () => setForm((prev) => ({ ...prev, split_among: [] }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const amount = parseFloat(form.amount)
    if (isNaN(amount) || amount <= 0) { toast.error('Amount must be a positive number'); return }
    if (form.split_among.length === 0)  { toast.error('Select at least one person to split with'); return }

    setLoading(true)
    try {
      const payload = {
        label: form.label.trim(),
        amount,
        paid_by: form.paid_by,
        split_among: form.split_among,
      }
      const res = isEdit
        ? await expensesAPI.update(groupId, expense.id, payload)
        : await expensesAPI.create(groupId, payload)
      onSaved(res.data, isEdit)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save expense'
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setLoading(false)
    }
  }

  const sharePreview =
    form.split_among.length > 0 && parseFloat(form.amount) > 0
      ? (parseFloat(form.amount) / form.split_among.length).toFixed(2)
      : null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-no-scroll" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        {/* ── Header ── */}
        <div className={styles.modalHeader}>
          <div className={styles.modalIconWrapper} style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--brand-blue)' }}>
            <DollarSign size={22} />
          </div>
          <div>
            <h2 className={styles.modalTitle}>{isEdit ? 'Edit Expense' : 'Add Expense'}</h2>
            <p className={styles.modalSub}>{isEdit ? 'Update the expense details' : 'Add a new expense to the group'}</p>
          </div>
          <button className={`btn btn-ghost ${styles.closeBtn}`} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Label */}
          <div className="form-group">
            <label className="form-label" htmlFor="expense-label">Expense Label</label>
            <input
              id="expense-label"
              type="text"
              className="form-input"
              placeholder="e.g. Dinner, Hotel, Cab ride…"
              value={form.label}
              onChange={(e) => handleChange('label', e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Amount — no spinner arrows */}
          <div className="form-group">
            <label className="form-label" htmlFor="expense-amount">Amount (₹)</label>
            <div className={styles.amountWrapper}>
              <span className={styles.currencySymbol}>₹</span>
              <input
                id="expense-amount"
                type="number"
                className={`form-input ${styles.amountInput} no-spinner`}
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                min="0.01"
                step="0.01"
                required
              />
              {sharePreview && (
                <span className={styles.sharePreview}>
                  ₹{sharePreview}/person
                </span>
              )}
            </div>
          </div>

          {/* Paid by — custom dropdown */}
          <div className="form-group">
            <label className="form-label" htmlFor="paid-by">Paid By</label>
            <MemberSelect
              members={members}
              value={form.paid_by}
              onChange={(val) => handleChange('paid_by', val)}
            />
          </div>

          {/* Split among */}
          <div className="form-group">
            <div className={styles.splitLabelRow}>
              <label className="form-label">
                Split Among
                {form.split_among.length > 0 && (
                  <span className={styles.splitCount}> · {form.split_among.length} selected</span>
                )}
              </label>
              <div className={styles.splitQuickActions}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={selectAll}>All</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={clearAll}>None</button>
              </div>
            </div>

            {form.split_among.length === 0 && (
              <div className={styles.splitHint}>Tap members below to add them to the split</div>
            )}

            <div className={styles.memberGrid}>
              {members.map((member) => {
                const selected = form.split_among.includes(member)
                return (
                  <button
                    key={member}
                    type="button"
                    className={`${styles.memberToggle} ${selected ? styles.memberSelected : ''}`}
                    onClick={() => toggleSplitMember(member)}
                    id={`split-toggle-${member.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    <div
                      className={`${styles.toggleAvatar} ${selected ? styles.toggleAvatarSelected : ''}`}
                      style={selected ? { background: avatarColor(member) } : {}}
                    >
                      {member.charAt(0).toUpperCase()}
                    </div>
                    <span className={styles.toggleName}>{member}</span>
                    {selected && <div className={styles.toggleCheck}>✓</div>}
                  </button>
                )
              })}
            </div>

            {sharePreview && form.split_among.length > 0 && (
              <div className={styles.splitSummary}>
                {form.split_among.length} {form.split_among.length === 1 ? 'person' : 'people'} · ₹{sharePreview} each
              </div>
            )}
          </div>

          <div className={styles.modalActions}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button
              id={isEdit ? 'update-expense-btn' : 'add-expense-submit-btn'}
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading
                ? <><div className="spinner" /> {isEdit ? 'Saving…' : 'Adding…'}</>
                : <><Save size={15} /> {isEdit ? 'Save Changes' : 'Add Expense'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
