import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api'
import toast, { Toaster } from "react-hot-toast"
import '../styles/auth.css'

export default function Login() {
  const navigate = useNavigate()
  
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) navigate('/menu')
  }, [navigate])

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  // 1. Thêm State quản lý số lần nhập sai
  const [wrongCount, setWrongCount] = useState(0)
  const [showForgot, setShowForgot] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    const cleanUsername = username.trim()

    if (!cleanUsername || !password) {
      const msg = !cleanUsername ? 'Bạn chưa nhập tên đăng nhập!' : 'Bạn chưa nhập mật khẩu!'
      setError(msg)
      toast.error(msg)
      return
    }

    setLoading(true)
    try {
      const response = await login(cleanUsername, password)
      
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('username', cleanUsername)
      
      setWrongCount(0)
      toast.success(`Đăng nhập thành công! Chào ${cleanUsername}`)
      
      setTimeout(() => {
        navigate('/menu')
      }, 1000)
      
    } catch (err) {
      const newCount = wrongCount + 1
      setWrongCount(newCount)

      const serverMessage = (err.response?.data?.message || err.response?.data || "").toLowerCase()
      let finalError = 'Tên đăng nhập hoặc mật khẩu không chính xác'

      // ƯU TIÊN KIỂM TRA NỘI DUNG CHỮ TRƯỚC
      if (serverMessage.includes('not found') || 
          serverMessage.includes('không tồn tại') || 
          serverMessage.includes('does not exist') ||
          serverMessage.includes('chưa đăng ký')) {
        finalError = 'Tài khoản này chưa được đăng ký!'
      } 
      // Nếu không phải lỗi "không tồn tại" mà là 401 thì mới báo sai mật khẩu
      else if (err.response?.status === 401) {
        finalError = 'Mật khẩu không chính xác. Vui lòng kiểm tra lại!'
      }
      else if (err.response?.data?.message) {
        finalError = err.response.data.message
      }

      setError(finalError)
      toast.error(`${finalError} (Lần ${newCount})`)

      if (newCount >= 3) {
        setShowForgot(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <Toaster position="top-center" />

      <div className="auth-card">
        <h1>🍽️ Nhà Hàng QT</h1>
        <p className="subtitle">Đặt Bàn & Chọn Món Trực Tuyến</p>
        
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label>Tên đăng nhập</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập"
              disabled={loading}
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              disabled={loading}
              required
            />
          </div>

          {error && <div className="error-message" style={{ color: 'red', marginBottom: '15px', fontSize: '14px' }}>{error}</div>}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
          </button>
        </form>

        {/* 4. HIỂN THỊ LINK QUÊN MẬT KHẨU KHI SAI NHIỀU */}
        {showForgot && (
          <div style={{ marginTop: '15px', textAlign: 'center' }}>
            <Link 
              to="/forgot-password" 
              style={{ color: '#ff4d4f', fontWeight: 'bold', textDecoration: 'none', fontSize: '14px' }}
            >
              ❓ Quên mật khẩu? Lấy lại qua Email
            </Link>
          </div>
        )}

        <p className="auth-switch">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  )
}