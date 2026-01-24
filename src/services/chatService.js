// Service để gọi Backend Chatbot API (Vercel Serverless Function)
const API_URL = '/api/chat';

// Phản hồi fallback khi API fail
const fallbackResponses = {
  thực_đơn: 'Nhà hàng QT phục vụ các món ăn Pháp - Ý thượng hạng: Steak, Sườn cừu, Gan ngỗng... Bạn có thể xem chi tiết trong mục "📋 Thực Đơn".',
  đặt_bàn: 'Dạ, Anh/Chị có thể đặt bàn qua mục "💳 Đặt Bàn" hoặc nhắn em thông tin thời gian nhé! 🥰',
  default: 'Dạ, em nghe đây ạ! Em có thể giúp Anh/Chị xem thực đơn, chọn món hoặc đặt bàn nha. ✨'
}

const getFallbackResponse = (message) => {
  const lowerMsg = message.toLowerCase()
  if (lowerMsg.includes('thực đơn') || lowerMsg.includes('món ăn') || lowerMsg.includes('ăn gì')) {
    return { text: fallbackResponses.thực_đơn, action: null, item: null }
  } else if (lowerMsg.includes('đặt bàn') || lowerMsg.includes('đặt') || lowerMsg.includes('bàn')) {
    return { text: fallbackResponses.đặt_bàn, action: null, item: null }
  }
  return { text: fallbackResponses.default, action: null, item: null }
}

// THÊM history vào tham số hàm ở đây
export const sendMessageToGemini = async (message, history = []) => {
  try {
    console.log('📤 Sending message & history to backend:', { message, history })
    
    const userId = localStorage.getItem('username') || 'guest-' + Date.now()
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: message,
        history: history, // GỬI THÊM LỊCH SỬ LÊN ĐÂY
        userId: userId
      })
    })

    if (!response.ok) {
      console.error('❌ Backend error status:', response.status)
      return { ...getFallbackResponse(message), fallback: true }
    }

    const data = await response.json()
    console.log('📥 Backend response content:', data)

    if (data && (data.text || data.reply)) {
      const finalChatText = data.text || data.reply;
      return { 
        text: finalChatText, 
        action: data.action || null, 
        item: data.item || null,
        fallback: false
      }
    }

    return { ...getFallbackResponse(message), fallback: true }

  } catch (error) {
    console.error('❌ Error calling backend API:', error)
    return { ...getFallbackResponse(message), fallback: true }
  }
}