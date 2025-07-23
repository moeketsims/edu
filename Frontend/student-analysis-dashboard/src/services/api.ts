import axios from 'axios';
import { BulkAnalysisResponse, FilteredAnalysisResponse, FilterOptions, Filters } from '../types';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create multipart form data API instance for file uploads
const multipartApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

export const studentAnalysisAPI = {
  // ============================================================================
  // SYSTEM ENDPOINTS
  // ============================================================================

  // API root
  getRoot: async () => {
    const response = await api.get('/');
    return response.data;
  },

  // Health check
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  // Database stats
  getStats: async () => {
    const response = await api.get('/stats');
    return response.data;
  },

  // Dashboard statistics (focused on graduation tracking)
  getDashboardStats: async () => {
    const response = await api.get('/api/dashboard-stats');
    return response.data;
  },

  // Database info
  getDatabaseInfo: async () => {
    const response = await api.get('/database-info');
    return response.data;
  },

  // ============================================================================
  // DATA LOADING ENDPOINTS
  // ============================================================================

  // Load student data from Excel file
  loadStudentData: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await multipartApi.post('/api/load-student-data', formData);
    return response.data;
  },

  // Load allocated modules from CSV file
  loadAllocatedModules: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await multipartApi.post('/api/load-allocated-modules', formData);
    return response.data;
  },

  // ============================================================================
  // STUDENT ENDPOINTS
  // ============================================================================

  // Get all students with pagination
  getStudents: async (skip: number = 0, limit: number = 100) => {
    const response = await api.get(`/api/students/?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  // Get student by student number
  getStudent: async (studentNumber: string) => {
    const response = await api.get(`/api/students/${studentNumber}`);
    return response.data;
  },

  // ============================================================================
  // MODULE ENDPOINTS
  // ============================================================================

  // Get all modules with pagination
  getModules: async (skip: number = 0, limit: number = 100) => {
    const response = await api.get(`/api/modules/?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  // Get module by code
  getModule: async (moduleCode: string) => {
    const response = await api.get(`/api/modules/${moduleCode}`);
    return response.data;
  },

  // ============================================================================
  // PLAN CODE ENDPOINTS
  // ============================================================================

  // Get all plan codes with pagination
  getPlanCodes: async (skip: number = 0, limit: number = 100) => {
    const response = await api.get(`/api/plancodes/?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  // Get plan code by code
  getPlanCode: async (planCode: string) => {
    const response = await api.get(`/api/plancodes/${planCode}`);
    return response.data;
  },

  // ============================================================================
  // MISSING MODULES ENDPOINTS
  // ============================================================================

  // Check missing modules for a specific student
  checkMissingModules: async (studentNumber: string) => {
    const response = await api.get(`/api/missing-modules/${studentNumber}`);
    return response.data;
  },

  // Generate missing modules report for all students
  generateMissingModulesReport: async () => {
    const response = await api.get('/api/missing-modules-report');
    return response.data;
  },

  // Bulk check missing modules for all students
  bulkCheckMissingModules: async () => {
    const response = await api.post('/api/bulk-check-missing-modules');
    return response.data;
  },

  // Analyze missing modules for a specific student by year
  analyzeStudentMissingModules: async (studentNumber: string) => {
    const response = await api.get(`/api/analyze-student-missing-modules/${studentNumber}`);
    return response.data;
  },

  // Bulk analyze missing modules for all students by year
  bulkAnalyzeMissingModules: async () => {
    const response = await api.post('/api/bulk-analyze-missing-modules');
    return response.data;
  },

  // Individual student comprehensive analysis
  individualAnalysis: async (studentNumber: string) => {
    const response = await api.get(`/api/comprehensive-student-analysis/${studentNumber}`);
    return response.data;
  },

  // Bulk comprehensive analysis
  bulkAnalysis: async (planCode?: string): Promise<BulkAnalysisResponse> => {
    const params = planCode ? { plan_code: planCode } : {};
    const response = await api.post('/api/bulk-comprehensive-analysis', null, { params });
    return response.data;
  },

  // Filtered student analysis with pagination
  filteredAnalysis: async (filters: Filters): Promise<FilteredAnalysisResponse> => {
    const params = new URLSearchParams();
    
    if (filters.academic_level) params.append('academic_level', filters.academic_level);
    if (filters.plan_code) params.append('plan_code', filters.plan_code);
    if (filters.has_missing_modules !== undefined) params.append('has_missing_modules', filters.has_missing_modules.toString());
    if (filters.completion_range) params.append('completion_range', filters.completion_range);
    if (filters.include_extended !== undefined) params.append('include_extended', filters.include_extended.toString());
    params.append('limit', filters.limit.toString());
    params.append('offset', filters.offset.toString());

    const response = await api.get(`/api/filtered-student-analysis?${params}`);
    return response.data;
  },

  // Get filter options for dropdowns
  getFilterOptions: async (): Promise<FilterOptions> => {
    const response = await api.get('/api/filter-options');
    return response.data;
  },

  // ============================================================================
  // SUMMARY ENDPOINTS
  // ============================================================================

  // Test summary endpoint
  testSummary: async () => {
    const response = await api.get('/api/test-summary');
    return response.data;
  },

  // Get comprehensive summary of missing modules by phase and year
  getMissingModulesSummary: async () => {
    const response = await api.get('/api/summary/missing-modules');
    return response.data;
  },

  // ============================================================================
  // EXPORT ENDPOINTS
  // ============================================================================

  // Export missing modules report (CSV or Excel)
  exportMissingModulesReport: async (format: string = 'csv') => {
    const response = await api.get(`/api/export/missing-modules?format=${format}`);
    return response.data;
  },

  // ============================================================================
  // CONVENIENCE METHODS
  // ============================================================================

  // Download file from blob response
  downloadFile: async (url: string, filename: string) => {
    const response = await api.get(url, { responseType: 'blob' });
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }
};

export default api; 