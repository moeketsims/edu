import React from 'react';
import { motion } from 'framer-motion';
import { Filter, X, Search, Settings, Sparkles } from 'lucide-react';
import { FilterOptions, Filters } from '../types';

interface FilterPanelProps {
  options: FilterOptions;
  filters: Filters;
  onFilterChange: (filters: Partial<Filters>) => void;
  onClear: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  options,
  filters,
  onFilterChange,
  onClear
}) => {
  const hasActiveFilters = Boolean(
    filters.academic_level || 
    filters.plan_code || 
    filters.has_missing_modules !== undefined || 
    filters.completion_range ||
    filters.include_extended !== undefined
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden"
    >
      {/* Header with gradient */}
      <div className="relative bg-gradient-to-r from-purple-600/20 to-pink-600/20 p-6 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-display">Advanced Filters</h3>
              <p className="text-gray-400 text-sm">Refine your student analysis</p>
            </div>
          </div>
          
          {hasActiveFilters && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClear}
              className="flex items-center px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all duration-200 border border-red-500/30"
            >
              <X className="w-4 h-4 mr-2" />
              Clear All
            </motion.button>
          )}
        </div>
        
        {/* Active filters summary */}
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 flex flex-wrap gap-2"
          >
            {filters.academic_level && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Level: {filters.academic_level}
              </span>
            )}
            {filters.plan_code && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Plan: {filters.plan_code}
              </span>
            )}
            {filters.has_missing_modules !== undefined && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {filters.has_missing_modules ? 'Has Missing Modules' : 'No Missing Modules'}
              </span>
            )}
            {filters.completion_range && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                Completion: {filters.completion_range}
              </span>
            )}
            {filters.include_extended !== undefined && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                {filters.include_extended ? 'Extended Programmes Only' : 'Regular Programmes Only'}
              </span>
            )}
          </motion.div>
        )}
      </div>

      {/* Filter controls */}
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Academic Level Filter */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">
              Academic Level
            </label>
            <div className="relative">
              <select
                value={filters.academic_level || ''}
                onChange={(e) =>
                  onFilterChange({
                    academic_level: e.target.value || undefined
                  })
                }
                className="w-full px-4 py-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 appearance-none cursor-pointer hover:bg-gray-800/70"
              >
                <option value="">All Levels</option>
                <option value="1st">1st Year</option>
                <option value="2nd">2nd Year</option>
                <option value="3rd">3rd Year</option>
                <option value="4th">4th Year</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Plan Code Filter */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">
              Plan Code
            </label>
            <div className="relative">
              <select
                value={filters.plan_code || ''}
                onChange={(e) =>
                  onFilterChange({
                    plan_code: e.target.value || undefined
                  })
                }
                className="w-full px-4 py-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 appearance-none cursor-pointer hover:bg-gray-800/70"
              >
                <option value="">All Plans</option>
                {options.plan_codes.map((plan) => (
                  <option key={plan.code} value={plan.code}>
                    {plan.code} ({plan.student_count} students)
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Missing Modules Filter */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">
              Missing Modules
            </label>
            <div className="relative">
              <select
                value={
                  filters.has_missing_modules === undefined
                    ? ''
                    : filters.has_missing_modules
                    ? 'true'
                    : 'false'
                }
                onChange={(e) =>
                  onFilterChange({
                    has_missing_modules:
                      e.target.value === ''
                        ? undefined
                        : e.target.value === 'true'
                  })
                }
                className="w-full px-4 py-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 appearance-none cursor-pointer hover:bg-gray-800/70"
              >
                <option value="">All Students</option>
                <option value="true">Has Missing Modules</option>
                <option value="false">No Missing Modules</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Completion Range Filter */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">
              Completion Range
            </label>
            <div className="relative">
              <select
                value={filters.completion_range || ''}
                onChange={(e) =>
                  onFilterChange({
                    completion_range: e.target.value || undefined
                  })
                }
                className="w-full px-4 py-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 appearance-none cursor-pointer hover:bg-gray-800/70"
              >
                <option value="">All Ranges</option>
                <option value="0-25%">0-25%</option>
                <option value="26-50%">26-50%</option>
                <option value="51-75%">51-75%</option>
                <option value="76-100%">76-100%</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Extended Programme Filter */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">
              Programme Type
            </label>
            <div className="relative">
              <select
                value={
                  filters.include_extended === undefined
                    ? ''
                    : filters.include_extended
                    ? 'true'
                    : 'false'
                }
                onChange={(e) =>
                  onFilterChange({
                    include_extended:
                      e.target.value === ''
                        ? undefined
                        : e.target.value === 'true'
                  })
                }
                className="w-full px-4 py-3 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 appearance-none cursor-pointer hover:bg-gray-800/70"
              >
                <option value="">All Programmes</option>
                <option value="false">Regular Only</option>
                <option value="true">Extended Only</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Results per page */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-300">Results per page:</span>
            <div className="flex space-x-2">
              {[10, 20, 50, 100].map((limit) => (
                <motion.button
                  key={limit}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onFilterChange({ limit, offset: 0 })}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    filters.limit === limit
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700'
                  }`}
                >
                  {limit}
                </motion.button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Sparkles className="w-4 h-4" />
            <span>
              {options.plan_codes.reduce((sum, plan) => sum + plan.student_count, 0).toLocaleString()} total students
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FilterPanel; 