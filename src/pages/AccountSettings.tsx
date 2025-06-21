import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, User, Key, Crown, CheckCircle, 
  Calendar, AlertTriangle, ArrowRight, X, ExternalLink,
  Receipt, Clock, Shield, Mail, Loader
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { motion } from 'framer-motion';

function AccountSettings() {
  const navigate = useNavigate();
  const { user, signOut, resetPassword } = useAuthStore();
  const { subscription, cancelSubscription, createCustomerPortalSession } = useSubscriptionStore();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Password reset state
  const [passwordResetStatus, setPasswordResetStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [passwordResetMessage, setPasswordResetMessage] = useState<string>('');

  // Calculate remaining days for subscription
  const calculateRemainingDays = (endDate: string): number => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

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

  const handleBillingHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const portalUrl = await createCustomerPortalSession();
      window.open(portalUrl, '_blank');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to open billing portal';
      setError(errorMessage);
      
      // If it's a configuration error, show a more helpful message
      if (errorMessage.includes('temporarily unavailable')) {
        setError('The billing portal is currently being set up. Please contact support at aibitcointutor@gmail.com for assistance with your subscription.');
      }
    } finally {
      setLoading(false);
    }
  };

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

  const isPremium = user?.isAdmin || (subscription?.tier === 'premium' && subscription?.status === 'active');
  const isActiveUntilPeriodEnd = subscription?.status === 'active_until_period_end' || subscription?.cancelAtPeriodEnd;
  
  // Calculate remaining days for premium subscriptions
  const remainingDays = subscription?.endDate ? calculateRemainingDays(subscription.endDate) : null;

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
                        <p className={`text-sm ${
                          isActiveUntilPeriodEnd ? 'text-amber-600' : 'text-green-600'
                        }`}>
                          {isActiveUntilPeriodEnd ? 'Active until period end' : 'Active'}
                        </p>
                      </div>
                    </div>
                    {isActiveUntilPeriodEnd ? (
                      <div className="flex items-center text-amber-600">
                        <Clock className="h-5 w-5 mr-1" />
                        <span className="text-sm font-medium">Canceling</span>
                      </div>
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>

                  {/* Subscription Details with Remaining Days */}
                  {subscription.endDate && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {isActiveUntilPeriodEnd ? 'Expires on: ' : 'Next billing date: '}
                          {new Date(subscription.endDate).toLocaleDateString()}
                        </div>
                        {remainingDays !== null && (
                          <div className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            remainingDays <= 7 
                              ? 'bg-red-100 text-red-800' 
                              : remainingDays <= 30 
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-green-100 text-green-800'
                          }`}>
                            <Clock className="h-3 w-3 mr-1" />
                            {remainingDays === 0 
                              ? 'Expires today' 
                              : remainingDays === 1 
                                ? '1 day remaining'
                                : `${remainingDays} days remaining`
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {isActiveUntilPeriodEnd && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center text-amber-800">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">Subscription Canceling</span>
                      </div>
                      <p className="text-sm text-amber-700 mt-1">
                        Your subscription will remain active until {new Date(subscription.endDate || '').toLocaleDateString()}. 
                        You can reactivate anytime before then.
                      </p>
                    </div>
                  )}

                  <div className="pt-4 border-t space-y-3">
                    {!isActiveUntilPeriodEnd && (
                      <button
                        onClick={() => setShowCancelConfirm(true)}
                        className="text-red-600 hover:text-red-700 font-medium"
                      >
                        Cancel Subscription
                      </button>
                    )}
                    
                    {isActiveUntilPeriodEnd && (
                      <button
                        onClick={() => navigate('/subscription')}
                        className="text-orange-600 hover:text-orange-700 font-medium"
                      >
                        Reactivate Subscription
                      </button>
                    )}
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

          {/* Billing History */}
          {subscription?.tier === 'premium' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Receipt className="h-5 w-5 mr-2" />
                Billing History
              </h2>
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Payment Records</h3>
                    <p className="text-gray-600 text-sm">
                      View your payment history, download invoices, and update payment methods.
                    </p>
                  </div>
                  <button
                    onClick={handleBillingHistory}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <ExternalLink className="h-4 w-4 mr-2" />
                    )}
                    View Billing Portal
                  </button>
                </div>
                
                <div className="mt-4 flex items-center text-sm text-gray-500">
                  <Shield className="h-4 w-4 mr-2" />
                  Secure billing portal powered by Stripe
                </div>

                {/* Alternative contact method if billing portal is unavailable */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center text-blue-800 mb-1">
                    <Mail className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Need Help?</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    If you need assistance with billing or have questions about your subscription, 
                    contact us at <a href="mailto:aibitcointutor@gmail.com" className="underline">aibitcointutor@gmail.com</a>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Password Management */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Key className="h-5 w-5 mr-2" />
              Password Management
            </h2>
            <div className="bg-gray-50 rounded-xl p-6">
              <p className="text-gray-600 mb-4">
                Change your password to keep your account secure. We'll send you a password reset link via email.
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
                <span className="font-medium">Important Information</span>
              </div>
              <p className="text-gray-600 mb-4">
                Your subscription will be canceled at the end of your current billing period. You'll continue to have access to premium features until:
              </p>
              <div className="bg-orange-50 p-3 rounded-lg mb-4">
                <div className="flex items-center text-orange-800">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="font-medium">
                    {subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'End of billing period'}
                  </span>
                </div>
              </div>
              <p className="text-gray-600 text-sm">
                You can reactivate your subscription anytime before it expires.
              </p>
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
                  'Cancel at Period End'
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