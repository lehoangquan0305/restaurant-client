import axios from 'axios'

const API_URL = 'https://restaurant-backend-production-4830.up.railway.app/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor để thêm token vào request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, error => Promise.reject(error))

// Interceptor để xử lý response errors
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.status, error.response?.data, error.message)
    return Promise.reject(error)
  }
)

// Auth API
export const login = (username, password) => 
  api.post('/auth/login', { username, password })

export const register = (username, password, fullName, email, phone) =>
  api.post('/auth/register', { username, password, fullName, email, phone })

export const getCurrentUser = () =>
  api.get('/auth/me')

// Menu API
export const getMenu = () =>
  api.get('/menu')

export const getMenuById = (id) =>
  api.get(`/menu/${id}`)

// Tables API
export const getTables = () =>
  api.get('/tables')

// Reservations API
export const createReservation = (data) => {
  // Backend expects tableId directly, not table: { id }
  const payload = {
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    partySize: data.partySize,
    reservationTime: data.reservationTime,
    tableId: data.table?.id || data.tableId,
    status: data.status
  }
  return api.post('/reservations', payload)
}

export const getReservations = () =>
  api.get('/reservations')

export const updateReservation = (id, data) =>
  api.put(`/reservations/${id}`, data)

export const deleteReservation = (id) =>
  api.delete(`/reservations/${id}`)

// Orders API
export const createOrder = (data) => {
  // Backend expects OrderCreateDTO format
  const payload = {
    tableId: data.table?.id || data.tableId,
    reservationId: data.reservation?.id || data.reservationId,
    notes: data.notes,
    status: data.status,
    items: data.items?.map(item => ({
      menuItemId: item.menuItem?.id || item.id,
      quantity: item.quantity,
      price: item.price
    }))
  }
  return api.post('/orders', payload)
}

export const getOrders = () => {
  const token = localStorage.getItem('token')
  console.log('getOrders called. Token in localStorage:', token ? 'YES' : 'NO')
  return api.get('/orders')
}

export const getOrderById = (id) =>
  api.get(`/orders/${id}`)

// Billing API
export const createInvoice = (orderId) =>
  api.post(`/billing/invoice/${orderId}`)

export const payInvoice = (invoiceId, amount, method) =>
  api.post(`/billing/pay/${invoiceId}`, null, { params: { amount, method } })

export default api
