import React, { useState } from 'react';
import { 
  User, Key, AlertTriangle, CheckCircle, 
  Mail, Loader
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';

function AccountSettings() {
  const { user, signOut, resetPassword } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  
  // Password reset state
  const [passwordResetStatus, setPasswordResetStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [passwordResetMessage, setPasswordResetMessage] = useState<string>('');

  const handlePasswordReset = async () => {
    if (!user?.email) {
      setPasswordResetStatus('error');
      setPasswordResetMessage('No email address found for your account');
      return;
    }

    try {
      setPasswordResetStatus('loading');
      setPasswordResetMessage('');
      
      await resetPassword(user.email);
      
      setPasswordResetStatus('success');
      setPasswordResetMessage('Password reset email sent! Please check your inbox and follow the instructions to reset your password.');
    } catch (err) {
      setPasswordResetStatus('error');
      setPasswordResetMessage(err instanceof Error ? err.message : 'Failed to send password reset email');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 bg-orange-500 text-white">
          <h1 className="text-2xl font-bold">Account Settings</h1>
        </div>

        <div className="p-6 space-y-8">
          {/* Account Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Account Information
            </h2>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <div className="mt-1 text-gray-900">{user?.email}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Account Type</label>
                  <div className="mt-1 flex items-center">
                    {user?.isAdmin ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                        <User className="h-4 w-4 mr-1" />
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <User className="h-4 w-4 mr-1" />
                        User
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Password Management */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Key className="h-5 w-5 mr-2" />
              Password Management
            </h2>
            <div className="bg-gray-50 rounded-xl p-6">
              <p className="text-gray-600 mb-4">
                This feature is not currently active in Beta. 
              </p>
              
              {/* Password Reset Status Messages */}
              {passwordResetMessage && (
                <div className={`mb-4 p-3 rounded-lg ${
                  passwordResetStatus === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-700' 
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  <div className="flex items-start">
                    {passwordResetStatus === 'success' ? (
                      <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                    )}
                    <span className="text-sm">{passwordResetMessage}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handlePasswordReset}
                disabled={passwordResetStatus === 'loading'}
                className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {passwordResetStatus === 'loading' ? (
                  <>
                    <Loader className="h-5 w-5 mr-2 animate-spin" />
                    Sending Reset Email...
                  </>
                ) : (
                  'Send Password Reset Email'
                )}
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="block">{error}</span>
                  {error.includes('contact support') && (
                    <a 
                      href="mailto:aibitcointutor@gmail.com" 
                      className="text-red-600 underline hover:text-red-800 text-sm mt-1 inline-block"
                    >
                      Contact Support →
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AccountSettings;