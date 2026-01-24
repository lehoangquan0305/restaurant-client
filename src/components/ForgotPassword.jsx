import React, { useState } from 'react'
import emailjs from '@emailjs/browser'
import toast, { Toaster } from 'react-hot-toast'
import { useNavigate, Link } from 'react-router-dom'
import '../styles/auth.css'

export default function ForgotPassword() {
  const navigate = useNavigate()
  
  const [email, setEmail] = useState('')
  const [otpInput, setOtpInput] = useState('')
  const [systemOtp, setSystemOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) 

  // BƯỚC 1: GỬI MÃ OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    
    // Kiểm tra email trống
    if (!email.trim()) {
      return toast.error("Cậu chưa nhập Email kìa!");
    }

    setLoading(true);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSystemOtp(code);

    const now = new Date();
    now.setMinutes(now.getMinutes() + 15);
    const expiryTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const toastId = toast.loading("Hệ thống đang gửi mã...");

    try {
      await emailjs.send(
        'service_s4dnq0q', 
        'template_oyfnerr', // Đã xóa dấu cách thừa ở đây
        { 
          to_email: email,
          passcode: code,
          time: expiryTime
        },
        '_NW44dIfZUTCSQJJO'
      );

      toast.dismiss(toastId);
      toast.success("Mã OTP đã gửi! Check mail ngay cậu ơi.");
      setStep(2);
    } catch (error) {
      toast.dismiss(toastId);
      toast.error("Gửi thất bại! Kiểm tra lại ID hoặc kết nối mạng.");
    } finally {
      setLoading(false);
    }
  };

  // BƯỚC 2: XÁC THỰC MÃ OTP
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    
    // Kiểm tra OTP trống
    if (!otpInput.trim()) {
      return toast.error("Vui lòng nhập mã OTP để xác nhận!");
    }

    if (otpInput === systemOtp) {
      toast.success("Xác thực thành công!");
      setStep(3);
    } else {
      toast.error("Mã OTP không chính xác, thử lại xem sao!");
    }
  }

  // BƯỚC 3: ĐẶT MẬT KHẨU MỚI
  const handleResetPassword = (e) => {
    e.preventDefault();
    
    // Kiểm tra mật khẩu trống
    if (!newPassword.trim()) {
      return toast.error("Cậu quên nhập mật khẩu mới rồi!");
    }

    if (newPassword.length < 6) {
      return toast.error("Mật khẩu mới phải tối thiểu 6 ký tự!");
    }
    
    toast.success("Mật khẩu đã được cập nhật thành công!");
    setTimeout(() => {
      navigate('/login');
    }, 2000);
  }

  return (
    <div className="auth-container">
      <Toaster position="top-center" />
      <div className="auth-card">
        <h1>🍽️ Nhà Hàng QT</h1>
        
        <h2 className="subtitle">
          {step === 1 && "Quên Mật Khẩu"}
          {step === 2 && "Xác Thực OTP"}
          {step === 3 && "Đặt Lại Mật Khẩu"}
        </h2>

        {/* BƯỚC 1: NHẬP EMAIL */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} noValidate>
            <div className="form-group">
              <label>Email khôi phục</label>
              <input 
                type="email" 
                placeholder="Nhập Gmail đã đăng ký" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Đang xử lý..." : "Gửi mã xác nhận"}
            </button>
          </form>
        )}

        {/* BƯỚC 2: NHẬP OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} noValidate>
            <p style={{fontSize: '14px', marginBottom: '10px'}}>
              Mã xác nhận gồm 6 số đã được gửi tới: <b>{email}</b>
            </p>
            <div className="form-group">
              <input 
                type="text" 
                placeholder="xxxxxx" 
                maxLength={6} 
                value={otpInput} 
                onChange={(e) => setOtpInput(e.target.value)} 
                style={{textAlign: 'center', fontSize: '24px', letterSpacing: '5px'}}
              />
            </div>
            <button type="submit" className="btn-primary">Xác thực mã</button>
            <p className="auth-switch" onClick={() => setStep(1)} style={{cursor:'pointer', marginTop: '10px'}}>
              Gửi lại mã khác
            </p>
          </form>
        )}

        {/* BƯỚC 3: ĐỔI PASS */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} noValidate>
            <div className="form-group">
              <label>Mật khẩu mới</label>
              <input 
                type="password" 
                placeholder="Nhập mật khẩu mới" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
              />
            </div>
            <button type="submit" className="btn-primary">Cập nhật mật khẩu</button>
          </form>
        )}

        <p className="auth-switch" style={{marginTop: '20px'}}>
          <Link to="/login">Quay lại Đăng nhập</Link>
        </p>
      </div>
    </div>
  )
}