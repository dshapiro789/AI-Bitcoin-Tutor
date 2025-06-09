import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import AiChat from './pages/AiChat';
import Subscription from './pages/Subscription';
import Resources from './pages/Resources';
import Auth from './pages/Auth';
import AccountSettings from './pages/AccountSettings';
import { Background } from './components/Background';
import { ScrollToTop } from './components/ScrollToTop';
import { useAuthStore } from './store/authStore';
import { useSubscriptionStore } from './store/subscriptionStore';
import { RequireAuth } from './components/RequireAuth';
import { RequireSubscription } from './components/RequireSubscription';

function App() {
  const { restoreSession } = useAuthStore();
  const { loadSubscription } = useSubscriptionStore();

  useEffect(() => {
    restoreSession();
    loadSubscription();
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100/80">
        <Background />
        <Navbar />
        <main className="pt-4 pb-12 px-4 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/subscription" element={<Subscription />} />
            
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
    </Router>
  );
}

export default App;