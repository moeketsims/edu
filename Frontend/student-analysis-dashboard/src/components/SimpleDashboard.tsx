import React, { useState, useEffect } from 'react';
import { studentAnalysisAPI } from '../services/api';
import { BulkAnalysisResponse, FilterOptions } from '../types';

const SimpleDashboard: React.FC = () => {
  const [bulkAnalysis, setBulkAnalysis] = useState<BulkAnalysisResponse | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load filter options
      const options = await studentAnalysisAPI.getFilterOptions();
      setFilterOptions(options);
      
      // Load bulk analysis
      const analysis = await studentAnalysisAPI.bulkAnalysis();
      setBulkAnalysis(analysis);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#111827',
      color: '#ffffff',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    },
    header: {
      textAlign: 'center' as const,
      marginBottom: '40px',
      padding: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '10px'
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      margin: '0 0 10px 0'
    },
    subtitle: {
      fontSize: '1.1rem',
      opacity: 0.9,
      margin: 0
    },
    metricsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
      marginBottom: '40px'
    },
    metricCard: {
      backgroundColor: '#1f2937',
      padding: '20px',
      borderRadius: '10px',
      border: '1px solid #374151',
      textAlign: 'center' as const
    },
    metricValue: {
      fontSize: '2rem',
      fontWeight: 'bold',
      marginBottom: '10px',
      color: '#10b981'
    },
    metricLabel: {
      fontSize: '0.9rem',
      opacity: 0.8
    },
    section: {
      backgroundColor: '#1f2937',
      padding: '20px',
      borderRadius: '10px',
      border: '1px solid #374151',
      marginBottom: '20px'
    },
    sectionTitle: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      marginBottom: '15px',
      color: '#f3f4f6'
    },
    loadingSpinner: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '200px',
      fontSize: '1.2rem'
    },
    errorBox: {
      backgroundColor: '#dc2626',
      color: '#ffffff',
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '20px'
    },
    button: {
      backgroundColor: '#8b5cf6',
      color: '#ffffff',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '1rem',
      marginBottom: '20px'
    },
    list: {
      listStyle: 'none',
      padding: 0,
      margin: 0
    },
    listItem: {
      padding: '10px 0',
      borderBottom: '1px solid #374151'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingSpinner}>
          Loading dashboard data...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>Academic Analytics Hub</h1>
        <p style={styles.subtitle}>Student Progress Management Platform</p>
      </header>

      {/* Error Display */}
      {error && (
        <div style={styles.errorBox}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Refresh Button */}
      <button style={styles.button} onClick={loadData}>
        Refresh Data
      </button>

      {/* Metrics Grid */}
      {bulkAnalysis && (
        <div style={styles.metricsGrid}>
          <div style={styles.metricCard}>
            <div style={styles.metricValue}>
              {bulkAnalysis.analysis_summary?.total_students_analyzed || 0}
            </div>
            <div style={styles.metricLabel}>Total Students</div>
          </div>
          
          <div style={styles.metricCard}>
            <div style={styles.metricValue}>
              {bulkAnalysis.analysis_summary?.successful_analyses || 0}
            </div>
            <div style={styles.metricLabel}>Successful Analyses</div>
          </div>
          
          <div style={styles.metricCard}>
            <div style={styles.metricValue}>
              {bulkAnalysis.completion_stats?.average_completion_percentage?.toFixed(1) || 0}%
            </div>
            <div style={styles.metricLabel}>Average Completion</div>
          </div>
          
          <div style={styles.metricCard}>
            <div style={styles.metricValue}>
              {bulkAnalysis.analysis_summary?.processing_time_seconds?.toFixed(2) || 0}s
            </div>
            <div style={styles.metricLabel}>Processing Time</div>
          </div>
        </div>
      )}

      {/* Academic Level Distribution */}
      {bulkAnalysis?.academic_level_distribution && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Academic Level Distribution</h2>
          <ul style={styles.list}>
            {Object.entries(bulkAnalysis.academic_level_distribution).map(([level, count]) => (
              <li key={level} style={styles.listItem}>
                Year {level}: {count} students
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Completion Distribution */}
      {bulkAnalysis?.completion_stats?.completion_distribution && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Completion Distribution</h2>
          <ul style={styles.list}>
            {Object.entries(bulkAnalysis.completion_stats.completion_distribution).map(([range, count]) => (
              <li key={range} style={styles.listItem}>
                {range}: {count} students
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Most Common Missing Modules */}
      {bulkAnalysis?.missing_modules_summary?.most_common_missing && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Most Common Missing Modules</h2>
          <ul style={styles.list}>
            {bulkAnalysis.missing_modules_summary.most_common_missing.slice(0, 10).map((module, index) => (
              <li key={module.module_code} style={styles.listItem}>
                {index + 1}. {module.module_code}: {module.count} students
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Filter Options Summary */}
      {filterOptions && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Available Plan Codes</h2>
          <ul style={styles.list}>
            {filterOptions.plan_codes?.slice(0, 5).map((plan) => (
              <li key={plan.code} style={styles.listItem}>
                {plan.code}: {plan.description} ({plan.student_count} students)
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Debug Info */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Connection Status</h2>
        <p>✅ API Connection: Working</p>
        <p>✅ Backend Health: {error ? 'Error' : 'Healthy'}</p>
        <p>✅ Data Load: {bulkAnalysis ? 'Success' : 'Failed'}</p>
      </div>
    </div>
  );
};

export default SimpleDashboard; 