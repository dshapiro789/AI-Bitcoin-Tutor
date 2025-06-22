import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import AiChat from './pages/AiChat';
import Resources from './pages/Resources';
import Contact from './pages/Contact';
import Auth from './pages/Auth';
import AccountSettings from './pages/AccountSettings';
import { Background } from './components/Background';
import { ScrollToTop } from './components/ScrollToTop';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import { useAuthStore } from './store/authStore';
import { RequireAuth } from './components/RequireAuth';

function AppContent() {
  const { restoreSession } = useAuthStore();
  const location = useLocation();

  // Check if current page is AI Chat
  const isAiChatPage = location.pathname === '/ai-chat';

  useEffect(() => {
    restoreSession();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100/80">
      <Background />
      <Navbar />
      <main className={
        isAiChatPage 
          ? "h-[calc(100vh-4rem)] flex flex-col" 
          : "pt-4 pb-12 px-4 sm:px-6 lg:px-8"
      }>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/contact" element={<Contact />} />
          
          {/* Protected Routes */}
          <Route 
            path="/account" 
            element={
              <RequireAuth>
                <AccountSettings />
              </RequireAuth>
            } 
          />
          <Route 
            path="/ai-chat" 
            element={
              <RequireAuth>
                <AiChat />
              </RequireAuth>
            } 
          />
          <Route 
            path="/resources" 
            element={
              <RequireAuth>
                <Resources />
              </RequireAuth>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ScrollToTop />
        <AppContent />
      </Router>
    </ErrorBoundary>
  );
}

export default App;