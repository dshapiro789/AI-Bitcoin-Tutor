import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, Clock, Copy, CheckCircle, MessageSquare,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { marked } from 'marked';

interface MessageReaction {
  type: '👍';
  timestamp: Date;
}

interface CodeBlock {
  language: string;
  code: string;
}

interface ChatMessageProps {
  id: string;
  text: string;
  isUser: boolean;
  model?: string;
  timestamp: Date;
  reactions?: MessageReaction[];
  category?: 'question' | 'explanation' | 'code' | 'error' | 'success';
  codeBlocks?: CodeBlock[];
  quickReplies?: string[];
  onQuickReply: (reply: string) => void;
}

const categoryIcons = {
  question: MessageSquare,
  explanation: MessageSquare,
  code: MessageSquare,
  error: AlertCircle,
  success: CheckCircle
};

export function ChatMessage({
  id,
  text,
  isUser,
  model,
  timestamp,
  reactions = [],
  category,
  codeBlocks = [],
  quickReplies = [],
  onQuickReply
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const CategoryIcon = category ? categoryIcons[category] : null;

  const handleCopy = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const formatText = (inputText: string) => {
    return marked.parse(inputText);
  };

  // Add copy buttons to code blocks
  useEffect(() => {
    if (!contentRef.current || isUser) return;

    const codeBlocks = contentRef.current.querySelectorAll('pre code');
    const addedButtons: { button: HTMLButtonElement; parent: HTMLPreElement }[] = [];

    codeBlocks.forEach((codeElement) => {
      const preElement = codeElement.parentElement as HTMLPreElement;
      if (!preElement) return;

      // Set up the pre element for positioning
      preElement.style.position = 'relative';
      preElement.classList.add('group');

      // Create copy button
      const copyButton = document.createElement('button');
      copyButton.className = 'absolute top-2 right-2 p-1.5 rounded-md bg-gray-700 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-600 flex items-center space-x-1';
      copyButton.title = 'Copy code';

      // Create copy icon SVG
      const copyIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      copyIcon.setAttribute('width', '14');
      copyIcon.setAttribute('height', '14');
      copyIcon.setAttribute('viewBox', '0 0 24 24');
      copyIcon.setAttribute('fill', 'none');
      copyIcon.setAttribute('stroke', 'currentColor');
      copyIcon.setAttribute('stroke-width', '2');
      copyIcon.setAttribute('stroke-linecap', 'round');
      copyIcon.setAttribute('stroke-linejoin', 'round');
      copyIcon.innerHTML = '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="m4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>';

      // Create check icon SVG
      const checkIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      checkIcon.setAttribute('width', '14');
      checkIcon.setAttribute('height', '14');
      checkIcon.setAttribute('viewBox', '0 0 24 24');
      checkIcon.setAttribute('fill', 'none');
      checkIcon.setAttribute('stroke', 'currentColor');
      checkIcon.setAttribute('stroke-width', '2');
      checkIcon.setAttribute('stroke-linecap', 'round');
      checkIcon.setAttribute('stroke-linejoin', 'round');
      checkIcon.innerHTML = '<path d="M20 6 9 17l-5-5"/>';
      checkIcon.style.display = 'none';

      copyButton.appendChild(copyIcon);
      copyButton.appendChild(checkIcon);

      // Add click handler
      copyButton.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        try {
          const codeText = codeElement.textContent || '';
          await navigator.clipboard.writeText(codeText);
          
          // Show success state
          copyIcon.style.display = 'none';
          checkIcon.style.display = 'block';
          copyButton.title = 'Copied!';
          copyButton.classList.add('bg-green-600');
          copyButton.classList.remove('bg-gray-700');
          
          // Reset after 2 seconds
          setTimeout(() => {
            copyIcon.style.display = 'block';
            checkIcon.style.display = 'none';
            copyButton.title = 'Copy code';
            copyButton.classList.remove('bg-green-600');
            copyButton.classList.add('bg-gray-700');
          }, 2000);
        } catch (error) {
          console.error('Failed to copy code:', error);
        }
      });

      preElement.appendChild(copyButton);
      addedButtons.push({ button: copyButton, parent: preElement });
    });

    // Cleanup function
    return () => {
      addedButtons.forEach(({ button, parent }) => {
        // Store parent reference before removing button
        if (parent && parent.contains(button)) {
          parent.removeChild(button);
          parent.style.position = '';
          parent.classList.remove('group');
        }
      });
    };
  }, [text, id, isUser]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} relative max-w-full`}
    >
      <div
        className={`w-full md:max-w-[85%] p-6 rounded-2xl relative group ${
          isUser
            ? 'bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white shadow-orange-500/20'
            : 'bg-white text-gray-800 shadow-lg'
        } shadow-xl hover:shadow-2xl transition-all duration-300`}
      >
        {/* Message Header */}
        <div className={`flex items-center justify-between mb-2 ${
          isUser ? 'text-orange-100/90' : 'text-gray-500'
        }`}>
          <div className="flex items-center space-x-2 flex-grow min-w-0 mr-3">
            {CategoryIcon && CategoryIcon !== MessageSquare && <CategoryIcon className="h-4 w-4" />}
            {!isUser && (
              model && (
                <>
                  <Bot className="h-4 w-4" />
                  <span className="text-sm font-medium flex-grow min-w-0 truncate">{model}</span>
                </>
              )
            )}
          </div>
          <div className="flex items-center space-x-1 flex-shrink-0">
            <Clock className="h-4 w-4" />
            <span className="text-xs sm:text-sm">{timestamp.toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Message Content - Fixed text cutoff with proper overflow handling */}
        <div 
          ref={contentRef}
          className={`prose prose-lg break-words overflow-x-hidden mt-4 ${
            isUser 
              ? 'prose-invert text-white' 
              : 'text-gray-800'
          }`}
          style={{ 
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            hyphens: 'auto'
          }}
          dangerouslySetInnerHTML={{ __html: formatText(text) }}
        />

        {/* Quick Replies */}
        {!isUser && quickReplies.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {quickReplies.map((reply, index) => (
              <button
                key={index}
                onClick={() => onQuickReply(reply)}
                className="px-3 py-1.5 text-sm bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 transition-colors break-words max-w-full"
                style={{ 
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word'
                }}
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        {/* Message Actions */}
        <div className="mt-4 flex items-center justify-end space-x-2">
          {/* Copy Button */}
          <button
            onClick={() => handleCopy(text)}
            className={`p-2 rounded-lg ${
              isUser
                ? 'text-white/80 hover:bg-white/10'
                : 'text-gray-600 hover:bg-gray-100'
            } transition-colors`}
            title={copied ? "Copied!" : "Copy message"}
          >
            {copied ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <Copy className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}