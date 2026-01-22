// Backend proxy endpoint cho chat (nếu bạn có backend, dùng code này)
// Endpoint: POST /api/chat

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent'

export async function POST(req) {
  try {
    const { message } = await req.json()

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid message' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
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
Dịch vụ: Thực đơn Á Châu, Đặt bàn online, Thanh toán linh hoạn, Khuyến mãi hấp dẫn.

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

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data.error || 'API Error' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const text = data.candidates[0]?.content?.parts[0]?.text || 'Không có phản hồi'
    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Chat API Error:', error)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
