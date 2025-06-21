import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Plus, Edit2, Trash2, MessageSquare, Clock, 
  Calendar, Loader, Check, AlertCircle 
} from 'lucide-react';
import { useChatHistory, ChatSession } from '../hooks/useChatHistory';

interface ChatHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onLoadChat: (sessionId: string) => void;
}

export function ChatHistorySidebar({ 
  isOpen, 
  onClose, 
  onNewChat, 
  onLoadChat 
}: ChatHistorySidebarProps) {
  const { 
    chatSessions, 
    isLoading, 
    error, 
    renameChatSession, 
    deleteChatSession 
  } = useChatHistory();
  
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleStartEdit = (session: ChatSession) => {
    setEditingSession(session.id);
    setEditTitle(session.title);
  };

  const handleSaveEdit = async () => {
    if (!editingSession || !editTitle.trim()) return;

    try {
      await renameChatSession(editingSession, editTitle.trim());
      setEditingSession(null);
      setEditTitle('');
    } catch (err) {
      console.error('Failed to rename chat:', err);
    }
  };

  const handleCancelEdit = () => {
    setEditingSession(null);
    setEditTitle('');
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteChatSession(sessionId);
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-16 bottom-0 w-80 bg-gray-50 border-r border-gray-200 z-50 flex flex-col shadow-xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-orange-500" />
                  Chat History
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* New Chat Button */}
              <button
                onClick={() => {
                  onNewChat();
                  onClose();
                }}
                className="w-full flex items-center justify-center px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium shadow-sm"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Chat
              </button>
            </div>

            {/* Chat Sessions List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader className="h-6 w-6 text-orange-500 animate-spin" />
                  <span className="ml-2 text-gray-600">Loading chat history...</span>
                </div>
              ) : error ? (
                <div className="p-4">
                  <div className="flex items-center text-red-600 mb-2">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span className="font-medium">Error loading chats</span>
                  </div>
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              ) : chatSessions.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No chat history</h3>
                  <p className="text-gray-500 text-sm">
                    Start a new conversation to see your chat history here.
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {chatSessions.map((session) => (
                    <div
                      key={session.id}
                      className="group relative bg-white rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-sm transition-all"
                    >
                      {editingSession === session.id ? (
                        <div className="p-3">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            className="w-full px-2 py-1 text-sm border border-orange-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            maxLength={50}
                            autoFocus
                          />
                          <div className="flex items-center justify-end space-x-2 mt-2">
                            <button
                              onClick={handleCancelEdit}
                              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveEdit}
                              className="px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            onLoadChat(session.id);
                            onClose();
                          }}
                          className="p-3 cursor-pointer"
                        >
                          {/* Chat Title */}
                          <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1 group-hover:text-orange-600 transition-colors">
                            {session.title}
                          </h3>

                          {/* Last Message Preview */}
                          <p className="text-xs text-gray-500 line-clamp-1 mb-2">
                            {session.lastMessagePreview}
                          </p>

                          {/* Metadata */}
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatRelativeTime(session.updatedAt)}
                            </div>
                            <div className="flex items-center">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              {session.messageCount}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEdit(session);
                              }}
                              className="p-1 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded transition-colors"
                              title="Rename chat"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirm(session.id);
                              }}
                              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="Delete chat"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center text-xs text-gray-500">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Chats are ordered by last activity</span>
              </div>
            </div>
          </motion.div>

          {/* Delete Confirmation Modal */}
          <AnimatePresence>
            {deleteConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-xl p-6 max-w-sm w-full"
                >
                  <div className="flex items-center mb-4 text-red-600">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <h3 className="font-semibold">Delete Chat</h3>
                  </div>
                  
                  <p className="text-gray-600 mb-6 text-sm">
                    Are you sure you want to delete this chat? This action cannot be undone.
                  </p>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDeleteSession(deleteConfirm)}
                      className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}