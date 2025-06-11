import { Routes, Route } from 'react-router-dom';
import { HomePage } from './components/HomePage';
import { AIToolsDirectory } from './components/AIToolsDirectory';
import { ServicePage } from './components/ServicePage';
import { ChatbotPage } from './components/ChatbotPage';
import { ReportPage } from './components/ReportPage';
import { RegisterForm } from './components/RegisterForm';
import { MovarToolsPage } from './components/MovarToolsPage';
import { AIPolicyPage } from './components/AIPolicyPage';
import { useState, useEffect, useRef } from 'react';
import { Chatbot } from './components/Chatbot';

function App() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState<string>('');
  const cursorRef = useRef<HTMLDivElement>(null);

  const handleOpenChat = (message?: string) => {
    setInitialMessage(message || '');
    setIsChatbotOpen(true);
  };

  useEffect(() => {
    const cursor = document.createElement('div');
    cursor.className = 'cursor-dot';
    document.body.appendChild(cursor);

    const moveCursor = (e: MouseEvent) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    };

    const growCursor = () => {
      cursor.style.transform = 'translate(-50%, -50%) scale(1.5)';
    };

    const shrinkCursor = () => {
      cursor.style.transform = 'translate(-50%, -50%) scale(1)';
    };

    document.addEventListener('mousemove', moveCursor);
    document.addEventListener('mousedown', growCursor);
    document.addEventListener('mouseup', shrinkCursor);

    return () => {
      document.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mousedown', growCursor);
      document.removeEventListener('mouseup', shrinkCursor);
      document.body.removeChild(cursor);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 animate-gradient">
      <Routes>
        <Route path="/" element={<HomePage onOpenChat={handleOpenChat} />} />
        <Route path="/tools" element={<AIToolsDirectory onOpenChat={() => handleOpenChat()} />} />
        <Route path="/movar-tools" element={<MovarToolsPage />} />
        <Route path="/services" element={<ServicePage />} />
        <Route path="/chatbot" element={<ChatbotPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/ai-policy" element={<AIPolicyPage />} />
      </Routes>
      {isChatbotOpen && (
        <Chatbot 
          onClose={() => setIsChatbotOpen(false)} 
          initialMessage={initialMessage}
        />
      )}
    </div>
  );
}

export default App