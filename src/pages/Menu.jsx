import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMenu, getTables, getReservations } from '../api'
import toast, { Toaster } from "react-hot-toast"
import '../styles/menu.css'

export default function Menu() {
  const [menu, setMenu] = useState([])
  const [tables, setTables] = useState([])
  const [cart, setCart] = useState([])
  const [selectedTable, setSelectedTable] = useState(null)
  const [reservationTime, setReservationTime] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCart, setShowCart] = useState(false)
  const [selectedDish, setSelectedDish] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadData()

    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]')
    setCart(savedCart)

    const savedTable = localStorage.getItem('selectedTable')
    const savedTime = localStorage.getItem('reservationTime')

    if (savedTable) setSelectedTable(parseInt(savedTable))
    if (savedTime) setReservationTime(savedTime)
  }, [])

  const loadData = async () => {
    try {
      const [menuRes, tablesRes, reservationsRes] = await Promise.all([
        getMenu(),
        getTables(),
        getReservations()
      ])

      const menuData = menuRes.data || []
      const tablesData = tablesRes.data || []
      const reservationsData = reservationsRes.data || []

      const reservedIds = new Set(
        reservationsData
          .filter(r => r.status !== 'CANCELLED')
          .map(r => r.table?.id)
          .filter(Boolean)
      )

      setMenu(menuData)
      setTables(tablesData.map(t => ({ ...t, available: !reservedIds.has(t.id) })))
    } catch (err) {
      console.error('Lỗi:', err)
    } finally {
      setLoading(false)
    }
  }

  // ⭐ Toast notification added here
  const addToCart = (item) => {
    const existingItem = cart.find(c => c.id === item.id)
    let newCart

    if (existingItem) {
      newCart = cart.map(c =>
        c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
      )
    } else {
      newCart = [...cart, { ...item, quantity: 1 }]
    }

    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))

    // 🔥 Beautiful Toast
    toast.success(`${item.name} đã được thêm vào giỏ hàng!`, {
      duration: 1500
    })
  }

  const removeFromCart = (itemId) => {
    const newCart = cart.filter(c => c.id !== itemId)
    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
  }

  const updateQuantity = (itemId, quantity) => {
    let newCart

    if (quantity <= 0) {
      newCart = cart.filter(c => c.id !== itemId)
    } else {
      newCart = cart.map(c =>
        c.id === itemId ? { ...c, quantity } : c
      )
    }

    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
  }

  const filteredMenu = menu.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  if (loading) {
    return <div className="loading">Đang tải dữ liệu...</div>
  }

  return (
    <div className="menu-container">

      {/* Toast hiển thị toàn trang */}
      <Toaster position="top-right" />

      <div className="menu-header">
        <h1>🍽️ Thực Đơn</h1>
        <button
          className="cart-toggle"
          onClick={() => setShowCart(!showCart)}
        >
          🛒 Giỏ Hàng ({cart.length})
        </button>
      </div>

      <div className="menu-content">

        <div className={`menu-list ${showCart ? 'hide' : ''}`}>

          <input
            type="text"
            className="search-input"
            placeholder="🔍 Tìm kiếm món ăn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="items-grid">
            {filteredMenu.map(item => (
              <div key={item.id} className="menu-item">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="item-image"
                    onClick={() => setSelectedDish(item)}
                    style={{ cursor: 'pointer' }}
                  />
                )}

                <div className="item-info">
                  <h3 onClick={() => setSelectedDish(item)} style={{ cursor: 'pointer' }}>
                    {item.name}
                  </h3>
                  {item.description && (
                    <p 
                      className="description"
                      onClick={() => setSelectedDish(item)}
                      style={{ cursor: 'pointer' }}
                    >
                      {item.description}
                    </p>
                  )}

                  <div className="item-footer">
                    <span className="price">
                      {item.price?.toLocaleString?.() || item.price} ₫
                    </span>

                    <button
                      className="btn-add"
                      onClick={() => addToCart(item)}
                    >
                      + Thêm
                    </button>

                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`cart-sidebar ${showCart ? 'show' : ''}`}>
          <div className="cart-header">
            <h2>🛒 Giỏ Hàng</h2>
            <button className="close-btn" onClick={() => setShowCart(false)}>✕</button>
          </div>

          {cart.length === 0 ? (
            <p className="empty-cart">Giỏ hàng trống</p>
          ) : (
            <>
              <div className="cart-items">
                {cart.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="item-name">{item.name}</div>

                    <div className="item-controls">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>

                    <div className="item-price">
                      {(item.price * item.quantity).toLocaleString?.()} ₫
                    </div>

                    <button
                      className="btn-remove"
                      onClick={() => removeFromCart(item.id)}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>

              <div className="reservation-section">
                <h3>📅 Đặt Bàn</h3>

                <div className="form-group">
                  <label>Chọn Bàn</label>
                  <select
                    value={selectedTable || ''}
                    onChange={(e) =>
                      setSelectedTable(e.target.value ? parseInt(e.target.value) : null)
                    }
                  >
                    <option value="">-- Chọn bàn --</option>

                    {tables.map(table => (
                      <option
                        key={table.id}
                        value={table.id}
                        disabled={table.available === false}
                      >
                        {table.name} (sức chứa {table.capacity} người)
                        {table.available === false ? ' — (Đã đặt)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Thời gian</label>
                  <input
                    type="datetime-local"
                    value={reservationTime}
                    onChange={(e) => setReservationTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="cart-total">
                <strong>Tổng cộng: {total.toLocaleString?.()} ₫</strong>
              </div>

              <div className="cart-actions">
                <button className="btn-continue-shopping" onClick={() => setShowCart(false)}>
                  ← Tiếp Tục Chọn Món
                </button>

                <button
                  className="btn-checkout"
                  onClick={() => {
                    if (cart.length === 0) {
                      alert('Vui lòng chọn ít nhất một món ăn')
                      return
                    }
                    if (!selectedTable) {
                      alert('Vui lòng chọn bàn')
                      return
                    }
                    if (!reservationTime) {
                      alert('Vui lòng chọn thời gian đặt bàn')
                      return
                    }

                    localStorage.setItem('cart', JSON.stringify(cart))
                    localStorage.setItem('selectedTable', selectedTable)
                    localStorage.setItem('reservationTime', reservationTime)

                    navigate('/checkout')
                  }}
                >
                  💳 Tiến tới Thanh Toán
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal Chi Tiết Món Ăn */}
      {selectedDish && (
        <div className="modal-overlay" onClick={() => setSelectedDish(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close"
              onClick={() => setSelectedDish(null)}
            >
              ✕
            </button>

            {selectedDish.image && (
              <img 
                src={selectedDish.image} 
                alt={selectedDish.name}
                className="modal-image"
              />
            )}

            <div className="modal-body">
              <h2>{selectedDish.name}</h2>
              
              <div className="modal-price">
                <strong>Giá: {selectedDish.price?.toLocaleString?.() || selectedDish.price} ₫</strong>
              </div>

              <div className="modal-description">
                <h3>📝 Mô Tả</h3>
                <p>{selectedDish.description || 'Không có mô tả chi tiết'}</p>
              </div>

              {selectedDish.ingredients && (
                <div className="modal-ingredients">
                  <h3>🥘 Thành Phần</h3>
                  <p>{selectedDish.ingredients}</p>
                </div>
              )}

              {selectedDish.allergens && (
                <div className="modal-allergens">
                  <h3>⚠️ Chứa Chất Gây Dị Ứng</h3>
                  <p>{selectedDish.allergens}</p>
                </div>
              )}

              {selectedDish.calories && (
                <div className="modal-info">
                  <span>🔥 Calo: {selectedDish.calories}</span>
                </div>
              )}

              <div className="modal-actions">
                <button
                  className="btn-add-modal"
                  onClick={() => {
                    addToCart(selectedDish)
                    setSelectedDish(null)
                  }}
                >
                  ✓ Thêm vào giỏ hàng
                </button>
                <button
                  className="btn-close-modal"
                  onClick={() => setSelectedDish(null)}
                >
                  ✕ Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
