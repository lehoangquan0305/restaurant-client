import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../api'
import toast, { Toaster } from "react-hot-toast" // 👈 THIẾU CÁI NÀY NÀY!
import '../styles/auth.css'

export default function Register() {
  const navigate = useNavigate()
  
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) navigate('/menu')
  }, [navigate])

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    email: '',
    phone: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('') // Reset lỗi cũ

    // 1. Thu thập và làm sạch dữ liệu
    const username = formData.username.trim()
    const email = formData.email.trim()
    const phone = formData.phone.trim()
    const fullName = formData.fullName.trim()
    const password = formData.password

    // 2. Validation "siêu cấp" - Bắn cả Error lẫn Toast cho Tester
    if (username.length < 3) {
      const msg = 'Tên đăng nhập tối thiểu phải 3 ký tự'
      setError(msg)
      toast.error(msg)
      return
    }
    
    if (!fullName) {
      const msg = 'Vui lòng nhập họ tên đầy đủ'
      setError(msg)
      toast.error(msg)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      const msg = 'Định dạng Email không hợp lệ'
      setError(msg)
      toast.error(msg)
      return
    }

    if (!/^\d{10}$/.test(phone)) {
      const msg = 'Số điện thoại phải bao gồm đúng 10 số'
      setError(msg)
      toast.error(msg)
      return
    }

    if (password.length < 6) {
      const msg = 'Mật khẩu phải từ 6 ký tự trở lên'
      setError(msg)
      toast.error(msg)
      return
    }

    if (password !== formData.confirmPassword) {
      const msg = 'Mật khẩu xác nhận không khớp'
      setError(msg)
      toast.error(msg)
      return
    }

    setLoading(true)
    try {
      await register(username, password, fullName, email, phone)
      
      toast.success('Đăng ký thành công! Đang chuyển hướng...')
      
      // Delay một chút để Tester kịp verify cái Toast thành công
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err) {
      const serverMessage = err.response?.data?.message || 'Đăng ký thất bại'
      setError(serverMessage)
      toast.error(serverMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      {/* Cần cái này để Toast nó có chỗ hiển thị */}
      <Toaster position="top-right" /> 

      <div className="auth-card">
        <h1>🍽️ Nhà Hàng QT</h1>
        <p className="subtitle">Tạo Tài Khoản Mới</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label>Tên đăng nhập</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Chọn tên đăng nhập"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label>Họ tên</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Nhập họ tên đầy đủ"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Nhập email"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
  <label>Số điện thoại</label>
  <input
    type="tel"
    name="phone"
    value={formData.phone}
    maxLength={10} // 👈 KHÓA CHẶT: Không thể gõ ký tự thứ 11
    onChange={(e) => {
      const v = e.target.value
      // Chỉ cho phép nhập số (như code cũ của cậu)
      if (/^\d*$/.test(v)) {
        handleChange(e)
      }
    }}
    placeholder="09xxxxxxxx (10 số)"
    disabled={loading}
    required
  />
</div>

          <div className="form-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Tối thiểu 6 ký tự"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label>Xác nhận mật khẩu</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Nhập lại mật khẩu"
              disabled={loading}
              required
            />
          </div>

          {/* Tester rất thích bắt element error-message này */}
          {error && <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Đang đăng ký...' : 'Tạo Tài Khoản'}
          </button>
        </form>

        <p className="auth-switch">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </div>
  )
}