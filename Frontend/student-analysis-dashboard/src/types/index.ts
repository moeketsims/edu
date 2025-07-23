export interface MissingModule {
  module_code: string;
  module_name: string;
  credits: number;
  required_year: string;
  priority: string;
  phase: string;
  description?: string;
  is_elective?: boolean;
  elective_options?: string[];
}

export interface Student {
  student_number: string;
  student_name: string;
  plan_code: string;
  current_academic_level: string;
  total_modules_passed: number;        // ACTUAL modules passed by student
  total_modules_required: number;      // ACTUAL modules required according to plan
  total_missing_modules: number;
  total_retakes: number;
  completion_percentage: number;
  missing_modules_details: MissingModule[];
}

export interface AnalysisSummary {
  total_students_analyzed: number;
  successful_analyses: number;
  failed_analyses: number;
  processing_time_seconds: number;
}

export interface BulkAnalysisResponse {
  analysis_summary: AnalysisSummary;
  academic_level_distribution: Record<string, number>;
  missing_modules_summary: {
    total_missing_modules: number;
    students_with_missing: number;
    missing_by_year: Record<string, number>;
    most_common_missing: Array<{ module_code: string; count: number }>;
  };
  retakes_summary?: {
    total_retakes: number;
    students_with_retakes: number;
    most_retaken_modules: Record<string, number>;
  };
  completion_stats: {
    average_completion_percentage: number;
    completion_distribution: Record<string, number>;
  };
  individual_student_results: Student[];
  errors: string[];
}

export interface FilteredAnalysisResponse {
  students: Student[];
  total_matching: number;
  pagination: {
    limit: number;
    offset: number;
    total_pages: number;
    current_page: number;
  };
  processing_time_seconds: number;
}

export interface FilterOptions {
  plan_codes: Array<{
    code: string;
    description: string;
    student_count: number;
  }>;
  academic_levels: Array<{
    level: string;
    description: string;
  }>;
  completion_ranges: Array<{
    range: string;
    description: string;
  }>;
  missing_module_options: Array<{
    value: boolean;
    description: string;
  }>;
  extended_programme_options: Array<{
    value: boolean | null;
    description: string;
  }>;
  has_analysis_data: boolean;
  note?: string;
}

export interface Filters {
  academic_level?: string;
  plan_code?: string;
  has_missing_modules?: boolean;
  completion_range?: string;
  include_extended?: boolean;
  limit: number;
  offset: number;
} 