import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Moon, Sun, ZoomIn, ZoomOut, ExternalLink, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';

interface WhitepaperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WhitepaperModal({ isOpen, onClose }: WhitepaperModalProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(9); // Bitcoin whitepaper has 9 pages

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

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Add padding to prevent layout shift
      document.body.style.paddingRight = '0px';
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
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

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black bg-opacity-75"
          onClick={onClose}
          style={{
            paddingTop: 'max(env(safe-area-inset-top), 0.5rem)',
            paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)',
            paddingLeft: 'max(env(safe-area-inset-left), 0.5rem)',
            paddingRight: 'max(env(safe-area-inset-right), 0.5rem)',
          }}
        >
          {/* Modal Content - Flexbox layout for proper mobile handling */}
          <div className="flex items-center justify-center w-full h-full p-2 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`w-full max-w-6xl flex flex-col rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl ${darkMode ? 'bg-gray-900' : 'bg-white'}`}
              style={{
                maxHeight: 'calc(100vh - max(env(safe-area-inset-top), 0.5rem) - max(env(safe-area-inset-bottom), 0.5rem) - 1rem)',
                height: 'calc(100vh - max(env(safe-area-inset-top), 0.5rem) - max(env(safe-area-inset-bottom), 0.5rem) - 1rem)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header - Fixed height */}
              <div className={`flex-shrink-0 flex items-center justify-between p-3 sm:p-4 border-b ${darkMode ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-200 bg-gray-50 text-gray-900'}`}>
                <div className="flex items-center flex-1 min-w-0 mr-4">
                  <h2 className="text-sm sm:text-base md:text-xl font-bold leading-tight">
                    Bitcoin: A Peer-to-Peer Electronic Cash System
                  </h2>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                  {/* Dark Mode Toggle */}
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                  >
                    {darkMode ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
                  </button>

                  {/* Zoom Controls - Hidden on smallest screens */}
                  <div className="hidden sm:flex items-center space-x-1">
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
                      <ZoomOut className="h-4 w-4 sm:h-5 sm:w-5" />
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
                      <ZoomIn className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>

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
                    <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>

                  {/* Share Button - Mobile Only */}
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: 'Bitcoin Whitepaper',
                          text: 'Check out the original Bitcoin whitepaper by Satoshi Nakamoto',
                          url: 'https://bitcoin.org/bitcoin.pdf',
                        });
                      }
                    }}
                    className={`sm:hidden p-2 rounded-lg transition-colors ${
                      darkMode 
                        ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    aria-label="Share"
                  >
                    <Share2 className="h-4 w-4" />
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
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              </div>

              {/* PDF Viewer - Flexible height */}
              <div className="relative flex-1 w-full overflow-hidden">
                {/* Loading Indicator */}
                {isLoading && (
                  <div className={`absolute inset-0 flex items-center justify-center z-10 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
                      <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-sm sm:text-base`}>Loading Bitcoin Whitepaper...</p>
                    </div>
                  </div>
                )}

                <iframe
                  src={`/bitcoin whitepaper.pdf#view=FitH&page=${currentPage}${darkMode ? '&toolbar=0&navpanes=0' : ''}`}
                  className="w-full h-full"
                  style={{ 
                    transform: `scale(${zoomLevel / 100})`,
                    transformOrigin: 'top center',
                    backgroundColor: darkMode ? '#1f2937' : '#ffffff'
                  }}
                  onLoad={() => setIsLoading(false)}
                  title="Bitcoin: A Peer-to-Peer Electronic Cash System"
                />

                {/* Mobile Page Navigation Controls */}
                <div className="sm:hidden absolute bottom-4 left-0 right-0 flex justify-center items-center space-x-4 py-2">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage <= 1}
                    className={`p-3 rounded-full shadow-lg transition-colors ${
                      darkMode 
                        ? 'bg-gray-800 text-white disabled:opacity-50' 
                        : 'bg-white text-gray-800 disabled:opacity-50'
                    }`}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  <div className={`text-sm font-medium px-3 py-2 rounded-lg ${
                    darkMode 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-white text-gray-800'
                  }`}>
                    {currentPage} / {totalPages}
                  </div>
                  
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages}
                    className={`p-3 rounded-full shadow-lg transition-colors ${
                      darkMode 
                        ? 'bg-gray-800 text-white disabled:opacity-50' 
                        : 'bg-white text-gray-800 disabled:opacity-50'
                    }`}
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                {/* Mobile Zoom Controls */}
                <div className="sm:hidden absolute top-4 right-4 flex flex-col space-y-2">
                  <button
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 200}
                    className={`p-2 rounded-full shadow-lg transition-colors ${
                      darkMode 
                        ? 'bg-gray-800 text-white disabled:opacity-50' 
                        : 'bg-white text-gray-800 disabled:opacity-50'
                    }`}
                    aria-label="Zoom in"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 50}
                    className={`p-2 rounded-full shadow-lg transition-colors ${
                      darkMode 
                        ? 'bg-gray-800 text-white disabled:opacity-50' 
                        : 'bg-white text-gray-800 disabled:opacity-50'
                    }`}
                    aria-label="Zoom out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Footer - Fixed height */}
              <div className={`flex-shrink-0 p-2 sm:p-3 ${
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
                    <span className="hidden sm:inline">View Original Source</span>
                    <span className="sm:hidden">Original PDF</span>
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}