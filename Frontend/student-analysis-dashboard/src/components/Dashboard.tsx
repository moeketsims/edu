import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Filter, Users, TrendingUp, AlertCircle, 
  Award, Target, Activity, Plus, 
  MoreVertical, RefreshCw 
} from 'lucide-react';
import { studentAnalysisAPI } from '../services/api';
import { Student, FilterOptions, Filters, BulkAnalysisResponse } from '../types';
import StudentCard from './StudentCard';
import BulkAnalysisCard from './BulkAnalysisCard';
import FilterPanel from './FilterPanel';
import AnimatedNumber from './AnimatedNumber';
import Sparkline from './Sparkline';

// Enhanced Metric Card Component
const EnterpriseMetricCard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  gradient: string;
  color: string;
  subtitle?: string;
  history?: number[];
  index: number;
}> = ({ title, value, change, icon, gradient, color, subtitle, history, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    whileHover={{ y: -5, transition: { duration: 0.2 } }}
    className="group relative"
  >
    {/* Gradient border effect */}
    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-0 group-hover:opacity-75 transition duration-300" />
    
    {/* Card content */}
    <div className="relative bg-gray-900 rounded-2xl p-6 border border-gray-800 backdrop-blur-xl">
      {/* Animated icon and trend */}
      <div className="flex items-start justify-between mb-4">
        <motion.div
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.5 }}
          className={`p-3 rounded-xl ${gradient} shadow-lg`}
        >
          <div className="w-6 h-6 text-white">
            {icon}
          </div>
        </motion.div>
        
        {/* Trend indicator */}
        {change !== undefined && (
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg ${
            change >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
          }`}>
            <TrendingUp className="w-3 h-3" />
            <span className="text-xs font-medium">{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      
      {/* Animated number counter */}
      <div className="mb-2">
        <AnimatedNumber
          value={typeof value === 'number' ? value : parseFloat(value.toString().replace(/[^\d.-]/g, '')) || 0}
          className="text-3xl font-bold text-white"
          format={(val) => typeof value === 'string' && value.includes('%') ? `${val.toFixed(1)}%` : val.toLocaleString()}
        />
      </div>
      
      {/* Label with subtitle */}
      <div>
        <p className="text-gray-400 text-sm font-medium">{title}</p>
        {subtitle && <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>}
      </div>
      
      {/* Mini sparkline */}
      {history && history.length > 0 && (
        <div className="mt-4 h-8">
          <Sparkline data={history} color={color} />
        </div>
      )}
    </div>
  </motion.div>
);

// Modern Progress Chart Component
const ModernProgressChart: React.FC<{
  data: Array<{ label: string; value: number; color: string; percentage: number }>;
  title: string;
}> = ({ data, title }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="relative group"
  >
    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-lg opacity-10 group-hover:opacity-20 transition duration-300" />
    <div className="relative bg-gray-900/90 backdrop-blur-xl rounded-3xl p-8 border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <p className="text-gray-400 text-sm mt-1">Student progress breakdown by percentage</p>
        </div>
        <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <MoreVertical className="w-5 h-5 text-gray-400" />
        </button>
      </div>
      
      {/* Enhanced progress bars */}
      <div className="space-y-6">
        {data.map((item, index) => (
          <div key={index} className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-300">{item.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">{item.value}</span>
                <span className="text-xs text-gray-500">students</span>
              </div>
            </div>
            <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.percentage}%` }}
                transition={{ duration: 1, delay: index * 0.1 }}
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${item.color}, ${item.color}80)`,
                  boxShadow: `0 0 20px ${item.color}40`
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  </motion.div>
);

// Modern Bar Chart Component  
const ModernBarChart: React.FC<{
  data: Array<{ label: string; value: number; color: string }>;
  title: string;
}> = ({ data, title }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.2 }}
    className="relative group"
  >
    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl blur-lg opacity-10 group-hover:opacity-20 transition duration-300" />
    <div className="relative bg-gray-900/90 backdrop-blur-xl rounded-3xl p-8 border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <p className="text-gray-400 text-sm mt-1">Enrollment by academic year</p>
        </div>
      </div>
      
      {/* Radial progress indicators */}
      <div className="grid grid-cols-2 gap-6">
        {data.map((year, index) => {
          const total = data.reduce((sum, item) => sum + item.value, 0);
          const percentage = total > 0 ? (year.value / total) * 100 : 0;
          
          return (
            <div key={index} className="relative">
              <div className="relative w-32 h-32 mx-auto">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-gray-800"
                  />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke={year.color}
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 56 * (1 - percentage / 100) }}
                    transition={{ duration: 1.5, delay: index * 0.1 }}
                    strokeLinecap="round"
                    style={{
                      filter: `drop-shadow(0 0 12px ${year.color}40)`
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-white">{year.value}</span>
                  <span className="text-xs text-gray-400">students</span>
                </div>
              </div>
              <div className="text-center mt-4">
                <span className="text-sm font-medium text-gray-300">{year.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </motion.div>
);

// Floating Action Button
const FloatingActionButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <motion.div
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    className="fixed bottom-8 right-8 z-50"
  >
    <button 
      onClick={onClick}
      className="group relative p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-110"
    >
      <Plus className="w-6 h-6 text-white" />
      <span className="absolute -top-12 right-0 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        Quick Actions
      </span>
    </button>
  </motion.div>
);

// Main Dashboard Component
const Dashboard: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [bulkAnalysis, setBulkAnalysis] = useState<BulkAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMatching, setTotalMatching] = useState(0);

  const [filters, setFilters] = useState<Filters>({
    limit: 20,
    offset: 0,
  });

  const loadFilterOptions = async () => {
    try {
      const options = await studentAnalysisAPI.getFilterOptions();
      setFilterOptions(options);
    } catch (err) {
      setError('Failed to load filter options');
    }
  };

  const loadBulkAnalysis = async () => {
    try {
      setLoading(true);
      const analysis = await studentAnalysisAPI.bulkAnalysis();
      setBulkAnalysis(analysis);
    } catch (err) {
      setError('Failed to load bulk analysis');
    } finally {
      setLoading(false);
    }
  };

  const loadFilteredStudents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await studentAnalysisAPI.filteredAnalysis(filters);
      setStudents(response.students);
      setTotalMatching(response.total_matching);
      setTotalPages(response.pagination.total_pages);
      setCurrentPage(response.pagination.current_page);
      setError(null);
    } catch (err) {
      setError('Failed to load students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load initial data
  useEffect(() => {
    loadFilterOptions();
    loadBulkAnalysis();
  }, []);

  // Load filtered students when filters change
  useEffect(() => {
    if (filterOptions) {
      loadFilteredStudents();
    }
  }, [filters, filterOptions, loadFilteredStudents]);

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      offset: 0 // Reset to first page when filters change
    }));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    const offset = (page - 1) * filters.limit;
    setFilters(prev => ({ ...prev, offset }));
    setCurrentPage(page);
  };

  const clearFilters = () => {
    setFilters({
      limit: 20,
      offset: 0,
    });
    setCurrentPage(1);
  };

  // Mock data for demonstration
  const mockHistory = [65, 68, 72, 75, 78, 82, 85, 88];

  // Calculate analytics for charts
  const analytics = React.useMemo(() => {
    if (!bulkAnalysis) return null;

    const { analysis_summary, academic_level_distribution, completion_stats } = bulkAnalysis;
    
    // Completion distribution for progress chart
    const completionData = completion_stats?.completion_distribution ? 
      Object.entries(completion_stats.completion_distribution).map(([range, count]) => ({
        label: range,
        value: count,
        color: range === '76-100%' ? '#10b981' : 
               range === '51-75%' ? '#f59e0b' : 
               range === '26-50%' ? '#f97316' : '#ef4444',
        percentage: analysis_summary?.total_students_analyzed ? 
          (count / analysis_summary.total_students_analyzed) * 100 : 0
      })) : [];

    // Academic level distribution for bar chart
    const levelData = academic_level_distribution ? 
      Object.entries(academic_level_distribution).map(([level, count], index) => ({
        label: `${level} Year`,
        value: count,
        color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][index] || '#6b7280'
      })) : [];

    return { completionData, levelData };
  }, [bulkAnalysis]);

  return (
    <div className="min-h-screen bg-gray-950 noise-texture">
      {/* Enterprise Hero Header */}
      <header className="relative min-h-[280px] overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900">
          {/* Animated orbs */}
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
          <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
        </div>
        
        {/* Glassmorphism navigation bar */}
        <nav className="relative z-10 px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              {/* Animated logo */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200" />
                <div className="relative px-4 py-2 bg-black rounded-lg leading-none flex items-center">
                  <span className="text-white font-bold text-xl font-display">AAH</span>
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white font-display">Academic Analytics Hub</h1>
                <p className="text-purple-200 text-sm">Enterprise Student Progress Management Platform</p>
              </div>
            </div>
            
            {/* Action buttons with glass effect */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-6 py-2.5 glass text-white rounded-xl hover:bg-white/20 transition-all duration-200 hover:scale-105 hover:shadow-lg"
              >
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </button>
              <button
                onClick={loadBulkAnalysis}
                className="flex items-center px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Refresh Data
              </button>
            </div>
          </div>
        </nav>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Enterprise Metrics Grid */}
        {bulkAnalysis && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 -mt-16 relative z-20">
            <EnterpriseMetricCard
              title="Total Students"
              value={bulkAnalysis.analysis_summary?.total_students_analyzed || 0}
              change={5.2}
              icon={<Users className="w-6 h-6" />}
              gradient="bg-gradient-to-br from-blue-500 to-blue-600"
              color="#3b82f6"
              subtitle="Active enrollments"
              history={mockHistory}
              index={0}
            />
            <EnterpriseMetricCard
              title="Success Rate"
              value={`${bulkAnalysis.analysis_summary?.total_students_analyzed > 0 ? 
                (((bulkAnalysis.analysis_summary?.successful_analyses || 0) / (bulkAnalysis.analysis_summary?.total_students_analyzed || 1)) * 100).toFixed(1) : '0'}%`}
              change={2.8}
              icon={<Target className="w-6 h-6" />}
              gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
              color="#10b981"
              subtitle="Analysis completion"
              history={[85, 87, 89, 91, 93, 95, 97, 98]}
              index={1}
            />
            <EnterpriseMetricCard
              title="Avg Completion"
              value={`${bulkAnalysis.completion_stats?.average_completion_percentage?.toFixed(1) || '0'}%`}
              change={-1.2}
              icon={<Award className="w-6 h-6" />}
              gradient="bg-gradient-to-br from-amber-500 to-amber-600"
              color="#f59e0b"
              subtitle="Academic progress"
              history={[78, 79, 77, 80, 82, 84, 83, 85]}
              index={2}
            />
            <EnterpriseMetricCard
              title="Processing Time"
              value={`${bulkAnalysis.analysis_summary?.processing_time_seconds?.toFixed(1) || '0'}s`}
              icon={<Activity className="w-6 h-6" />}
              gradient="bg-gradient-to-br from-purple-500 to-purple-600"
              color="#8b5cf6"
              subtitle="Last analysis"
              history={[0.5, 0.4, 0.3, 0.4, 0.2, 0.3, 0.2, 0.43]}
              index={3}
            />
          </div>
        )}

        {/* Charts Section */}
        {analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ModernProgressChart 
              data={analytics.completionData}
              title="Academic Completion Distribution"
            />
            <ModernBarChart 
              data={analytics.levelData}
              title="Student Level Distribution"
            />
          </div>
        )}

        {/* Filter Panel */}
        {showFilters && filterOptions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-900/50 backdrop-blur-xl rounded-xl shadow-lg border border-gray-800 overflow-hidden"
          >
            <FilterPanel
              options={filterOptions}
              filters={filters}
              onFilterChange={handleFilterChange}
              onClear={clearFilters}
            />
          </motion.div>
        )}

        {/* Enhanced Bulk Analysis */}
        {bulkAnalysis && (
          <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl shadow-lg border border-gray-800 overflow-hidden">
            <BulkAnalysisCard analysis={bulkAnalysis} />
          </div>
        )}

        {/* Results Summary */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-gray-300 text-sm font-medium">
              Showing {students.length} of {totalMatching.toLocaleString()} students
            </span>
          </div>
          {error && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-full">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}
        </div>

        {/* Student Results Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-gray-800 rounded-xl p-6 animate-pulse">
                <div className="space-y-4">
                  <div className="h-4 bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-700 rounded w-1/2" />
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-8 bg-gray-700 rounded" />
                    <div className="h-8 bg-gray-700 rounded" />
                    <div className="h-8 bg-gray-700 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((student, index) => (
              <motion.div
                key={student.student_number}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <StudentCard student={student} />
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-8">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    currentPage === pageNum
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton onClick={() => console.log('Quick actions clicked')} />
    </div>
  );
};

export default Dashboard; 