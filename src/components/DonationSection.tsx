import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Copy, CheckCircle, QrCode } from 'lucide-react';

export function DonationSection() {
  const [copied, setCopied] = useState(false);
  const btcAddress = 'bc1qxftmkwmgn2uqqutgl0x5500xdycxrdlwetkh07';

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(btcAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  return (
    <section className="relative py-24 bg-gradient-to-br from-orange-50 via-white to-orange-50 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(#f7931a_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>
      
      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-full mb-6">
            <Heart className="h-8 w-8 text-white" />
          </div>
          
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Support Our Mission
          </h2>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Help us continue building the world's best Bitcoin education platform. 
            Your support directly funds new features, content improvements, and keeps our mission alive.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-orange-100"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* QR Code Section */}
            <div className="text-center order-2 md:order-1">
              <div className="inline-flex items-center justify-center mb-6">
                <QrCode className="h-6 w-6 text-orange-500 mr-2" />
                <span className="text-lg font-semibold text-gray-900">Scan to Donate</span>
              </div>
              
              <div className="relative inline-block">
                <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg border-2 border-orange-100">
                  <img 
                    src="/BTC.jpg" 
                    alt="Bitcoin donation QR code" 
                    className="w-40 h-40 md:w-48 md:h-48 mx-auto"
                  />
                </div>
              </div>
              
              <p className="text-sm text-gray-500 mt-4">
                Scan with any Bitcoin wallet
              </p>
            </div>

            {/* Address Section */}
            <div className="space-y-4 md:space-y-6 order-1 md:order-2">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Bitcoin Donation Address
                </h3>
                
                <div className="bg-gray-50 rounded-xl p-3 md:p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <code className="text-xs md:text-sm font-mono text-gray-800 break-all pr-2 md:pr-4">
                      {btcAddress}
                    </code>
                    
                    <button
                      onClick={handleCopyAddress}
                      className="flex-shrink-0 p-1.5 md:p-2 text-orange-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title={copied ? "Copied!" : "Copy address"}
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4 md:h-5 md:w-5" />
                      ) : (
                        <Copy className="h-4 w-4 md:h-5 md:w-5" />
                      )}
                    </button>
                  </div>
                </div>
                
                {copied && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs md:text-sm text-green-600 mt-2 font-medium"
                  >
                    ✓ Address copied to clipboard!
                  </motion.p>
                )}
              </div>

              {/* How Donations Help */}
              <div className="bg-orange-50 rounded-xl p-4 md:p-6 border border-orange-100">
                <h4 className="font-semibold text-gray-900 mb-3">How Your Donation Helps:</h4>
                <ul className="space-y-2 text-xs md:text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                    Developing new AI features and improvements
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                    Creating comprehensive Bitcoin educational content
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                    Maintaining and improving platform infrastructure
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                    Keeping the platform accessible and free for basic features
                  </li>
                </ul>
              </div>

              {/* Thank You Message */}
              <div className="text-center lg:text-left">
                <p className="text-sm md:text-base text-gray-600 italic">
                  "Every satoshi counts and helps us build a better Bitcoin education platform for everyone. 
                  Thank you for supporting our mission to spread Bitcoin knowledge worldwide."
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <div className="inline-flex items-center px-6 py-3 bg-white rounded-full shadow-md border border-orange-100">
            <QrCode className="h-5 w-5 text-orange-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">
              We only accept Bitcoin donations - staying true to our mission
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}