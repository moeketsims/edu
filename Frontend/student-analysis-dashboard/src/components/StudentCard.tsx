import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, ChevronDown, ChevronUp, AlertTriangle, BookOpen, 
  Clock, Award, Target, TrendingUp, Sparkles, CheckCircle,
  XCircle, Minus
} from 'lucide-react';
import { Student } from '../types';

interface StudentCardProps {
  student: Student;
}

const StudentCard: React.FC<StudentCardProps> = ({ student }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine completion status and colors
  const getCompletionStatus = (percentage: number) => {
    if (percentage >= 80) return { 
      status: 'excellent', 
      color: 'from-emerald-500 to-emerald-600', 
      bgColor: 'bg-emerald-500/20', 
      textColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/30'
    };
    if (percentage >= 60) return { 
      status: 'good', 
      color: 'from-amber-500 to-amber-600', 
      bgColor: 'bg-amber-500/20', 
      textColor: 'text-amber-400',
      borderColor: 'border-amber-500/30'
    };
    return { 
      status: 'needs-attention', 
      color: 'from-red-500 to-red-600', 
      bgColor: 'bg-red-500/20', 
      textColor: 'text-red-400',
      borderColor: 'border-red-500/30'
    };
  };

  // Determine academic level colors
  const getLevelColors = (level: string) => {
    switch (level.toLowerCase()) {
      case '1st': return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' };
      case '2nd': return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' };
      case '3rd': return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' };
      case '4th': return { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' };
      default: return { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' };
    }
  };

  const completionStatus = getCompletionStatus(student.completion_percentage);
  const levelColors = getLevelColors(student.current_academic_level);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="group relative"
    >
      {/* Card glow effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-300" />
      
      {/* Main card */}
      <div className="relative bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-all duration-300">
        {/* Header with gradient accent */}
        <div className="relative p-6 pb-4">
          {/* Status indicator stripe */}
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${completionStatus.color}`} />
          
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {/* Student name and number */}
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white truncate font-display">
                    {student.student_name}
                  </h3>
                  <p className="text-sm text-gray-400">#{student.student_number}</p>
                </div>
              </div>

              {/* Key metrics row */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                {/* Academic Level */}
                <div className="text-center">
                  <div className={`inline-flex items-center px-3 py-1.5 rounded-lg ${levelColors.bg} ${levelColors.border} border`}>
                    <span className={`text-sm font-medium ${levelColors.text}`}>
                      {student.current_academic_level} Year
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Academic Level</p>
                </div>

                {/* Completion Percentage */}
                <div className="text-center">
                  <div className={`inline-flex items-center px-3 py-1.5 rounded-lg ${completionStatus.bgColor} ${completionStatus.borderColor} border`}>
                    <span className={`text-sm font-bold ${completionStatus.textColor}`}>
                      {student.completion_percentage.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Completion</p>
                </div>

                {/* Missing Modules */}
                <div className="text-center">
                  <div className={`inline-flex items-center px-3 py-1.5 rounded-lg ${
                    student.total_missing_modules === 0 
                      ? 'bg-emerald-500/20 border-emerald-500/30 border' 
                      : 'bg-red-500/20 border-red-500/30 border'
                  }`}>
                    <span className={`text-sm font-bold ${
                      student.total_missing_modules === 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {student.total_missing_modules}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Missing</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-400">Academic Progress</span>
                  <span className={`text-xs font-bold ${completionStatus.textColor}`}>
                    {student.completion_percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${completionStatus.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${student.completion_percentage}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    style={{
                      boxShadow: `0 0 10px ${completionStatus.color.includes('emerald') ? '#10b981' : 
                                             completionStatus.color.includes('amber') ? '#f59e0b' : '#ef4444'}40`
                    }}
                  />
                </div>
              </div>

              {/* Plan code */}
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">{student.plan_code}</span>
                </div>
                
                {/* Retakes indicator */}
                {student.total_retakes > 0 && (
                  <div className="flex items-center space-x-1 px-2 py-1 bg-amber-500/20 rounded-lg border border-amber-500/30">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span className="text-xs font-medium text-amber-400">
                      {student.total_retakes} retake{student.total_retakes !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Expand button */}
          {student.missing_modules_details.length > 0 && (
            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full mt-4 p-3 bg-gray-800/50 hover:bg-gray-800/70 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 group/button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-sm font-medium text-gray-300 group-hover/button:text-white transition-colors">
                {isExpanded ? 'Hide Details' : 'View Missing Modules'}
              </span>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-400 group-hover/button:text-white transition-colors" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400 group-hover/button:text-white transition-colors" />
              )}
            </motion.button>
          )}
        </div>

        {/* Expandable missing modules section */}
        <AnimatePresence>
          {isExpanded && student.missing_modules_details.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-gray-800"
            >
              <div className="p-6 pt-4 space-y-3">
                <div className="flex items-center space-x-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <h4 className="text-lg font-semibold text-white">Missing Modules</h4>
                  <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded-lg border border-red-500/30">
                    {student.missing_modules_details.length}
                  </span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                  {student.missing_modules_details.map((module, index) => (
                    <motion.div
                      key={module.module_code}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-white text-sm">
                              {module.module_code}
                            </span>
                            {module.is_elective && (
                              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-medium rounded border border-blue-500/30">
                                Elective
                              </span>
                            )}
                            <span className={`px-2 py-0.5 text-xs font-medium rounded border ${
                              module.priority === 'High' 
                                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                            }`}>
                              {module.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300 mb-2 line-clamp-2">
                            {module.module_name}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="flex items-center space-x-1">
                              <Award className="w-3 h-3" />
                              <span>{module.credits} credits</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Target className="w-3 h-3" />
                              <span>Year {module.required_year}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <BookOpen className="w-3 h-3" />
                              <span>{module.phase}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state for no missing modules */}
        {isExpanded && student.missing_modules_details.length === 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-800 p-6 text-center"
          >
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h4 className="text-lg font-semibold text-white mb-2">All Caught Up!</h4>
            <p className="text-gray-400">This student has no missing modules.</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default StudentCard; 