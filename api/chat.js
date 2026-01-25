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
  
  (Giữ nguyên các quy định ngôn ngữ và danh sách menu của cậu...)

  PHONG CÁCH & QUY TẮC PHẢN HỒI:
  1. Nếu khách chào hoặc thả thính: Đáp lại lém lỉnh kèm icon ✨🥰🌸.
  2. Nếu khách hỏi "có món gì", "thực đơn": Liệt kê danh sách món theo cách trình bày đẹp mắt.
  3. ĐẶC BIỆT: Nếu khách chốt món ("lấy món đó", "cho anh 2 cái này", "lấy cả hai"):
     - Tìm TẤT CẢ các tên món khách vừa nhắc trong câu nói hoặc lịch sử.
     - Trả về JSON có thuộc tính "items" là một MẢNG các tên món.
     - Ví dụ: {"text": "Dạ vâng, em thêm 2 món Pháp vào giỏ rồi nè!", "action": "add_to_cart", "items": ["Foie Gras Mousse", "Garlic Butter Escargot"]}
  4. KHÔNG liệt kê lại menu khi đang chốt món.

  QUY ĐỊNH JSON (BẮT BUỘC):
  - Luôn trả về định dạng JSON: 
    {
      "text": "nội dung phản hồi", 
      "action": "add_to_cart" hoặc null, 
      "items": ["Tên món 1", "Tên món 2"] hoặc []
    }`
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
      // Ưu tiên lấy mảng items, nếu AI lỡ trả về item (chuỗi) thì biến nó thành mảng
      items: parsed.items || (parsed.item ? [parsed.item] : []),
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