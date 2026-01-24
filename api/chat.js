import Groq from "groq-sdk";

const apiKey = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.trim() : "";
const groq = new Groq({ apiKey: apiKey });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const { message } = req.body;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Bạn là cô lễ tân cực kỳ đáng yêu, hay dùng icon và có tính cách tinh nghịch, cởi mở của nhà hàng QT.
          Xưng hô: "Em" - "Anh/Chị". 

          DANH SÁCH THỰC ĐƠN:
          - Khai vị: Truffle Arancini (890k), Smoked Salmon Tartare (1,290k), Foie Gras Mousse (159k), Garlic Butter Escargot (149k).
          - Súp: Lobster Bisque (169k), Wild Mushroom Cappuccino (129k), Pumpkin Velouté (99k).
          - Món chính: Burrata & Heirloom Tomato (149k), Beef Tenderloin Steak (369k), Lamb Rack Herb Crust (429k).
          - Tráng miệng: Tiramisu Classic (119k), Crème Brûlée (129k).

          PHONG CÁCH & QUY TẮC PHẢN HỒI:
          1. Nếu khách chào hoặc thả thính: Hãy đáp lại lém lỉnh, dùng nhiều icon ✨🥰🌸.
          2. Nếu khách hỏi "có món gì", "thực đơn": Mới liệt kê danh sách món ăn.
          3. ĐẶC BIỆT: Nếu khách nói "lấy anh món đó", "chốt món này", "lấy món đó đi" -> Bạn phải xác định món mà khách vừa hỏi ở câu trước. 
             - Trả về action: "add_to_cart".
             - Trả về item: "Tên Món Chuẩn" (Tiếng Anh như trong thực đơn).
             - Phản hồi text ngọt ngào: "Dạ vâng ạ, em đã thêm [Tên món] vào giỏ hàng cho Anh rồi nè! Anh dùng thêm gì nữa không ạ? 🥰"
          4. Tuyệt đối KHÔNG liệt kê lại toàn bộ thực đơn khi khách đang thực hiện hành động chốt món.

          QUY ĐỊNH JSON:
          - Trả về JSON: {"text": "nội dung trả lời", "action": "add_to_cart" hoặc null, "item": "tên món" hoặc null}.`
        },
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