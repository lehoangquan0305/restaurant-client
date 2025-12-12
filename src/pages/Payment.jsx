import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { payInvoice } from '../api'
import '../styles/payment.css'

export default function Payment() {
  const [pending, setPending] = useState(null)
  const [status, setStatus] = useState('waiting')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('pendingPayment') || '{}')
    setPending(data)
  }, [])

  const handlePaymentConfirm = async () => {
    if (!pending) return

    setLoading(true)
    try {
      await payInvoice(pending.invoiceId, pending.amount, pending.method)
      setStatus('success')
      localStorage.removeItem('pendingPayment')
      localStorage.removeItem('cart')
      localStorage.removeItem('selectedTable')
      localStorage.removeItem('reservationTime')
      
      setTimeout(() => {
        navigate('/orders')
      }, 2000)
    } catch (err) {
      setStatus('failed')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!pending || !pending.invoiceId) {
    return (
      <div className="payment-container">
        <div className="payment-card">
          <p>Không có thanh toán nào trong chờ xử lý</p>
          <button onClick={() => navigate('/menu')}>← Quay lại Thực đơn</button>
        </div>
      </div>
    )
  }

  return (
    <div className="payment-container">
      <div className="payment-card">
        {status === 'waiting' && (
          <>
            <div className="payment-header">
              <h1>💳 Thanh Toán</h1>
              <p>Phương thức: {pending.method === 'qrcode' ? 'Quét Mã QR' : pending.method === 'momo' ? 'Ví Momo' : 'Chuyển Khoản Ngân Hàng'}</p>
            </div>

            {(pending.method === 'qrcode' || pending.method === 'bank') && (
              <div className="qr-section">
                <h2>📱 Quét Mã QR Để Thanh Toán</h2>
                <div className="qr-code">
                  <div className="qr-placeholder">
                    [Mã QR]
                  </div>
                </div>
                <p className="qr-info">
                  Mã QR tương ứng với số tiền: <strong>{pending.amount?.toLocaleString?.()} ₫</strong>
                </p>
                <p className="qr-text">
                  Quét mã QR này bằng ứng dụng ngân hàng hoặc Momo của bạn để thanh toán
                </p>
              </div>
            )}

            {pending.method === 'momo' && (
              <div className="momo-section">
                <h2>🔴 Thanh Toán Qua Momo</h2>
                <div className="momo-info">
                  <p><strong>Số tiền:</strong> {pending.amount?.toLocaleString?.()} ₫</p>
                  <p><strong>Nội dung chuyển:</strong> Thanh toán hóa đơn {pending.invoiceId}</p>
                  <p><strong>Số điện thoại Momo:</strong> 0XX XXX XXXX</p>
                </div>
                <p className="momo-text">
                  Vui lòng mở ứng dụng Momo và chuyển tiền theo thông tin trên
                </p>
              </div>
            )}

            <div className="payment-amount">
              <span>Tổng thanh toán:</span>
              <strong>{pending.amount?.toLocaleString?.()} ₫</strong>
            </div>

            <div className="payment-actions">
              <button 
                className="btn-cancel"
                onClick={() => navigate('/checkout')}
                disabled={loading}
              >
                ← Quay Lại Chỉnh Sửa
              </button>
              <button 
                className="btn-confirm"
                onClick={handlePaymentConfirm}
                disabled={loading}
              >
                {loading ? '⏳ Đang xử lý...' : '✅ Tôi Đã Thanh Toán'}
              </button>
            </div>
          </>
        )}

        {status === 'success' && (
          <div className="payment-success">
            <div className="success-icon">✅</div>
            <h1>Thanh Toán Thành Công!</h1>
            <p>Cảm ơn bạn đã đặt bàn và chọn món tại nhà hàng của chúng tôi</p>
            <p className="success-message">Đang chuyển hướng đến danh sách đơn hàng...</p>
          </div>
        )}

        {status === 'failed' && (
          <div className="payment-failed">
            <div className="failed-icon">❌</div>
            <h1>Thanh Toán Thất Bại</h1>
            <p>Có lỗi xảy ra khi xử lý thanh toán. Vui lòng thử lại.</p>
            <button onClick={() => setStatus('waiting')}>← Thử Lại</button>
          </div>
        )}
      </div>
    </div>
  )
}
