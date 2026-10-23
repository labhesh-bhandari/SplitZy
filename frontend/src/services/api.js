import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor - attach token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('splitzy_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle 401s globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('splitzy_token')
      localStorage.removeItem('splitzy_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  signup: (data) => api.post('/api/auth/signup', data),
  login: (data) => api.post('/api/auth/login', data),
  me: () => api.get('/api/auth/me'),
}

// ─── Groups ───────────────────────────────────────────────────────────────────
export const groupsAPI = {
  getAll: () => api.get('/api/groups'),
  getOne: (id) => api.get(`/api/groups/${id}`),
  create: (data) => api.post('/api/groups', data),
  delete: (id) => api.delete(`/api/groups/${id}`),
}

// ─── Expenses ─────────────────────────────────────────────────────────────────
export const expensesAPI = {
  getAll: (groupId) => api.get(`/api/groups/${groupId}/expenses`),
  create: (groupId, data) => api.post(`/api/groups/${groupId}/expenses`, data),
  update: (groupId, expenseId, data) => api.put(`/api/groups/${groupId}/expenses/${expenseId}`, data),
  delete: (groupId, expenseId) => api.delete(`/api/groups/${groupId}/expenses/${expenseId}`),
}

// ─── Settlements ──────────────────────────────────────────────────────────────
export const settlementsAPI = {
  calculate: (groupId) => api.post(`/api/groups/${groupId}/settlements`),
  get: (groupId) => api.get(`/api/groups/${groupId}/settlements`),
}

export default api
