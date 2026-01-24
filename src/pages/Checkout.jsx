import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createReservation, createOrder, createInvoice, payInvoice, getTables, getReservations, getCurrentUser } from '../api'
import '../styles/checkout.css'

export default function Checkout() {
  const [step, setStep] = useState(1)
  const [tables, setTables] = useState([])
  const [cart, setCart] = useState([])
  const [formData, setFormData] = useState({
    customerName: localStorage.getItem('username') || '',
    customerPhone: '',
    partySize: 2,
    reservationTime: '',
    tableId: null,
    notes: ''
  })
  const [paymentMethod, setPaymentMethod] = useState('qrcode')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [tablesRes, reservationsRes, userRes] = await Promise.all([getTables(), getReservations(), getCurrentUser().catch(()=>null)])
      const tablesData = tablesRes.data || []
      const reservationsData = reservationsRes.data || []

      // compute reserved table ids (exclude cancelled)
      const reservedIds = new Set(reservationsData.filter(r => r.status !== 'CANCELLED').map(r => r.table?.id).filter(Boolean))

      const mapped = tablesData.map(t => ({ ...t, available: !reservedIds.has(t.id) }))
      setTables(mapped)

      // prefill phone from user profile if available
      if (userRes && userRes.data) {
        const u = userRes.data
        if (u.phone && (!formData.customerPhone || formData.customerPhone === '')) {
          setFormData(f => ({ ...f, customerPhone: u.phone }))
        }
        if (u.fullName && (!formData.customerName || formData.customerName === '')) {
          setFormData(f => ({ ...f, customerName: u.fullName }))
        }
      }

      // Lấy dữ liệu từ localStorage (không phải sessionStorage)
      const savedCart = JSON.parse(localStorage.getItem('cart') || '[]')
      const savedTable = localStorage.getItem('selectedTable')
      const savedTime = localStorage.getItem('reservationTime')

      setCart(savedCart)
      if (savedTable) setFormData(f => ({ ...f, tableId: parseInt(savedTable) }))
      if (savedTime) setFormData(f => ({ ...f, reservationTime: savedTime }))
    } catch (err) {
      console.error('Lỗi:', err)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleNext = () => {
    if (step === 1) {
      if (!formData.customerPhone || !/^\d{10}$/.test(formData.customerPhone)) {
        setError('Số điện thoại phải đủ 10 chữ số')
        return
      }
      if (!formData.tableId) {
        setError('Vui lòng chọn bàn')
        return
      }
      if (!formData.reservationTime) {
        setError('Vui lòng chọn thời gian')
        return
      }
      // validate party size <= table capacity
      const table = tables.find(t => t.id === parseInt(formData.tableId))
      if (table && table.capacity != null) {
        if (parseInt(formData.partySize) > table.capacity) {
          setError(`Số người (${formData.partySize}) lớn hơn sức chứa của bàn (${table.capacity})`)
          return
        }
        if (!table.available) {
          setError('Bàn đã được đặt. Vui lòng chọn bàn khác.')
          return
        }
      }
    }
    setError('')
    setStep(step + 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      // Tạo đặt bàn
      const reservationData = {
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        partySize: parseInt(formData.partySize),
        reservationTime: formData.reservationTime,
        table: { id: parseInt(formData.tableId) },
        status: 'CONFIRMED'
      }

      console.log('Creating reservation:', reservationData)
      const reservationRes = await createReservation(reservationData)
      console.log('Reservation response:', reservationRes)
      const reservationData_created = reservationRes.data || reservationRes
      console.log('Reservation created:', reservationData_created)

      // Tạo đơn hàng
      const cart = JSON.parse(localStorage.getItem('cart') || '[]')
      console.log('Cart data:', cart)
      
        if (cart.length > 0) {
        const orderData = {
          table: { id: parseInt(formData.tableId) },
          reservationId: reservationData_created?.id,
          items: cart.map(item => ({
            menuItem: { id: item.id },
            quantity: item.quantity,
            price: item.price
          })),
          notes: formData.notes,
          status: 'NEW'
        }

        console.log('Creating order:', orderData)
        const orderRes = await createOrder(orderData)
        console.log('Order response full:', orderRes)
        console.log('Order response.data:', orderRes.data)
        const orderData_created = orderRes.data || orderRes
        console.log('Order created object:', orderData_created)
        console.log('Order created with ID:', orderData_created?.id)

        if (!orderData_created?.id) {
          console.error('Order ID is missing. Full object:', JSON.stringify(orderData_created))
          throw new Error('Order creation failed: no order ID returned')
        }

        // Tạo invoice
        console.log('Creating invoice for order:', orderData_created.id)
        const invoiceRes = await createInvoice(orderData_created.id)
        console.log('Invoice response full:', invoiceRes)
        console.log('Invoice response.data:', invoiceRes.data)
        const invoiceData = invoiceRes.data || invoiceRes
        console.log('Invoice created object:', invoiceData)
        console.log('Invoice created with ID:', invoiceData?.id)

        if (!invoiceData?.id) {
          console.error('Invoice ID is missing. Full object:', JSON.stringify(invoiceData))
          throw new Error('Invoice creation failed: no invoice ID returned')
        }

        // Xử lý thanh toán
        if (paymentMethod === 'qrcode' || paymentMethod === 'bank' || paymentMethod === 'momo') {
          // Lưu vào localStorage để trang Payment có dữ liệu hiển thị
          localStorage.setItem('pendingPayment', JSON.stringify({
            invoiceId: invoiceData.id,
            amount: invoiceData.amount,
            method: paymentMethod,
            orderId: orderData_created.id
          }))
          // Chuyển sang trang hiện mã QR (Momo bây giờ sẽ nhảy vào đây)
          navigate('/payment')
        } else {
          // Chỉ dành cho Thanh toán tại quán (cash)
          console.log('Processing direct payment with method:', paymentMethod)
          await payInvoice(invoiceData.id, invoiceData.amount, paymentMethod)
          alert('Đơn hàng đã được ghi nhận! Vui lòng thanh toán tại quầy.')
          
          localStorage.removeItem('cart')
          localStorage.removeItem('selectedTable')
          localStorage.removeItem('reservationTime')
          navigate('/orders')
        }
      } else {
        // Chỉ đặt bàn, không có món ăn
        alert('Thanh toán thành công! Bàn của bạn đã được xác nhận.')
        localStorage.removeItem('cart')
        localStorage.removeItem('selectedTable')
        localStorage.removeItem('reservationTime')
        navigate('/orders')
      }
    } catch (err) {
      console.error('Error in handleSubmit:', err)
      console.error('Error response:', err.response)
      console.error('Error data:', err.response?.data)
      
      let errorMsg = 'Có lỗi xảy ra khi xử lý đơn hàng'
      
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message
      } else if (err.response?.data?.error) {
        errorMsg = err.response.data.error
      } else if (typeof err.response?.data === 'string') {
        errorMsg = err.response.data
      } else if (err.response?.data) {
        errorMsg = JSON.stringify(err.response.data)
      } else if (err.message && err.message !== 'No message available') {
        errorMsg = err.message
      }
      
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="checkout-container">
      <div className="checkout-wrapper">
        <div className="steps">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Thông Tin</div>
          </div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Thanh Toán</div>
          </div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Xác Nhận</div>
          </div>
        </div>

        <div className="checkout-content">
          {step === 1 && (
            <div className="checkout-step">
              <h2>📋 Thông Tin Đặt Bàn</h2>
              
              <div className="form-group">
                <label>Tên khách</label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  placeholder="Nhập tên"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Số điện thoại</label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={(e) => {
                    const v = e.target.value
                    if (/^\d*$/.test(v)) {
                      handleInputChange(e)
                    }
                  }}
                  placeholder="0xxxxxxxxx"
                  maxLength="10"
                  pattern="\\d{10}"
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Số người</label>
                  <input
                    type="number"
                    name="partySize"
                    value={formData.partySize}
                    onChange={handleInputChange}
                    min="1"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label>Chọn bàn</label>
                  <select
                    name="tableId"
                    value={formData.tableId || ''}
                    onChange={handleInputChange}
                    disabled={loading}
                  >
                    <option value="">-- Chọn bàn --</option>
                    {tables.map(table => (
                      <option key={table.id} value={table.id} disabled={!table.available}>
                        {table.name} ({table.capacity} người){!table.available ? ' — (Đã đặt)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Thời gian</label>
                <input
                  type="datetime-local"
                  name="reservationTime"
                  value={formData.reservationTime}
                  onChange={handleInputChange}
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label>Ghi chú (tùy chọn)</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Có ghi chú gì không?"
                  disabled={loading}
                  rows="3"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="checkout-step">
              <h2>💳 Chọn Phương Thức Thanh Toán</h2>
              <div className="section-info">
                <strong>Bàn đã chọn:</strong> {tables.find(t => t.id === formData.tableId)?.name} | 
                <strong> Thời gian:</strong> {new Date(formData.reservationTime).toLocaleString('vi-VN')}
              </div>

              <div className="payment-options">
                <label className="payment-option">
                  <input
                    type="radio"
                    name="payment"
                    value="qrcode"
                    checked={paymentMethod === 'qrcode'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="option-content">
                    <div className="option-title">📱 Quét Mã QR</div>
                    <div className="option-desc">Quét mã QR để thanh toán qua ngân hàng</div>
                  </div>
                </label>

                <label className="payment-option">
                  <input
                    type="radio"
                    name="payment"
                    value="momo"
                    checked={paymentMethod === 'momo'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="option-content">
                    <div className="option-title">🔴 Ví Momo</div>
                    <div className="option-desc">Thanh toán qua ứng dụng Momo</div>
                  </div>
                </label>

                <label className="payment-option">
                  <input
                    type="radio"
                    name="payment"
                    value="bank"
                    checked={paymentMethod === 'bank'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="option-content">
                    <div className="option-title">🏦 Chuyển Khoản Ngân Hàng</div>
                    <div className="option-desc">Chuyển tiền trực tiếp vào tài khoản nhà hàng</div>
                  </div>
                </label>

                <label className="payment-option">
                  <input
                    type="radio"
                    name="payment"
                    value="cash"
                    checked={paymentMethod === 'cash'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="option-content">
                    <div className="option-title">💵 Thanh Toán Tại Quán</div>
                    <div className="option-desc">Thanh toán bằng tiền mặt khi đến quán</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="checkout-step">
              <h2>✅ Xác Nhận Đặt Bàn</h2>
              <div className="confirmation">
                <div className="confirm-section">
                  <div className="confirm-title">📋 Thông Tin Khách</div>
                  <div className="confirm-item">
                    <span>Tên khách:</span>
                    <strong>{formData.customerName}</strong>
                  </div>
                  <div className="confirm-item">
                    <span>Số điện thoại:</span>
                    <strong>{formData.customerPhone}</strong>
                  </div>
                </div>
                
                <div className="confirm-section">
                  <div className="confirm-title">🍽️ Thông Tin Đặt Bàn</div>
                  <div className="confirm-item">
                    <span>Bàn:</span>
                    <strong>{tables.find(t => t.id === formData.tableId)?.name}</strong>
                  </div>
                  <div className="confirm-item">
                    <span>Số người:</span>
                    <strong>{formData.partySize} người</strong>
                  </div>
                  <div className="confirm-item">
                    <span>Thời gian:</span>
                    <strong>{new Date(formData.reservationTime).toLocaleString('vi-VN')}</strong>
                  </div>
                </div>
                
                <div className="confirm-section">
                  <div className="confirm-title">💳 Phương Thức Thanh Toán</div>
                  <div className="confirm-item">
                    <strong>
                      {paymentMethod === 'qrcode' && '📱 Quét Mã QR'}
                      {paymentMethod === 'momo' && '🔴 Ví Momo'}
                      {paymentMethod === 'bank' && '🏦 Chuyển Khoản Ngân Hàng'}
                      {paymentMethod === 'cash' && '💵 Thanh Toán Tại Quán'}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="error-section">
              <div className="error-message">
                <strong>❌ Lỗi:</strong> {error}
              </div>
            </div>
          )}

          <div className="checkout-actions">
            {step > 1 && (
              <button 
                className="btn-back"
                onClick={() => {
                  if (step === 2 && cart.length === 0) {
                    navigate('/menu')
                  } else {
                    setStep(step - 1)
                  }
                }}
                disabled={loading}
              >
                ← Quay Lại {step === 2 ? 'Chọn Món' : 'Thanh Toán'}
              </button>
            )}
            
            {step < 3 && (
              <button 
                className="btn-primary"
                onClick={handleNext}
                disabled={loading}
              >
                Tiếp Tục →
              </button>
            )}

            {step === 3 && (
              <>
                <button 
                  className="btn-primary"
                  onClick={() => setStep(2)}
                  disabled={loading}
                >
                  ← Quay Lại Chọn Thanh Toán
                </button>
                <button 
                  className="btn-success"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Đang xử lý...' : '✅ Xác Nhận Đặt Bàn'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
