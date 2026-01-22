import fetch from 'node-fetch'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBdtqU4ByiiseiY4LvTFHIJQWSAce2BKkI'
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent'

const fallbackResponses = {
  thực_đơn: 'Nhà hàng QT phục vụ các món ăn Á Châu đa dạng: Cơm, Mì, Canh, Gỏi, Salad và các món tráng miệng đặc sắc.',
  đặt_bàn: 'Bạn có thể đặt bàn qua mục "💳 Đặt Bàn". Chỉ cần chọn thời gian, số người, và những món ăn bạn muốn.',
  thanh_toán: 'Chúng tôi hỗ trợ: Chuyển khoản ngân hàng, Ví điện tử, và Tiền mặt.',
  default: 'Cảm ơn câu hỏi! Tôi có thể giúp bạn về: Thực đơn, Đặt bàn, Thanh toán, Khuyến mãi.'
}

const getFallbackResponse = (message) => {
  const lowerMsg = message.toLowerCase()
  if (lowerMsg.includes('thực đơn') || lowerMsg.includes('món ăn')) return fallbackResponses.thực_đơn
  if (lowerMsg.includes('đặt bàn') || lowerMsg.includes('bàn')) return fallbackResponses.đặt_bàn
  if (lowerMsg.includes('thanh toán') || lowerMsg.includes('chi phí')) return fallbackResponses.thanh_toán
  return fallbackResponses.default
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
                text: `Bạn là trợ lý AI chuyên về nhà hàng QT. Trả lời ngắn gọn bằng tiếng Việt (dưới 80 từ).
Dịch vụ: Thực đơn Á Châu, Đặt bàn online, Thanh toán linh hoạt, Khuyến mãi hấp dẫn.

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
      return res.status(200).json({ 
        text: getFallbackResponse(message),
        fallback: true 
      })
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      console.warn('No text in response:', data)
      return res.status(200).json({ 
        text: getFallbackResponse(message),
        fallback: true 
      })
    }

    return res.status(200).json({ text, fallback: false })
  } catch (error) {
    console.error('Chat API error:', error)
    return res.status(200).json({ 
      text: 'Xin lỗi, tôi gặp lỗi tạm thời. Vui lòng thử lại sau.',
      fallback: true,
      error: error.message 
    })
  }
}
