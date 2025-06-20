import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Shield, Check, Loader, Zap, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { stripe } from '../lib/stripe';

const plans = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: 10.00,
    stripePriceId: 'price_1RYV5qG7jCpuFqxwzD6a8tx3',
    interval: 'month',
    features: [
      'Unlimited Access to AI Chatbot',
      'Advanced Bitcoin Education',
      'Priority Support',
      'Early Access to New Features'
    ]
  },
  {
    id: 'annual',
    name: 'Annual',
    price: 80.00,
    stripePriceId: 'price_1RYV6HG7jCpuFqxwnzZSXb4q',
    interval: 'year',
    features: [
      'All Monthly Features',
      '2 Months Free',
      'Exclusive Annual Content',
      'Premium Support'
    ]
  }
];

function Subscription() {
  const [selectedPlan, setSelectedPlan] = useState(plans[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const { subscription } = useSubscriptionStore();
  const location = useLocation();
  const navigate = useNavigate();
  const redirectPath = new URLSearchParams(location.search).get('redirect');

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/auth?redirect=' + encodeURIComponent(location.pathname));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Creating checkout session for user:', user.id, 'with price:', selectedPlan.stripePriceId);
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      
      // Use the correct function name that you deployed
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-payments`;
      console.log('Full function URL:', functionUrl);
      
      // Call Supabase Edge Function
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          priceId: selectedPlan.stripePriceId,
          userId: user.id,
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to create checkout session`);
      }

      const responseData = await response.json();
      console.log('Response data:', responseData);
      
      const { sessionId } = responseData;
      console.log('Got session ID:', sessionId);

      if (!sessionId) {
        throw new Error('No session ID returned from server');
      }

      if (!stripe) {
        throw new Error('Stripe not initialized');
      }

      console.log('Redirecting to Stripe checkout...');
      const result = await stripe.redirectToCheckout({ sessionId });

      if (result?.error) {
        console.error('Stripe redirect error:', result.error);
        throw new Error(result.error.message);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process payment');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
        <p className="text-xl text-gray-600">
          Get unlimited access to all features and premium content
        </p>
        {user && subscription?.tier === 'premium' && subscription?.status === 'active' && (
          <div className="mt-6">
            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg">
              <Check className="h-5 w-5 mr-2" />
              You already have an active premium subscription
            </div>
            <div className="mt-4">
              <button
                onClick={() => navigate('/account')}
                className="text-orange-500 hover:text-orange-600 font-medium"
              >
                Manage your subscription →
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 transform hover:scale-[1.02] ${
              selectedPlan.id === plan.id ? 'ring-2 ring-orange-500' : ''
            }`}
          >
            <div className="p-6">
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                {plan.name}
              </h3>
              <div className="flex items-baseline mb-4">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="ml-2 text-gray-500">/{plan.interval}</span>
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center text-gray-600">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setSelectedPlan(plan)}
                className={`w-full py-3 rounded-lg transition-colors font-medium ${
                  selectedPlan.id === plan.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-orange-50'
                }`}
              >
                Select Plan
              </button>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="max-w-md mx-auto mb-8 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          <div className="font-medium mb-1">Payment Error</div>
          <div>{error}</div>
        </div>
      )}

      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <CreditCard className="h-6 w-6 text-orange-500 mr-2" />
            <h3 className="text-xl font-semibold text-gray-900">
              Payment Information
            </h3>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Selected Plan:</h4>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">{selectedPlan.name} Plan</span>
              <span className="font-semibold">${selectedPlan.price}/{selectedPlan.interval}</span>
            </div>
          </div>

          {!user && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                You need to sign in before subscribing. You'll be redirected to sign in when you click subscribe.
              </p>
            </div>
          )}

          <div className="mt-8">
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full py-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium"
            >
              {loading ? (
                <Loader className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Zap className="h-5 w-5 mr-2" />
                  {user ? 'Subscribe Now' : 'Sign In & Subscribe'}
                </>
              )}
            </button>
          </div>

          <div className="mt-6 flex items-center justify-center text-sm text-gray-500">
            <Shield className="h-4 w-4 mr-2" />
            Secure, encrypted payment processing by Stripe
          </div>

          <div className="mt-4 text-center text-xs text-gray-400">
            You can cancel your subscription at any time from your account settings.
          </div>
        </div>
      </div>
    </div>
  );
}

export default Subscription;