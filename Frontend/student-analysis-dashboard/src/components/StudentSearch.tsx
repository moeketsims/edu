import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, User, BookOpen, AlertTriangle, CheckCircle, 
  Calendar, GraduationCap, BarChart3, RefreshCw,
  ChevronRight, Clock, Award, Target
} from 'lucide-react';
import { studentAnalysisAPI } from '../services/api';

interface StudentSearchProps {
  onClose: () => void;
}

const StudentSearch: React.FC<StudentSearchProps> = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [studentData, setStudentData] = useState<any>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [missingModules, setMissingModules] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const searchStudent = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError(null);
    setStudentData(null);
    setAnalysisData(null);
    setMissingModules(null);

    try {
      // Get basic student info
      const student = await studentAnalysisAPI.getStudent(searchTerm.trim());
      setStudentData(student);

      // Get comprehensive analysis
      const analysis = await studentAnalysisAPI.individualAnalysis(searchTerm.trim());
      setAnalysisData(analysis);

      // Get missing modules
      const missing = await studentAnalysisAPI.checkMissingModules(searchTerm.trim());
      setMissingModules(missing);

    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Student not found');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchStudent();
    }
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Student Basic Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{studentData?.name}</h3>
            <p className="text-sm text-gray-600">Student #{studentData?.student_number}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm font-medium text-gray-500">Academic Year</span>
            <p className="text-gray-900">{studentData?.year || 'Not specified'}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Campus</span>
            <p className="text-gray-900">{studentData?.campus_name || 'Not specified'}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Plan Code</span>
            <p className="text-gray-900">{studentData?.plan_code || 'Not specified'}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Plan Description</span>
            <p className="text-gray-900">{studentData?.plan_description || 'Not specified'}</p>
          </div>
        </div>
      </div>

      {/* Analysis Summary */}
      {analysisData?.summary && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Progress Summary</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Completion Rate</span>
                <span className="font-semibold text-emerald-600">
                  {analysisData.summary.completion_percentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-emerald-600 h-2 rounded-full"
                  style={{ width: `${analysisData.summary.completion_percentage}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-xs text-gray-500">Passed</span>
                  <p className="font-semibold text-green-600">
                    {analysisData.summary.total_modules_passed}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Missing</span>
                  <p className="font-semibold text-red-600">
                    {analysisData.summary.total_missing_modules}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Academic Details</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Academic Level</span>
                <span className="font-semibold text-purple-600">
                  {analysisData.current_academic_level}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Required</span>
                <span className="text-gray-900">
                  {analysisData.summary.total_required_modules}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Retakes</span>
                <span className="text-gray-900">
                  {analysisData.summary.total_retakes}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const MissingModulesTab = () => (
    <div className="space-y-6">
      {missingModules && missingModules.length > 0 ? (
        <div className="space-y-4">
          {missingModules.map((module: any, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    module.priority === 'High' ? 'bg-red-100' : 'bg-yellow-100'
                  }`}>
                    <AlertTriangle className={`w-4 h-4 ${
                      module.priority === 'High' ? 'text-red-600' : 'text-yellow-600'
                    }`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{module.module_code}</h4>
                    <p className="text-sm text-gray-600">{module.module_name || 'Module Name Not Available'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    module.priority === 'High' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {module.priority} Priority
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-xs font-medium text-gray-500">Required Year</span>
                  <p className="text-sm text-gray-900">{module.required_year}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500">Phase</span>
                  <p className="text-sm text-gray-900">{module.phase}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500">Credits</span>
                  <p className="text-sm text-gray-900">{module.credits || 'N/A'}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-green-50 rounded-xl border border-green-200 p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">All Modules Complete!</h3>
          <p className="text-green-700">This student has completed all required modules for their plan.</p>
        </div>
      )}
    </div>
  );

  const ModuleHistoryTab = () => (
    <div className="space-y-6">
      {analysisData?.modules_by_year && Object.entries(analysisData.modules_by_year).map(([year, modules]: [string, any]) => (
        <div key={year} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            Year {year}
          </h3>
          
          <div className="grid grid-cols-3 gap-6 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{modules.passed?.length || 0}</div>
              <div className="text-sm text-gray-600">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{modules.failed?.length || 0}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{modules.in_progress?.length || 0}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
          </div>

          {/* Module Details */}
          {(modules.passed?.length > 0 || modules.failed?.length > 0 || modules.in_progress?.length > 0) && (
            <div className="space-y-4">
              {modules.passed?.length > 0 && (
                <div>
                  <h4 className="font-medium text-green-700 mb-2">Passed Modules</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {modules.passed.map((module: any, idx: number) => (
                      <div key={idx} className="text-sm bg-green-50 px-3 py-2 rounded-lg">
                        <span className="font-medium">{module.module_code}</span>
                        {module.final_mark && (
                          <span className="text-green-600 ml-2">({module.final_mark}%)</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {modules.failed?.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-700 mb-2">Failed Modules</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {modules.failed.map((module: any, idx: number) => (
                      <div key={idx} className="text-sm bg-red-50 px-3 py-2 rounded-lg">
                        <span className="font-medium">{module.module_code}</span>
                        {module.final_mark && (
                          <span className="text-red-600 ml-2">({module.final_mark}%)</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {modules.in_progress?.length > 0 && (
                <div>
                  <h4 className="font-medium text-blue-700 mb-2">In Progress</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {modules.in_progress.map((module: any, idx: number) => (
                      <div key={idx} className="text-sm bg-blue-50 px-3 py-2 rounded-lg">
                        <span className="font-medium">{module.module_code}</span>
                        <span className="text-blue-600 ml-2">
                          <Clock className="w-3 h-3 inline" />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Search className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Student Search & Analysis</h2>
                <p className="text-sm text-gray-600">Search for individual students and view their academic progress</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Enter student number (e.g., 1996237523)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={searchStudent}
              disabled={loading || !searchTerm.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Search</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {error && (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-800">Error</span>
                </div>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {studentData && (
            <>
              {/* Tabs */}
              <div className="px-6 py-4 bg-white border-b border-gray-200">
                <div className="flex space-x-8">
                  {[
                    { id: 'overview', label: 'Overview', icon: User },
                    { id: 'missing', label: 'Missing Modules', icon: AlertTriangle },
                    { id: 'history', label: 'Module History', icon: BookOpen }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {activeTab === 'overview' && <OverviewTab />}
                {activeTab === 'missing' && <MissingModulesTab />}
                {activeTab === 'history' && <ModuleHistoryTab />}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default StudentSearch; 