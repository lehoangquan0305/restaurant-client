// Service để gọi Backend Chatbot API (Spring Boot + Gemini)
const API_URL = '/api/chat'

// Phản hồi fallback khi API fail
const fallbackResponses = {
  thực_đơn: 'Nhà hàng QT phục vụ các món ăn Á Châu đa dạng: Cơm, Mì, Canh, Gỏi, Salad và các món tráng miệng đặc sắc. Bạn có thể xem chi tiết trong mục "📋 Thực Đơn".',
  đặt_bàn: 'Bạn có thể đặt bàn qua mục "💳 Đặt Bàn". Chỉ cần chọn thời gian, số người, và những món ăn bạn muốn. Chúng tôi sẽ xác nhận lịch đặt của bạn.',
  thanh_toán: 'Chúng tôi hỗ trợ: Chuyển khoản ngân hàng, Ví điện tử, và Tiền mặt. Bạn có thể chọn phương thức phù hợp nhất khi thanh toán.',
  liên_hệ: 'Bạn có thể liên hệ với chúng tôi qua hotline hoặc website. Đội ngũ nhà hàng sẽ sẵn sàng hỗ trợ bạn.',
  giá_cả: 'Giá cả các món ăn rất hợp lý và cạnh tranh. Bạn có thể xem chi tiết giá từng món trong thực đơn.',
  khuyến_mãi: 'Nhà hàng QT thường xuyên có các khuyến mãi hấp dẫn. Vui lòng kiểm tra thực đơn hoặc liên hệ để biết thêm chi tiết.',
  default: 'Cảm ơn câu hỏi! 😊 Tôi có thể giúp bạn về: Thực đơn, Đặt bàn, Thanh toán, Khuyến mãi, Hoặc bất kỳ câu hỏi nào về nhà hàng QT.'
}

const getFallbackResponse = (message) => {
  const lowerMsg = message.toLowerCase()
  if (lowerMsg.includes('thực đơn') || lowerMsg.includes('món ăn') || lowerMsg.includes('ăn gì')) {
    return { text: fallbackResponses.thực_đơn, action: null, item: null }
  } else if (lowerMsg.includes('đặt bàn') || lowerMsg.includes('đặt') || lowerMsg.includes('bàn')) {
    return { text: fallbackResponses.đặt_bàn, action: null, item: null }
  } else if (lowerMsg.includes('thanh toán') || lowerMsg.includes('trả tiền') || lowerMsg.includes('chi phí')) {
    return { text: fallbackResponses.thanh_toán, action: null, item: null }
  } else if (lowerMsg.includes('liên hệ') || lowerMsg.includes('hotline') || lowerMsg.includes('điện thoại')) {
    return { text: fallbackResponses.liên_hệ, action: null, item: null }
  } else if (lowerMsg.includes('giá') || lowerMsg.includes('tiền')) {
    return { text: fallbackResponses.giá_cả, action: null, item: null }
  } else if (lowerMsg.includes('khuyến mãi') || lowerMsg.includes('giảm') || lowerMsg.includes('sale')) {
    return { text: fallbackResponses.khuyến_mãi, action: null, item: null }
  }
  return { text: fallbackResponses.default, action: null, item: null }
}

export const sendMessageToGemini = async (message) => {
  try {
    console.log('📤 Sending message to backend:', message)
    
    // Lấy userId từ localStorage (được set khi login)
    const userId = localStorage.getItem('username') || 'guest-' + Date.now()
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: message,
        userId: userId
      })
    })

    console.log('📥 Backend response status:', response.status)
    const data = await response.json()
    console.log('📥 Backend response:', data)

    if (!response.ok) {
      console.error('❌ Backend error:', data)
      return getFallbackResponse(message)
    }

    if (data.reply) {
      console.log('✅ Got AI response from Gemini:', data.reply)
      return { text: data.reply, action: data.action || null, item: data.item || null }
    }

    if (data.error) {
      console.error('❌ Backend returned error:', data.error)
      return getFallbackResponse(message)
    }

    console.error('❌ Invalid response format:', data)
    return getFallbackResponse(message)
  } catch (error) {
    console.error('❌ Error calling backend API:', error)
    // Sử dụng fallback response khi có lỗi
    return getFallbackResponse(message)
  }
}

