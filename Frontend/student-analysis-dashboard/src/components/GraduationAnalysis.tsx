import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  TrendingUp, 
  Filter,
  Search,
  Download,
  RefreshCw,
  Award,
  Calendar,
  MapPin,
  Bookmark
} from 'lucide-react';

interface GraduationStats {
  total_potential_graduates: number;
  graduation_ready: number;
  by_campus: Array<{ campus: string; count: number }>;
  by_plan: Array<{ plan_code: string; plan_description: string; count: number }>;
  by_academic_level: Array<{ level: string; count: number }>;
  summary: {
    total_students: number;
    graduation_rate: number;
    ready_for_graduation: number;
    ready_rate: number;
  };
}

interface PotentialGraduate {
  student_number: string;
  name: string;
  campus_name: string;
  plan_code: string;
  plan_description: string;
  academic_level: string;
  completion_percentage: number;
  total_modules_passed: number;
  total_modules: number;
  total_retakes: number;
  current_modules: Array<{
    module_code: string;
    module_name: string;
    final_mark: number;
    status: string;
  }>;
  final_modules_count: number;
  graduation_ready: boolean;
}

interface GraduationAnalysisData {
  potential_graduates: PotentialGraduate[];
  total_count: number;
  filters_applied: {
    campus?: string;
    plan_code?: string;
    academic_level?: string;
  };
  pagination: {
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

const GraduationAnalysis: React.FC = () => {
  const [stats, setStats] = useState<GraduationStats | null>(null);
  const [graduates, setGraduates] = useState<PotentialGraduate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    campus: '',
    plan_code: '',
    academic_level: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchGraduationStats = async () => {
    try {
      const response = await fetch('/api/graduation-stats');
      if (!response.ok) throw new Error('Failed to fetch graduation statistics');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching graduation stats:', err);
      setError('Failed to load graduation statistics');
    }
  };

  const fetchGraduationAnalysis = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '20',
        offset: ((page - 1) * 20).toString(),
        ...(filters.campus && { campus: filters.campus }),
        ...(filters.plan_code && { plan_code: filters.plan_code }),
        ...(filters.academic_level && { academic_level: filters.academic_level })
      });

      const response = await fetch(`/api/graduation-analysis?${params}`);
      if (!response.ok) throw new Error('Failed to fetch graduation analysis');
      
      const data: GraduationAnalysisData = await response.json();
      setGraduates(data.potential_graduates);
      setTotalCount(data.total_count);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching graduation analysis:', err);
      setError('Failed to load graduation analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraduationStats();
    fetchGraduationAnalysis();
  }, []);

  useEffect(() => {
    fetchGraduationAnalysis(1);
  }, [filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ campus: '', plan_code: '', academic_level: '' });
  };

  const exportGraduationData = () => {
    // TODO: Implement export functionality
    console.log('Export graduation data');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Graduation Analysis</div>
            <div className="text-red-500">{error}</div>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Graduation Analysis</h1>
                <p className="text-gray-600">Track potential graduates and graduation readiness</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
              <button
                onClick={exportGraduationData}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Potential Graduates</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_potential_graduates.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm text-gray-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span>{stats.summary.graduation_rate}% of total students</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ready for Graduation</p>
                  <p className="text-2xl font-bold text-green-600">{stats.graduation_ready.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Award className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Bookmark className="w-4 h-4 mr-1" />
                  <span>{stats.summary.ready_rate}% of potential graduates</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.summary.total_students.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>Enrolled students</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Top Campus</p>
                  <p className="text-lg font-bold text-gray-900">
                    {stats.by_campus[0]?.campus || 'N/A'}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <MapPin className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="w-4 h-4 mr-1" />
                  <span>{stats.by_campus[0]?.count || 0} potential graduates</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Campus</label>
                  <select
                    value={filters.campus}
                    onChange={(e) => handleFilterChange('campus', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Campuses</option>
                    {stats?.by_campus.map((campus) => (
                      <option key={campus.campus} value={campus.campus}>
                        {campus.campus} ({campus.count})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plan Code</label>
                  <select
                    value={filters.plan_code}
                    onChange={(e) => handleFilterChange('plan_code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Plans</option>
                    {stats?.by_plan.map((plan) => (
                      <option key={plan.plan_code} value={plan.plan_code}>
                        {plan.plan_code} ({plan.count})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Academic Level</label>
                  <select
                    value={filters.academic_level}
                    onChange={(e) => handleFilterChange('academic_level', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Levels</option>
                    {stats?.by_academic_level.map((level) => (
                      <option key={level.level} value={level.level}>
                        {level.level} Year ({level.count})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Graduates List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Potential Graduates</h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {totalCount.toLocaleString()} students found
                </span>
                <button
                  onClick={() => fetchGraduationAnalysis(currentPage)}
                  disabled={loading}
                  className="p-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center space-x-2">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-gray-600">Loading potential graduates...</span>
              </div>
            </div>
          ) : graduates.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-500">
                <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No potential graduates found</p>
                <p className="text-sm">Try adjusting your filters or run the bulk analysis first.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {graduates.map((graduate, index) => (
                <motion.div
                  key={graduate.student_number}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {graduate.name}
                        </h3>
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {graduate.student_number}
                        </span>
                        {graduate.graduation_ready && (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full flex items-center">
                            <Award className="w-3 h-3 mr-1" />
                            Ready
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{graduate.campus_name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <BookOpen className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{graduate.plan_code}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{graduate.academic_level} Year</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{graduate.completion_percentage}% Complete</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-sm font-medium text-gray-600">Modules Passed</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {graduate.total_modules_passed} / {graduate.total_modules}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-sm font-medium text-gray-600">Retakes</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {graduate.total_retakes}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-sm font-medium text-gray-600">Final Modules</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {graduate.final_modules_count}
                          </div>
                        </div>
                      </div>

                      {graduate.current_modules.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Current Modules (In Progress)</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {graduate.current_modules.map((module, idx) => (
                              <div key={idx} className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                                <div className="text-sm font-medium text-yellow-800">{module.module_code}</div>
                                <div className="text-xs text-yellow-600">{module.module_name}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalCount > 20 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalCount)} of {totalCount} results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => fetchGraduationAnalysis(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg">
                    {currentPage}
                  </span>
                  <button
                    onClick={() => fetchGraduationAnalysis(currentPage + 1)}
                    disabled={currentPage * 20 >= totalCount}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GraduationAnalysis; 