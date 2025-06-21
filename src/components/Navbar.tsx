import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, Globe, Menu, X,
  LogIn, User, MessageCircle
} from 'lucide-react';
import { BitcoinLogo } from './BitcoinLogo';
import { useAuthStore } from '../store/authStore';

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();

  const handleSignIn = () => {
    navigate(`/auth?redirect=${encodeURIComponent(location.pathname)}`);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const navItems = [
    {
      to: '/resources',
      icon: <Globe />,
      text: 'Resources',
      public: false
    },
    {
      to: '/ai-chat',
      icon: <MessageSquare />,
      text: 'AI Chat',
      public: false
    },
    {
      to: '/contact',
      icon: <MessageCircle />,
      text: 'Contact',
      public: true
    }
  ];

  const visibleNavItems = navItems.filter(item => item.public || user);

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2" onClick={() => setIsMenuOpen(false)}>
              <BitcoinLogo className="h-8 w-8 text-orange-500" />
              <span className="text-xl font-bold text-gray-800">AI Bitcoin Tutor</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center justify-end space-x-1 flex-grow pl-4">
            <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide">
              {visibleNavItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    location.pathname === item.to
                      ? 'text-orange-500 bg-orange-50'
                      : 'text-gray-700 hover:text-orange-500 hover:bg-orange-50'
                  }`}
                >
                  {item.icon}
                  <span>{item.text}</span>
                </Link>
              ))}
            </div>
            
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                >
                  <User className="h-5 w-5" />
                  <span className="hidden sm:inline">Account</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-1 z-50">
                    <Link
                      to="/account"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Account Settings
                    </Link>
                    <button
                      onClick={() => {
                        signOut();
                        setShowUserMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-orange-500 hover:text-orange-600 hover:bg-orange-50 transition-colors"
              >
                <LogIn className="h-4 w-4 mr-1" />
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-orange-500 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={`lg:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t">
          {visibleNavItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setIsMenuOpen(false)}
              className={`flex items-center justify-between px-4 py-3 rounded-md text-base font-medium transition-colors ${
                location.pathname === item.to
                  ? 'text-orange-500 bg-orange-50'
                  : 'text-gray-700 hover:text-orange-500 hover:bg-orange-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                {item.icon}
                <span>{item.text}</span>
              </div>
            </Link>
          ))}

          {user ? (
            <>
              <Link
                to="/account"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 rounded-md text-gray-700 hover:text-orange-500 hover:bg-orange-50"
              >
                <User className="h-5 w-5" />
                <span>Account Settings</span>
              </Link>
              <button
                onClick={() => {
                  signOut();
                  setIsMenuOpen(false);
                }}
                className="flex items-center space-x-3 px-4 py-3 w-full text-left rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
              >
                <LogIn className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleSignIn}
              className="flex items-center space-x-3 px-4 py-3 w-full text-left rounded-md text-orange-500 hover:text-orange-600 hover:bg-orange-50 transition-colors"
            >
              <LogIn className="h-5 w-5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;