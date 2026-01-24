import React, { useState, useRef, useEffect } from 'react'
import { sendMessageToGemini } from '../services/chatService'
import { getMenu } from '../api'
import toast, { Toaster } from "react-hot-toast"
import '../styles/chatbox.css'

export default function ChatBox() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Xin chào! 👋 Tôi là trợ lý AI của Nhà Hàng QT. Tôi có thể giúp bạn tư vấn về thực đơn, đặt bàn, thanh toán, hoặc bất kỳ câu hỏi nào khác. Bạn cần giúp gì?',
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [menu, setMenu] = useState([])
  const messagesEndRef = useRef(null)

  // 1. Đồng bộ cuộn tin nhắn
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 2. Load Menu để Bot biết thông tin món ăn
  useEffect(() => {
    const loadMenu = async () => {
      try {
        const menuRes = await getMenu()
        setMenu(menuRes.data || [])
      } catch (error) {
        console.error('Error loading menu:', error)
      }
    }
    loadMenu()
  }, [])

  // 3. Hàm Add To Cart "bắt chước" Menu.jsx nhưng thêm lệnh phát sự kiện
  const addToCartFromBot = (item) => {
    // Lấy giỏ hàng mới nhất từ localStorage (giống cách Menu làm)
    const currentCart = JSON.parse(localStorage.getItem('cart') || '[]')
    
    const existingItem = currentCart.find(c => c.id === item.id)
    let newCart

    if (existingItem) {
      newCart = currentCart.map(c =>
        c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
      )
    } else {
      newCart = [...currentCart, { ...item, quantity: 1 }]
    }

    // Lưu vào localStorage
    localStorage.setItem('cart', JSON.stringify(newCart))

    // 🔥 CÁI NÀY QUAN TRỌNG NHẤT:
    // Vì Bot và Menu là 2 Component khác nhau, Bot phải "hét" lên 
    // để Menu nghe thấy và tự cập nhật lại giao diện của nó.
    window.dispatchEvent(new Event('storage')) 
window.dispatchEvent(new Event('cart-updated'))
    
    toast.success(`${item.name} đã được thêm vào giỏ hàng!`, {
      duration: 1500,
      position: 'bottom-right'
    })
  }

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // 1. Tạo tin nhắn mới của người dùng
    const userMessage = {
      id: Date.now(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    // 2. Cập nhật giao diện ngay lập tức
    setMessages(prev => [...prev, userMessage]);
    
    // 3. Chuẩn bị "Trí nhớ" (Lịch sử chat) để gửi lên AI
    // Chúng ta lấy khoảng 4 tin nhắn gần nhất để AI biết "món đó" là món nào
    const history = messages.slice(-4).map(msg => ({
      role: msg.sender === 'bot' ? 'assistant' : 'user',
      content: msg.text
    }));

    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      // 4. Gửi cả tin nhắn hiện tại VÀ lịch sử chat lên Service
      // Chúng ta sẽ gộp lịch sử vào để AI đọc được ngữ cảnh
      const response = await sendMessageToGemini(currentInput, history);
      
      const botMessage = {
        id: Date.now() + 1,
        text: response.text,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);

      // 5. Xử lý khi AI yêu cầu thêm món
      if (response.action === 'add_to_cart' && response.item) {
        // Tìm món ăn trong menu dựa trên tên AI trả về
        const foundItem = menu.find(m => 
          m.name.toLowerCase().includes(response.item.toLowerCase()) ||
          response.item.toLowerCase().includes(m.name.toLowerCase())
        );
        
        if (foundItem) {
          addToCartFromBot(foundItem);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Em đang bận xíu, Anh nhắn lại nhé! 😭");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      <Toaster />
      <button className="chat-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '✕' : '💬'}
      </button>

      {isOpen && (
        <div className="chatbox-container">
          <div className="chatbox-header">
            <h3>Trợ Lý AI - Nhà Hàng QT</h3>
            <button className="close-btn" onClick={() => setIsOpen(false)}>✕</button>
          </div>
          <div className="chatbox-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.sender}`}>
                <div className="message-content">{msg.text}</div>
              </div>
            ))}
            {isLoading && (
              <div className="message bot">
                <div className="message-content">
                  <span className="typing-indicator"><span></span><span></span><span></span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="chatbox-input-area">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập câu hỏi..."
              className="chatbox-input"
              disabled={isLoading}
            />
            <button onClick={handleSendMessage} disabled={isLoading || !input.trim()} className="send-btn">📤</button>
          </div>
        </div>
      )}
    </>
  )
}