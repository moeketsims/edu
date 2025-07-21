import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, Download, Database, FileSpreadsheet, FileText, 
  Users, BookOpen, RefreshCw, CheckCircle, AlertCircle,
  Play, Settings, BarChart3
} from 'lucide-react';
import { studentAnalysisAPI } from '../services/api';

interface DataManagementProps {
  onClose: () => void;
}

const DataManagement: React.FC<DataManagementProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('upload');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (file: File, type: 'student' | 'modules') => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      let result;
      if (type === 'student') {
        result = await studentAnalysisAPI.loadStudentData(file);
      } else {
        result = await studentAnalysisAPI.loadAllocatedModules(file);
      }
      setResults(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkOperation = async (operation: string) => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      let result;
      switch (operation) {
        case 'bulk-check-missing':
          result = await studentAnalysisAPI.bulkCheckMissingModules();
          break;
        case 'bulk-analyze-missing':
          result = await studentAnalysisAPI.bulkAnalyzeMissingModules();
          break;
        case 'bulk-comprehensive':
          result = await studentAnalysisAPI.bulkAnalysis();
          break;
        default:
          throw new Error('Unknown operation');
      }
      setResults(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await studentAnalysisAPI.exportMissingModulesReport(format);
      await studentAnalysisAPI.downloadFile(
        `/api/export/missing-modules?format=${format}`,
        `missing_modules_report.${format}`
      );
      setResults({ message: `Export completed successfully in ${format.toUpperCase()} format` });
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  const FileUploadSection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Student Data Upload */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-6 bg-white rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Student Data</h3>
              <p className="text-sm text-gray-600">Upload Excel file with student records</p>
            </div>
          </div>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file, 'student');
            }}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <p className="text-xs text-gray-500 mt-2">
            Expected columns: STUDENT_NUMBER, NAME, YEAR, PLAN_CODE, MODULE_CODE, etc.
          </p>
        </motion.div>

        {/* Module Allocation Upload */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-6 bg-white rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Module Allocation</h3>
              <p className="text-sm text-gray-600">Upload CSV file with module assignments</p>
            </div>
          </div>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file, 'modules');
            }}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <p className="text-xs text-gray-500 mt-2">
            Expected columns: Plan Code, Module, Phase, Year, Credits, etc.
          </p>
        </motion.div>
      </div>
    </div>
  );

  const BulkOperationsSection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        {[
          {
            id: 'bulk-check-missing',
            title: 'Bulk Check Missing Modules',
            description: 'Check missing modules for all students',
            icon: CheckCircle,
            color: 'blue'
          },
          {
            id: 'bulk-analyze-missing',
            title: 'Bulk Analyze Missing Modules',
            description: 'Detailed analysis of missing modules by year',
            icon: BarChart3,
            color: 'emerald'
          },
          {
            id: 'bulk-comprehensive',
            title: 'Bulk Comprehensive Analysis',
            description: 'Complete graduation tracking analysis',
            icon: Database,
            color: 'purple'
          }
        ].map((operation) => (
          <motion.div
            key={operation.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 cursor-pointer"
            onClick={() => handleBulkOperation(operation.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 bg-${operation.color}-100 rounded-lg flex items-center justify-center`}>
                  <operation.icon className={`w-6 h-6 text-${operation.color}-600`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{operation.title}</h3>
                  <p className="text-sm text-gray-600">{operation.description}</p>
                </div>
              </div>
              <Play className="w-5 h-5 text-gray-400" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const ExportSection = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {[
          { format: 'csv', icon: FileText, label: 'CSV Format', description: 'Comma-separated values' },
          { format: 'excel', icon: FileSpreadsheet, label: 'Excel Format', description: 'Microsoft Excel file' }
        ].map((exportOption) => (
          <motion.div
            key={exportOption.format}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 cursor-pointer"
            onClick={() => handleExport(exportOption.format)}
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <exportOption.icon className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{exportOption.label}</h3>
                <p className="text-sm text-gray-600">{exportOption.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
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
        className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Data Management</h2>
                <p className="text-sm text-gray-600">Upload files, run bulk operations, and export reports</p>
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
              { id: 'upload', label: 'File Upload', icon: Upload },
              { id: 'bulk', label: 'Bulk Operations', icon: RefreshCw },
              { id: 'export', label: 'Export Data', icon: Download }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
          {activeTab === 'upload' && <FileUploadSection />}
          {activeTab === 'bulk' && <BulkOperationsSection />}
          {activeTab === 'export' && <ExportSection />}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-3">
                <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
                <span className="text-gray-600">Processing...</span>
              </div>
            </div>
          )}

          {/* Results */}
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg"
            >
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Operation Successful</span>
              </div>
              <pre className="text-sm text-green-700 whitespace-pre-wrap">
                {JSON.stringify(results, null, 2)}
              </pre>
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-800">Error</span>
              </div>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </motion.div>
          )}

          {/* Close button (shown after operation completes) */}
          {(results || error) && !loading && (
            <div className="mt-8 flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2 bg-emerald-600 text-white rounded-lg shadow hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DataManagement; 