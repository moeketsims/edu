import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, Database, BookOpen, Users, GraduationCap, 
  RefreshCw, CheckCircle, AlertCircle, Info, Server,
  Search, Filter, ChevronRight, Clock, Award
} from 'lucide-react';
import { studentAnalysisAPI } from '../services/api';

interface SystemAdminProps {
  onClose: () => void;
}

const SystemAdmin: React.FC<SystemAdminProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [databaseInfo, setDatabaseInfo] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [planCodes, setPlanCodes] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const pageSize = 20;

  useEffect(() => {
    if (activeTab === 'overview') {
      loadOverviewData();
    } else if (activeTab === 'modules') {
      loadModules();
    } else if (activeTab === 'plancodes') {
      loadPlanCodes();
    } else if (activeTab === 'students') {
      loadStudents();
    }
  }, [activeTab, currentPage]);

  const loadOverviewData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [dbInfo, summaryData] = await Promise.all([
        studentAnalysisAPI.getDatabaseInfo(),
        studentAnalysisAPI.getMissingModulesSummary()
      ]);
      
      setDatabaseInfo(dbInfo);
      setSummary(summaryData);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load overview data');
    } finally {
      setLoading(false);
    }
  };

  const loadModules = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await studentAnalysisAPI.getModules(currentPage * pageSize, pageSize);
      setModules(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load modules');
    } finally {
      setLoading(false);
    }
  };

  const loadPlanCodes = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await studentAnalysisAPI.getPlanCodes(currentPage * pageSize, pageSize);
      setPlanCodes(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load plan codes');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await studentAnalysisAPI.getStudents(currentPage * pageSize, pageSize);
      setStudents(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Database Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Database className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Database Information</h3>
        </div>
        
        {databaseInfo && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-500">Database Type</span>
              <p className="text-gray-900 flex items-center">
                {databaseInfo.database_type}
                {databaseInfo.is_postgresql && (
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Production Ready
                  </span>
                )}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Bulk Operations</span>
              <p className="text-gray-900 flex items-center">
                {databaseInfo.supports_bulk_operations ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                    Supported
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-yellow-600 mr-1" />
                    Limited
                  </>
                )}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-sm font-medium text-gray-500">Connection URL</span>
              <p className="text-gray-900 font-mono text-sm bg-gray-50 p-2 rounded">
                {databaseInfo.database_url?.split('://')[0]}://***
              </p>
            </div>
          </div>
        )}
      </div>

      {/* System Summary */}
      {summary && (
        <>
          <div className="grid grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.total_students?.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Students with Missing</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.students_with_missing?.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Missing Modules</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.total_missing_modules?.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary.total_students > 0 ? 
                      Math.round(((summary.total_students - summary.students_with_missing) / summary.total_students) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Missing Modules by Phase */}
          {summary.by_phase && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Missing Modules by Phase</h3>
              <div className="grid grid-cols-4 gap-4">
                {Object.entries(summary.by_phase).map(([phase, data]: [string, any]) => (
                  <div key={phase} className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{data.total}</div>
                    <div className="text-sm text-gray-600">{phase}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  const ModulesTab = () => (
    <div className="space-y-6">
      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => setCurrentPage(0)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Search
          </button>
        </div>
      </div>

      {/* Modules List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Modules ({modules.length})</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {modules.map((module, index) => (
            <div key={index} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{module.code}</h4>
                      <p className="text-sm text-gray-600">{module.name}</p>
                    </div>
                  </div>
                  {module.description && (
                    <p className="text-sm text-gray-500 mt-2 ml-11">{module.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-4">
                    {module.credits && (
                      <span className="text-sm text-gray-600">{module.credits} credits</span>
                    )}
                    {module.phase && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                        {module.phase}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center space-x-2">
        <button
          onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
        >
          Previous
        </button>
        <span className="px-4 py-2 text-gray-600">Page {currentPage + 1}</span>
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={modules.length < pageSize}
          className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );

  const PlanCodesTab = () => (
    <div className="space-y-6">
      {/* Plan Codes List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Plan Codes ({planCodes.length})</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {planCodes.map((plan, index) => (
            <div key={index} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{plan.code}</h4>
                      <p className="text-sm text-gray-600">{plan.description}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-4">
                    {plan.total_credits && (
                      <span className="text-sm text-gray-600">{plan.total_credits} credits</span>
                    )}
                    {plan.duration_years && (
                      <span className="text-sm text-gray-600">{plan.duration_years} years</span>
                    )}
                    {plan.phase && (
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full">
                        {plan.phase}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {plan.specialisation && (
                <p className="text-sm text-gray-500 mt-2 ml-11">
                  Specialisation: {plan.specialisation}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center space-x-2">
        <button
          onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
        >
          Previous
        </button>
        <span className="px-4 py-2 text-gray-600">Page {currentPage + 1}</span>
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={planCodes.length < pageSize}
          className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );

  const StudentsTab = () => (
    <div className="space-y-6">
      {/* Students List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Students ({students.length})</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {students.map((student, index) => (
            <div key={index} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{student.name}</h4>
                      <p className="text-sm text-gray-600">#{student.student_number}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-4">
                    {student.year && (
                      <span className="text-sm text-gray-600">Year {student.year}</span>
                    )}
                    {student.plan_code && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        {student.plan_code}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {student.plan_description && (
                <p className="text-sm text-gray-500 mt-2 ml-11">{student.plan_description}</p>
              )}
              {student.campus_name && (
                <p className="text-sm text-gray-500 ml-11">Campus: {student.campus_name}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center space-x-2">
        <button
          onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
        >
          Previous
        </button>
        <span className="px-4 py-2 text-gray-600">Page {currentPage + 1}</span>
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={students.length < pageSize}
          className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
        >
          Next
        </button>
      </div>
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
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">System Administration</h2>
                <p className="text-sm text-gray-600">Manage system data, view statistics, and monitor database status</p>
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

        {/* Tabs */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'System Overview', icon: Database },
              { id: 'modules', label: 'Modules', icon: BookOpen },
              { id: 'plancodes', label: 'Plan Codes', icon: GraduationCap },
              { id: 'students', label: 'Students', icon: Users }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(0);
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-3">
                <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
                <span className="text-gray-600">Loading...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-800">Error</span>
              </div>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          )}

          {/* Tab Content */}
          {!loading && !error && (
            <>
              {activeTab === 'overview' && <OverviewTab />}
              {activeTab === 'modules' && <ModulesTab />}
              {activeTab === 'plancodes' && <PlanCodesTab />}
              {activeTab === 'students' && <StudentsTab />}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SystemAdmin; 