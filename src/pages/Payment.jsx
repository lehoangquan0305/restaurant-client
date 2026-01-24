import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { payInvoice } from '../api'
import '../styles/payment.css'

export default function Payment() {
  const [pending, setPending] = useState(null)
  const [status, setStatus] = useState('waiting')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // THÔNG TIN NGÂN HÀNG CỦA CẬU
  const MY_BANK = {
    BANK_ID: "tpbank", 
    ACCOUNT_NO: "0934016724", 
    ACCOUNT_NAME: "LE HOANG QUAN"
  }

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
                <div className="qr-code" style={{ textAlign: 'center', margin: '20px 0' }}>
                  {/* Mã QR VietQR xịn xò tự động điền tiền và nội dung */}
                  <img 
                    src={`https://img.vietqr.io/image/${MY_BANK.BANK_ID}-${MY_BANK.ACCOUNT_NO}-compact.png?amount=${pending.amount}&addInfo=Thanh toan hoa don ${pending.invoiceId}&accountName=${MY_BANK.ACCOUNT_NAME}`} 
                    alt="Mã QR Thanh Toán" 
                    style={{ width: '100%', maxWidth: '250px', borderRadius: '15px', border: '2px solid #f1f1f1', padding: '10px' }}
                  />
                </div>
                <p className="qr-info">
                  Mã QR tương ứng với số tiền: <strong>{pending.amount?.toLocaleString?.()} ₫</strong>
                </p>
                <p className="qr-text" style={{ fontSize: '13px', color: '#666' }}>
                  Sử dụng ứng dụng Ngân hàng để quét mã QR và thanh toán tự động.
                </p>
              </div>
            )}

            {/* ... Phần Momo và các phần dưới giữ nguyên như cũ của cậu nhé ... */}
            {pending.method === 'momo' && (
              <div className="momo-section">
                <h2>🔴 Thanh Toán Qua Momo</h2>
                <div className="momo-info">
                  <p><strong>Số tiền:</strong> {pending.amount?.toLocaleString?.()} ₫</p>
                  <p><strong>Nội dung chuyển:</strong> Thanh toán hóa đơn {pending.invoiceId}</p>
                  <p><strong>Số điện thoại Momo:</strong> 0934016724</p>
                </div>
              </div>
            )}

            <div className="payment-amount">
              <span>Tổng thanh toán:</span>
              <strong>{pending.amount?.toLocaleString?.()} ₫</strong>
            </div>

            <div className="payment-actions">
              <button className="btn-cancel" onClick={() => navigate('/checkout')} disabled={loading}>
                ← Quay Lại
              </button>
              <button className="btn-confirm" onClick={handlePaymentConfirm} disabled={loading}>
                {loading ? '⏳ Đang xử lý...' : '✅ Tôi Đã Thanh Toán'}
              </button>
            </div>
          </>
        )}

        {/* ... Success/Failed view giữ nguyên ... */}
        {status === 'success' && (
          <div className="payment-success">
            <div className="success-icon" style={{fontSize: '50px'}}>✅</div>
            <h1>Thanh Toán Thành Công!</h1>
            <p>Đang chuyển hướng đến đơn hàng của bạn...</p>
          </div>
        )}
      </div>
    </div>
  )
}