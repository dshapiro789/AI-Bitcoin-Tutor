import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Share2, Download, Copy, CheckCircle, Mail, MessageSquare, 
  FileText, Printer, Smartphone, Globe, AlertCircle, ExternalLink
} from 'lucide-react';
import { Message } from '../hooks/useAIChat';

interface ShareExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  userEmail?: string;
  userName?: string;
}

export function ShareExportModal({ 
  isOpen, 
  onClose, 
  messages, 
  userEmail, 
  userName 
}: ShareExportModalProps) {
  const [copied, setCopied] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [shareMessage, setShareMessage] = useState('');

  if (!isOpen) return null;

  // Generate chat content for sharing/export
  const generateChatContent = (format: 'text' | 'html' = 'text') => {
    const chatContent = messages
      .filter(msg => msg.id !== '1') // Exclude welcome message
      .map(msg => {
        const timestamp = msg.timestamp.toLocaleString();
        const sender = msg.isUser ? 'You' : `AI Assistant${msg.model ? ` (${msg.model})` : ''}`;
        
        if (format === 'html') {
          return `<div style="margin-bottom: 20px; padding: 15px; border-left: 3px solid ${msg.isUser ? '#f97316' : '#6b7280'}; background-color: ${msg.isUser ? '#fff7ed' : '#f9fafb'};">
            <div style="font-weight: bold; color: #374151; margin-bottom: 5px;">${sender}</div>
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 10px;">${timestamp}</div>
            <div style="line-height: 1.6; color: #111827;">${msg.text.replace(/\n/g, '<br>')}</div>
          </div>`;
        }
        
        return `[${timestamp}] ${sender}:\n${msg.text}\n`;
      })
      .join(format === 'html' ? '' : '\n');

    const header = format === 'html' 
      ? `<h1 style="color: #f97316; margin-bottom: 20px;">Bitcoin AI Tutor Chat History</h1>
         <p style="color: #6b7280; margin-bottom: 30px;">Exported on: ${new Date().toLocaleString()}</p>`
      : `# Bitcoin AI Tutor Chat History\n\nExported on: ${new Date().toLocaleString()}\nUser: ${userName || userEmail || 'Anonymous'}\n\n`;

    return header + chatContent;
  };

  // Copy to clipboard
  const handleCopyToClipboard = async () => {
    try {
      const content = generateChatContent('text');
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setShareStatus('success');
      setShareMessage('Chat history copied to clipboard!');
      setTimeout(() => {
        setCopied(false);
        setShareStatus('idle');
        setShareMessage('');
      }, 3000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      setShareStatus('error');
      setShareMessage('Failed to copy to clipboard. Please try again.');
    }
  };

  // Export as text file
  const handleExportText = () => {
    try {
      const content = generateChatContent('text');
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bitcoin-chat-history-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setShareStatus('success');
      setShareMessage('Text file downloaded successfully!');
      setTimeout(() => {
        setShareStatus('idle');
        setShareMessage('');
      }, 3000);
    } catch (error) {
      console.error('Failed to export text file:', error);
      setShareStatus('error');
      setShareMessage('Failed to export text file. Please try again.');
    }
  };

  // Export as HTML file (fallback for PDF)
  const handleExportHTML = () => {
    try {
      const content = generateChatContent('html');
      const fullHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Bitcoin AI Tutor Chat History</title>
          <meta charset="UTF-8">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              max-width: 800px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            @media print {
              body { margin: 0; padding: 15px; }
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
        </html>
      `;
      
      const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bitcoin-chat-history-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setShareStatus('success');
      setShareMessage('HTML file downloaded! Open it in your browser and use Ctrl+P (Cmd+P on Mac) to print as PDF.');
      setTimeout(() => {
        setShareStatus('idle');
        setShareMessage('');
      }, 5000);
    } catch (error) {
      console.error('Failed to export HTML file:', error);
      setShareStatus('error');
      setShareMessage('Failed to export HTML file. Please try again.');
    }
  };

  // Print to PDF (with improved popup handling)
  const handlePrintToPDF = () => {
    try {
      const content = generateChatContent('html');
      
      // First try to open popup
      const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
      
      if (!printWindow) {
        // Popup was blocked, offer alternative
        setShareStatus('error');
        setShareMessage('Popup blocked by your browser. Please allow popups for this site, or use the HTML export option below and print from there.');
        setTimeout(() => {
          setShareStatus('idle');
          setShareMessage('');
        }, 5000);
        return;
      }

      // Check if popup was actually opened (some browsers return object even when blocked)
      setTimeout(() => {
        if (printWindow.closed) {
          setShareStatus('error');
          setShareMessage('Print window was blocked. Please allow popups for this site, or use the HTML export option and print from there.');
          setTimeout(() => {
            setShareStatus('idle');
            setShareMessage('');
          }, 5000);
          return;
        }

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Bitcoin AI Tutor Chat History</title>
            <meta charset="UTF-8">
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                max-width: 800px; 
                margin: 0 auto; 
                padding: 20px; 
              }
              @media print {
                body { margin: 0; padding: 15px; }
                .no-print { display: none; }
              }
              .print-button {
                background: #f97316; 
                color: white; 
                border: none; 
                padding: 12px 24px; 
                border-radius: 8px; 
                cursor: pointer; 
                font-size: 16px;
                margin-right: 10px;
              }
              .close-button {
                background: #6b7280; 
                color: white; 
                border: none; 
                padding: 12px 24px; 
                border-radius: 8px; 
                cursor: pointer; 
                font-size: 16px;
              }
              .button-container {
                margin: 30px 0;
                text-align: center;
                padding: 20px;
                background: #f9fafb;
                border-radius: 8px;
              }
            </style>
          </head>
          <body>
            <div class="no-print button-container">
              <p style="margin-bottom: 15px; color: #6b7280;">Use your browser's print function to save as PDF (Ctrl+P or Cmd+P)</p>
              <button class="print-button" onclick="window.print()">Print to PDF</button>
              <button class="close-button" onclick="window.close()">Close</button>
            </div>
            ${content}
          </body>
          </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        
        setShareStatus('success');
        setShareMessage('Print dialog opened successfully! Use Ctrl+P (Cmd+P on Mac) to save as PDF.');
        setTimeout(() => {
          setShareStatus('idle');
          setShareMessage('');
        }, 5000);
      }, 100);
      
    } catch (error) {
      console.error('Failed to open print dialog:', error);
      setShareStatus('error');
      setShareMessage('Failed to open print dialog. Please try the HTML export option and print from there.');
      setTimeout(() => {
        setShareStatus('idle');
        setShareMessage('');
      }, 3000);
    }
  };

  // Share via email
  const handleEmailShare = () => {
    try {
      const content = generateChatContent('text');
      const subject = encodeURIComponent('My Bitcoin AI Tutor Chat History');
      const body = encodeURIComponent(content);
      const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
      
      window.open(mailtoUrl, '_blank');
      
      setShareStatus('success');
      setShareMessage('Email client opened with chat history!');
      setTimeout(() => {
        setShareStatus('idle');
        setShareMessage('');
      }, 3000);
    } catch (error) {
      console.error('Failed to open email client:', error);
      setShareStatus('error');
      setShareMessage('Failed to open email client. Please try copying the content instead.');
    }
  };

  // Share via SMS
  const handleSMSShare = () => {
    try {
      const content = generateChatContent('text');
      // Truncate content for SMS (most carriers have limits)
      const truncatedContent = content.length > 1000 
        ? content.substring(0, 1000) + '...\n\n[Content truncated for SMS]'
        : content;
      
      const smsUrl = `sms:?body=${encodeURIComponent(truncatedContent)}`;
      window.open(smsUrl, '_blank');
      
      setShareStatus('success');
      setShareMessage('SMS app opened with chat history!');
      setTimeout(() => {
        setShareStatus('idle');
        setShareMessage('');
      }, 3000);
    } catch (error) {
      console.error('Failed to open SMS app:', error);
      setShareStatus('error');
      setShareMessage('Failed to open SMS app. Please try copying the content instead.');
    }
  };

  // Native share (if supported)
  const handleNativeShare = async () => {
    if (!navigator.share) {
      setShareStatus('error');
      setShareMessage('Native sharing not supported on this device. Please use other sharing options.');
      return;
    }

    try {
      const content = generateChatContent('text');
      await navigator.share({
        title: 'Bitcoin AI Tutor Chat History',
        text: content,
      });
      
      setShareStatus('success');
      setShareMessage('Content shared successfully!');
      setTimeout(() => {
        setShareStatus('idle');
        setShareMessage('');
      }, 3000);
    } catch (error) {
      const errorName = (error as Error).name;
      
      // Handle user cancellation (not an actual error)
      if (errorName === 'AbortError') {
        return; // User cancelled, don't show error message
      }
      
      // Handle permission denied specifically
      if (errorName === 'NotAllowedError') {
        console.error('Share permission denied:', error);
        setShareStatus('error');
        setShareMessage('Sharing permission denied by your browser or device. Please check your browser settings or try other sharing options.');
        setTimeout(() => {
          setShareStatus('idle');
          setShareMessage('');
        }, 5000);
        return;
      }
      
      // Handle other errors
      console.error('Failed to share:', error);
      setShareStatus('error');
      setShareMessage('Failed to share content. Please try other sharing options.');
      setTimeout(() => {
        setShareStatus('idle');
        setShareMessage('');
      }, 3000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Share2 className="h-6 w-6 mr-3" />
              <h2 className="text-2xl font-bold">Share & Export Chat</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-2 text-orange-100">
            Share your conversation or export it for your records
          </p>
        </div>

        <div className="p-6">
          {/* Status Messages */}
          <AnimatePresence>
            {shareMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mb-6 p-4 rounded-xl flex items-start ${
                  shareStatus === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-700' 
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}
              >
                {shareStatus === 'success' ? (
                  <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                )}
                <span className="text-sm">{shareMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Share Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Share2 className="h-5 w-5 mr-2 text-orange-500" />
              Share Options
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Copy to Clipboard */}
              <button
                onClick={handleCopyToClipboard}
                className="flex items-center p-4 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all group"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mr-4 group-hover:bg-blue-200 transition-colors">
                  {copied ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <Copy className="h-6 w-6 text-blue-500" />
                  )}
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Copy to Clipboard</div>
                  <div className="text-sm text-gray-500">Copy chat content for pasting</div>
                </div>
              </button>

              {/* Email Share */}
              <button
                onClick={handleEmailShare}
                className="flex items-center p-4 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all group"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mr-4 group-hover:bg-green-200 transition-colors">
                  <Mail className="h-6 w-6 text-green-500" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Email</div>
                  <div className="text-sm text-gray-500">Share via email client</div>
                </div>
              </button>

              {/* SMS Share */}
              <button
                onClick={handleSMSShare}
                className="flex items-center p-4 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all group"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mr-4 group-hover:bg-purple-200 transition-colors">
                  <Smartphone className="h-6 w-6 text-purple-500" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">SMS/Text</div>
                  <div className="text-sm text-gray-500">Share via text message</div>
                </div>
              </button>

              {/* Native Share */}
              {navigator.share && (
                <button
                  onClick={handleNativeShare}
                  className="flex items-center p-4 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all group"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg mr-4 group-hover:bg-indigo-200 transition-colors">
                    <Globe className="h-6 w-6 text-indigo-500" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">More Apps</div>
                    <div className="text-sm text-gray-500">Share to social media & messaging apps</div>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Export Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Download className="h-5 w-5 mr-2 text-orange-500" />
              Export Options
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Export as Text */}
              <button
                onClick={handleExportText}
                className="flex items-center p-4 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all group"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg mr-4 group-hover:bg-gray-200 transition-colors">
                  <FileText className="h-6 w-6 text-gray-500" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Text File (.txt)</div>
                  <div className="text-sm text-gray-500">Download as plain text</div>
                </div>
              </button>

              {/* Export as HTML */}
              <button
                onClick={handleExportHTML}
                className="flex items-center p-4 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all group"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mr-4 group-hover:bg-blue-200 transition-colors">
                  <Globe className="h-6 w-6 text-blue-500" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">HTML File</div>
                  <div className="text-sm text-gray-500">Download formatted HTML (print to PDF)</div>
                </div>
              </button>

              {/* Print to PDF */}
              <button
                onClick={handlePrintToPDF}
                className="flex items-center p-4 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all group"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mr-4 group-hover:bg-red-200 transition-colors">
                  <Printer className="h-6 w-6 text-red-500" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Quick Print</div>
                  <div className="text-sm text-gray-500">Open print dialog directly</div>
                </div>
              </button>
            </div>

            {/* Format Limitations Notice */}
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-700">
                  <div className="font-medium mb-1">Export Tips</div>
                  <ul className="space-y-1 text-xs">
                    <li>• If "Quick Print" is blocked, use "HTML File" export and print from there</li>
                    <li>• HTML files can be opened in any browser and printed as PDF</li>
                    <li>• SMS sharing may truncate long conversations due to character limits</li>
                    <li>• All exports include timestamps and preserve conversation structure</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Summary */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <h4 className="font-medium text-gray-900 mb-2">Chat Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Total Messages:</span> {messages.length - 1}
              </div>
              <div>
                <span className="font-medium">Date Range:</span> {
                  messages.length > 1 
                    ? `${messages[1]?.timestamp.toLocaleDateString()} - ${messages[messages.length - 1]?.timestamp.toLocaleDateString()}`
                    : 'No messages'
                }
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}