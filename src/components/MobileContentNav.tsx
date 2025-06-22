import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, DollarSign, Activity } from 'lucide-react';

interface MobileContentNavProps {
  activeTab: 'resources' | 'treasuries' | 'on-chain';
  onChange: (tab: 'resources' | 'treasuries' | 'on-chain') => void;
}

export function MobileContentNav({ activeTab, onChange }: MobileContentNavProps) {
  const tabs = [
    {
      id: 'resources' as const,
      icon: BookOpen,
      label: 'Bitcoin Resources',
      shortLabel: 'Resources'
    },
    {
      id: 'treasuries' as const,
      icon: DollarSign,
      label: 'Bitcoin Treasuries',
      shortLabel: 'Treasuries'
    },
    {
      id: 'on-chain' as const,
      icon: Activity,
      label: 'On-Chain Data',
      shortLabel: 'On-Chain'
    }
  ];

  return (
    <div className="w-full bg-white rounded-2xl shadow-lg p-2 mb-8">
      <div className="relative flex">
        {/* Background slider */}
        <motion.div
          className="absolute top-2 bottom-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-md"
          animate={{
            left: activeTab === 'resources' ? '0.5rem' : 
                  activeTab === 'treasuries' ? '33.333%' : '66.666%',
            width: '33.333%',
            marginLeft: activeTab === 'resources' ? '0' : 
                       activeTab === 'treasuries' ? '-0.167rem' : '-0.333rem'
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
              className={`relative flex-1 flex items-center justify-center gap-2 px-3 py-4 rounded-xl transition-all duration-300 z-10 ${
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
                <Icon className="h-5 w-5" />
              </motion.div>
              
              <span className="font-semibold text-xs sm:text-sm lg:text-base">
                <span className="hidden lg:inline">{tab.label}</span>
                <span className="lg:hidden">{tab.shortLabel}</span>
              </span>

              {/* Active indicator dot */}
              {isActive && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full shadow-md"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}