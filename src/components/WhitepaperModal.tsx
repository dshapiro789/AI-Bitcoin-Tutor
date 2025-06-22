import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Moon, Sun, ZoomIn, ZoomOut, ExternalLink } from 'lucide-react';

interface WhitepaperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WhitepaperModal({ isOpen, onClose }: WhitepaperModalProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isLoading, setIsLoading] = useState(true);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Reset loading state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
    }
  }, [isOpen]);

  const handleZoomIn = () => {
    if (zoomLevel < 200) {
      setZoomLevel(prev => prev + 10);
    }
  };

  const handleZoomOut = () => {
    if (zoomLevel > 50) {
      setZoomLevel(prev => prev - 10);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/bitcoin whitepaper.pdf';
    link.download = 'bitcoin_whitepaper.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75"
          onClick={onClose}
        >
          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`w-full max-w-6xl h-[90vh] rounded-2xl overflow-hidden shadow-2xl ${darkMode ? 'bg-gray-900' : 'bg-white'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-200 bg-gray-50 text-gray-900'}`}>
              <div className="flex items-center">
                <h2 className="text-xl font-bold">Bitcoin: A Peer-to-Peer Electronic Cash System</h2>
              </div>
              <div className="flex items-center space-x-2">
                {/* Dark Mode Toggle */}
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>

                {/* Zoom Controls */}
                <button
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 50}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 disabled:opacity-50 disabled:hover:bg-gray-700' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:hover:bg-gray-200'
                  }`}
                  aria-label="Zoom out"
                >
                  <ZoomOut className="h-5 w-5" />
                </button>
                <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {zoomLevel}%
                </div>
                <button
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 200}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 disabled:opacity-50 disabled:hover:bg-gray-700' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:hover:bg-gray-200'
                  }`}
                  aria-label="Zoom in"
                >
                  <ZoomIn className="h-5 w-5" />
                </button>

                {/* Download Button */}
                <button
                  onClick={handleDownload}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode 
                      ? 'bg-orange-600 text-white hover:bg-orange-700' 
                      : 'bg-orange-500 text-white hover:bg-orange-600'
                  }`}
                  aria-label="Download whitepaper"
                >
                  <Download className="h-5 w-5" />
                </button>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="relative w-full h-full">
              {/* Loading Indicator */}
              {isLoading && (
                <div className={`absolute inset-0 flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Loading Bitcoin Whitepaper...</p>
                  </div>
                </div>
              )}

              <iframe
                src={`/bitcoin whitepaper.pdf#view=FitH${darkMode ? '&toolbar=0&navpanes=0' : ''}`}
                className="w-full h-full"
                style={{ 
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'top center',
                  backgroundColor: darkMode ? '#1f2937' : '#ffffff'
                }}
                onLoad={() => setIsLoading(false)}
                title="Bitcoin: A Peer-to-Peer Electronic Cash System"
              />
            </div>

            {/* Footer */}
            <div className={`absolute bottom-0 left-0 right-0 p-3 ${
              darkMode 
                ? 'bg-gray-800 text-gray-300 border-t border-gray-700' 
                : 'bg-gray-50 text-gray-600 border-t border-gray-200'
            }`}>
              <div className="flex justify-between items-center text-xs">
                <span>© 2008 Satoshi Nakamoto</span>
                <a 
                  href="https://bitcoin.org/bitcoin.pdf" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center hover:underline"
                >
                  View Original Source
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}