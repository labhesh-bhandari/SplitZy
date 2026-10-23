import { useState } from 'react'
import { X, Plus, Trash2, Users } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { groupsAPI } from '../../services/api'
import styles from './Modal.module.css'

export default function CreateGroupModal({ onClose, onCreated }) {
  const [title, setTitle] = useState('')
  const [members, setMembers] = useState([{ name: '' }, { name: '' }])
  const [loading, setLoading] = useState(false)

  const addMember = () => {
    setMembers((prev) => [...prev, { name: '' }])
  }

  const removeMember = (index) => {
    if (members.length <= 2) {
      toast.error('A group needs at least 2 members')
      return
    }
    setMembers((prev) => prev.filter((_, i) => i !== index))
  }

  const updateMember = (index, value) => {
    setMembers((prev) => prev.map((m, i) => (i === index ? { name: value } : m)))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate
    const filledMembers = members.filter((m) => m.name.trim())
    if (filledMembers.length < 2) {
      toast.error('Please add at least 2 members')
      return
    }

    // Check for duplicates
    const names = filledMembers.map((m) => m.name.trim().toLowerCase())
    if (new Set(names).size !== names.length) {
      toast.error('Member names must be unique')
      return
    }

    setLoading(true)
    try {
      const res = await groupsAPI.create({
        title: title.trim(),
        members: filledMembers.map((m) => ({ name: m.name.trim() })),
      })
      onCreated(res.data)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to create group'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalIconWrapper}>
            <Users size={22} />
          </div>
          <div>
            <h2 className={styles.modalTitle}>Create New Group</h2>
            <p className={styles.modalSub}>Add a title and members to get started</p>
          </div>
          <button className={`btn btn-ghost ${styles.closeBtn}`} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label className="form-label" htmlFor="group-title">Group / Trip Name</label>
            <input
              id="group-title"
              type="text"
              className="form-input"
              placeholder="e.g. Goa Trip 2025, Apartment Rent…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Members ({members.length})</label>
            <div className={styles.membersList}>
              {members.map((member, idx) => (
                <div key={idx} className={styles.memberRow}>
                  <div className={styles.memberNum}>{idx + 1}</div>
                  <input
                    id={`member-${idx}`}
                    type="text"
                    className={`form-input ${styles.memberInput}`}
                    placeholder={`Member ${idx + 1} name`}
                    value={member.name}
                    onChange={(e) => updateMember(idx, e.target.value)}
                    maxLength={100}
                  />
                  <button
                    type="button"
                    className={`btn btn-ghost ${styles.removeMemberBtn}`}
                    onClick={() => removeMember(idx)}
                    title="Remove member"
                    disabled={members.length <= 2}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <button
              id="add-member-btn"
              type="button"
              className={`btn btn-ghost ${styles.addMemberBtn}`}
              onClick={addMember}
            >
              <Plus size={15} />
              Add Member
            </button>
          </div>

          <div className={styles.modalActions}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              id="create-group-submit-btn"
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? <><div className="spinner" /> Creating…</> : <><Users size={15} /> Create Group</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
