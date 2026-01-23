import fetch from 'node-fetch'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBdtqU4ByiiseiY4LvTFHIJQWSAce2BKkI'
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent'

const fallbackResponses = {
  thực_đơn: 'Nhà hàng QT phục vụ các món ăn Á Châu đa dạng: Cơm, Mì, Canh, Gỏi, Salad và các món tráng miệng đặc sắc.',
  đặt_bàn: 'Bạn có thể đặt bàn qua mục "💳 Đặt Bàn". Chỉ cần chọn thời gian, số người, và những món ăn bạn muốn.',
  thanh_toán: 'Chúng tôi hỗ trợ: Chuyển khoản ngân hàng, Ví điện tử, và Tiền mặt.',
  đặt_món: 'Bạn có thể đặt món trực tiếp qua chat bằng cách nói "Đặt món [tên món]". Ví dụ: "Đặt món Phở bò".',
  default: 'Cảm ơn câu hỏi! Tôi có thể giúp bạn về: Thực đơn, Đặt bàn, Thanh toán, Khuyến mãi, Đặt món qua chat.'
}

const getFallbackResponse = (message) => {
  const lowerMsg = message.toLowerCase()
  if (lowerMsg.includes('thực đơn') || lowerMsg.includes('món ăn')) return { text: fallbackResponses.thực_đơn, action: null }
  if (lowerMsg.includes('đặt bàn') || lowerMsg.includes('bàn')) return { text: fallbackResponses.đặt_bàn, action: null }
  if (lowerMsg.includes('thanh toán') || lowerMsg.includes('chi phí')) return { text: fallbackResponses.thanh_toán, action: null }
  if (lowerMsg.includes('đặt món') || lowerMsg.includes('order')) return { text: fallbackResponses.đặt_món, action: null }
  return { text: fallbackResponses.default, action: null }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { message } = req.body

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Invalid message' })
    }

    console.log('Calling Gemini API with message:', message)

    const response = await fetch(GEMINI_URL + '?key=' + GEMINI_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Bạn là trợ lý AI chuyên về nhà hàng QT. Trả lời bằng JSON format: {"text": "nội dung trả lời ngắn gọn bằng tiếng Việt (dưới 80 từ)", "action": "add_to_cart" hoặc null, "item": "tên món nếu action là add_to_cart" hoặc null}

Dịch vụ: Thực đơn Á Châu, Đặt bàn online, Thanh toán linh hoạt, Khuyến mãi hấp dẫn, Đặt món trực tiếp qua chat.

Nếu người dùng muốn đặt món, hãy đặt action: "add_to_cart" và item là tên món cụ thể (ví dụ: "Phở bò", "Cơm tấm", etc.). Nếu không phải đặt món, action: null.

Ví dụ: Nếu người dùng nói "Đặt món Phở", trả lời {"text": "Đã thêm Phở vào giỏ hàng của bạn!", "action": "add_to_cart", "item": "Phở"}

Câu hỏi: ${message}`
              }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 200,
          temperature: 0.7,
        }
      })
    })

    const data = await response.json()
    console.log('Gemini response status:', response.status)

    if (!response.ok) {
      console.error('Gemini API error:', data)
      return { ...getFallbackResponse(message), fallback: true }
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      console.warn('No text in response:', data)
      return { ...getFallbackResponse(message), fallback: true }
    }

    try {
      const parsed = JSON.parse(text)
      if (parsed.text && typeof parsed.action === 'string' && parsed.item) {
        return { text: parsed.text, action: parsed.action, item: parsed.item, fallback: false }
      } else if (parsed.text) {
        return { text: parsed.text, action: null, item: null, fallback: false }
      }
    } catch (e) {
      console.warn('Failed to parse JSON response:', text)
      return { text: text, action: null, item: null, fallback: false }
    }

    return { text: text, action: null, item: null, fallback: false }
  } catch (error) {
    console.error('Chat API error:', error)
    return res.status(200).json({ 
      text: 'Xin lỗi, tôi gặp lỗi tạm thời. Vui lòng thử lại sau.',
      action: null,
      item: null,
      fallback: true,
      error: error.message 
    })
  }
}
