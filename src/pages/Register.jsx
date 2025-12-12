import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../api'
import '../styles/auth.css'

export default function Register() {
  const navigate = useNavigate()
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) navigate('/menu')
  }, [])
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
    setError('')

    // Validation
    if (!formData.username || formData.username.trim().length < 3) {
      setError('Tên đăng nhập phải tối thiểu 3 ký tự')
      return
    }
    if (!formData.password || formData.password.length < 6) {
      setError('Mật khẩu phải tối thiểu 6 ký tự')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu không khớp')
      return
    }
    if (!formData.email || !formData.email.includes('@')) {
      setError('Email không hợp lệ')
      return
    }
    if (!formData.phone || !/^\d{9,11}$/.test(formData.phone)) {
      setError('Số điện thoại phải từ 9-11 số')
      return
    }

    setLoading(true)
    try {
      await register(
        formData.username,
        formData.password,
        formData.fullName,
        formData.email,
        formData.phone
      )
      alert('Đăng ký thành công! Vui lòng đăng nhập.')
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>🍽️ Nhà Hàng 5 Sao</h1>
        <p className="subtitle">Tạo Tài Khoản Mới</p>

        <form onSubmit={handleSubmit}>
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
              onChange={(e) => {
                const v = e.target.value
                if (/^\d*$/.test(v)) {
                  handleChange(e)
                }
              }}
              placeholder="09xxxxxxxxx"
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

          {error && <div className="error-message">{error}</div>}

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
