import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { 
  Users, BookOpen, AlertTriangle, Trophy, GraduationCap, 
  BarChart3, Settings, Download, Database,
  RefreshCw, ChevronRight
} from 'lucide-react';
import { studentAnalysisAPI } from '../services/api';
import AnimatedHeroSection from './AnimatedHeroSection';
import EnhancedMetricCard from './EnhancedMetricCard';
import AdvancedVisualizationDashboard from './AdvancedVisualizationDashboard';
import CommandPalette from './CommandPalette';
import FloatingActionMenu from './FloatingActionMenu';
import FloatingInsights from './FloatingInsights';
import DataManagement from './DataManagement';
import StudentSearch from './StudentSearch';
import SystemAdmin from './SystemAdmin';
import ComprehensiveDataAnalysis from './ComprehensiveDataAnalysis';



// Clean Professional Header Component
interface EnterpriseHeaderProps {
  onStudentSearch: () => void;
  onDataManagement: () => void;
  onSystemAdmin: () => void;
}

const EnterpriseHeader: React.FC<EnterpriseHeaderProps> = ({ 
  onStudentSearch, onDataManagement, onSystemAdmin 
}) => (
  <motion.header 
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-emerald-600 shadow-sm"
  >
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
          {[
            { icon: BarChart3, label: 'Analytics', active: true, onClick: () => {} },
            { icon: Users, label: 'Student Search', active: false, onClick: onStudentSearch },
            { icon: Database, label: 'Data Management', active: false, onClick: onDataManagement },
            { icon: Settings, label: 'Administration', active: false, onClick: onSystemAdmin }
          ].map((item, i) => (
            <motion.button
              key={item.label}
              onClick={item.onClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                item.active 
                  ? 'text-emerald-600 bg-white shadow-sm' 
                  : 'text-white hover:text-emerald-100 hover:bg-white/10'
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </motion.button>
          ))}
        </nav>
      </div>
    </div>
  </motion.header>
);

// Animated Number Component
const AnimatedNumber: React.FC<{ value: number; suffix?: string; prefix?: string; className?: string }> = ({ 
  value, suffix = '', prefix = '', className = '' 
}) => (
  <CountUp
    end={value}
    duration={2.5}
    separator=","
    prefix={prefix}
    suffix={suffix}
    className={className}
    enableScrollSpy
    scrollSpyOnce
  />
);







// Main Enterprise Dashboard Component
const EnterpriseDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [dataManagementOpen, setDataManagementOpen] = useState(false);
  const [studentSearchOpen, setStudentSearchOpen] = useState(false);
  const [systemAdminOpen, setSystemAdminOpen] = useState(false);
  const [comprehensiveAnalysisOpen, setComprehensiveAnalysisOpen] = useState(false);



  const loadData = async () => {
    try {
      setLoading(true);
      // Use the new comprehensive dashboard stats endpoint
      const dashboardStats = await studentAnalysisAPI.getDashboardStats();

      setStats(dashboardStats);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Fallback to demo data with graduation tracking focus
      setStats({
        totalStudents: 7771,
        totalModules: 785,
        studentsWithMissingModules: 2337,
        averagePerformance: 68,
        graduationTracking: {
          studentsReadyToGraduate: 5434,
          studentsAtRisk: 1234,
          totalMissingModules: 8927,
          averageCompletionRate: 68
        },
        academicLevelDistribution: {
          "1st": 2000,
          "2nd": 1950,
          "3rd": 1900,
          "4th": 1921
        },
        performanceMetrics: {
          studentsAbove75Percent: 2500,
          students50To75Percent: 3800,
          studentsBelow50Percent: 1471,
          averageRetakeRate: 1.2
        },
        missingModulesByLevel: {
          "1st": 800,
          "2nd": 650,
          "3rd": 420,
          "4th": 150
        },
        trends: {
          monthlyStats: []
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        setDataManagementOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        setStudentSearchOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        setSystemAdminOpen(true);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleRefresh = () => {
    loadData();
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Clean Breadcrumb and Page Header */}
      <div className="bg-gray-50 px-8 py-6">
        {/* Breadcrumb */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6"
        >
          <nav className="flex items-center space-x-2 text-sm">
            <span className="text-gray-500">Dashboard</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium">Overview</span>
          </nav>
        </motion.div>

        {/* Page Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Academic Overview
            </h1>
            <p className="text-gray-600">
              Comprehensive insights into student performance, risk analysis, and institutional metrics
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors bg-white text-emerald-800"
            >
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </motion.button>
            <motion.button 
              onClick={handleRefresh}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-800 text-white rounded-lg hover:bg-emerald-900 transition-colors shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </motion.button>
          </div>
        </motion.div>
      </div>

            {/* Spectacular Animated Hero Section */}
      <AnimatedHeroSection 
        stats={stats}
        onStudentSearch={() => setStudentSearchOpen(true)}
        onDataManagement={() => setDataManagementOpen(true)}
        onSystemAdmin={() => setSystemAdminOpen(true)}
        onComprehensiveAnalysis={() => setComprehensiveAnalysisOpen(true)}
      />

      {/* Enhanced Metric Cards with Sparklines */}
      <div className="px-8 pb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-4 gap-6"
        >
          {[
            {
              icon: <Users className="w-6 h-6 text-emerald-800" />,
              label: 'TOTAL STUDENTS',
              value: stats.totalStudents || 0,
              trend: '+12%',
              trendColor: 'text-emerald-800',
              borderColor: 'border-t-emerald-700',
              colorTheme: '#065968'
            },
            {
              icon: <Trophy className="w-6 h-6 text-emerald-600" />,
              label: 'READY TO GRADUATE',
              value: stats.graduationTracking?.studentsReadyToGraduate || 0,
              trend: '+3.2%',
              trendColor: 'text-emerald-800',
              borderColor: 'border-t-emerald-500',
              colorTheme: '#059669'
            },
            {
              icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
              label: 'AT-RISK STUDENTS',
              value: stats.graduationTracking?.studentsAtRisk || 0,
              trend: '-8%',
              trendColor: 'text-emerald-800',
              borderColor: 'border-t-amber-500',
              colorTheme: '#d97706'
            },
            {
              icon: <BookOpen className="w-6 h-6 text-blue-600" />,
              label: 'COMPLETION RATE',
              value: stats.averagePerformance || 0,
              trend: '+1.8%',
              trendColor: 'text-emerald-800',
              borderColor: 'border-t-blue-500',
              suffix: '%',
              colorTheme: '#2563eb'
            }
          ].map((metric, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
            >
              <EnhancedMetricCard {...metric} />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Advanced Visualization Dashboard */}
      <div className="px-8">
        <AdvancedVisualizationDashboard stats={stats} />
      </div>

      {/* Command Palette */}
      <CommandPalette 
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onDataManagement={() => setDataManagementOpen(true)}
        onStudentSearch={() => setStudentSearchOpen(true)}
        onSystemAdmin={() => setSystemAdminOpen(true)}
        onComprehensiveAnalysis={() => setComprehensiveAnalysisOpen(true)}
      />

      {/* Floating Action Menu */}
      <FloatingActionMenu 
        onCommandPaletteOpen={() => setCommandPaletteOpen(true)}
      />

      {/* Floating Insights Panel */}
      <FloatingInsights stats={stats} />

      {/* Management Modals */}
      {dataManagementOpen && (
        <DataManagement onClose={() => setDataManagementOpen(false)} />
      )}
      
      {studentSearchOpen && (
        <StudentSearch onClose={() => setStudentSearchOpen(false)} />
      )}
      
      {systemAdminOpen && (
        <SystemAdmin onClose={() => setSystemAdminOpen(false)} />
      )}
      
      {comprehensiveAnalysisOpen && (
        <ComprehensiveDataAnalysis 
          isOpen={comprehensiveAnalysisOpen}
          onClose={() => setComprehensiveAnalysisOpen(false)} 
        />
      )}
    </div>
  );
};

export default EnterpriseDashboard; 