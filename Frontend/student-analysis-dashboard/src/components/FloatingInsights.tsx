import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface FloatingInsightsProps {
  stats?: any;
}

const FloatingInsights: React.FC<FloatingInsightsProps> = ({ stats }) => {
  const insights = React.useMemo(() => {
    if (!stats) return [
      "Loading graduation tracking data...",
      "Analyzing student completion rates",
      "Calculating missing module statistics"
    ];

    const readyToGraduate = stats.graduationTracking?.studentsReadyToGraduate || 0;
    const atRisk = stats.graduationTracking?.studentsAtRisk || 0;
    const totalStudents = stats.totalStudents || 1;
    const completionRate = stats.averagePerformance || 0;

    return [
      `${Math.round((readyToGraduate / totalStudents) * 100)}% of students ready to graduate`,
      `${atRisk} students identified as at-risk for graduation`,
      `Average completion rate: ${completionRate}%`
    ];
  }, [stats]);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 2, duration: 0.5 }}
      className="fixed bottom-8 right-8 max-w-sm bg-white rounded-lg shadow-xl p-4 border border-gray-100 z-40"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-purple-600" />
        </div>
        <h4 className="font-medium text-gray-900">AI Insights</h4>
      </div>
      
      <div className="space-y-2">
        {insights.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.2 + i * 0.1, duration: 0.3 }}
            className="text-sm text-gray-600 flex items-start gap-2"
          >
            <div className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 flex-shrink-0" />
            {insight}
          </motion.div>
        ))}
      </div>
      
      {/* Close button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
        onClick={() => {
          // Handle close - you can add state management here
        }}
      >
        ×
      </motion.button>
    </motion.div>
  );
};

export default FloatingInsights; 