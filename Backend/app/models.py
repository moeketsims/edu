"""
SQLAlchemy models for the Student Module Checker database
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, Table, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

# Association table for many-to-many relationship between PlanCode and Module
plan_modules = Table(
    'plan_modules',
    Base.metadata,
    Column('plan_code', String, ForeignKey('plan_codes.code'), primary_key=True),
    Column('module_code', String, ForeignKey('modules.code'), primary_key=True),
    Column('year', String),
    Column('phase', String),
    Column('is_required', Boolean, default=True),
    Column('credits', Float),
    # Performance indexes for plan requirements lookups
    Index('idx_plan_modules_plan_code', 'plan_code'),
    Index('idx_plan_modules_year_phase', 'year', 'phase'),
    Index('idx_plan_modules_composite', 'plan_code', 'year', 'phase')
)

class Student(Base):
    """Student model"""
    __tablename__ = "students"
    
    student_number = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    year = Column(String)
    campus_name = Column(String)
    plan_code = Column(String, ForeignKey('plan_codes.code'))
    plan_description = Column(Text)
    year_in_plan = Column(Integer)
    years_in_degree = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Performance indexes
    __table_args__ = (
        Index('idx_students_plan_code', 'plan_code'),
        Index('idx_students_campus_year', 'campus_name', 'year'),
        Index('idx_students_plan_year', 'plan_code', 'year'),
        Index('idx_students_search', 'name', 'student_number')  # For search queries
    )
    
    # Relationships
    plan = relationship("PlanCode", back_populates="students")
    student_modules = relationship("StudentModule", back_populates="student")
    missing_modules = relationship("MissingModule", back_populates="student")

class Module(Base):
    """Module model"""
    __tablename__ = "modules"
    
    code = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    credits = Column(Float)
    prerequisites = Column(Text)
    phase = Column(String)  # Foundation, Intermediate, Senior, etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Performance indexes
    __table_args__ = (
        Index('idx_modules_name', 'name'),
        Index('idx_modules_phase', 'phase'),
        Index('idx_modules_search', 'code', 'name')  # For module search
    )
    
    # Relationships
    student_modules = relationship("StudentModule", back_populates="module")
    plan_codes = relationship("PlanCode", secondary=plan_modules, back_populates="modules")

class PlanCode(Base):
    """Plan Code model - represents degree programs"""
    __tablename__ = "plan_codes"
    
    code = Column(String, primary_key=True, index=True)
    description = Column(Text, nullable=False)
    phase = Column(String)  # Foundation Phase, Intermediate Phase, etc.
    specialisation = Column(String)
    total_credits = Column(Float)
    duration_years = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Performance indexes
    __table_args__ = (
        Index('idx_plan_codes_phase', 'phase'),
        Index('idx_plan_codes_specialisation', 'specialisation'),
        Index('idx_plan_codes_search', 'code', 'description')
    )
    
    # Relationships
    students = relationship("Student", back_populates="plan")
    modules = relationship("Module", secondary=plan_modules, back_populates="plan_codes")

class StudentModule(Base):
    """Student-Module relationship - tracks completed modules"""
    __tablename__ = "student_modules"
    
    id = Column(Integer, primary_key=True, index=True)
    student_number = Column(String, ForeignKey('students.student_number'))
    module_code = Column(String, ForeignKey('modules.code'))
    year_taken = Column(String)
    final_mark = Column(Float)
    final_mark_description = Column(String)  # Pass, Pass with Distinction, etc.
    credits_earned = Column(Float)
    total_credit_hemis = Column(Float)
    units_maximum = Column(Float)
    cred_pass_plan_all_years = Column(Float)
    cred_pass_plan_cur_year = Column(Float)
    completed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Critical performance indexes for analysis queries
    __table_args__ = (
        Index('idx_student_modules_student', 'student_number'),
        Index('idx_student_modules_module', 'module_code'),
        Index('idx_student_modules_year', 'year_taken'),
        Index('idx_student_modules_marks', 'final_mark', 'final_mark_description'),
        Index('idx_student_modules_student_year', 'student_number', 'year_taken'),
        Index('idx_student_modules_student_module', 'student_number', 'module_code'),
        Index('idx_student_modules_composite', 'student_number', 'year_taken', 'final_mark'),
        Index('idx_student_modules_passed', 'student_number', 'final_mark') # For passed module queries
    )
    
    # Relationships
    student = relationship("Student", back_populates="student_modules")
    module = relationship("Module", back_populates="student_modules")

class MissingModule(Base):
    """Missing Module model - tracks modules students still need to complete"""
    __tablename__ = "missing_modules"
    
    id = Column(Integer, primary_key=True, index=True)
    student_number = Column(String, ForeignKey('students.student_number'))
    module_code = Column(String, ForeignKey('modules.code'))
    module_name = Column(String)
    required_year = Column(String)
    phase = Column(String)
    credits = Column(Float)
    is_prerequisite_met = Column(Boolean, default=True)
    priority = Column(String, default="Normal")  # High, Normal, Low
    detected_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Performance indexes for missing module queries
    __table_args__ = (
        Index('idx_missing_modules_student', 'student_number'),
        Index('idx_missing_modules_module', 'module_code'),
        Index('idx_missing_modules_year', 'required_year'),
        Index('idx_missing_modules_phase', 'phase'),
        Index('idx_missing_modules_priority', 'priority'),
        Index('idx_missing_modules_student_year', 'student_number', 'required_year'),
        Index('idx_missing_modules_count', 'student_number', 'phase')  # For counting missing modules
    )
    
    # Relationships
    student = relationship("Student", back_populates="missing_modules")

class AuditLog(Base):
    """Audit log for tracking system changes"""
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String, nullable=False)  # CREATE, UPDATE, DELETE, BULK_CHECK
    entity_type = Column(String, nullable=False)  # Student, Module, PlanCode
    entity_id = Column(String)
    changes = Column(Text)  # JSON string of changes
    user_id = Column(String, default="system")
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Performance indexes for audit queries
    __table_args__ = (
        Index('idx_audit_logs_timestamp', 'timestamp'),
        Index('idx_audit_logs_entity', 'entity_type', 'entity_id'),
        Index('idx_audit_logs_action', 'action', 'timestamp')
    )

class SystemConfiguration(Base):
    """System configuration settings"""
    __tablename__ = "system_config"
    
    key = Column(String, primary_key=True)
    value = Column(Text)
    description = Column(Text)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

# ============================================================================
# MATERIALIZED VIEWS FOR PERFORMANCE (PostgreSQL)
# ============================================================================

class StudentAnalysisSummary(Base):
    """Materialized view for pre-calculated student analysis data"""
    __tablename__ = "student_analysis_summary"
    
    student_number = Column(String, primary_key=True)
    student_name = Column(String)
    plan_code = Column(String)
    campus_name = Column(String)
    academic_level = Column(String)  # 1st, 2nd, 3rd, 4th
    total_modules_passed = Column(Integer, default=0)
    total_modules_required = Column(Integer, default=0)
    total_missing_modules = Column(Integer, default=0)
    completion_percentage = Column(Float, default=0.0)
    total_retakes = Column(Integer, default=0)
    risk_level = Column(String, default="Low")  # Low, Medium, High
    last_activity_year = Column(String)
    last_updated = Column(DateTime(timezone=True), server_default=func.now())
    
    # Performance indexes for dashboard queries
    __table_args__ = (
        Index('idx_analysis_summary_plan', 'plan_code'),
        Index('idx_analysis_summary_campus', 'campus_name'),
        Index('idx_analysis_summary_level', 'academic_level'),
        Index('idx_analysis_summary_completion', 'completion_percentage'),
        Index('idx_analysis_summary_risk', 'risk_level'),
        Index('idx_analysis_summary_missing', 'total_missing_modules'),
        Index('idx_analysis_summary_composite', 'plan_code', 'academic_level', 'completion_percentage')
    )

class DashboardStatistics(Base):
    """Pre-calculated dashboard statistics for ultra-fast loading"""
    __tablename__ = "dashboard_statistics"
    
    id = Column(Integer, primary_key=True)
    stat_type = Column(String, nullable=False)  # 'global', 'plan_code', 'campus'
    stat_key = Column(String)  # plan code, campus name, or 'global'
    total_students = Column(Integer, default=0)
    students_with_missing_modules = Column(Integer, default=0)
    average_completion_percentage = Column(Float, default=0.0)
    total_modules_offered = Column(Integer, default=0)
    students_at_risk = Column(Integer, default=0)  # completion < 50%
    potential_graduates = Column(Integer, default=0)  # no missing modules, final year
    last_calculated = Column(DateTime(timezone=True), server_default=func.now())
    
    # Performance indexes
    __table_args__ = (
        Index('idx_dashboard_stats_type', 'stat_type'),
        Index('idx_dashboard_stats_key', 'stat_key'),
        Index('idx_dashboard_stats_composite', 'stat_type', 'stat_key'),
        Index('idx_dashboard_stats_updated', 'last_calculated')
    )

class ModulePerformanceStats(Base):
    """Pre-calculated module performance statistics"""
    __tablename__ = "module_performance_stats"
    
    module_code = Column(String, primary_key=True)
    module_name = Column(String)
    total_enrollments = Column(Integer, default=0)
    total_passes = Column(Integer, default=0)
    total_fails = Column(Integer, default=0)
    pass_rate = Column(Float, default=0.0)
    average_mark = Column(Float, default=0.0)
    retake_rate = Column(Float, default=0.0)
    most_common_year = Column(String)
    risk_indicator = Column(String, default="Low")  # Based on pass rate
    last_calculated = Column(DateTime(timezone=True), server_default=func.now())
    
    # Performance indexes
    __table_args__ = (
        Index('idx_module_stats_pass_rate', 'pass_rate'),
        Index('idx_module_stats_risk', 'risk_indicator'),
        Index('idx_module_stats_enrollments', 'total_enrollments'),
        Index('idx_module_stats_updated', 'last_calculated')
    ) 