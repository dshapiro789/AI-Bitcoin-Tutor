import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, DollarSign, Activity, FileText } from 'lucide-react';

interface MobileContentNavProps {
  activeTab: 'resources' | 'treasuries' | 'on-chain' | 'whitepaper';
  onChange: (tab: 'resources' | 'treasuries' | 'on-chain' | 'whitepaper') => void;
}

export function MobileContentNav({ activeTab, onChange }: MobileContentNavProps) {
  const tabs = [
    {
      id: 'resources' as const,
      icon: BookOpen,
      label: 'Bitcoin Resources',
      shortLabel: 'Resources',
      description: 'Tools & Services'
    },
    {
      id: 'treasuries' as const,
      icon: DollarSign,
      label: 'Bitcoin Treasuries',
      shortLabel: 'Treasuries',
      description: 'Corporate Holdings'
    },
    {
      id: 'on-chain' as const,
      icon: Activity,
      label: 'On-Chain Data',
      shortLabel: 'On-Chain',
      description: 'Live Network Stats'
    },
    {
      id: 'whitepaper' as const,
      icon: FileText,
      label: 'Bitcoin Whitepaper',
      shortLabel: 'Whitepaper',
      description: 'Original Document'
    }
  ];

  return (
    <div className="w-full mb-6 sm:mb-8">
      {/* Mobile Navigation (320px - 767px) */}
      <div className="block md:hidden">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2 mx-2">
          <div className="grid grid-cols-2 gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => onChange(tab.id)}
                  className={`relative flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300 min-h-[88px] ${
                    isActive
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                      : 'text-gray-600 hover:text-orange-500 hover:bg-orange-50'
                  }`}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: isActive ? 1 : 1.02 }}
                >
                  {/* Background glow for active state */}
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-700 rounded-xl blur-sm -z-10"
                    />
                  )}

                  {/* Icon with animation */}
                  <motion.div
                    animate={{
                      scale: isActive ? 1.1 : 1,
                      rotate: isActive ? [0, -5, 5, 0] : 0
                    }}
                    transition={{
                      duration: 0.3,
                      rotate: { duration: 0.6 }
                    }}
                    className="mb-2"
                  >
                    <Icon className="h-6 w-6" />
                  </motion.div>
                  
                  {/* Label */}
                  <span className="font-semibold text-xs text-center leading-tight">
                    {tab.shortLabel}
                  </span>
                  
                  {/* Description */}
                  <span className={`text-xs text-center leading-tight mt-1 ${
                    isActive ? 'text-orange-100' : 'text-gray-500'
                  }`}>
                    {tab.description}
                  </span>

                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full shadow-md"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tablet Navigation (768px - 1023px) */}
      <div className="hidden md:block lg:hidden">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-3 mx-4">
          <div className="grid grid-cols-4 gap-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => onChange(tab.id)}
                  className={`relative flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300 min-h-[80px] ${
                    isActive
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                      : 'text-gray-600 hover:text-orange-500 hover:bg-orange-50'
                  }`}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: isActive ? 1 : 1.02 }}
                >
                  <motion.div
                    animate={{
                      scale: isActive ? 1.1 : 1,
                      rotate: isActive ? [0, -5, 5, 0] : 0
                    }}
                    transition={{
                      duration: 0.3,
                      rotate: { duration: 0.6 }
                    }}
                    className="mb-2"
                  >
                    <Icon className="h-5 w-5" />
                  </motion.div>
                  
                  <span className="font-semibold text-xs text-center leading-tight">
                    {tab.shortLabel}
                  </span>

                  {isActive && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full shadow-md"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Desktop Navigation (1024px+) */}
      <div className="hidden lg:block">
        <div className="bg-white rounded-2xl shadow-lg p-1 overflow-hidden border border-gray-100">
          <div className="relative flex">
            {/* Background slider */}
            <motion.div
              className="absolute top-1 bottom-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-md"
              animate={{
                left: activeTab === 'resources' ? '0.25rem' : 
                      activeTab === 'treasuries' ? '25%' : 
                      activeTab === 'on-chain' ? '50%' : '75%',
                width: '25%',
                marginLeft: activeTab === 'resources' ? '0' : 
                           activeTab === 'treasuries' ? '-0.125rem' : 
                           activeTab === 'on-chain' ? '-0.25rem' : '-0.375rem'
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
            />

            {/* Tab buttons */}
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => onChange(tab.id)}
                  className={`relative flex-1 flex flex-col items-center justify-center gap-2 px-6 py-4 rounded-xl transition-all duration-300 z-10 min-h-[5rem] ${
                    isActive
                      ? 'text-white'
                      : 'text-gray-600 hover:text-orange-500'
                  }`}
                >
                  <motion.div
                    animate={{
                      scale: isActive ? 1.1 : 1,
                      rotate: isActive ? [0, -5, 5, 0] : 0
                    }}
                    transition={{
                      duration: 0.3,
                      rotate: { duration: 0.6 }
                    }}
                  >
                    <Icon className="h-6 w-6" />
                  </motion.div>
                  
                  <span className="font-semibold text-sm leading-tight text-center">
                    {tab.label}
                  </span>

                  {/* Active indicator dot */}
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-white rounded-full shadow-md"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}