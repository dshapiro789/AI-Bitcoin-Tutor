import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Tab {
  id: string;
  icon: React.ElementType;
  label: string;
}

interface TabSliderProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export function TabSlider({ tabs, activeTab, onChange }: TabSliderProps) {
  const [sliderWidth, setSliderWidth] = useState(0);
  const [sliderLeft, setSliderLeft] = useState(0);
  const tabsRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeTabRef.current) {
      setSliderWidth(activeTabRef.current.offsetWidth);
      setSliderLeft(activeTabRef.current.offsetLeft);
    }
  }, [activeTab]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      tabsRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative bg-white border-b">
      <div className="flex items-center px-2">
        <button
          onClick={() => handleScroll('left')}
          className="p-2 text-gray-500 hover:text-orange-500 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div
          ref={tabsRef}
          className="flex-1 flex overflow-x-auto scrollbar-hide relative"
        >
          {/* Background line */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-200" />

          {/* Animated slider */}
          <motion.div
            className="absolute bottom-0 h-0.5 bg-orange-500"
            animate={{
              width: sliderWidth,
              x: sliderLeft
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30
            }}
          />

          {/* Tabs */}
          <div className="flex space-x-1 relative">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  ref={isActive ? activeTabRef : null}
                  onClick={() => onChange(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 transition-colors relative ${
                    isActive
                      ? 'text-orange-500'
                      : 'text-gray-600 hover:text-orange-500'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{tab.label}</span>

                  {/* Active tab highlight effect */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabHighlight"
                      className="absolute inset-0 bg-orange-50 rounded-lg -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => handleScroll('right')}
          className="p-2 text-gray-500 hover:text-orange-500 transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}