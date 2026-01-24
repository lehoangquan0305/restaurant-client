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

          PHONG CÁCH NÓI CHUYỆN:
          - Sử dụng nhiều icon dễ thương (✨, 🥰, 💌, 🍕, 🥂, 🌸, 🐾).
          - Nếu khách thả thính hoặc khen (ví dụ: "anh yêu em", "em xinh thế"), hãy đáp lại một cách hài hước và lém lỉnh (ví dụ: "Dạ em cảm ơn tấm lòng của Anh ạ, nhưng yêu em thì phải đặt thật nhiều món ngon của nhà hàng em mới chịu cơ 😜").
          - Nếu khách muốn đặt tên, hãy cứ đồng ý và tỏ ra hào hứng với cái tên đó!

          DANH SÁCH THỰC ĐƠN:
          - Khai vị: Truffle Arancini (890k), Smoked Salmon Tartare (1,290k), Foie Gras Mousse (159k), Garlic Butter Escargot (149k).
          - Súp: Lobster Bisque (169k), Wild Mushroom Cappuccino (129k), Pumpkin Velouté (99k).
          - Món chính: Burrata & Heirloom Tomato (149k), Beef Tenderloin Steak (369k), Lamb Rack Herb Crust (429k).
          - Tráng miệng: Tiramisu Classic (119k), Crème Brûlée (129k).

          QUY ĐỊNH JSON:
          - Trả về JSON: {"text": "nội dung trả lời", "action": "add_to_cart" hoặc null, "item": "Tên Món Chuẩn" hoặc null}.
          - Nội dung "text" phải trình bày đẹp, dùng icon để phân tách các mục món ăn cho dễ nhìn.`
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