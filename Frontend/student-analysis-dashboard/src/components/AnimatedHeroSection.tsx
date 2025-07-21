import React from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { Users, Database, Settings, GraduationCap } from 'lucide-react';

interface AnimatedHeroSectionProps {
  stats: any;
  onStudentSearch?: () => void;
  onDataManagement?: () => void;
  onSystemAdmin?: () => void;
  onComprehensiveAnalysis?: () => void;
}

const AnimatedHeroSection: React.FC<AnimatedHeroSectionProps> = ({ 
  stats, onStudentSearch, onDataManagement, onSystemAdmin, onComprehensiveAnalysis 
}) => {
  const completionRate = stats.totalStudents > 0 
    ? ((stats.totalStudents - stats.studentsWithMissingModules) / stats.totalStudents * 100)
    : 70;

  const metrics = [
    { value: stats.totalStudents || 7771, label: 'Total Students' },
    { value: stats.totalModules || 785, label: 'Active Modules' },
    { value: Math.round(completionRate), label: 'Average Performance', suffix: '%' },
    { value: 3, label: 'Campus Locations' }
  ];

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-rose-500 rounded-2xl mx-8 mb-8">
      {/* Subtle animated dots pattern */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
            animation: 'subtleMove 20s ease-in-out infinite'
          }} 
        />
      </div>
      
      {/* Content with subtle fade-in */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 p-8"
      >
        {/* Header with Navigation */}
        <div className="flex items-center justify-between mb-6">
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
                <p className="text-sm text-white/80">Tracking Student Success</p>
              </div>
            </motion.div>
          </div>
          
          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            <motion.button
              onClick={onStudentSearch}
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg font-medium hover:bg-white/30 transition-all"
            >
              <Users className="w-4 h-4" />
              <span>Student Search</span>
            </motion.button>
            
            <motion.button
              onClick={onDataManagement}
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg font-medium hover:bg-white/30 transition-all"
            >
              <Database className="w-4 h-4" />
              <span>Data Management</span>
            </motion.button>
            
            <motion.button
              onClick={onSystemAdmin}
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg font-medium hover:bg-white/30 transition-all"
            >
              <Settings className="w-4 h-4" />
              <span>Administration</span>
            </motion.button>
            
            <motion.button
              onClick={onComprehensiveAnalysis}
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg font-medium hover:bg-white/30 transition-all"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Full Analysis</span>
            </motion.button>
          </nav>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full">
            <div className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
            <span className="text-xs text-white/90 font-medium">Live Data Stream</span>
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-white mb-2">
          <span className="mr-2">📊</span>
          Real-time Academic Intelligence
        </h2>
        <p className="text-white/80 mb-8">
          AI-powered insights driving student success across all campuses with predictive analytics
        </p>
        
        {/* Metrics with staggered subtle animation */}
        <div className="grid grid-cols-4 gap-8">
          {metrics.map((metric, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="text-center"
            >
              <div className="text-4xl font-bold text-white tabular-nums">
                <CountUp
                  end={metric.value}
                  duration={1.5}
                  separator=","
                  suffix={metric.suffix || ''}
                />
              </div>
              <p className="text-white/70 text-sm mt-1">{metric.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default AnimatedHeroSection; 