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
  const [cart, setCart] = useState([])
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const addToCart = (item) => {
    const existingItem = cart.find(c => c.id === item.id)
    let newCart

    if (existingItem) {
      newCart = cart.map(c =>
        c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
      )
    } else {
      newCart = [...cart, { ...item, quantity: 1 }]
    }

    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))

    toast.success(`${item.name} đã được thêm vào giỏ hàng!`, {
      duration: 1500
    })
  }

  useEffect(() => {
    scrollToBottom()
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

    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]')
    setCart(savedCart)
  }, [])

  const handleSendMessage = async () => {
    if (!input.trim()) return

    // Thêm tin nhắn của người dùng
    const userMessage = {
      id: messages.length + 1,
      text: input,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Gọi Gemini AI API thực
    try {
      const response = await sendMessageToGemini(input)
      const botMessage = {
        id: messages.length + 2,
        text: response.text,
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMessage])

      // Handle action
      if (response.action === 'add_to_cart' && response.item) {
        const item = menu.find(m => m.name.toLowerCase().includes(response.item.toLowerCase()))
        if (item) {
          addToCart(item)
        } else {
          toast.error(`Không tìm thấy món "${response.item}" trong thực đơn.`, {
            duration: 2000
          })
        }
      }
    } catch (error) {
      console.error('Error getting AI response:', error)
      const errorResponse = {
        id: messages.length + 2,
        text: 'Xin lỗi, tôi gặp lỗi. Vui lòng thử lại sau.',
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorResponse])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      <Toaster />
      {/* Chat Box Button */}
      <button 
        className="chat-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Trợ lý AI"
      >
        💬
      </button>

      {/* Chat Box Window */}
      {isOpen && (
        <div className="chatbox-container">
          <div className="chatbox-header">
            <h3>Trợ Lý AI - Nhà Hàng QT</h3>
            <button 
              className="close-btn"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className="chatbox-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.sender}`}>
                <div className="message-content">
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message bot">
                <div className="message-content">
                  <span className="typing-indicator">
                    <span></span><span></span><span></span>
                  </span>
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
              placeholder="Nhập câu hỏi của bạn..."
              className="chatbox-input"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              className="send-btn"
            >
              📤
            </button>
          </div>
        </div>
      )}
    </>
  )
}
