"""
SQLAlchemy models for the Student Module Checker database
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, Table
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
    Column('credits', Float)
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

class SystemConfiguration(Base):
    """System configuration settings"""
    __tablename__ = "system_config"
    
    key = Column(String, primary_key=True)
    value = Column(Text)
    description = Column(Text)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now()) 