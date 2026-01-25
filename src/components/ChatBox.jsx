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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

  // Tối ưu hàm thêm vào giỏ hàng để tránh ghi đè khi gọi liên tục
  const addToCartFromBot = (item) => {
    const currentCart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existingItemIndex = currentCart.findIndex(c => c.id === item.id)
    let newCart = [...currentCart]

    if (existingItemIndex > -1) {
      newCart[existingItemIndex].quantity += 1
    } else {
      newCart.push({ ...item, quantity: 1 })
    }

    localStorage.setItem('cart', JSON.stringify(newCart))
    window.dispatchEvent(new Event('storage')) 
    window.dispatchEvent(new Event('cart-updated'))
    
    toast.success(`${item.name} đã thêm vào giỏ!`, {
      duration: 1500,
      position: 'bottom-right'
    })
  }

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const currentCart = JSON.parse(localStorage.getItem('cart') || '[]');
    const cartDescription = currentCart.length > 0 
      ? currentCart.map(item => `${item.name} (SL: ${item.quantity})`).join(", ")
      : "đang trống";

    const userMessage = {
      id: Date.now(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    const history = messages.slice(-4).map(msg => ({
      role: msg.sender === 'bot' ? 'assistant' : 'user',
      content: msg.text
    }));

    // Nhắc khéo AI trả về nhiều món nếu cần
    const contextualInput = `[Giỏ hàng hiện tại: ${cartDescription}]. Nếu khách yêu cầu nhiều món, hãy liệt kê chúng trong thuộc tính 'items' dạng mảng. Câu hỏi: ${input}`;

    setInput('');
    setIsLoading(true);

    try {
      const response = await sendMessageToGemini(contextualInput, history);
      
      const botMessage = {
        id: Date.now() + 1,
        text: response.text,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);

      // --- LOGIC SỬA ĐỔI Ở ĐÂY ---
      if (response.action === 'add_to_cart') {
        // Hỗ trợ cả response.item (chuỗi) và response.items (mảng)
        let itemsToAdd = [];
        if (response.items && Array.isArray(response.items)) {
          itemsToAdd = response.items;
        } else if (response.item) {
          // Nếu AI trả về chuỗi có dấu phẩy, tách nó ra thành mảng
          itemsToAdd = response.item.split(',').map(i => i.trim());
        }

        itemsToAdd.forEach(itemName => {
          const foundItem = menu.find(m => 
            m.name.toLowerCase().includes(itemName.toLowerCase()) ||
            itemName.toLowerCase().includes(m.name.toLowerCase())
          );
          if (foundItem) {
            addToCartFromBot(foundItem);
          }
        });
      }
      // --------------------------

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