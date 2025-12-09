import React, { useState, useEffect } from 'react'
import { getReservations, getOrders, deleteReservation, getCurrentUser } from '../api'
import '../styles/orders.css'

export default function Orders() {
  const [reservations, setReservations] = useState([])
  const [orders, setOrders] = useState([])
  const [activeTab, setActiveTab] = useState('reservations')
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState(null)
  const [currentUsername, setCurrentUsername] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Lấy user hiện tại
      const userRes = await getCurrentUser()
      const username = userRes.data?.username || ''
      setCurrentUsername(username)

      // Load tất cả reservations & orders
      const [resRes, ordersRes] = await Promise.all([
        getReservations(),
        getOrders()
      ])

      const allReservations = resRes.data || []
      const allOrders = ordersRes.data || []

      // Filter theo username từ BE
      const userReservations = allReservations.filter(
        res => res.customerName === username
      )

      const userOrders = allOrders.filter(order => {
        if (!order) return false

        // Nếu order có reservation → kiểm tra username
        if (order.reservation && order.reservation.customerName === username)
          return true

        // Nếu order chỉ có table → match dựa trên reservation + username
        return (
          order.table &&
          allReservations.some(
            res =>
              res.table?.id === order.table?.id &&
              res.customerName === username
          )
        )
      })

      setReservations(userReservations)
      setOrders(userOrders)
    } catch (err) {
      console.error('Lỗi:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelReservation = async (id) => {
    if (window.confirm('Bạn chắc chắn muốn hủy đặt bàn này?')) {
      try {
        setDeletingId(id)
        const res = await deleteReservation(id)
        // backend returns 200 OK on success
        if (res.status === 200 || res.status === 204) {
          await loadData()
          alert('Hủy đặt bàn thành công')
        } else {
          const msg = res.data?.message || 'Không thể hủy đặt bàn'
          alert(msg)
        }
      } catch (err) {
        console.error('Cancel reservation error', err)
        const msg = err.response?.data?.message || err.message || 'Có lỗi xảy ra'
        alert(msg)
      }
      finally {
        setDeletingId(null)
      }
    }
  }

  // Helper: check if a reservation has any associated order items in COOKING state
  const reservationHasCookingItems = (reservationId) => {
    if (!orders || orders.length === 0) return false
    const ord = orders.find(o => o.reservation && o.reservation.id === reservationId)
    if (!ord || !ord.items) return false
    return ord.items.some(it => it.status === 'COOKING')
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'CONFIRMED': { label: 'Đã Xác Nhận', color: 'success' },
      'PENDING': { label: 'Chờ Xác Nhận', color: 'warning' },
      'CANCELLED': { label: 'Đã Hủy', color: 'danger' },
      'COMPLETED': { label: 'Hoàn Thành', color: 'info' }
    }
    const s = statusMap[status] || { label: status, color: 'secondary' }
    return <span className={`badge badge-${s.color}`}>{s.label}</span>
  }

  if (loading) {
    return <div className="loading">Đang tải dữ liệu...</div>
  }

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h1>📋 Lịch Sử Đơn Hàng & Đặt Bàn</h1>
      </div>

      <div className="orders-content">
        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'reservations' ? 'active' : ''}`}
            onClick={() => setActiveTab('reservations')}
          >
            📅 Đặt Bàn ({reservations.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            🛒 Đơn Hàng ({orders.length})
          </button>
        </div>

        {activeTab === 'reservations' && (
          <div className="tab-content">
            {reservations.length === 0 ? (
              <p className="empty-message">Chưa có đặt bàn nào</p>
            ) : (
              <div className="items-list">
                {reservations.map(res => {
                  const canCancel = res.status !== 'CANCELLED' && res.status !== 'COMPLETED' && (res.status === 'CONFIRMED' || !reservationHasCookingItems(res.id))
                  return (
                    <div key={res.id} className="item-card">
                      <div className="item-header">
                        <h3>{res.customerName}</h3>
                        {getStatusBadge(res.status)}
                      </div>
                      
                      <div className="item-details">
                        <div className="detail">
                          <span className="label">Bàn:</span>
                          <span className="value">{res.table?.name}</span>
                        </div>
                        <div className="detail">
                          <span className="label">Số người:</span>
                          <span className="value">{res.partySize} người</span>
                        </div>
                        <div className="detail">
                          <span className="label">Thời gian:</span>
                          <span className="value">{new Date(res.reservationTime).toLocaleString('vi-VN')}</span>
                        </div>
                        <div className="detail">
                          <span className="label">Số điện thoại:</span>
                          <span className="value">{res.customerPhone}</span>
                        </div>
                      </div>

                      <div className="item-actions">
                        <button 
                          className="btn-view"
                          onClick={() => setSelectedItem(res)}
                        >
                          👁️ Xem Chi Tiết
                        </button>
                        {canCancel && (
                          <button 
                            className="btn-cancel"
                            onClick={() => handleCancelReservation(res.id)}
                            disabled={deletingId === res.id}
                          >
                            {deletingId === res.id ? 'Đang hủy...' : '❌ Hủy Đặt Bàn'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="tab-content">
            {orders.length === 0 ? (
              <p className="empty-message">Chưa có đơn hàng nào</p>
            ) : (
              <div className="items-list">
                {orders.map(order => (
                  <div key={order.id} className="item-card">
                    <div className="item-header">
                      <h3>Đơn Hàng #{order.id}</h3>
                      {getStatusBadge(order.status)}
                    </div>
                    
                    <div className="item-details">
                      <div className="detail">
                        <span className="label">Bàn:</span>
                        <span className="value">{order.table?.name}</span>
                      </div>
                      <div className="detail">
                        <span className="label">Tổng tiền:</span>
                        <span className="value price">{order.total?.toLocaleString?.()} ₫</span>
                      </div>
                      <div className="detail">
                        <span className="label">Số lượng món:</span>
                        <span className="value">{order.items?.length || 0} món</span>
                      </div>
                      {order.notes && (
                        <div className="detail">
                          <span className="label">Ghi chú:</span>
                          <span className="value">{order.notes}</span>
                        </div>
                      )}
                    </div>

                    {order.items && order.items.length > 0 && (
                      <div className="order-items">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="order-item">
                            <span>{item.menuItem?.name} x {item.quantity}</span>
                            <span>{(item.price * item.quantity).toLocaleString?.()} ₫</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="item-actions">
                      <button 
                        className="btn-view"
                        onClick={() => setSelectedItem(order)}
                      >
                        👁️ Xem Chi Tiết
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedItem(null)}>✕</button>
            
            <h2>Chi Tiết</h2>
            
            <div className="modal-details">
              {selectedItem.customerName && (
                <>
                  <div className="detail">
                    <span>Tên khách:</span>
                    <strong>{selectedItem.customerName}</strong>
                  </div>
                  <div className="detail">
                    <span>Số điện thoại:</span>
                    <strong>{selectedItem.customerPhone}</strong>
                  </div>
                  <div className="detail">
                    <span>Số người:</span>
                    <strong>{selectedItem.partySize} người</strong>
                  </div>
                  <div className="detail">
                    <span>Thời gian:</span>
                    <strong>{new Date(selectedItem.reservationTime).toLocaleString('vi-VN')}</strong>
                  </div>
                </>
              )}
              
              {selectedItem.items && (
                <>
                  <h3>Các Món Ăn</h3>
                  {selectedItem.items.map((item, idx) => (
                    <div key={idx} className="detail">
                      <span>{item.menuItem?.name} x {item.quantity}</span>
                      <strong>{(item.price * item.quantity).toLocaleString?.()} ₫</strong>
                    </div>
                  ))}
                  <div className="detail total">
                    <span>Tổng cộng:</span>
                    <strong>{selectedItem.total?.toLocaleString?.()} ₫</strong>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
