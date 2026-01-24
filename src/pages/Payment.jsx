import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { payInvoice } from '../api' // Lưu ý: Nếu có api cancelInvoice thì nên thêm vào
import '../styles/payment.css'

export default function Payment() {
  const [pending, setPending] = useState(null)
  const [status, setStatus] = useState('waiting')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const MY_BANK = {
    BANK_ID: "tpbank", 
    ACCOUNT_NO: "0934016724", 
    ACCOUNT_NAME: "LE HOANG QUAN"
  }

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('pendingPayment') || '{}')
    if (!data.invoiceId) {
        navigate('/menu')
    }
    setPending(data)

    // CHỐN LỖI: Nếu user bấm nút Back của trình duyệt
    const handlePopState = () => {
      localStorage.removeItem('pendingPayment');
    };
    window.addEventListener('popstate', handlePopState);
    
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate])

  // HÀM XỬ LÝ QUAY LẠI (QUAN TRỌNG)
  const handleBackToCheckout = () => {
    // Xóa dữ liệu thanh toán đang chờ để tránh bị "nhận vơ" là đã thanh toán
    localStorage.removeItem('pendingPayment');
    navigate('/checkout');
  }

  const handlePaymentConfirm = async () => {
    if (!pending) return

    setLoading(true)
    try {
      await payInvoice(pending.invoiceId, pending.amount, pending.method)
      
      // Xóa toàn bộ dữ liệu liên quan sau khi thanh toán THÀNH CÔNG
      localStorage.removeItem('pendingPayment')
      localStorage.removeItem('cart')
      localStorage.removeItem('selectedTable')
      localStorage.removeItem('reservationTime')
      
      setStatus('success')
      
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
    return <div className="payment-container"><div className="payment-card">Đang tải thông tin thanh toán...</div></div>
  }

  return (
    <div className="payment-container">
      <div className="payment-card">
        {status === 'waiting' && (
          <>
            <div className="payment-header">
              <h1>💳 Thanh Toán</h1>
              <p>Phương thức: {
                pending.method === 'qrcode' ? '📱 Quét Mã QR' : 
                pending.method === 'momo' ? '🔴 Ví Momo' : 
                pending.method === 'bank' ? '🏦 Chuyển Khoản' : '💵 Tại Quầy'
              }</p>
            </div>

            {(pending.method === 'qrcode' || pending.method === 'bank') && (
              <div className="qr-section">
                <h2>📱 Quét QR Ngân Hàng</h2>
                <div className="qr-code" style={{ textAlign: 'center', margin: '20px 0' }}>
                  <img 
                    src={`https://img.vietqr.io/image/${MY_BANK.BANK_ID}-${MY_BANK.ACCOUNT_NO}-compact.png?amount=${pending.amount}&addInfo=Thanh toan hoa don ${pending.invoiceId}&accountName=${MY_BANK.ACCOUNT_NAME}`} 
                    alt="VietQR" 
                    style={{ width: '100%', maxWidth: '250px', borderRadius: '15px', border: '2px solid #007bff', padding: '10px' }}
                  />
                </div>
                <p className="qr-info">Số tiền: <strong>{pending.amount?.toLocaleString()} ₫</strong></p>
                <p className="qr-text" style={{ fontSize: '13px', color: '#666' }}>Quét mã bằng App ngân hàng để thanh toán tự động.</p>
              </div>
            )}

            {pending.method === 'momo' && (
              <div className="momo-section" style={{ textAlign: 'center' }}>
                <h2 style={{ color: '#a50064' }}>🔴 Thanh Toán Momo / QR</h2>
                <div className="qr-code" style={{ margin: '20px 0' }}>
                  <img 
                    src={`https://img.vietqr.io/image/${MY_BANK.BANK_ID}-${MY_BANK.ACCOUNT_NO}-compact.png?amount=${pending.amount}&addInfo=Thanh toan hoa don ${pending.invoiceId}&accountName=${MY_BANK.ACCOUNT_NAME}`} 
                    alt="Momo QR" 
                    style={{ width: '100%', maxWidth: '220px', borderRadius: '15px', border: '4px solid #a50064', padding: '5px' }}
                  />
                </div>
                <p>Nội dung CK: <strong>#{pending.invoiceId}</strong></p>
                <p style={{ fontSize: '12px', color: '#666' }}>Dùng Momo hoặc App Ngân hàng quét đều được!</p>
              </div>
            )}

            {pending.method === 'cash' && (
              <div className="cash-section" style={{ padding: '30px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: '60px' }}>🏃‍♂️</div>
                <h2 style={{ color: '#2ecc71' }}>Thanh Toán Tại Quầy</h2>
                <p>Vui lòng đọc mã hóa đơn này cho thu ngân:</p>
                <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '8px', margin: '15px 0', fontSize: '22px', fontWeight: 'bold', color: '#333', border: '1px dashed #ccc' }}>
                  #{pending.invoiceId}
                </div>
              </div>
            )}

            <div className="payment-amount" style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
              <span>Số tiền cần trả:</span>
              <strong style={{ fontSize: '24px', color: '#e74c3c' }}>{pending.amount?.toLocaleString()} ₫</strong>
            </div>

            <div className="payment-actions" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn-cancel" onClick={handleBackToCheckout} disabled={loading} style={{ flex: 1, cursor: 'pointer' }}>
                ← Quay Lại
              </button>
              <button className="btn-confirm" onClick={handlePaymentConfirm} disabled={loading} style={{ flex: 2, cursor: 'pointer' }}>
                {loading ? '⏳ Đang xử lý...' : (pending.method === 'cash' ? '✅ Xác nhận thanh toán' : '✅ Tôi Đã Chuyển Khoản')}
              </button>
            </div>
          </>
        )}

        {status === 'success' && (
          <div className="payment-success" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div className="success-icon" style={{ fontSize: '60px', marginBottom: '20px' }}>🎉</div>
            <h1>Thành Công!</h1>
            <p>Hệ thống đang kiểm tra và xử lý món ăn cho bạn.</p>
            <p style={{ color: '#7f8c8d', fontSize: '14px', marginTop: '10px' }}>Tự động chuyển trang sau 2 giây...</p>
          </div>
        )}

        {status === 'failed' && (
          <div className="payment-failed" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div className="failed-icon" style={{ fontSize: '60px', marginBottom: '20px' }}>⚠️</div>
            <h1>Giao Dịch Thất Bại</h1>
            <p>Không thể cập nhật trạng thái hóa đơn. Vui lòng thử lại hoặc báo nhân viên.</p>
            <button className="btn-confirm" onClick={() => setStatus('waiting')} style={{ marginTop: '20px', padding: '10px 20px' }}>Thử lại</button>
          </div>
        )}
      </div>
    </div>
  )
}