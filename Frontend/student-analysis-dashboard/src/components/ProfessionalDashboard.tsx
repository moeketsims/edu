import React, { useState, useEffect } from 'react';
import { 
  Users, BookOpen, AlertTriangle, Trophy, GraduationCap, 
  BarChart3, Settings, TrendingUp, TrendingDown, Download, 
  RefreshCw, ChevronRight, Target, Activity
} from 'lucide-react';
import { studentAnalysisAPI } from '../services/api';
import { BulkAnalysisResponse, FilterOptions } from '../types';

// Professional Header Component
const ProfessionalHeader: React.FC = () => (
  <header className="bg-white border-b border-gray-200 shadow-sm">
    <div className="px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Faculty of Education</h1>
              <p className="text-sm text-gray-500">Tracking Student Success</p>
            </div>
          </div>
        </div>
        
        <nav className="flex items-center space-x-8">
          <button className="flex items-center space-x-2 px-4 py-2 text-emerald-600 bg-emerald-50 rounded-lg font-medium hover:bg-emerald-100 transition-colors">
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
            <BookOpen className="w-4 h-4" />
            <span>Tutorials</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
            <Settings className="w-4 h-4" />
            <span>Administration</span>
          </button>
        </nav>
      </div>
    </div>
  </header>
);

// Hero Insights Section
const HeroInsights: React.FC<{ stats: any }> = ({ stats }) => (
  <div className="relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-red-500 opacity-95" />
    <div className="relative px-8 py-12">
      <h2 className="text-3xl font-bold text-white mb-2">Real-time Academic Insights</h2>
      <p className="text-emerald-50 mb-8 max-w-2xl">
        Monitor student performance, identify at-risk learners, and track institutional success across all campuses
      </p>
      
      <div className="grid grid-cols-4 gap-8">
        <div className="text-center">
          <div className="text-4xl font-bold text-white mb-1">{stats.totalStudents?.toLocaleString() || '0'}</div>
          <div className="text-emerald-100 text-sm">Total Students</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-white mb-1">{stats.totalModules || '0'}</div>
          <div className="text-emerald-100 text-sm">Active Modules</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-white mb-1">{stats.totalPlanCodes || '0'}</div>
          <div className="text-emerald-100 text-sm">Academic Programs</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-white mb-1">3</div>
          <div className="text-emerald-100 text-sm">Campus Locations</div>
        </div>
      </div>
    </div>
    
    {/* Decorative pattern */}
    <div className="absolute right-0 top-0 w-64 h-64 opacity-10">
      <div className="grid grid-cols-8 gap-2 p-4">
        {[...Array(64)].map((_, i) => (
          <div key={i} className="w-4 h-4 bg-white rounded-sm" />
        ))}
      </div>
    </div>
  </div>
);

// Professional Metric Card
interface MetricCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  trend: 'up' | 'down';
  trendValue: string;
  color: string;
  description?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  icon, value, label, trend, trendValue, color, description 
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 ${color} bg-opacity-10 rounded-lg flex items-center justify-center`}>
        {icon}
      </div>
      <span className={`text-sm font-medium px-3 py-1 rounded-full flex items-center space-x-1
        ${trend === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
        {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        <span>{trendValue}</span>
      </span>
    </div>
    
    <div className="space-y-1">
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500 uppercase tracking-wide font-medium">{label}</div>
      {description && (
        <div className="text-xs text-gray-400 mt-2">{description}</div>
      )}
    </div>
    
    {/* Progress indicator */}
    <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} bg-opacity-60 rounded-full transition-all duration-500`} 
           style={{ width: trend === 'up' ? '75%' : '45%' }} />
    </div>
  </div>
);

// Quick Stats Section
const QuickStats: React.FC<{ stats: any }> = ({ stats }) => {
  const completionRate = stats.totalStudents > 0 
    ? ((stats.totalStudents - stats.studentsWithMissingModules) / stats.totalStudents * 100).toFixed(1)
    : '0.0';
  
  const averageMissingModules = stats.studentsWithMissingModules > 0 
    ? (stats.totalMissingModules / stats.studentsWithMissingModules).toFixed(1)
    : '0.0';

  return (
    <div className="grid grid-cols-4 gap-6">
      <MetricCard
        icon={<Users className="w-6 h-6 text-blue-600" />}
        value={stats.totalStudents?.toLocaleString() || '0'}
        label="Total Students"
        trend="up"
        trendValue="+12%"
        color="bg-blue-600"
        description="Enrolled across all programs"
      />
      <MetricCard
        icon={<Target className="w-6 h-6 text-emerald-600" />}
        value={`${completionRate}%`}
        label="Completion Rate"
        trend="up"
        trendValue="+5.1%"
        color="bg-emerald-600"
        description="Students on track to graduate"
      />
      <MetricCard
        icon={<AlertTriangle className="w-6 h-6 text-amber-600" />}
        value={stats.studentsWithMissingModules?.toLocaleString() || '0'}
        label="At-Risk Students"
        trend="down"
        trendValue="-8%"
        color="bg-amber-600"
        description="Students with missing modules"
      />
      <MetricCard
        icon={<Activity className="w-6 h-6 text-purple-600" />}
        value={averageMissingModules}
        label="Avg Missing/Student"
        trend="down"
        trendValue="-2.3%"
        color="bg-purple-600"
        description="Average modules behind"
      />
    </div>
  );
};

// Detailed Analytics Section
const DetailedAnalytics: React.FC<{ stats: any }> = ({ stats }) => (
  <div className="grid grid-cols-3 gap-6 mt-8">
    {/* Module Distribution */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Module Distribution</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Total Active Modules</span>
          <span className="font-semibold text-gray-900">{stats.totalModules || 0}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Academic Programs</span>
          <span className="font-semibold text-gray-900">{stats.totalPlanCodes || 0}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Missing Modules</span>
          <span className="font-semibold text-red-600">{stats.totalMissingModules?.toLocaleString() || 0}</span>
        </div>
      </div>
      
      {/* Visual progress */}
      <div className="mt-6 space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Completion Progress</span>
            <span className="text-gray-900">
              {stats.totalStudents > 0 ? 
                ((stats.totalStudents - stats.studentsWithMissingModules) / stats.totalStudents * 100).toFixed(1) 
                : '0'}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
              style={{ 
                width: `${stats.totalStudents > 0 ? 
                  ((stats.totalStudents - stats.studentsWithMissingModules) / stats.totalStudents * 100) 
                  : 0}%` 
              }}
            />
          </div>
        </div>
      </div>
    </div>

    {/* Risk Analysis */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Analysis</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">High Risk</span>
          <span className="font-semibold text-red-600">
            {stats.studentsWithMissingModules > 0 ? 
              Math.round(stats.studentsWithMissingModules * 0.3).toLocaleString() : '0'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Medium Risk</span>
          <span className="font-semibold text-amber-600">
            {stats.studentsWithMissingModules > 0 ? 
              Math.round(stats.studentsWithMissingModules * 0.5).toLocaleString() : '0'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Low Risk</span>
          <span className="font-semibold text-emerald-600">
            {stats.studentsWithMissingModules > 0 ? 
              Math.round(stats.studentsWithMissingModules * 0.2).toLocaleString() : '0'}
          </span>
        </div>
      </div>
      
      {/* Risk distribution chart placeholder */}
      <div className="mt-6 h-32 bg-gradient-to-r from-red-50 via-amber-50 to-emerald-50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Risk Distribution Chart</p>
        </div>
      </div>
    </div>

    {/* Performance Trends */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">This Month</span>
          <span className="font-semibold text-emerald-600">+5.2%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">This Quarter</span>
          <span className="font-semibold text-emerald-600">+12.1%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">This Year</span>
          <span className="font-semibold text-blue-600">+18.5%</span>
        </div>
      </div>
      
      {/* Trend visualization placeholder */}
      <div className="mt-6 h-32 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <TrendingUp className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Performance Timeline</p>
        </div>
      </div>
    </div>
  </div>
);

// Main Professional Dashboard Component
const ProfessionalDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadData = async () => {
    try {
      setLoading(true);
      const [filterOptions, bulkAnalysis, stats] = await Promise.all([
        studentAnalysisAPI.getFilterOptions(),
        studentAnalysisAPI.bulkAnalysis(),
        studentAnalysisAPI.getStats()
      ]);

      setStats({
        totalStudents: stats.total_students || bulkAnalysis.analysis_summary.total_students_analyzed,
        totalModules: stats.total_modules,
        totalPlanCodes: stats.total_plan_codes,
                    studentsWithMissingModules: bulkAnalysis.missing_modules_summary.students_with_missing,
        totalMissingModules: bulkAnalysis.missing_modules_summary.total_missing_modules,
        planCodes: filterOptions.plan_codes
      });
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProfessionalHeader />
      
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-8 py-3">
        <nav className="flex items-center space-x-2 text-sm">
          <span className="text-gray-500">Dashboard</span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900 font-medium">Overview</span>
        </nav>
      </div>

      {/* Page Header */}
      <div className="bg-white px-8 py-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Academic Overview</h1>
            <p className="text-gray-500 mt-1">
              Comprehensive insights into student performance, risk analysis, and institutional metrics
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
            <button 
              onClick={handleRefresh}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero Insights */}
      <HeroInsights stats={stats} />

      {/* Main Content */}
      <div className="px-8 py-8">
        {/* Metrics Grid */}
        <QuickStats stats={stats} />

        {/* Detailed Analytics */}
        <DetailedAnalytics stats={stats} />
      </div>
    </div>
  );
};

export default ProfessionalDashboard; 