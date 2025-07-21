import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, Users, Clock, CheckCircle, AlertTriangle, 
  TrendingUp, Award, Activity, Sparkles, Target,
  Database, Zap, Shield 
} from 'lucide-react';
import { BulkAnalysisResponse } from '../types';

interface BulkAnalysisCardProps {
  analysis: BulkAnalysisResponse;
}

const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: number;
  description?: string;
  index: number;
}> = ({ label, value, icon, color, trend, description, index }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: index * 0.05 }}
    className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-all duration-200 hover:bg-gray-800/70"
  >
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2 rounded-lg ${color}`}>
        {icon}
      </div>
      {trend !== undefined && (
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium ${
          trend >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
        }`}>
          <TrendingUp className="w-3 h-3" />
          <span>{Math.abs(trend)}%</span>
        </div>
      )}
    </div>
    <div className="space-y-1">
      <div className="text-2xl font-bold text-white">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-sm font-medium text-gray-300">{label}</div>
      {description && (
        <div className="text-xs text-gray-500">{description}</div>
      )}
    </div>
  </motion.div>
);

const BulkAnalysisCard: React.FC<BulkAnalysisCardProps> = ({ analysis }) => {
  const { analysis_summary, academic_level_distribution, missing_modules_summary, completion_stats } = analysis;

  // Calculate success rate
  const successRate = analysis_summary.total_students_analyzed > 0 
    ? (analysis_summary.successful_analyses / analysis_summary.total_students_analyzed) * 100 
    : 0;

  // Get most common missing module
  const topMissingModule = missing_modules_summary?.most_common_missing?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden"
    >
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-display">Bulk Analysis Overview</h3>
              <p className="text-gray-400 text-sm">Comprehensive student progress insights</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-emerald-400 text-sm font-medium">Analysis Complete</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="p-6 space-y-6">
        {/* Performance metrics grid */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-400" />
            Performance Metrics
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Students Analyzed"
              value={analysis_summary.total_students_analyzed}
              icon={<Users className="w-5 h-5 text-white" />}
              color="bg-blue-500/20"
              trend={5.2}
              description="Total processed"
              index={0}
            />
            <StatCard
              label="Success Rate"
              value={`${successRate.toFixed(1)}%`}
              icon={<CheckCircle className="w-5 h-5 text-white" />}
              color="bg-emerald-500/20"
              trend={2.8}
              description="Analysis completion"
              index={1}
            />
            <StatCard
              label="Processing Time"
              value={`${analysis_summary.processing_time_seconds.toFixed(2)}s`}
              icon={<Zap className="w-5 h-5 text-white" />}
              color="bg-purple-500/20"
              description="Ultra-fast analysis"
              index={2}
            />
            <StatCard
              label="Failed Analyses"
              value={analysis_summary.failed_analyses}
              icon={<AlertTriangle className="w-5 h-5 text-white" />}
              color="bg-red-500/20"
              description="Error count"
              index={3}
            />
          </div>
        </div>

        {/* Academic level distribution */}
        {academic_level_distribution && (
          <div>
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-emerald-400" />
              Academic Level Distribution
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(academic_level_distribution).map(([level, count], index) => {
                const colors = ['bg-blue-500/20', 'bg-emerald-500/20', 'bg-amber-500/20', 'bg-purple-500/20'];
                const textColors = ['text-blue-400', 'text-emerald-400', 'text-amber-400', 'text-purple-400'];
                
                return (
                  <motion.div
                    key={level}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className={`${colors[index]} rounded-xl p-4 border border-gray-700 text-center`}
                  >
                    <div className={`text-2xl font-bold ${textColors[index]} mb-2`}>
                      {count}
                    </div>
                    <div className="text-sm font-medium text-gray-300">
                      {level} Year
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {analysis_summary.total_students_analyzed > 0 
                        ? `${((count / analysis_summary.total_students_analyzed) * 100).toFixed(1)}%`
                        : '0%'
                      }
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Missing modules summary */}
        {missing_modules_summary && (
          <div>
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-amber-400" />
              Missing Modules Analysis
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                label="Total Missing"
                value={missing_modules_summary.total_missing_modules}
                icon={<Database className="w-5 h-5 text-white" />}
                color="bg-red-500/20"
                description="Across all students"
                index={0}
              />
              <StatCard
                label="Students Affected"
                value={missing_modules_summary.students_with_missing}
                icon={<Users className="w-5 h-5 text-white" />}
                color="bg-amber-500/20"
                description="Need attention"
                index={1}
              />
              {topMissingModule && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="bg-gray-800/50 rounded-xl p-4 border border-gray-700"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    <span className="text-sm font-medium text-gray-300">Most Common</span>
                  </div>
                  <div className="text-lg font-bold text-white">
                    {topMissingModule.module_code}
                  </div>
                  <div className="text-sm text-amber-400">
                    {topMissingModule.count} students missing
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* Completion statistics */}
        {completion_stats && (
          <div>
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-purple-400" />
              Completion Statistics
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gray-800/50 rounded-xl p-6 border border-gray-700"
              >
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-400 mb-2">
                    {completion_stats.average_completion_percentage.toFixed(1)}%
                  </div>
                  <div className="text-sm font-medium text-gray-300 mb-1">
                    Average Completion
                  </div>
                  <div className="text-xs text-gray-500">
                    Across all analyzed students
                  </div>
                </div>
              </motion.div>

              {completion_stats.completion_distribution && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gray-800/50 rounded-xl p-6 border border-gray-700"
                >
                  <div className="text-sm font-medium text-gray-300 mb-3">Completion Distribution</div>
                  <div className="space-y-2">
                    {Object.entries(completion_stats.completion_distribution).map(([range, count], index) => (
                      <div key={range} className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">{range}</span>
                        <span className={`text-sm font-medium ${
                          range === '76-100%' ? 'text-emerald-400' :
                          range === '51-75%' ? 'text-amber-400' :
                          range === '26-50%' ? 'text-orange-400' : 'text-red-400'
                        }`}>
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}

        {/* Performance insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl p-6 border border-purple-500/20"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <h4 className="text-lg font-semibold text-white">Performance Insights</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400 mb-1">
                {analysis_summary.processing_time_seconds < 1 ? 'Ultra' : 'Fast'}
              </div>
              <div className="text-gray-300">Processing Speed</div>
              <div className="text-xs text-gray-500 mt-1">
                {(analysis_summary.total_students_analyzed / analysis_summary.processing_time_seconds).toFixed(0)} students/sec
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {successRate >= 99 ? 'Excellent' : successRate >= 95 ? 'Good' : 'Needs Review'}
              </div>
              <div className="text-gray-300">Reliability</div>
              <div className="text-xs text-gray-500 mt-1">
                {analysis_summary.successful_analyses}/{analysis_summary.total_students_analyzed} success
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400 mb-1">
                {completion_stats?.average_completion_percentage >= 80 ? 'High' : 
                 completion_stats?.average_completion_percentage >= 60 ? 'Medium' : 'Low'}
              </div>
              <div className="text-gray-300">Overall Progress</div>
              <div className="text-xs text-gray-500 mt-1">
                Student completion level
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default BulkAnalysisCard; 