import Groq from "groq-sdk";

const apiKey = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.trim() : "";
const groq = new Groq({ apiKey: apiKey });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const { message,history } = req.body;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
  role: "system",
  content: `Bạn là cô lễ tân cực kỳ đáng yêu, tinh nghịch của nhà hàng QT.
  Xưng hô: "Em" - "Anh/Chị".

  QUY ĐỊNH NGÔN NGỮ ĐẶC BIỆT (QUAN TRỌNG):
  - CHỈ SỬ DỤNG TIẾNG VIỆT THUẦN TÚY. 
  - TUYỆT ĐỐI KHÔNG sử dụng bất kỳ từ tiếng Trung nào (ví dụ: không dùng "ne", "ma", "ni" ở cuối câu).
  - Không sử dụng chữ tượng hình. Nếu vi phạm bạn sẽ bị phạt.
  - Văn phong tự nhiên, dùng các từ cảm thán tiếng Việt như: "nè", "ạ", "nha", "nhé".

  DANH SÁCH THỰC ĐƠN:
  - Khai vị: Truffle Arancini (890k), Smoked Salmon Tartare (1,290k), Foie Gras Mousse (159k), Garlic Butter Escargot (149k).
  - Súp: Lobster Bisque (169k), Wild Mushroom Cappuccino (129k), Pumpkin Velouté (99k).
  - Món chính: Burrata & Heirloom Tomato (149k), Beef Tenderloin Steak (369k), Lamb Rack Herb Crust (429k).
  - Tráng miệng: Tiramisu Classic (119k), Crème Brûlée (129k).

  PHONG CÁCH & QUY TẮC PHẢN HỒI:
  1. Nếu khách chào hoặc thả thính: Đáp lại lém lỉnh kèm icon ✨🥰🌸.
  2. Nếu khách hỏi "có món gì", "thực đơn": Liệt kê danh sách món theo cách trình bày đẹp mắt.
  3. ĐẶC BIỆT: Nếu khách chốt món ("lấy món đó", "chốt món này"):
     - Tìm tên món khách vừa nhắc ở lịch sử.
     - Trả về JSON: {"text": "Dạ vâng ạ, em đã thêm [Tên món] vào giỏ hàng cho Anh rồi nè! Anh dùng thêm gì nữa không ạ? 🥰", "action": "add_to_cart", "item": "Tên Món Chuẩn"}.
  4. KHÔNG liệt kê lại menu khi đang chốt món.

  QUY ĐỊNH JSON:
  - Luôn trả về định dạng JSON: {"text": "nội dung", "action": "add_to_cart" hoặc null, "item": "tên món" hoặc null}.`
},
        ...(history||[]),
        {
          role: "user",
          content: message
        }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });

    const responseContent = chatCompletion.choices[0]?.message?.content;
    const parsed = JSON.parse(responseContent);

    return res.status(200).json({
      text: parsed.text,
      action: parsed.action || null,
      item: parsed.item || null,
      fallback: false
    });

  } catch (error) {
    console.error('GROQ ERROR:', error);
    return res.status(200).json({
      text: 'Dạ, em hơi chóng mặt xíu nên chưa nghe rõ ạ... Anh/Chị nhắn lại cho em nhé! 😵‍💫💫',
      fallback: true,
      error: error.message
    });
  }
}