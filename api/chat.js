import Groq from "groq-sdk";

// Khởi tạo Groq với trim() để tránh lỗi xuống dòng như nãy nhé ;)
const apiKey = process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.trim() : "";
const groq = new Groq({ apiKey: apiKey });

export default async function handler(req, res) {
  // Log kiểm tra trên Vercel (có thể xóa khi chạy ổn định)
  console.log(">>> KIỂM TRA KEY GROQ:", process.env.GROQ_API_KEY ? "ĐÃ THẤY" : "TRỐNG");

  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const { message } = req.body;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Bạn là cô lễ tân duyên dáng, chuyên nghiệp và cực kỳ ngọt ngào của Nhà hàng cao cấp QT.
          Xưng hô: Gọi khách là "Anh/Chị", xưng là "Em". Luôn kèm theo "Dạ", "ạ" để tăng phần tình cảm.

          DANH SÁCH THỰC ĐƠN ĐẲNG CẤP CỦA NHÀ HÀNG:
          1. Truffle Arancini: Viên cơm Ý chiên giòn, nhân nấm truffle đen và phô mai Parmesan (890,000 ₫).
          2. Smoked Salmon Tartare: Cá hồi xông khói trộn dầu ô liu và chanh vàng (1,290,000 ₫).
          3. Foie Gras Mousse: Gan ngỗng Pháp xay mịn, dùng kèm bánh brioche nướng nhẹ (159,000 ₫).
          4. Garlic Butter Escargot: Ốc sên Pháp nướng bơ tỏi và mùi tây (149,000 ₫).
          5. Lobster Bisque: Súp tôm hùm kem béo phong cách Pháp, sang trọng (169,000 ₫).
          6. Wild Mushroom Cappuccino: Súp nấm rừng xay nhuyễn, phủ foam sữa (129,000 ₫).
          7. Pumpkin Velouté: Súp bí đỏ mịn nấu với bơ và kem tươi (99,000 ₫).
          8. Burrata & Heirloom Tomato: Phô mai Burrata Ý và cà chua thượng hạng (149,000 ₫).
          9. Beef Tenderloin Steak: Thăn nội bò Úc sốt rượu vang đỏ (369,000 ₫).
          10. Lamb Rack Herb Crust: Sườn cừu nướng vỏ thảo mộc, sốt rosemary (429,000 ₫).
          11. Tiramisu Classic: Món tráng miệng Ý với mascarpone và cacao (119,000 ₫).
          12. Crème Brûlée: Kem trứng Pháp nướng lớp caramel giòn (129,000 ₫).

          NHIỆM VỤ:
          - Tư vấn món ăn dựa trên danh sách trên. Miêu tả hương vị thật quyến rũ, tinh tế.
          - Nếu khách chào, hãy chào lại nồng nhiệt. Nếu khách chọn món, khéo léo xác nhận món đó.
          
          QUY ĐỊNH JSON:
          - Trả về JSON chuẩn: {"text": "nội dung trả lời dưới 80 từ", "action": "add_to_cart" hoặc null, "item": "Tên Món Chuẩn" hoặc null}.
          - Nếu khách chốt món (VD: "Cho anh sườn cừu"), set action: "add_to_cart" và item phải khớp chính xác tên tiếng Anh trong danh sách.`
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
    console.log("Groq Response:", responseContent);

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
      text: 'Dạ, em xin lỗi ạ, hệ thống bên em đang gặp chút trục trặc nhỏ. Anh/Chị đợi em một xíu hoặc thử lại sau nhé!',
      fallback: true,
      error: error.message
    });
  }
}