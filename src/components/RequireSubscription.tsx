import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { useAuthStore } from '../store/authStore';
import { Lock } from 'lucide-react';

interface RequireSubscriptionProps {
  children: React.ReactNode;
  feature: string;
}

export function RequireSubscription({ children, feature }: RequireSubscriptionProps) {
  const { user } = useAuthStore();
  const { checkAccess } = useSubscriptionStore();
  const location = useLocation();

  // Allow admin access to all features
  if (user?.isAdmin) {
    return <>{children}</>;
  }

  const hasAccess = checkAccess(feature);

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-lg p-8 bg-white rounded-xl shadow-lg">
          <Lock className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign in Required</h2>
          <p className="text-gray-600 mb-6">
            Please sign in to access this feature.
          </p>
          <button
            onClick={() => {
              window.location.href = `/subscription?redirect=${encodeURIComponent(location.pathname)}`;
            }}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-lg p-8 bg-white rounded-xl shadow-lg">
          <Lock className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Premium Feature</h2>
          <p className="text-gray-600 mb-6">
            This feature is available exclusively to premium subscribers.
          </p>
          <button
            onClick={() => {
              window.location.href = `/subscription?redirect=${encodeURIComponent(location.pathname)}`;
            }}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Upgrade to Premium
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}