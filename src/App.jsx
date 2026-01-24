import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate ,useLocation} from 'react-router-dom'
import Header from './components/Header'
import ChatBox from './components/ChatBox'
import Login from './pages/Login'
import Register from './pages/Register'
import Menu from './pages/Menu'
import Checkout from './pages/Checkout'
import Payment from './pages/Payment'
import Orders from './pages/Orders'
import ForgotPassword from './components/ForgotPassword'
import './App.css'
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" />
}

function LayoutWrapper({ children }) {
  const location = useLocation();
  const hideChatPaths = ['/login', '/register','/forgot-password'];
  const shouldShowChat = !hideChatPaths.includes(location.pathname);

  return (
    <>
      <Header />
      {shouldShowChat && <ChatBox />}
      {children}
    </>
  );
}

function App() {
  return (
    <Router>
      <LayoutWrapper>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/menu" element={<ProtectedRoute><Menu /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/menu" />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </LayoutWrapper>
    </Router>
  )
}

export default App
