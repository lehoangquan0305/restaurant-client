import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req, res) {
  console.log(">>> KIỂM TRA KEY GROQ:", process.env.GROQ_API_KEY ? "ĐÃ THẤY" : "TRỐNG");

  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const { message } = req.body;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Bạn là lễ tân thân thiện của nhà hàng QT. Trả lời bằng JSON: {"text": "nội dung trả lời dưới 80 từ", "action": "add_to_cart" hoặc null, "item": "tên món" hoặc null}. Nếu khách đặt món, set action là add_to_cart.`
        },
        {
          role: "user",
          content: message
        }
      ],
      model: "llama-3.3-70b-versatile", // Model cực mạnh và nhanh của Groq
      response_format: { type: "json_object" } // Ép Groq trả về JSON chuẩn
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
      text: 'Xin lỗi, em đang bận một chút. Anh/chị cần gì ạ?',
      fallback: true,
      error: error.message
    });
  }
}