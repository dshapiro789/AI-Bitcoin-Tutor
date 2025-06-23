import React from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, ExternalLink, Heart, MessageSquare, 
  Send, Clock, Shield, ArrowRight
} from 'lucide-react';

function Contact() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 py-12">
      <div className="max-w-4xl mx-auto px-4">

        {/* Main Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-orange-100"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-8 text-white text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Get in Touch</h2>
            <p className="text-orange-100 text-lg">
              Have questions or feedback? We'd love to hear from you.
            </p>
          </div>

          <div className="p-8">
            {/* Main Email Button */}
            <div className="flex justify-center mb-12">
              <motion.a
                href="mailto:aibitcointutor@gmail.com"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative inline-flex items-center px-12 py-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl font-bold text-xl shadow-2xl hover:shadow-orange-500/25 transition-all duration-300 overflow-hidden"
              >
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Content */}
                <div className="relative flex items-center">
                  <Mail className="h-6 w-6 mr-3" />
                  <span>Email</span>
                  <motion.div
                    className="ml-3"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="h-6 w-6" />
                  </motion.div>
                </div>

                {/* Shine effect */}
                <div className="absolute inset-0 -top-2 -bottom-2 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              </motion.a>
            </div>

            {/* What to Include Section */}
            <div className="bg-orange-50 rounded-xl p-6 border border-orange-100">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <MessageSquare className="h-5 w-5 text-orange-500 mr-2" />
                What to include in your email (optional):
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Your specific question or issue</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Any error messages you're seeing</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Your experience level with Bitcoin</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Screenshots if applicable</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Any relevant account information</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Thank You Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center px-6 py-3 bg-white rounded-full shadow-md border border-orange-100">
            <Heart className="h-5 w-5 text-orange-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">
              Thank you for being part of the AI Bitcoin Tutor community!
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Contact;