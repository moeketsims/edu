import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, BookOpen, GraduationCap, BarChart3, Settings,
  TrendingUp, Award, Target, Brain, ChevronDown, RefreshCw
} from 'lucide-react';
import EnterpriseDashboard from './EnterpriseDashboard';

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

const MainDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  const tabs: TabItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <BarChart3 className="w-4 h-4" />,
      component: <EnterpriseDashboard />
    },
    {
      id: 'modules',
      label: 'View Modules',
      icon: <BookOpen className="w-4 h-4" />,
      component: <div className="p-8"><h2 className="text-2xl font-bold">Module Management</h2><p className="text-gray-600 mt-2">Coming soon...</p></div>
    },
    {
      id: 'performance',
      label: 'Year Performance',
      icon: <TrendingUp className="w-4 h-4" />,
      component: <div className="p-8"><h2 className="text-2xl font-bold">Year Performance</h2><p className="text-gray-600 mt-2">Coming soon...</p></div>
    },
    {
      id: 'assessment',
      label: 'Assessment Analytics',
      icon: <Target className="w-4 h-4" />,
      component: <div className="p-8"><h2 className="text-2xl font-bold">Assessment Analytics</h2><p className="text-gray-600 mt-2">Coming soon...</p></div>
    },
    {
      id: 'departmental',
      label: 'Departmental Analytics',
      icon: <Users className="w-4 h-4" />,
      component: <div className="p-8"><h2 className="text-2xl font-bold">Departmental Analytics</h2><p className="text-gray-600 mt-2">Coming soon...</p></div>
    },
    {
      id: 'ai-insights',
      label: 'AI Insights',
      icon: <Brain className="w-4 h-4" />,
      component: <div className="p-8"><h2 className="text-2xl font-bold">AI Insights</h2><p className="text-gray-600 mt-2">Coming soon...</p></div>
    }
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab) || tabs[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-800 to-emerald-700 shadow-lg">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div 
                className="flex items-center space-x-3"
                whileHover={{ scale: 1.02 }}
              >
                <motion.div 
                  className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center"
                  whileHover={{ rotate: 5 }}
                >
                  <GraduationCap className="w-7 h-7 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-xl font-bold text-white">
                    Faculty of Education
                  </h1>
                  <p className="text-sm text-emerald-100">Tracking Student Success</p>
                </div>
              </motion.div>
            </div>
            
            <nav className="flex items-center space-x-8">
              {/* Analytics Dropdown */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)}
                  className="flex items-center space-x-2 px-4 py-2 text-emerald-800 bg-white rounded-lg font-medium shadow-sm"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Analytics</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isAnalyticsOpen ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                  {isAnalyticsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
                    >
                      {tabs.map((tab) => (
                        <motion.button
                          key={tab.id}
                          whileHover={{ backgroundColor: '#f3f4f6' }}
                          onClick={() => {
                            setActiveTab(tab.id);
                            setIsAnalyticsOpen(false);
                          }}
                          className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                            activeTab === tab.id ? 'bg-emerald-50 text-emerald-800 border-r-2 border-emerald-700' : 'text-gray-700'
                          }`}
                        >
                          {tab.icon}
                          <span className="font-medium">{tab.label}</span>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 px-4 py-2 text-white hover:text-emerald-100 hover:bg-white/10 rounded-lg font-medium transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                <span>Tutorials</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 px-4 py-2 text-white hover:text-emerald-100 hover:bg-white/10 rounded-lg font-medium transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Administration</span>
              </motion.button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-1"
      >
        {activeTabData.component}
      </motion.div>

      {/* Refresh Button - Fixed position */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 right-8 w-14 h-14 bg-emerald-800 text-white rounded-full shadow-lg hover:bg-emerald-900 transition-colors flex items-center justify-center z-40"
        onClick={() => window.location.reload()}
      >
        <RefreshCw className="w-6 h-6" />
      </motion.button>
    </div>
  );
};

export default MainDashboard; 