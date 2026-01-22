import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getCurrentUser } from '../api'
import '../styles/header.css'

export default function Header() {
  const [user, setUser] = useState(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    let mounted = true
    const token = localStorage.getItem('token')
    if (token) {
      // fetch profile to get latest user info
      getCurrentUser().then(res => {
        if (!mounted) return
        const data = res.data
        setUser(data)
        // store useful fields locally for other pages
        if (data.phone) localStorage.setItem('phone', data.phone)
        if (data.fullName) localStorage.setItem('fullName', data.fullName)
        if (data.username) localStorage.setItem('username', data.username)
      }).catch(() => {
        // token invalid or api failed -> clear
        localStorage.removeItem('token')
        localStorage.removeItem('username')
        setUser(null)
      })
    }
    return () => { mounted = false }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('phone')
    localStorage.removeItem('fullName')
    setShowUserMenu(false)
    navigate('/login')
  }

  // Không hiển thị header trên trang login/register
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null
  }

  if (!user) return null

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <img src="/logo-qt.png" alt="QT Restaurant & Bar" className="logo-img" />
          <h1>🍽️ Nhà Hàng QT</h1>
        </div>

        <nav className="nav">
          <button 
            className={`nav-link ${location.pathname === '/menu' ? 'active' : ''}`}
            onClick={() => navigate('/menu')}
          >
            📋 Thực Đơn
          </button>
          <button 
            className={`nav-link ${location.pathname === '/checkout' ? 'active' : ''}`}
            onClick={() => navigate('/checkout')}
          >
            💳 Đặt Bàn
          </button>
          <button 
            className={`nav-link ${location.pathname === '/orders' ? 'active' : ''}`}
            onClick={() => navigate('/orders')}
          >
            📦 Đơn Của Tôi
          </button>
        </nav>

        <div className="user-section">
          <div className="user-menu-wrapper">
            <button 
              className="user-name-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              👤 {user?.fullName || user?.username || 'Khách'} ▼
            </button>
            {showUserMenu && (
              <div className="user-menu-dropdown">
                <div className="user-menu-header">
                  <div className="user-menu-name">{user?.fullName || user?.username}</div>
                  <div className="user-menu-email">{user?.email || 'Không có email'}</div>
                  <div className="user-menu-phone">📱 {user?.phone || 'Không có số điện thoại'}</div>
                </div>
                <div className="user-menu-divider"></div>
                <button 
                  className="user-menu-item"
                  onClick={() => {
                    navigate('/orders')
                    setShowUserMenu(false)
                  }}
                >
                  📦 Đơn Hàng Của Tôi
                </button>
                <button 
                  className="user-menu-item user-menu-logout"
                  onClick={handleLogout}
                >
                  🚪 Đăng Xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
