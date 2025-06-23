import React from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, ExternalLink, Heart, MessageSquare, 
  Send, Shield, ArrowRight
} from 'lucide-react';

function Contact() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Get in Touch</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Have questions or feedback? We'd love to hear from you.
          </p>
        </motion.div>

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
            <h2 className="text-3xl font-bold mb-2">Contact Us</h2>
            <p className="text-orange-100 text-lg">
              Send us an email and we'll get back to you as soon as possible
            </p>
          </div>

          {/* Email Contact Section */}
          <div className="p-12">
            <div className="text-center mb-12">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Ready to reach out?
              </h3>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Whether you have questions about Bitcoin, need technical support, or want to share feedback, 
                we're here to help. Click the button below to send us an email.
              </p>
            </div>

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
                  <span>Email Us</span>
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

            {/* Email Address Display - Fixed for Mobile */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 mb-2">Or copy our email address:</p>
                <div className="flex w-full items-center justify-center px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <Mail className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                  <span className="font-mono text-gray-800 select-all break-all text-sm sm:text-base">aibitcointutor@gmail.com</span>
                </div>
              </div>
            </div>

            {/* What to Include Section */}
            <div className="bg-orange-50 rounded-xl p-6 border border-orange-100">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <MessageSquare className="h-5 w-5 text-orange-500 mr-2" />
                What to include in your email:
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
                    <span className="text-sm text-gray-700">Your preferred contact method</span>
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

        {/* Single Contact Method - Feedback & Ideas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12"
        >
          <div className="flex justify-center">
            <div className="bg-white p-6 rounded-xl shadow-lg text-center max-w-sm">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                <Heart className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Feedback & Ideas</h3>
              <p className="text-sm text-gray-600">
                Have suggestions for improving our platform? We'd love to hear them.
              </p>
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