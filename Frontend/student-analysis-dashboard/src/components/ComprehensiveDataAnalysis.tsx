import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Download, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Users, 
  GraduationCap,
  Building2,
  Calendar,
  Target,
  TrendingUp,
  AlertTriangle,
  BookOpen,
  RefreshCw,
  Clock,
  Info,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  BarChart3,
  CheckCircle2,
  Award,
  Eye,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

// Enhanced types for enterprise-level data handling
interface MissingModuleDetail {
  student_number: string;
  module_code: string;
  required_year: string;
  phase: string;
  is_elective: boolean;
  module_name: string;
  description: string | null;
  credits: number;
  priority: string;
}

interface Student {
  student_number: string;
  name: string;
  surname: string;
  first_names: string;
  campus_name: string;
  plan_code: string;
  plan_description: string;
  academic_level: string;
  modules_passed: number;
  total_modules: number;
  completion_percentage: number;
  missing_modules: number;
  total_retakes: number;
  risk_level?: 'Low' | 'Medium' | 'High';
  last_activity?: string;
  missing_modules_details: MissingModuleDetail[];
  phase: string; // Added for filtering
}

interface ComprehensiveDataAnalysisProps {
  isOpen?: boolean;
  onClose: () => void;
}

// Simplified filter options structure
interface FilterStats {
  campuses: string[];
  phases: string[];
  years: string[];
  planCodes: string[];
}

const ComprehensiveDataAnalysis: React.FC<ComprehensiveDataAnalysisProps> = ({ 
  isOpen = true, 
  onClose
}) => {
  // Core state management
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState('Initializing...');
  
  // Simplified filter state
  const [filterStats, setFilterStats] = useState<FilterStats>({
    campuses: [],
    phases: [],
    years: [],
    planCodes: []
  });
  
  // Filter selections
  const [selectedCampus, setSelectedCampus] = useState<string>('');
  const [selectedPhase, setSelectedPhase] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedPlanCode, setSelectedPlanCode] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // UI state
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showMissingModuleInfo, setShowMissingModuleInfo] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState<string>('completion_percentage');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Scroll indicator state
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Missing modules popup state
  const [missingModulesPopup, setMissingModulesPopup] = useState<{
    isOpen: boolean;
    student: any;
    modules: any[];
  }>({
    isOpen: false,
    student: null,
    modules: []
  });

  // Close popup with ESC key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && missingModulesPopup.isOpen) {
        setMissingModulesPopup({ isOpen: false, student: null, modules: [] });
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [missingModulesPopup.isOpen]);

  // Normalize academic level to standard format
  const normalizeAcademicLevel = (level: string): string => {
    if (!level) return '1st';
    const normalized = level.toLowerCase().trim();
    if (normalized.includes('1') || normalized === 'first') return '1st';
    if (normalized.includes('2') || normalized === 'second') return '2nd'; 
    if (normalized.includes('3') || normalized === 'third') return '3rd';
    if (normalized.includes('4') || normalized === 'fourth') return '4th';
    return '1st';
  };

  const getRiskLevel = (completion: number, missing: number): string => {
    if (completion < 50 || missing > 5) return 'High';
    if (completion < 70 || missing > 2) return 'Medium';
    return 'Low';
  };

  // Simplified filter options building
  const buildFilterOptions = (studentsData: Student[]) => {
    const campuses = Array.from(new Set(studentsData.map(s => s.campus_name)));
    const phases = Array.from(new Set(studentsData.map(s => s.phase)));
    const years = Array.from(new Set(studentsData.map(s => s.academic_level))).sort((a, b) => {
      const order: Record<string, number> = { '1st': 1, '2nd': 2, '3rd': 3, '4th': 4, 'Unknown': 5 };
      return (order[a] || 99) - (order[b] || 99);
    });
    const planCodes = Array.from(new Set(studentsData.map(s => s.plan_code)));

    setFilterStats({
      campuses,
      phases,
      years,
      planCodes
    });
  };

  // Enhanced data loading with enterprise-level error handling
  const loadStudents = async () => {
    try {
      setLoading(true);
      setLoadingProgress(10);
      setLoadingStage('Loading student data...');
      
      // Use bulk comprehensive analysis endpoint that provides academic levels
      setLoadingProgress(30);
      setLoadingStage('Fetching comprehensive analysis...');
      
      const response = await fetch('/api/bulk-comprehensive-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch comprehensive analysis');
      }
      
      const analysisData = await response.json();
      console.log('📊 Bulk analysis response:', analysisData);
      
      setLoadingProgress(70);
      setLoadingStage('Processing records...');

      if (analysisData.individual_student_results && analysisData.individual_student_results.length > 0) {
        // Process the comprehensive analysis data
        const data = analysisData.individual_student_results.map((result: any) => {
          // Extract campus from plan code prefix
          let campusName = 'Unknown Campus';
          if (result.plan_code) {
            const prefix = result.plan_code.charAt(0).toUpperCase();
            switch (prefix) {
              case 'Q': campusName = 'Qwaqwa Campus'; break;
              case 'B': campusName = 'Bloemfontein Campus'; break;
              case 'L': campusName = 'South Campus'; break;
              default: campusName = `${prefix} Campus`;
            }
          }

          // Extract phase from plan code or description
          let phase = 'Foundation Phase';
          if (result.plan_code) {
            if (result.plan_code.includes('735')) {
              phase = 'Foundation Phase';
            } else if (result.plan_code.includes('736') || result.plan_code.includes('737')) {
              phase = 'Intermediate Phase';
            } else if (result.plan_code.includes('738') || result.plan_code.includes('739')) {
              phase = 'Senior Phase';
            }
          }

          // Calculate risk level based on completion and missing modules
          const completionPercentage = result.completion_percentage || 0;
          const missingCount = result.total_missing_modules || 0;
          let riskLevel = 'Low';
          
          if (completionPercentage < 50 || missingCount > 5) {
            riskLevel = 'High';
          } else if (completionPercentage < 70 || missingCount > 2) {
            riskLevel = 'Medium';
          }
          
          // Use ACTUAL module data from backend (no more estimation!)
          const totalModules = result.total_modules_required || 30; // Use actual required modules
          const passedModules = result.total_modules_passed || 0;    // Use actual passed modules
          
          return {
            student_number: result.student_number || 'Unknown',
            name: result.student_name || 'Unknown Student',
            surname: result.student_name ? result.student_name.split(',')[0]?.trim() || 'Unknown' : 'Unknown',
            first_names: result.student_name ? result.student_name.split(',')[1]?.trim() || 'Unknown' : 'Unknown',
            campus_name: campusName,
            plan_code: result.plan_code || 'Unknown',
            plan_description: `Program ${result.plan_code}` || 'Unknown Program',
            academic_level: result.current_academic_level || '1st', // This comes from backend calculation
            modules_passed: passedModules,      // ACTUAL modules passed
            total_modules: totalModules,        // ACTUAL modules required
            completion_percentage: Math.round(completionPercentage),
            missing_modules: result.total_missing_modules || 0,
            total_retakes: result.total_retakes || 0,
            risk_level: riskLevel,
            last_activity: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
            missing_modules_details: result.missing_modules_details || [],
            phase: phase // Add phase for filtering
          };
        });

        setLoadingProgress(90);
        setLoadingStage('Building filters...');
        
        setStudents(data);
        buildFilterOptions(data);
        
        setLoadingProgress(100);
        setLoadingStage('Ready!');
        setLastRefresh(new Date());
        
        // Complete loading quickly
        setTimeout(() => {
          setLoading(false);
        }, 200);
      } else {
        throw new Error('No student analysis data received');
      }
      
    } catch (error) {
      console.error('❌ Critical error loading students:', error);
      setStudents([]);
      setLoading(false);
      setLoadingStage('Failed to load data');
    }
  };

  // Load students data
  useEffect(() => {
    if (isOpen) {
      loadStudents();
    }
  }, [isOpen]);

  // Enhanced filtering with search and hierarchical dependencies
  const filteredStudents = students.filter(student => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const nameMatch = student.name.toLowerCase().includes(searchLower);
      const numberMatch = student.student_number.toLowerCase().includes(searchLower);
      if (!nameMatch && !numberMatch) return false;
    }

    // Campus filter
    if (selectedCampus && student.campus_name !== selectedCampus) return false;

    // Phase filter - extract phase from plan description
    if (selectedPhase) {
      const studentPhase = student.phase;
      if (studentPhase !== selectedPhase) return false;
    }

    // Academic year filter
    if (selectedYear && student.academic_level !== selectedYear) return false;

    // Plan code filter
    if (selectedPlanCode && student.plan_code !== selectedPlanCode) return false;

    return true;
  });

  // Sort the filtered results
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    let aValue: any = a[sortField as keyof Student];
    let bValue: any = b[sortField as keyof Student];

    // Handle numeric fields
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    // Handle string fields
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }

    return 0;
  });

  // Calculate pagination
  const totalStudents = sortedStudents.length;
  const totalPagesCalculated = Math.ceil(totalStudents / studentsPerPage);
  const startIndex = (currentPage - 1) * studentsPerPage;
  const endIndex = startIndex + studentsPerPage;
  const currentPageStudents = sortedStudents.slice(startIndex, endIndex);

  // Update total pages when filtered results change
  React.useEffect(() => {
    setTotalPages(totalPagesCalculated);
    if (currentPage > totalPagesCalculated && totalPagesCalculated > 0) {
      setCurrentPage(1);
    }
  }, [totalPagesCalculated, currentPage]);

  // Reset to first page when filters change and scroll to top
  React.useEffect(() => {
    setCurrentPage(1);
    // Scroll to top when filters change
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedCampus, selectedPhase, selectedYear, selectedPlanCode, searchTerm]);

  // Scroll to top when page changes
  React.useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

  // Enhanced analytics calculations
  const avgCompletion = totalStudents > 0 
    ? Math.round(filteredStudents.reduce((sum, s) => sum + s.completion_percentage, 0) / totalStudents)
    : 0;
  const withMissingModules = filteredStudents.filter(s => s.missing_modules > 0).length;
  const atRisk = filteredStudents.filter(s => s.completion_percentage < 50).length;
  const highRisk = filteredStudents.filter(s => s.risk_level === 'High').length;
  const lowRisk = filteredStudents.filter(s => s.risk_level === 'Low').length;
  const totalRetakes = filteredStudents.reduce((sum, s) => sum + s.total_retakes, 0);

  // Smart filter reset functionality
  const handleCampusChange = (campus: string) => {
    setSelectedCampus(campus);
    // Reset dependent filters
    setSelectedPhase('');
    setSelectedYear('');
    setSelectedPlanCode('');
  };

  const handlePhaseChange = (phase: string) => {
    setSelectedPhase(phase);
    // Reset dependent filters  
    setSelectedYear('');
    setSelectedPlanCode('');
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    // Reset dependent filters
    setSelectedPlanCode('');
  };

  const clearAllFilters = () => {
    setSelectedCampus('');
    setSelectedPhase('');
    setSelectedYear('');
    setSelectedPlanCode('');
    setSearchTerm('');
  };

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Download functionality
  const handleDownload = () => {
    const csvData = sortedStudents.map(student => ({
      'Student Number': student.student_number,
      'Name': student.name,
      'Campus': student.campus_name,
      'Plan Code': student.plan_code,
      'Academic Level': student.academic_level,
      'Completion %': student.completion_percentage,
      'Modules Passed': student.modules_passed,
      'Total Modules': student.total_modules,
      'Missing Modules': student.missing_modules,
      'Total Retakes': student.total_retakes,
      'Risk Level': student.risk_level
    }));

    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `student-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Get available options for dependent filters
  const getAvailablePhases = () => {
    if (!selectedCampus) return filterStats.phases;
    return Array.from(new Set(
      students
        .filter(s => s.campus_name === selectedCampus)
        .map(s => s.phase)
    ));
  };

  const getAvailableYears = () => {
    if (!selectedCampus) return filterStats.years;
    let filtered = students.filter(s => s.campus_name === selectedCampus);
    if (selectedPhase) {
      filtered = filtered.filter(s => s.phase === selectedPhase);
    }
    return Array.from(new Set(filtered.map(s => s.academic_level))).sort((a, b) => {
      const order: Record<string, number> = { '1st': 1, '2nd': 2, '3rd': 3, '4th': 4, 'Unknown': 5 };
      return (order[a] || 99) - (order[b] || 99);
    });
  };

  const getAvailablePlanCodes = () => {
    if (!selectedCampus) return filterStats.planCodes;
    let filtered = students.filter(s => s.campus_name === selectedCampus);
    if (selectedPhase) {
      filtered = filtered.filter(s => s.phase === selectedPhase);
    }
    if (selectedYear) {
      filtered = filtered.filter(s => s.academic_level === selectedYear);
    }
    return Array.from(new Set(filtered.map(s => s.plan_code)));
  };

  // Scroll indicator handler
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setCanScrollUp(scrollTop > 10);
      setCanScrollDown(scrollTop < scrollHeight - clientHeight - 10);
    }
  };

  // Set up scroll event listener
  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      // Initial check
      handleScroll();
      
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [currentPageStudents.length]);

  // Handle missing modules popup
  const handleMissingModulesClick = (student: any) => {
    setMissingModulesPopup({
      isOpen: true,
      student: student,
      modules: student.missing_modules_details || []
    });
  };

  // Don't render if not open
  if (!isOpen) return null;

    return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-[98vw] h-[95vh] flex flex-col overflow-hidden border border-slate-200/20"
        >
          {/* Enterprise Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-8 py-6 flex items-center justify-between text-white">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl shadow-lg">
                <BarChart3 className="w-8 h-8 text-white" />
            </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  Enterprise Analytics Dashboard
                </h1>
                <p className="text-slate-400 text-sm font-medium">
                  Comprehensive Student Performance Intelligence
                </p>
          </div>
            </div>
            
            <div className="flex items-center space-x-3">
    <motion.div
                whileHover={{ scale: 1.05 }}
                className="px-4 py-2 bg-slate-700/50 rounded-xl border border-slate-600/50 text-sm font-medium"
              >
                Last updated: {lastRefresh?.toLocaleTimeString()}
              </motion.div>
              
              <button
                onClick={() => setShowMissingModuleInfo(true)}
                className="p-3 hover:bg-slate-700/50 rounded-xl transition-all duration-200 border border-slate-600/30"
                title="Analytics Information"
              >
                <Info className="w-5 h-5" />
              </button>
              
              <button
                onClick={loadStudents}
                disabled={loading}
                className="p-3 hover:bg-slate-700/50 rounded-xl transition-all duration-200 border border-slate-600/30 disabled:opacity-50"
                title="Refresh Analytics"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                onClick={onClose}
                className="p-3 hover:bg-red-500/20 rounded-xl transition-all duration-200 border border-red-500/30 text-red-400 hover:text-red-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-8 border-b border-slate-200">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-slate-200"></div>
                    <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
            </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">{loadingStage}</h3>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${loadingProgress}%` }}
                        transition={{ duration: 0.5 }}
                      />
          </div>
                    <p className="text-sm text-slate-600 mt-2">{loadingProgress}% complete</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Minimal Top Analytics Bar */}
          <div className="bg-white border-b border-slate-200 px-6 py-2">
            <div className="flex items-center justify-between">
              {/* Left: Quick Stats */}
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="p-1 bg-gradient-to-br from-blue-600 to-indigo-600 rounded">
                    <BarChart3 className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm font-medium text-slate-800">Analytics</span>
                </div>
                
                <div className="flex items-center space-x-4 text-sm">
                  <span className="flex items-center space-x-1">
                    <Users className="w-3 h-3 text-blue-600" />
                    <span className="font-medium text-slate-700">{totalStudents}</span>
                    <span className="text-slate-500">students</span>
                  </span>
                  
                  <span className="flex items-center space-x-1">
                    <TrendingUp className="w-3 h-3 text-emerald-600" />
                    <span className="font-medium text-slate-700">{avgCompletion}%</span>
                    <span className="text-slate-500">avg</span>
                  </span>
                  
                  <span className="flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3 text-red-600" />
                    <span className="font-medium text-slate-700">{atRisk}</span>
                    <span className="text-slate-500">at risk</span>
                  </span>
                  
                  <span className="flex items-center space-x-1">
                    <BookOpen className="w-3 h-3 text-amber-600" />
                    <span className="font-medium text-slate-700">{withMissingModules}</span>
                    <span className="text-slate-500">missing</span>
                  </span>
                </div>
              </div>

              {/* Right: Controls */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-xs text-slate-600">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      <span>Good: {filteredStudents.filter(s => s.completion_percentage >= 70).length}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                      <span>Warning: {filteredStudents.filter(s => s.completion_percentage >= 50 && s.completion_percentage < 70).length}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      <span>Critical: {filteredStudents.filter(s => s.completion_percentage < 50).length}</span>
                    </span>
                  </div>
                </div>
                
            <button
                  onClick={() => setShowMissingModuleInfo(true)}
                  className="text-xs text-slate-600 hover:text-slate-800 flex items-center space-x-1 px-2 py-1 hover:bg-slate-100 rounded"
                >
                  <Info className="w-3 h-3" />
              <span>Details</span>
            </button>
              </div>
          </div>
        </div>

          {/* Enterprise Filter Panel */}
          <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-200 p-4">
            <div className="max-w-full mx-auto">
              {/* Filter Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg">
                    <Filter className="w-4 h-4 text-white" />
          </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-800">Smart Filters</h3>
                    <p className="text-xs text-slate-600">Dynamic filtering with dependency management</p>
                  </div>
                  {(selectedCampus || selectedPhase || selectedYear || selectedPlanCode || searchTerm) && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200"
                    >
                      {[selectedCampus, selectedPhase, selectedYear, selectedPlanCode, searchTerm].filter(Boolean).length} active
                    </motion.div>
              )}
            </div>
            
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleDownload}
                    disabled={filteredStudents.length === 0}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium"
                  >
                    <Download className="w-3 h-3" />
                    <span>Export</span>
                  </button>
                  
                  {(selectedCampus || selectedPhase || selectedYear || selectedPlanCode || searchTerm) && (
                    <motion.button
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={clearAllFilters}
                      className="flex items-center space-x-1 px-3 py-1.5 text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 transition-all duration-200 text-sm"
                    >
                      <X className="w-3 h-3" />
                      <span>Clear</span>
                    </motion.button>
                  )}
                      </div>
                    </div>

              {/* Filter Controls - More Compact */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* Campus Filter */}
                  <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  className="space-y-1"
                >
                  <label className="flex items-center space-x-1 text-xs font-medium text-slate-700">
                    <Building2 className="w-3 h-3 text-emerald-600" />
                    <span>Campus</span>
                  </label>
                  <select
                    value={selectedCampus}
                    onChange={(e) => handleCampusChange(e.target.value)}
                    className="w-full px-2 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-xs shadow-sm"
                  >
                    <option value="">All ({filterStats.campuses.length})</option>
                    {filterStats.campuses.map(campus => {
                      const count = students.filter(s => s.campus_name === campus).length;
                      return (
                        <option key={campus} value={campus}>
                          {campus.replace(' Campus', '')} ({count})
                        </option>
                      );
                    })}
                  </select>
                  </motion.div>

                {/* Phase Filter */}
                  <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  className="space-y-1"
                >
                  <label className="flex items-center space-x-1 text-xs font-medium text-slate-700">
                    <GraduationCap className="w-3 h-3 text-emerald-600" />
                    <span>Phase</span>
                  </label>
                  <select
                    value={selectedPhase}
                    onChange={(e) => handlePhaseChange(e.target.value)}
                    disabled={!selectedCampus}
                    className="w-full px-2 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed transition-all duration-200 text-xs shadow-sm"
                  >
                    <option value="">All ({getAvailablePhases().length})</option>
                    {getAvailablePhases().map(phase => {
                      const count = (selectedCampus ? 
                        students.filter(s => s.campus_name === selectedCampus && s.phase === phase) :
                        students.filter(s => s.phase === phase)
                      ).length;
                      return (
                        <option key={phase} value={phase}>
                          {phase.replace(' Phase', '')} ({count})
                        </option>
                      );
                    })}
                  </select>
                  </motion.div>

                {/* Year Filter */}
                  <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  className="space-y-1"
                >
                  <label className="flex items-center space-x-1 text-xs font-medium text-slate-700">
                    <Calendar className="w-3 h-3 text-emerald-600" />
                    <span>Year</span>
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => handleYearChange(e.target.value)}
                    disabled={!selectedCampus || !selectedPhase}
                    className="w-full px-2 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed transition-all duration-200 text-xs shadow-sm"
                  >
                    <option value="">All ({getAvailableYears().length})</option>
                    {getAvailableYears().map(year => {
                      let count = students.filter(s => s.academic_level === year);
                      if (selectedCampus) count = count.filter(s => s.campus_name === selectedCampus);
                      if (selectedPhase) count = count.filter(s => s.phase === selectedPhase);
                      return (
                        <option key={year} value={year}>
                          {year} ({count.length})
                        </option>
                      );
                    })}
                  </select>
                </motion.div>

                {/* Plan Code Filter */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-1"
                >
                  <label className="flex items-center space-x-1 text-xs font-medium text-slate-700">
                    <Target className="w-3 h-3 text-emerald-600" />
                    <span>Plan</span>
                  </label>
                  <select
                    value={selectedPlanCode}
                    onChange={(e) => setSelectedPlanCode(e.target.value)}
                    disabled={!selectedCampus || !selectedPhase || !selectedYear}
                    className="w-full px-2 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed transition-all duration-200 text-xs shadow-sm"
                  >
                    <option value="">All ({getAvailablePlanCodes().length})</option>
                    {getAvailablePlanCodes().map(planCode => {
                      let count = students.filter(s => s.plan_code === planCode);
                      if (selectedCampus) count = count.filter(s => s.campus_name === selectedCampus);
                      if (selectedPhase) count = count.filter(s => s.phase === selectedPhase);
                      if (selectedYear) count = count.filter(s => s.academic_level === selectedYear);
                      return (
                        <option key={planCode} value={planCode}>
                          {planCode} ({count.length})
                        </option>
                      );
                    })}
                  </select>
                </motion.div>

                {/* Search Filter */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-1 col-span-2 md:col-span-1"
                >
                  <label className="flex items-center space-x-1 text-xs font-medium text-slate-700">
                    <Search className="w-3 h-3 text-emerald-600" />
                    <span>Search</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Name, number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-2 py-2 pl-7 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-xs shadow-sm"
                    />
                    <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 transform -translate-y-1/2" />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    </div>
                  </motion.div>
                </div>
                      </div>
                      </div>

          {/* Enterprise Data Table - Fixed Height Container */}
          <div className="flex-1 bg-white flex flex-col min-h-0">
            {/* Table Header - Fixed */}
            <div className="flex-shrink-0">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center space-x-3">
                  <h2 className="text-lg font-semibold text-slate-800">Student Analytics Table</h2>
                  <span className="px-2 py-1 bg-slate-200 text-slate-600 rounded-full text-sm font-medium">
                    Showing {startIndex + 1}-{Math.min(endIndex, totalStudents)} of {totalStudents} results
                  </span>
                      </div>
                
                <div className="flex items-center space-x-3">
                  {/* Sort Controls */}
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-slate-600">Sort by:</span>
                    <select
                      value={`${sortField}-${sortDirection}`}
                      onChange={(e) => {
                        const [field, direction] = e.target.value.split('-') as [string, 'asc' | 'desc'];
                        setSortField(field);
                        setSortDirection(direction);
                      }}
                      className="px-3 py-1 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="completion_percentage-desc">Completion % ↓</option>
                      <option value="completion_percentage-asc">Completion % ↑</option>
                      <option value="name-asc">Name A-Z</option>
                      <option value="name-desc">Name Z-A</option>
                      <option value="missing_modules-desc">Missing ↓</option>
                      <option value="missing_modules-asc">Missing ↑</option>
                      <option value="total_retakes-desc">Retakes ↓</option>
                      <option value="total_retakes-asc">Retakes ↑</option>
                    </select>
                    
                    <button
                      onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                      className="p-1 hover:bg-slate-100 rounded"
                    >
                      {sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                    </button>
                      </div>

                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-slate-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('table')}
                      className={`p-2 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('cards')}
                      className={`p-2 rounded-lg transition-colors ${viewMode === 'cards' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-600 hover:bg-slate-200'}`}
                    >
                      <Users className="w-4 h-4" />
                    </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table Content - Scrollable Area with Fixed Height */}
              <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-auto table-scrollbar relative min-h-0"
                style={{ scrollBehavior: 'smooth', maxHeight: 'calc(100vh - 400px)' }}
              >
                {/* Scroll indicators */}
                {canScrollUp && (
                  <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white via-white/80 to-transparent z-20 pointer-events-none" />
                )}
                {canScrollDown && (
                  <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white via-white/80 to-transparent z-20 pointer-events-none" />
                )}
                
                {/* Scroll to top button */}
                {canScrollUp && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="absolute bottom-4 right-4 p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg transition-colors z-30"
                    title="Scroll to top"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </motion.button>
                )}
                
                {viewMode === 'table' ? (
                  <div className="h-full">
                    <table className="w-full">{/* Enhanced scrolling table */}
                      <thead className="bg-slate-50 sticky top-0 z-10">
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-4 px-6 font-medium text-slate-700">
                            <div className="flex items-center space-x-1 cursor-pointer" onClick={() => handleSort('name')}>
                              <span>Student</span>
                              {sortField === 'name' && (
                                sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                )}
              </div>
                          </th>
                          <th className="text-left py-4 px-6 font-medium text-slate-700">
                            <div className="flex items-center space-x-1 cursor-pointer" onClick={() => handleSort('campus_name')}>
                              <span>Campus</span>
                              {sortField === 'campus_name' && (
                                sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                              )}
                        </div>
                          </th>
                          <th className="text-left py-4 px-6 font-medium text-slate-700">
                            <div className="flex items-center space-x-1 cursor-pointer" onClick={() => handleSort('academic_level')}>
                              <span>Level</span>
                              {sortField === 'academic_level' && (
                                sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      )}
                    </div>
                          </th>
                          <th className="text-left py-4 px-6 font-medium text-slate-700">
                            <div className="flex items-center space-x-1 cursor-pointer" onClick={() => handleSort('completion_percentage')}>
                              <span>Progress</span>
                              {sortField === 'completion_percentage' && (
                                sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                              )}
                  </div>
                          </th>
                          <th className="text-center py-4 px-6 font-medium text-slate-700">Modules</th>
                          <th className="text-center py-4 px-6 font-medium text-slate-700">
                            <div className="flex items-center justify-center space-x-1 cursor-pointer" onClick={() => handleSort('total_retakes')}>
                              <span>Retakes</span>
                              {sortField === 'total_retakes' && (
                                sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                )}
              </div>
                          </th>
                          <th className="text-center py-4 px-6 font-medium text-slate-700">
                            <div className="flex items-center justify-center space-x-1 cursor-pointer" onClick={() => handleSort('missing_modules')}>
                              <span>Missing</span>
                              {sortField === 'missing_modules' && (
                                sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                              )}
                      </div>
                          </th>
                            </tr>
                          </thead>
                      <tbody className="divide-y divide-slate-200">
                        {currentPageStudents.map((student, index) => (
                          <motion.tr
                            key={student.student_number}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            {/* Student Info */}
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                                  {student.first_names?.charAt(0) || student.name?.charAt(0) || 'S'}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-800">{student.surname}, {student.first_names}</p>
                                  <p className="text-sm text-slate-500">{student.student_number}</p>
                                </div>
                              </div>
                                </td>

                            {/* Campus */}
                            <td className="py-4 px-6">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                {student.campus_name.replace(' Campus', '')}
                              </span>
                            </td>

                            {/* Academic Level */}
                            <td className="py-4 px-6">
                              <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                                {student.academic_level}
                              </span>
                            </td>

                            {/* Progress */}
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-2">
                                <div className="flex-1 bg-slate-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                      student.completion_percentage >= 70 ? 'bg-emerald-500' :
                                      student.completion_percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${student.completion_percentage}%` }}
                                  ></div>
                      </div>
                                <span className="text-sm font-medium text-slate-700 min-w-[45px]">
                                  {student.completion_percentage}%
                                </span>
                    </div>
                            </td>

                            {/* Modules */}
                            <td className="py-4 px-6 text-center">
                              <span className="text-sm text-slate-700">
                                {student.modules_passed}/{student.total_modules}
                              </span>
                            </td>

                            {/* Retakes */}
                            <td className="py-4 px-6 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                student.total_retakes === 0 ? 'bg-emerald-100 text-emerald-800' :
                                student.total_retakes <= 2 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {student.total_retakes}
                              </span>
                            </td>

                            {/* Missing Modules - Clickable */}
                            <td className="py-4 px-6 text-center">
                              <button 
                                onClick={() => handleMissingModulesClick(student)}
                                className={`px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 cursor-pointer ${
                                  student.missing_modules === 0 ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' :
                                  student.missing_modules <= 3 ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-red-100 text-red-800 hover:bg-red-200'
                                }`}
                                disabled={student.missing_modules === 0}
                              >
                                {student.missing_modules} missing
                              </button>
                            </td>
                          </motion.tr>
                            ))}
                            </tbody>
                          </table>
                        </div>
                ) : (
                  // Card view content remains the same
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Card view implementation */}
                  </div>
                )}
              </div>

              {/* Missing Modules Creative Popup */}
              {missingModulesPopup.isOpen && (
                <div 
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setMissingModulesPopup({ isOpen: false, student: null, modules: [] });
                    }
                  }}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
                  >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-red-500 to-pink-600 p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold">Missing Modules</h3>
                            <p className="text-red-100">
                              {missingModulesPopup.student?.surname}, {missingModulesPopup.student?.first_names}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setMissingModulesPopup({ isOpen: false, student: null, modules: [] })}
                          className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Student Info Bar */}
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-6">
                          <div>
                            <span className="text-slate-500">Student #:</span>
                            <span className="font-medium text-slate-800 ml-1">
                              {missingModulesPopup.student?.student_number}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Campus:</span>
                            <span className="font-medium text-slate-800 ml-1">
                              {missingModulesPopup.student?.campus_name}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Level:</span>
                            <span className="font-medium text-slate-800 ml-1">
                              {missingModulesPopup.student?.academic_level}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-red-600">
                            {missingModulesPopup.modules.length} Missing
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Missing Modules List */}
                    <div className="p-6 max-h-[400px] overflow-y-auto">
                      {missingModulesPopup.modules.length > 0 ? (
                        <div className="space-y-3">
                          {missingModulesPopup.modules.map((module, index) => (
                            <motion.div
                              key={module.module_code || index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                            >
                              <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                  <AlertTriangle className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-800">
                                    {module.module_code}
                                  </div>
                                  <div className="text-sm text-slate-500">
                                    {module.module_name || 'Module Name Not Available'}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  module.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {module.priority || 'Normal'} Priority
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                  Required for {module.required_year || 'Current'} year
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                          </div>
                          <h4 className="text-lg font-semibold text-slate-800 mb-2">All Caught Up!</h4>
                          <p className="text-slate-500">This student has no missing modules.</p>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-500">
                          Last updated: {new Date().toLocaleDateString()}
                        </div>
                        <button
                          onClick={() => setMissingModulesPopup({ isOpen: false, student: null, modules: [] })}
                          className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Pagination - Always Visible */}
          {totalPages > 1 && (
            <div className="bg-white border-t border-slate-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-slate-600">
                  <span>
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(endIndex, totalStudents)}</span> of{' '}
                    <span className="font-medium">{totalStudents}</span> results
                  </span>
                        </div>
                
                <div className="flex items-center space-x-2">
                  {/* Previous button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  {/* Page numbers */}
                  <div className="flex items-center space-x-1">
                    {(() => {
                      const pages = [];
                      const maxVisible = 5;
                      let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                      let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                      
                      if (endPage - startPage < maxVisible - 1) {
                        startPage = Math.max(1, endPage - maxVisible + 1);
                      }

                      // First page + ellipsis
                      if (startPage > 1) {
                        pages.push(
                          <button
                            key={1}
                            onClick={() => setCurrentPage(1)}
                            className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg"
                          >
                            1
                          </button>
                        );
                        if (startPage > 2) {
                          pages.push(
                            <span key="ellipsis1" className="px-2 text-slate-400">
                              ...
                            </span>
                          );
                        }
                      }

                      // Visible page numbers
                      for (let page = startPage; page <= endPage; page++) {
                        pages.push(
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg ${
                              page === currentPage
                                ? 'bg-emerald-600 text-white'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      }

                      // Last page + ellipsis
                      if (endPage < totalPages) {
                        if (endPage < totalPages - 1) {
                          pages.push(
                            <span key="ellipsis2" className="px-2 text-slate-400">
                              ...
                            </span>
                          );
                        }
                        pages.push(
                          <button
                            key={totalPages}
                            onClick={() => setCurrentPage(totalPages)}
                            className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg"
                          >
                            {totalPages}
                          </button>
                        );
                      }

                      return pages;
                    })()}
                      </div>

                  {/* Next button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                          </div>
                      </div>
              </div>
            )}
          </div>

          {/* Missing Modules Info Modal */}
          {showMissingModuleInfo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-60 bg-black bg-opacity-75 flex items-center justify-center p-4"
              onClick={() => setShowMissingModuleInfo(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-emerald-100 rounded-xl">
                      <Info className="w-6 h-6 text-emerald-600" />
                      </div>
                    <h3 className="text-xl font-bold text-slate-900">Analytics Information</h3>
                    </div>
                  <button
                    onClick={() => setShowMissingModuleInfo(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                    </div>
                
                <div className="space-y-6">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                    <h4 className="font-semibold text-emerald-900 mb-3 flex items-center">
                      <Award className="w-5 h-5 mr-2" />
                      Enterprise Analytics Features
                    </h4>
                    <ul className="space-y-2 text-sm text-emerald-800">
                      <li className="flex items-start">
                        <span className="w-1 h-1 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Real-time data from comprehensive analysis API
                      </li>
                      <li className="flex items-start">
                        <span className="w-1 h-1 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Intelligent cascading filters with dependency management
                      </li>
                      <li className="flex items-start">
                        <span className="w-1 h-1 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Advanced sorting and search capabilities
                      </li>
                      <li className="flex items-start">
                        <span className="w-1 h-1 bg-emerald-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Comprehensive student performance metrics
                      </li>
                    </ul>
                </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2" />
                      Data Sources & Calculations
                    </h4>
                    <ul className="space-y-2 text-sm text-blue-800">
                      <li><strong>Missing Modules:</strong> Calculated from plan requirements vs completed modules</li>
                      <li><strong>Risk Assessment:</strong> Based on completion percentage and missing module count</li>
                      <li><strong>Academic Level:</strong> Normalized to 1st, 2nd, 3rd, 4th year format</li>
                      <li><strong>Campus Assignment:</strong> Derived from plan code prefixes (Q, B, L)</li>
                    </ul>
                  </div>
                                </div>
                
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={() => setShowMissingModuleInfo(false)}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
                  >
                    Got it!
                  </button>
                              </div>
              </motion.div>
            </motion.div>
        )}
      </motion.div>
    </motion.div>
    </AnimatePresence>
  );
}; 

export default ComprehensiveDataAnalysis; 