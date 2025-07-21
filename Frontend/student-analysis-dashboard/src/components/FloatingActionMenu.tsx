import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Brain, 
  Download, 
  Settings, 
  Zap,
  BarChart3,
  FileText,
  Search
} from 'lucide-react';

interface FloatingActionMenuProps {
  onCommandPaletteOpen: () => void;
}

const FloatingActionMenu: React.FC<FloatingActionMenuProps> = ({ onCommandPaletteOpen }) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      icon: Search,
      label: 'Search (⌘K)',
      color: 'bg-purple-600 hover:bg-purple-700',
      action: onCommandPaletteOpen
    },
    {
      icon: Brain,
      label: 'AI Analysis',
      color: 'bg-indigo-600 hover:bg-indigo-700',
      action: () => {
        console.log('Starting AI analysis...');
        setIsOpen(false);
      }
    },
    {
      icon: Download,
      label: 'Export Data',
      color: 'bg-blue-600 hover:bg-blue-700',
      action: () => {
        console.log('Exporting data...');
        setIsOpen(false);
      }
    },
    {
      icon: BarChart3,
      label: 'Analytics',
      color: 'bg-emerald-600 hover:bg-emerald-700',
      action: () => {
        console.log('Opening analytics...');
        setIsOpen(false);
      }
    },
    {
      icon: FileText,
      label: 'Generate Report',
      color: 'bg-orange-600 hover:bg-orange-700',
      action: () => {
        console.log('Generating report...');
        setIsOpen(false);
      }
    },
    {
      icon: Settings,
      label: 'Settings',
      color: 'bg-gray-600 hover:bg-gray-700',
      action: () => {
        console.log('Opening settings...');
        setIsOpen(false);
      }
    }
  ];

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {/* Floating Action Buttons */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-20 right-0 space-y-3"
          >
            {menuItems.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: 20, scale: 0.9 }}
                animate={{ 
                  opacity: 1, 
                  x: 0, 
                  scale: 1,
                  transition: {
                    delay: i * 0.05,
                    duration: 0.2
                  }
                }}
                exit={{ 
                  opacity: 0, 
                  x: 20, 
                  scale: 0.9,
                  transition: {
                    delay: (menuItems.length - 1 - i) * 0.03,
                    duration: 0.15
                  }
                }}
                className="flex items-center space-x-3"
              >
                {/* Label */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/95 backdrop-blur-sm text-gray-900 px-3 py-2 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap border border-gray-200"
                >
                  {item.label}
                </motion.div>
                
                {/* Button */}
                <motion.button
                  whileHover={{ 
                    scale: 1.1,
                    rotate: 5
                  }}
                  whileTap={{ scale: 0.9 }}
                  onClick={item.action}
                  className={`w-12 h-12 ${item.color} text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200`}
                >
                  <item.icon className="w-5 h-5" />
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleMenu}
        className="relative w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200"
      >
        {/* Ripple effect on hover */}
        <motion.div
          className="absolute inset-0 bg-white rounded-full opacity-0 group-hover:opacity-20"
          animate={{ scale: isOpen ? 1.5 : 1 }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Icon with rotation */}
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="relative z-10"
        >
          <Plus className="w-7 h-7" />
        </motion.div>
        
        {/* Pulsing ring */}
        <motion.div
          className="absolute inset-0 border-2 border-emerald-400 rounded-full opacity-0"
          animate={{ 
            scale: [1, 1.5, 1], 
            opacity: [0, 0.6, 0] 
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Tooltip */}
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 10, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.8 }}
              className="absolute right-full mr-4 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Quick Actions
              <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-gray-900" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
      
      {/* Background overlay when open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/10 backdrop-blur-[1px] -z-10"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default FloatingActionMenu; 