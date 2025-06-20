import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSubscriptionStore } from '../store/subscriptionStore';

function SubscriptionSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loadSubscription } = useSubscriptionStore();
  const [loading, setLoading] = useState(true);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Reload subscription data after successful payment
    const reloadData = async () => {
      try {
        await loadSubscription();
      } catch (error) {
        console.error('Error reloading subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      // Wait a moment for webhook to process
      setTimeout(reloadData, 2000);
    } else {
      setLoading(false);
    }
  }, [sessionId, loadSubscription]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-8 h-8 text-green-500" />
        </motion.div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to Premium!
        </h1>

        <div className="flex items-center justify-center mb-6">
          <Crown className="w-6 h-6 text-orange-500 mr-2" />
          <span className="text-lg font-medium text-orange-600">Premium Member</span>
        </div>

        <p className="text-gray-600 mb-8">
          Your subscription has been activated successfully. You now have unlimited access to all premium features!
        </p>

        <div className="space-y-3 mb-8">
          <div className="flex items-center text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
            Unlimited AI Chat Access
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
            Advanced Bitcoin Education
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
            Priority Support
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/ai-chat')}
            className="w-full py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center justify-center"
          >
            Start Learning
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>

          <button
            onClick={() => navigate('/account')}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Manage Subscription
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default SubscriptionSuccess;