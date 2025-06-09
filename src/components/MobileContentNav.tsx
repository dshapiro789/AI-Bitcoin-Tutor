import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Video, HelpCircle } from 'lucide-react';

interface MobileContentNavProps {
  activeTab: 'content' | 'video' | 'quiz';
  onChange: (tab: 'content' | 'video' | 'quiz') => void;
  hasVideos: boolean;
  hasQuizzes: boolean;
}

export function MobileContentNav({ activeTab, onChange, hasVideos, hasQuizzes }: MobileContentNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg lg:hidden">
      <nav className="flex justify-around items-center">
        <button
          onClick={() => onChange('content')}
          className={`flex-1 py-4 px-2 flex flex-col items-center space-y-1 relative ${
            activeTab === 'content' ? 'text-orange-500' : 'text-gray-500'
          }`}
        >
          <BookOpen className="h-5 w-5" />
          <span className="text-xs font-medium">Content</span>
          {activeTab === 'content' && (
            <motion.div
              layoutId="activeTabIndicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"
            />
          )}
        </button>

        {hasVideos && (
          <button
            onClick={() => onChange('video')}
            className={`flex-1 py-4 px-2 flex flex-col items-center space-y-1 relative ${
              activeTab === 'video' ? 'text-orange-500' : 'text-gray-500'
            }`}
          >
            <Video className="h-5 w-5" />
            <span className="text-xs font-medium">Videos</span>
            {activeTab === 'video' && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"
              />
            )}
          </button>
        )}

        {hasQuizzes && (
          <button
            onClick={() => onChange('quiz')}
            className={`flex-1 py-4 px-2 flex flex-col items-center space-y-1 relative ${
              activeTab === 'quiz' ? 'text-orange-500' : 'text-gray-500'
            }`}
          >
            <HelpCircle className="h-5 w-5" />
            <span className="text-xs font-medium">Quizzes</span>
            {activeTab === 'quiz' && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"
              />
            )}
          </button>
        )}
      </nav>
    </div>
  );
}