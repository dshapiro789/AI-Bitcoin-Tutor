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
    price: 29.99,
    stripePriceId: 'price_monthly',
    interval: 'month',
    features: [
      'Access to AI Chatbot',
      'Node Simulator',
      'Wallet Simulator',
      'Development Tools',
      'Premium Courses',
      'Early Access to New Features'
    ]
  },
  {
    id: 'annual',
    name: 'Annual',
    price: 299.99,
    stripePriceId: 'price_annual',
    interval: 'year',
    features: [
      'All Monthly Features',
      '2 Months Free',
      'Early Access to New Features'
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
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: selectedPlan.stripePriceId,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      const result = await stripe?.redirectToCheckout({ sessionId });

      if (result?.error) {
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
        {user && subscription?.tier === 'premium' && (
          <div className="mt-6">
            <a 
              href="/account" 
              className="text-orange-500 hover:text-orange-600 font-medium"
            >
              Already subscribed? Manage your subscription
            </a>
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
        <div className="max-w-md mx-auto mb-8 p-4 bg-red-50 text-red-700 text-sm">
          {error}
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
                  Subscribe Now
                </>
              )}
            </button>
          </div>

          <div className="mt-6 flex items-center justify-center text-sm text-gray-500">
            <Shield className="h-4 w-4 mr-2" />
            Secure, encrypted payment processing
          </div>
        </div>
      </div>
    </div>
  );
}

export default Subscription;