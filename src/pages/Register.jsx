import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../api'
import toast, { Toaster } from "react-hot-toast"
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

  // Quản lý lỗi riêng cho từng ô
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    // Xóa lỗi của ô đó khi người dùng bắt đầu sửa
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFieldErrors({})

    const { username, password, confirmPassword, fullName, email, phone } = formData
    let errors = {}

    // Kiểm tra lỗi và nhét vào Object
    if (username.trim().length < 3) errors.username = 'Tên đăng nhập tối thiểu 3 ký tự'
    if (!fullName.trim()) errors.fullName = 'Vui lòng nhập họ tên đầy đủ'
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) errors.email = 'Định dạng Email không hợp lệ'
    
    if (!/^\d{10}$/.test(phone.trim())) errors.phone = 'Số điện thoại phải đúng 10 số'
    
    if (password.length < 6) errors.password = 'Mật khẩu phải từ 6 ký tự trở lên'
    
    if (password !== confirmPassword) errors.confirmPassword = 'Mật khẩu xác nhận không khớp'

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      // Vẫn bắn toast cho nó rôm rả
      toast.error("Vui lòng sửa các lỗi đỏ bên dưới!")
      return
    }

    setLoading(true)
    try {
      await register(username.trim(), password, fullName.trim(), email.trim(), phone.trim())
      toast.success('Đăng ký thành công!')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  // Hàm render ô input kèm thông báo lỗi "kiểu cũ" của cậu
  const renderField = (label, name, type, placeholder, extra = {}) => (
    <div className="form-group">
      <label>{label}</label>
      <input
        type={type}
        name={name}
        value={formData[name]}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={loading}
        className={fieldErrors[name] ? 'input-error-border' : ''}
        {...extra}
      />
      {fieldErrors[name] && (
        <div className="error-message shake-animation" style={{ marginTop: '5px', padding: '8px' }}>
          ⚠️ {fieldErrors[name]}
        </div>
      )}
    </div>
  )

  return (
    <div className="auth-container">
      <Toaster position="top-right" /> 

      <div className="auth-card">
        <h1>🍽️ Nhà Hàng QT</h1>
        <p className="subtitle">Tạo Tài Khoản Mới</p>

        <form onSubmit={handleSubmit} noValidate>
          {renderField("Tên đăng nhập", "username", "text", "Chọn tên đăng nhập")}
          {renderField("Họ tên", "fullName", "text", "Nhập họ tên đầy đủ")}
          {renderField("Email", "email", "email", "Nhập email")}
          {renderField("Số điện thoại", "phone", "tel", "09xxxxxxxx", {
             maxLength: 10,
             onChange: (e) => /^\d*$/.test(e.target.value) && handleChange(e)
          })}
          {renderField("Mật khẩu", "password", "password", "Tối thiểu 6 ký tự")}
          {renderField("Xác nhận mật khẩu", "confirmPassword", "password", "Nhập lại mật khẩu")}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Đang xử lý...' : 'Tạo Tài Khoản'}
          </button>
        </form>

        <p className="auth-switch">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
    </div>
  )
}