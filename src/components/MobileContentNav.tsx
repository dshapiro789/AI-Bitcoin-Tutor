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
    },
    {
      id: 'whitepaper' as const,
      icon: FileText,
      label: 'Bitcoin Whitepaper',
      shortLabel: 'Whitepaper'
    }
  ];

  return (
    <div className="w-full bg-white rounded-2xl shadow-lg p-1 mb-8 overflow-hidden">
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
              className={`relative flex-1 flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-xl transition-all duration-300 z-10 min-h-[4rem] ${
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
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </motion.div>
              
              <span className="font-semibold text-xs leading-tight text-center">
                <span className="hidden sm:inline">{tab.shortLabel}</span>
                <span className="sm:hidden">{tab.id === 'resources' ? 'Tools' : 
                                             tab.id === 'treasuries' ? 'Holdings' : 
                                             tab.id === 'on-chain' ? 'Data' : 'Paper'}</span>
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
  );
}