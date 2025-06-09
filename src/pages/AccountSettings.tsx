import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, User, Key, Crown, CheckCircle, 
  Calendar, AlertTriangle, ArrowRight, X
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { motion } from 'framer-motion';

function AccountSettings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const { subscription, cancelSubscription } = useSubscriptionStore();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancelSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      await cancelSubscription();
      setShowCancelConfirm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    } finally {
      setLoading(false);
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
                        <Crown className="h-4 w-4 mr-1" />
                        Admin
                      </span>
                    ) : subscription?.tier === 'premium' ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                        <Crown className="h-4 w-4 mr-1" />
                        Premium
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        Free
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Management */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Subscription Management
            </h2>

            <div className="bg-gray-50 rounded-xl p-6">
              {subscription?.tier === 'premium' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Crown className="h-6 w-6 text-orange-500 mr-2" />
                      <div>
                        <h3 className="font-medium text-gray-900">Premium Subscription</h3>
                        <p className="text-sm text-gray-500">Active</p>
                      </div>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    Next billing date: {new Date(subscription.endDate || '').toLocaleDateString()}
                  </div>

                  <div className="pt-4 border-t">
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      Cancel Subscription
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <Crown className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Upgrade to Premium
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Get unlimited access to all premium features and courses.
                  </p>
                  <button
                    onClick={() => navigate('/subscription')}
                    className="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium"
                  >
                    Upgrade Now
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </button>
                </div>
              )}
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
                Change your password to keep your account secure.
              </p>
              <button
                onClick={() => {/* Implement password reset */}}
                className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Subscription Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Cancel Subscription</h3>
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center mb-4 text-amber-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <span className="font-medium">Warning</span>
              </div>
              <p className="text-gray-600">
                Are you sure you want to cancel your premium subscription? You'll lose access to:
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center text-gray-600">
                  <Crown className="h-4 w-4 mr-2 text-orange-500" />
                  Premium courses and content
                </li>
                <li className="flex items-center text-gray-600">
                  <Crown className="h-4 w-4 mr-2 text-orange-500" />
                  Unlimited AI chat access
                </li>
                <li className="flex items-center text-gray-600">
                  <Crown className="h-4 w-4 mr-2 text-orange-500" />
                  Advanced development tools
                </li>
              </ul>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  'Cancel Subscription'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default AccountSettings;