import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, MessageSquare, Shield, Ban as Bank, Library, ChevronRight, Lock, Crown } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useSubscriptionStore } from '../store/subscriptionStore';

function Home() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { subscription } = useSubscriptionStore();

  const features = [
    {
      icon: <Shield className="h-8 w-8 text-orange-600" />,
      title: "Financial Freedom",
      description: "Bitcoin gives you complete control over your money. No banks or governments can freeze your assets or deny you access."
    },
    {
      icon: <Globe className="h-8 w-8 text-orange-600" />,
      title: "Global Access",
      description: "Send money anywhere in the world, instantly and at minimal cost. Bitcoin works 24/7 and doesn't care about borders."
    },
    {
      icon: <Bank className="h-8 w-8 text-orange-600" />,
      title: "Sound Money",
      description: "With a fixed supply of 21 million coins, Bitcoin is designed to be inflation-resistant, preserving your wealth over time."
    }
  ];

  const freeFeatures = [
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Resources",
      description: "Access our curated collection of Bitcoin tools and educational materials.",
      path: "/resources"
    },
    {
      icon: <MessageSquare className="h-8 w-8" />,
      title: "Limited AI Chat",
      description: "Try our AI Bitcoin tutor with basic access (15 messages per hour).",
      path: "/ai-chat"
    }
  ];

  const premiumFeatures = [
    {
      icon: <MessageSquare className="h-8 w-8" />,
      title: "Unlimited AI Chat",
      description: "Get unlimited personalized help from our advanced AI tutor, available 24/7.",
      path: "/ai-chat",
      premium: true
    }
  ];

  const handleFeatureClick = (path: string, premium: boolean = false) => {
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(path)}`);
      return;
    }
    
    if (premium && (!subscription || subscription.tier !== 'premium')) {
      navigate('/subscription?redirect=' + encodeURIComponent(path));
      return;
    }

    navigate(path);
  };

  const isPremium = user?.isAdmin || (subscription?.tier === 'premium' && subscription?.status === 'active');

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Hero Section */}
      <div className="text-center mb-16 pt-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Master Bitcoin with AI-Powered Learning
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            From basics to advanced concepts, learn everything about Bitcoin through
            interactive AI-guided tutorials.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/subscription')}
                className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-center"
              >
                Get Started
              </motion.button>
            ) : !isPremium ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/subscription')}
                className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-center"
              >
                Upgrade to Premium
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/ai-chat')}
                className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-center"
              >
                Start Learning
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Why Bitcoin Matters Section */}
      <div className="mb-24">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-t-2xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-4">Why Bitcoin Matters</h2>
          <p className="text-lg opacity-90">
            Understanding the revolutionary potential of the world's first decentralized digital currency
          </p>
        </div>
        <div className="bg-white rounded-b-2xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {features.map((feature, index) => (
              <div key={index} className="p-8 hover:bg-orange-50 transition-colors">
                <div className="bg-orange-50 p-4 rounded-lg inline-block mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="mb-24">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Available Features</h2>
        
        {/* Free Features */}
        <div className="mb-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Free Features</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {freeFeatures.map((feature, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                className="bg-white p-6 rounded-xl shadow-md cursor-pointer"
                onClick={() => handleFeatureClick(feature.path)}
              >
                <div className="p-2 bg-orange-50 rounded-lg text-orange-500 inline-flex mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <div className="flex items-center text-orange-500 font-medium">
                  {user ? 'Access Now' : 'Sign In to Access'}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Premium Features */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Premium Features</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {premiumFeatures.map((feature, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                className={`bg-white p-6 rounded-xl shadow-md cursor-pointer relative ${
                  !user || (!isPremium && feature.premium) ? 'opacity-75' : ''
                }`}
                onClick={() => handleFeatureClick(feature.path, feature.premium)}
              >
                <div className="p-2 bg-orange-50 rounded-lg text-orange-500 inline-flex mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
                  {feature.title}
                  {(!user || (!isPremium && feature.premium)) && (
                    <Crown className="h-4 w-4 ml-2 text-orange-500" />
                  )}
                </h3>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <div className="flex items-center text-orange-500 font-medium">
                  {!user ? 'Sign In with Premium Account to Access' : 
                    (!isPremium && feature.premium) ? 'Upgrade to Premium to Access' : 'Access Now'}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      {(!user || !isPremium) && (
        <div className="mb-24 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Master Bitcoin?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Get unlimited access to all our premium features and start your journey to Bitcoin mastery today.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/subscription')}
            className="px-8 py-4 bg-white text-orange-500 rounded-xl hover:bg-orange-50 transition-colors font-semibold text-lg"
          >
            Get Premium Access
          </motion.button>
        </div>
      )}
    </div>
  );
}

export default Home;