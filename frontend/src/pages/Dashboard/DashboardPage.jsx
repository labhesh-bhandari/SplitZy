import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users, Eye, PlusCircle, Trash2, Search, TrendingUp, Receipt, Wallet } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { groupsAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import CreateGroupModal from '../../components/Modals/CreateGroupModal'
import styles from './DashboardPage.module.css'

export default function DashboardPage() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const { user } = useAuth()
  const navigate = useNavigate()

  const fetchGroups = async () => {
    try {
      const res = await groupsAPI.getAll()
      setGroups(res.data)
    } catch (err) {
      toast.error('Failed to load groups')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGroups()
  }, [])

  const handleGroupCreated = (newGroup) => {
    setGroups((prev) => [newGroup, ...prev])
    setShowCreateModal(false)
    toast.success(`"${newGroup.title}" created! 🎉`)
    navigate(`/groups/${newGroup.id}`)
  }

  const handleDeleteGroup = async (groupId, groupTitle, e) => {
    e.stopPropagation()
    if (!window.confirm(`Delete "${groupTitle}"? This will also delete all its expenses.`)) return
    setDeletingId(groupId)
    try {
      await groupsAPI.delete(groupId)
      setGroups((prev) => prev.filter((g) => g.id !== groupId))
      toast.success('Group deleted')
    } catch {
      toast.error('Failed to delete group')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredGroups = groups.filter((g) =>
    g.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const settlementLabel = (status) => {
    switch (status) {
      case 'calculated': return { text: 'Settled', cls: 'badge-green' }
      case 'stale': return { text: 'Needs Recalculation', cls: 'badge-yellow' }
      default: return { text: 'Pending', cls: 'badge-purple' }
    }
  }

  const totalExpenses = groups.reduce((sum, g) => sum + g.expense_count, 0)

  return (
    <div className={styles.page}>
      {/* Hero header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.welcome}>
            <h1 className={styles.welcomeTitle}>
              Hey, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
            </h1>
            <p className={styles.welcomeSub}>Manage your splits and settle up with ease</p>
          </div>

          {/* Stats strip */}
          <div className={styles.statsStrip}>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'rgba(124,58,237,0.1)' }}>
                <Users size={20} style={{ color: 'var(--brand-purple)' }} />
              </div>
              <div>
                <div className={styles.statNum}>{groups.length}</div>
                <div className={styles.statLbl}>Groups</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'rgba(37,99,235,0.1)' }}>
                <Receipt size={20} style={{ color: 'var(--brand-blue)' }} />
              </div>
              <div>
                <div className={styles.statNum}>{totalExpenses}</div>
                <div className={styles.statLbl}>Total Expenses</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: 'rgba(6,182,212,0.1)' }}>
                <TrendingUp size={20} style={{ color: 'var(--brand-cyan)' }} />
              </div>
              <div>
                <div className={styles.statNum}>
                  {groups.filter((g) => g.settlement_status === 'calculated').length}
                </div>
                <div className={styles.statLbl}>Settled</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={styles.content}>
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input
              id="group-search"
              type="text"
              className={`form-input ${styles.searchInput}`}
              placeholder="Search groups…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            id="create-group-btn"
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={18} />
            New Group
          </button>
        </div>

        {loading ? (
          <div className={styles.grid}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={`${styles.groupCard} ${styles.skeleton}`}>
                <div className={`${styles.skeletonLine} ${styles.skeletonWide} shimmer`} />
                <div className={`${styles.skeletonLine} ${styles.skeletonHalf} shimmer`} />
                <div className={`${styles.skeletonBtn} shimmer`} style={{ marginTop: 20 }} />
              </div>
            ))}
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Wallet size={48} />
            </div>
            <h3>
              {searchQuery ? 'No groups found' : 'No groups yet'}
            </h3>
            <p>
              {searchQuery
                ? `No groups match "${searchQuery}"`
                : 'Create your first group to start splitting expenses with friends!'}
            </p>
            {!searchQuery && (
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={18} />
                Create First Group
              </button>
            )}
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredGroups.map((group, idx) => {
              const badge = settlementLabel(group.settlement_status)
              return (
                <div
                  key={group.id}
                  className={`${styles.groupCard} animate-fadeInUp`}
                  style={{ animationDelay: `${idx * 0.08}s`, cursor: 'pointer' }}
                  onClick={() => navigate(`/groups/${group.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/groups/${group.id}`)}
                >
                  <div className={styles.cardHeader}>
                    <div className={styles.groupAvatar}>
                      {group.title.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.cardMeta}>
                      <h3 className={styles.groupTitle}>{group.title}</h3>
                      <span className={`badge ${badge.cls}`}>{badge.text}</span>
                    </div>
                    <button
                      id={`delete-group-${group.id}`}
                      className={`btn btn-ghost ${styles.deleteBtn}`}
                      onClick={(e) => handleDeleteGroup(group.id, group.title, e)}
                      disabled={deletingId === group.id}
                      title="Delete group"
                    >
                      {deletingId === group.id ? (
                        <div className="spinner spinner-brand" style={{ width: 16, height: 16 }} />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </button>
                  </div>

                  <div className={styles.cardInfo}>
                    <div className={styles.infoItem}>
                      <Users size={14} />
                      <span>{group.members.length} members</span>
                    </div>
                    <div className={styles.infoItem}>
                      <Receipt size={14} />
                      <span>{group.expense_count} expense{group.expense_count !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {/* Members avatars */}
                  <div className={styles.memberAvatars}>
                    {group.members.slice(0, 5).map((m, i) => (
                      <div
                        key={i}
                        className={styles.memberAvatar}
                        title={m}
                        style={{ zIndex: 5 - i }}
                      >
                        {m.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {group.members.length > 5 && (
                      <div className={`${styles.memberAvatar} ${styles.memberMore}`}>
                        +{group.members.length - 5}
                      </div>
                    )}
                  </div>

                  <div className={styles.cardActions}>
                    <button
                      id={`view-group-${group.id}`}
                      className="btn btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/groups/${group.id}`)
                      }}
                      style={{ flex: 1 }}
                    >
                      <Eye size={15} />
                      View
                    </button>
                    <button
                      id={`add-expense-${group.id}`}
                      className="btn btn-primary"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/groups/${group.id}?addExpense=true`)
                      }}
                      style={{ flex: 1 }}
                    >
                      <PlusCircle size={15} />
                      Add Expense
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleGroupCreated}
        />
      )}
    </div>
  )
}
