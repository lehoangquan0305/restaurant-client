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
    return { text: fallbackResponses.thực_đơn, action: null, items: [] }
  } else if (lowerMsg.includes('đặt bàn') || lowerMsg.includes('đặt') || lowerMsg.includes('bàn')) {
    return { text: fallbackResponses.đặt_bàn, action: null, items: [] }
  }
  return { text: fallbackResponses.default, action: null, items: [] }
}

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
        history: history,
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
      
      // LOGIC MỚI: Chuẩn hóa dữ liệu trả về cho Frontend
      // Nếu Backend trả về 'item' (chuỗi), ta biến nó thành mảng 'items' để đồng bộ
      let finalItems = [];
      if (data.items && Array.isArray(data.items)) {
        finalItems = data.items;
      } else if (data.item) {
        // Nếu là chuỗi, kiểm tra xem có dấu phẩy không để tách ra
        finalItems = data.item.includes(',') 
          ? data.item.split(',').map(i => i.trim()) 
          : [data.item.trim()];
      }

      return { 
        text: finalChatText, 
        action: data.action || null, 
        items: finalItems, // Luôn trả về mảng để Frontend dễ xử lý vòng lặp
        fallback: false
      }
    }

    return { ...getFallbackResponse(message), fallback: true }

  } catch (error) {
    console.error('❌ Error calling backend API:', error)
    return { ...getFallbackResponse(message), fallback: true }
  }
}