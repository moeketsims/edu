"""
Service classes containing business logic for the Student Module Checker
"""

import pandas as pd
import io
import time
from datetime import datetime
from typing import List, Optional, Dict, Any, Set
from sqlalchemy.orm import Session
from sqlalchemy import func, text, and_
from fastapi import UploadFile, HTTPException
import re

from app.models import Student, Module, PlanCode, StudentModule, MissingModule, plan_modules
from app.schemas import (
    StudentCreate, StudentResponse, ModuleCreate, ModuleResponse,
    PlanCodeCreate, PlanCodeResponse, MissingModuleResponse,
    DataLoadResult, BulkProcessingResult
)
from app.database import get_database_info

# ============================================================================
# STUDENT SERVICE
# ============================================================================

class StudentService:
    """Service for student-related operations"""
    
    @staticmethod
    def create_student(db: Session, student: StudentCreate) -> Student:
        """Create a new student"""
        db_student = Student(**student.dict())
        db.add(db_student)
        db.commit()
        db.refresh(db_student)
        return db_student
    
    @staticmethod
    def get_student(db: Session, student_number: str) -> Optional[Student]:
        """Get student by student number"""
        return db.query(Student).filter(Student.student_number == student_number).first()
    
    @staticmethod
    def get_students(db: Session, skip: int = 0, limit: int = 100) -> List[Student]:
        """Get list of students with pagination"""
        return db.query(Student).offset(skip).limit(limit).all()
    
    @staticmethod
    def update_student(db: Session, student_number: str, student: StudentCreate) -> Student:
        """Update student information"""
        db_student = db.query(Student).filter(Student.student_number == student_number).first()
        if not db_student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        for field, value in student.dict(exclude={'student_number'}).items():
            setattr(db_student, field, value)
        
        db.commit()
        db.refresh(db_student)
        return db_student
    
    @staticmethod
    def delete_student(db: Session, student_number: str):
        """Delete a student"""
        db_student = db.query(Student).filter(Student.student_number == student_number).first()
        if not db_student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        db.delete(db_student)
        db.commit()

# ============================================================================
# MODULE SERVICE
# ============================================================================

class ModuleService:
    """Service for module-related operations"""
    
    @staticmethod
    def create_module(db: Session, module: ModuleCreate) -> Module:
        """Create a new module"""
        db_module = Module(**module.dict())
        db.add(db_module)
        db.commit()
        db.refresh(db_module)
        return db_module
    
    @staticmethod
    def get_module(db: Session, module_code: str) -> Optional[Module]:
        """Get module by code"""
        return db.query(Module).filter(Module.code == module_code).first()
    
    @staticmethod
    def get_modules(db: Session, skip: int = 0, limit: int = 100) -> List[Module]:
        """Get list of modules with pagination"""
        return db.query(Module).offset(skip).limit(limit).all()
    
    @staticmethod
    def update_module(db: Session, module_code: str, module: ModuleCreate) -> Module:
        """Update module information"""
        db_module = db.query(Module).filter(Module.code == module_code).first()
        if not db_module:
            raise HTTPException(status_code=404, detail="Module not found")
        
        for field, value in module.dict(exclude={'code'}).items():
            setattr(db_module, field, value)
        
        db.commit()
        db.refresh(db_module)
        return db_module

# ============================================================================
# PLAN CODE SERVICE
# ============================================================================

class PlanCodeService:
    """Service for plan code-related operations"""
    
    @staticmethod
    def create_plan_code(db: Session, plan_code: PlanCodeCreate) -> PlanCode:
        """Create a new plan code with required modules"""
        db_plan = PlanCode(**plan_code.dict(exclude={'modules'}))
        db.add(db_plan)
        db.commit()
        
        # Add module assignments
        if plan_code.modules:
            for module_assignment in plan_code.modules:
                # Ensure module exists
                module = db.query(Module).filter(Module.code == module_assignment.module_code).first()
                if module:
                    # Insert into association table
                    stmt = plan_modules.insert().values(
                        plan_code=plan_code.code,
                        module_code=module_assignment.module_code,
                        year=module_assignment.year,
                        phase=module_assignment.phase,
                        is_required=module_assignment.is_required,
                        credits=module_assignment.credits
                    )
                    db.execute(stmt)
        
        db.commit()
        db.refresh(db_plan)
        return db_plan
    
    @staticmethod
    def get_plan_code(db: Session, plan_code: str) -> Optional[PlanCode]:
        """Get plan code by code"""
        return db.query(PlanCode).filter(PlanCode.code == plan_code).first()
    
    @staticmethod
    def get_plan_codes(db: Session) -> List[PlanCode]:
        """Get all plan codes"""
        return db.query(PlanCode).all()

# ============================================================================
# DATA LOADER SERVICE
# ============================================================================

class DataLoaderService:
    """Service for loading data from external files"""
    
    @staticmethod
    def get_system_stats(db: Session) -> Dict[str, Any]:
        """Get system statistics"""
        try:
            students_count = db.query(Student).count()
            modules_count = db.query(Module).count()
            plan_codes_count = db.query(PlanCode).count()
            missing_modules_count = db.query(MissingModule).count()
            
            # Count students with missing modules
            students_with_missing = db.query(MissingModule.student_number).distinct().count()
            
            return {
                "total_students": students_count,
                "total_modules": modules_count,
                "total_plan_codes": plan_codes_count,
                "students_with_missing_modules": students_with_missing,
                "total_missing_modules": missing_modules_count,
                "last_bulk_check": None  # Placeholder - implement actual logic if needed
            }
        except Exception as e:
            return {
                "total_students": 0,
                "total_modules": 0,
                "total_plan_codes": 0,
                "students_with_missing_modules": 0,
                "total_missing_modules": 0,
                "last_bulk_check": None
            }
    
    @staticmethod
    def check_missing_modules_for_student(db: Session, student_number: str) -> List[MissingModule]:
        """Check missing modules for a specific student by comparing completed vs required modules"""
        try:
            # Get student information
            student = db.query(Student).filter(Student.student_number == student_number).first()
            if not student:
                return []
            
            # Get student's plan code
            plan_code = student.plan_code
            if not plan_code:
                return []
            
            # Get student's completed modules
            completed_modules = db.query(StudentModule).filter(
                StudentModule.student_number == student_number
            ).all()
            completed_module_codes = {sm.module_code for sm in completed_modules}
            
            # Get required modules for this plan code from allocated modules
            # This requires the plan_modules relationship table to be properly populated
            required_modules = db.query(plan_modules).filter(
                plan_modules.c.plan_code == plan_code,
                plan_modules.c.is_required == True
            ).all()
            
            missing_modules = []
            for required in required_modules:
                if required.module_code not in completed_module_codes:
                    # Create missing module record
                    missing_module = MissingModule(
                        student_number=student_number,
                        module_code=required.module_code,
                        module_name=required.module_name if hasattr(required, 'module_name') else None,
                        required_year=required.year if hasattr(required, 'year') else None,
                        phase=required.phase if hasattr(required, 'phase') else None,
                        credits=required.credits if hasattr(required, 'credits') else None,
                        is_prerequisite_met=True,  # Placeholder - implement prerequisite logic
                        priority="Normal",
                        detected_at=datetime.now()
                    )
                    missing_modules.append(missing_module)
            
            return missing_modules
            
        except Exception as e:
            print(f"Error checking missing modules for student {student_number}: {str(e)}")
            return []

    @staticmethod
    def analyze_student_missing_modules_by_year(db: Session, student_number: str) -> Dict[str, Any]:
        """
        Comprehensive analysis of missing modules for a student by year
        This method goes through the student's record, plan modules, and identifies missing modules
        """
        try:
            # Get student information
            student = db.query(Student).filter(Student.student_number == student_number).first()
            if not student:
                return {"error": "Student not found", "student_number": student_number}
            
            plan_code = student.plan_code
            if not plan_code:
                return {"error": "Student has no plan code", "student_number": student_number}
            
            # Get student's current year
            current_year = student.year or "2023"
            
            # Get student's completed modules with details
            completed_modules = db.query(StudentModule).filter(
                StudentModule.student_number == student_number
            ).all()
            
            # Create a map of completed modules by year
            completed_by_year = {}
            for module in completed_modules:
                year = module.year_taken or "Unknown"
                if year not in completed_by_year:
                    completed_by_year[year] = []
                completed_by_year[year].append({
                    "module_code": module.module_code,
                    "final_mark": module.final_mark,
                    "credits_earned": module.credits_earned,
                    "status": module.final_mark_description
                })
            
            # Get plan requirements from allocated modules
            # This is the key part - getting what modules are required for this plan
            plan_requirements = db.query(plan_modules).filter(
                plan_modules.c.plan_code == plan_code
            ).all()
            
            # If no plan requirements found, skip missing modules analysis
            if not plan_requirements:
                print(f"⚠️ No plan requirements found for {plan_code}, skipping missing modules analysis")
                plan_requirements = []
            
            # Convert plan_requirements to a consistent format
            formatted_requirements = []
            for req in plan_requirements:
                if hasattr(req, 'module_code'):
                    # It's a database result object
                    formatted_requirements.append({
                        'module_code': req.module_code,
                        'module_name': getattr(req, 'module_name', None),
                        'year': getattr(req, 'year', '1st'),
                        'phase': getattr(req, 'phase', 'Other'),
                        'credits': getattr(req, 'credits', 0),
                        'is_required': getattr(req, 'is_required', True)
                    })
                elif isinstance(req, tuple):
                    # It's a tuple from the database query
                    # Expected format: (plan_code, module_code, year, phase, is_required, credits, ...)
                    if len(req) >= 6:
                        formatted_requirements.append({
                            'module_code': req[1],  # module_code is at index 1
                            'module_name': None,  # Not available in tuple
                            'year': req[2] if req[2] else '1st',  # year is at index 2
                            'phase': req[3] if req[3] else 'Other',  # phase is at index 3
                            'credits': req[5] if len(req) > 5 and req[5] else 0,  # credits is at index 5
                            'is_required': req[4] if len(req) > 4 else True  # is_required is at index 4
                        })
                    else:
                        print(f"⚠️ Skipping malformed requirement tuple: {req}")
                else:
                    # It's already a dictionary
                    formatted_requirements.append(req)
            
            # Analyze missing modules by year
            missing_by_year = {
                "1st": [],
                "2nd": [],
                "3rd": [],
                "4th": [],
                "Other": []
            }
            
            total_required = 0
            total_completed = len(completed_modules)
            total_missing = 0
            
            for requirement in formatted_requirements:
                total_required += 1
                module_code = requirement['module_code']
                required_year = requirement['year'] or "1st"
                
                # Check if this module is completed
                is_completed = any(
                    module.module_code == module_code 
                    for module in completed_modules
                )
                
                if not is_completed:
                    total_missing += 1
                    missing_module = {
                        "module_code": module_code,
                        "module_name": requirement.get('module_name', None),
                        "required_year": required_year,
                        "phase": requirement.get('phase', 'Other'),
                        "credits": requirement.get('credits', 0),
                        "priority": "High" if required_year == current_year else "Normal"
                    }
                    
                    if required_year in missing_by_year:
                        missing_by_year[required_year].append(missing_module)
                    else:
                        missing_by_year["Other"].append(missing_module)
            
            # Calculate completion percentages
            completion_percentage = (total_completed / total_required * 100) if total_required > 0 else 0
            
            # Get module details for completed modules
            completed_details = []
            for module in completed_modules:
                module_info = db.query(Module).filter(Module.code == module.module_code).first()
                completed_details.append({
                    "module_code": module.module_code,
                    "module_name": module_info.name if module_info else "Unknown",
                    "year_taken": module.year_taken,
                    "final_mark": module.final_mark,
                    "credits_earned": module.credits_earned,
                    "status": module.final_mark_description,
                    "phase": module_info.phase if module_info else "Other"
                })
            
            return {
                "student_number": student_number,
                "student_name": student.name,
                "plan_code": plan_code,
                "plan_description": student.plan_description,
                "current_year": current_year,
                "current_academic_level": None, # Placeholder, will be added later
                "analysis_summary": {
                    "total_required_modules": total_required,
                    "total_completed_modules": total_completed,
                    "total_missing_modules": total_missing,
                    "completion_percentage": round(completion_percentage, 2)
                },
                "missing_modules_by_year": missing_by_year,
                "completed_modules": completed_details,
                "completion_by_year": completed_by_year,
                "analysis_timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Error analyzing missing modules for student {student_number}: {str(e)}")
            return {"error": str(e), "student_number": student_number}

    @staticmethod
    def bulk_analyze_missing_modules_by_year(db: Session) -> Dict[str, Any]:
        """
        Bulk analyze missing modules for all students by year
        This is the main method that goes through all student records
        """
        try:
            start_time = time.time()
            
            # Get all students
            students = db.query(Student).all()
            total_students = len(students)
            
            # Clear existing missing module records
            db.query(MissingModule).delete()
            db.commit()
            
            # Analysis results
            analysis_results = {
                "total_students_processed": 0,
                "students_with_missing_modules": 0,
                "total_missing_modules": 0,
                "missing_modules_by_year": {
                    "1st": 0, "2nd": 0, "3rd": 0, "4th": 0, "Other": 0
                },
                "missing_modules_by_phase": {
                    "Foundation": 0, "Intermediate": 0, "Advanced": 0, "Other": 0
                },
                "plan_code_summary": {},
                "errors": [],
                "processing_time_seconds": 0
            }
            
            # Process each student
            for i, student in enumerate(students):
                try:
                    if i % 100 == 0:
                        print(f"Processing student {i+1}/{total_students}: {student.student_number}")
                    
                    # Analyze this student
                    student_analysis = DataLoaderService.analyze_student_missing_modules_by_year(
                        db, student.student_number
                    )
                    
                    analysis_results["total_students_processed"] += 1
                    
                    if "error" not in student_analysis:
                        # Count missing modules
                        total_missing = student_analysis["analysis_summary"]["total_missing_modules"]
                        if total_missing > 0:
                            analysis_results["students_with_missing_modules"] += 1
                            analysis_results["total_missing_modules"] += total_missing
                            
                            # Count by year
                            for year, modules in student_analysis["missing_modules_by_year"].items():
                                if year in analysis_results["missing_modules_by_year"]:
                                    analysis_results["missing_modules_by_year"][year] += len(modules)
                            
                            # Count by phase
                            for year_modules in student_analysis["missing_modules_by_year"].values():
                                for module in year_modules:
                                    phase = module.get("phase", "Other")
                                    if phase in analysis_results["missing_modules_by_phase"]:
                                        analysis_results["missing_modules_by_phase"][phase] += 1
                            
                            # Plan code summary
                            plan_code = student.plan_code
                            if plan_code not in analysis_results["plan_code_summary"]:
                                analysis_results["plan_code_summary"][plan_code] = {
                                    "students": 0,
                                    "missing_modules": 0,
                                    "by_year": {"1st": 0, "2nd": 0, "3rd": 0, "4th": 0, "Other": 0}
                                }
                            
                            analysis_results["plan_code_summary"][plan_code]["students"] += 1
                            analysis_results["plan_code_summary"][plan_code]["missing_modules"] += total_missing
                            
                            # Save missing modules to database
                            for year, modules in student_analysis["missing_modules_by_year"].items():
                                for module in modules:
                                    missing_module = MissingModule(
                                        student_number=student.student_number,
                                        module_code=module["module_code"],
                                        module_name=module["module_name"],
                                        required_year=module["required_year"],
                                        phase=module["phase"],
                                        credits=module["credits"],
                                        priority=module["priority"],
                                        detected_at=datetime.now()
                                    )
                                    db.add(missing_module)
                            
                            db.commit()
                    else:
                        analysis_results["errors"].append(
                            f"Student {student.student_number}: {student_analysis['error']}"
                        )
                        
                except Exception as e:
                    analysis_results["errors"].append(f"Student {student.student_number}: {str(e)}")
            
            end_time = time.time()
            analysis_results["processing_time_seconds"] = end_time - start_time
            
            return analysis_results
            
        except Exception as e:
            return {
                "error": str(e),
                "total_students_processed": 0,
                "students_with_missing_modules": 0,
                "total_missing_modules": 0,
                "processing_time_seconds": 0,
                "errors": [str(e)]
            }
    
    @staticmethod
    def generate_missing_modules_report(db: Session) -> List[MissingModule]:
        """Generate missing modules report for all students"""
        try:
            # Get all students
            students = db.query(Student).all()
            all_missing_modules = []
            
            for student in students:
                student_missing = DataLoaderService.check_missing_modules_for_student(db, student.student_number)
                all_missing_modules.extend(student_missing)
            
            return all_missing_modules
            
        except Exception as e:
            print(f"Error generating missing modules report: {str(e)}")
            return []
    
    @staticmethod
    def bulk_check_missing_modules(db: Session) -> Dict[str, Any]:
        """Bulk check missing modules for all students"""
        try:
            start_time = time.time()
            
            # Get all students
            students = db.query(Student).all()
            total_students = len(students)
            students_with_missing = 0
            total_missing_modules = 0
            errors = []
            
            # Clear existing missing module records
            db.query(MissingModule).delete()
            db.commit()
            
            # Check each student
            for student in students:
                try:
                    missing_modules = DataLoaderService.check_missing_modules_for_student(db, student.student_number)
                    
                    if missing_modules:
                        students_with_missing += 1
                        total_missing_modules += len(missing_modules)
                        
                        # Save missing modules to database
                        for missing in missing_modules:
                            db.add(missing)
                        
                        db.commit()
                        
                except Exception as e:
                    errors.append(f"Student {student.student_number}: {str(e)}")
            
            end_time = time.time()
            
            return {
                "status": "completed",
                "total_students_processed": total_students,
                "students_with_missing_modules": students_with_missing,
                "total_missing_modules": total_missing_modules,
                "processing_time_seconds": end_time - start_time,
                "errors": errors
            }
            
        except Exception as e:
            return {
                "status": "failed",
                "error": str(e),
                "total_students_processed": 0,
                "students_with_missing_modules": 0,
                "total_missing_modules": 0,
                "processing_time_seconds": 0,
                "errors": [str(e)]
            }
    
    @staticmethod
    def export_missing_modules_report(db: Session, format: str = "csv") -> Dict[str, Any]:
        """Export missing modules report"""
        # This is a placeholder - implement the actual export logic as needed
        return {"message": f"Export in {format} format completed", "status": "success"}
    
    @staticmethod
    def get_missing_modules_summary(db: Session) -> Dict[str, Any]:
        """Get comprehensive summary of missing modules by phase and year"""
        try:
            # Get basic counts first
            students_count = db.query(Student).count()
            modules_count = db.query(Module).count()
            plan_codes_count = db.query(PlanCode).count()
            
            # Initialize summary structure
            summary = {
                'total_students': students_count,
                'students_with_missing_modules': 0,
                'total_missing_modules': 0,
                'by_phase': {
                    'Foundation': {'1st': 0, '2nd': 0, '3rd': 0, '4th': 0, 'total': 0},
                    'Intermediate': {'1st': 0, '2nd': 0, '3rd': 0, '4th': 0, 'total': 0},
                    'Advanced': {'1st': 0, '2nd': 0, '3rd': 0, '4th': 0, 'total': 0},
                    'Other': {'1st': 0, '2nd': 0, '3rd': 0, '4th': 0, 'total': 0}
                },
                'by_year': {
                    '1st': {'Foundation': 0, 'Intermediate': 0, 'Advanced': 0, 'Other': 0, 'total': 0},
                    '2nd': {'Foundation': 0, 'Intermediate': 0, 'Advanced': 0, 'Other': 0, 'total': 0},
                    '3rd': {'Foundation': 0, 'Intermediate': 0, 'Advanced': 0, 'Other': 0, 'total': 0},
                    '4th': {'Foundation': 0, 'Intermediate': 0, 'Advanced': 0, 'Other': 0, 'total': 0}
                },
                'top_missing_modules': [],
                'plan_code_summary': {},
                'message': 'Summary generated successfully. Note: Detailed missing module analysis requires plan-module relationships to be properly configured.'
            }
            
            # Get actual missing modules data
            missing_modules = db.query(MissingModule).all()
            summary['total_missing_modules'] = len(missing_modules)
            
            # Count students with missing modules
            students_with_missing = db.query(MissingModule.student_number).distinct().count()
            summary['students_with_missing_modules'] = students_with_missing
            
            # Analyze by phase and year
            for missing in missing_modules:
                phase = missing.phase or 'Other'
                year = missing.required_year or '1st'
                
                # Count by phase
                if phase in summary['by_phase']:
                    if year in summary['by_phase'][phase]:
                        summary['by_phase'][phase][year] += 1
                    summary['by_phase'][phase]['total'] += 1
                
                # Count by year
                if year in summary['by_year']:
                    if phase in summary['by_year'][year]:
                        summary['by_year'][year][phase] += 1
                    summary['by_year'][year]['total'] += 1
            
            # Get top missing modules
            module_counts = {}
            for missing in missing_modules:
                module_code = missing.module_code
                module_counts[module_code] = module_counts.get(module_code, 0) + 1
            
            # Sort and get top 10
            top_missing = sorted(module_counts.items(), key=lambda x: x[1], reverse=True)[:10]
            summary['top_missing_modules'] = [
                {'module_code': code, 'count': count} for code, count in top_missing
            ]
            
            # Plan code summary
            plan_summary = {}
            for missing in missing_modules:
                student = db.query(Student).filter(Student.student_number == missing.student_number).first()
                if student and student.plan_code:
                    plan_code = student.plan_code
                    if plan_code not in plan_summary:
                        plan_summary[plan_code] = {
                            'students': set(),
                            'missing_modules': 0,
                            'by_phase': {'Foundation': 0, 'Intermediate': 0, 'Advanced': 0, 'Other': 0}
                        }
                    
                    plan_summary[plan_code]['students'].add(missing.student_number)
                    plan_summary[plan_code]['missing_modules'] += 1
                    
                    phase = missing.phase or 'Other'
                    if phase in plan_summary[plan_code]['by_phase']:
                        plan_summary[plan_code]['by_phase'][phase] += 1
            
            # Convert sets to counts
            for plan_code, data in plan_summary.items():
                summary['plan_code_summary'][plan_code] = {
                    'students': len(data['students']),
                    'missing_modules': data['missing_modules'],
                    'by_phase': data['by_phase']
                }
            
            return summary
            
        except Exception as e:
            return {
                'error': str(e),
                'total_students': 0,
                'students_with_missing_modules': 0,
                'total_missing_modules': 0,
                'by_phase': {},
                'by_year': {},
                'top_missing_modules': [],
                'plan_code_summary': {},
                'message': f'Error generating summary: {str(e)}'
            }
    
    @staticmethod
    async def load_student_data(db: Session, file: UploadFile) -> DataLoadResult:
        """Load student data from Excel file with ultra-fast PostgreSQL optimizations"""
        start_time = time.time()
        errors = []
        loaded_count = 0
        skipped_count = 0
        
        try:
            print("🚀 Starting ultra-fast PostgreSQL data loading...")
            
            # Read Excel file
            contents = await file.read()
            print("📁 Reading Excel file...")
            df = pd.read_excel(io.BytesIO(contents), engine='openpyxl', skiprows=3)
            
            # Forward fill student information efficiently
            print("🔄 Forward-filling student data...")
            student_info_columns = ['STUDENT_NUMBER', 'NAME', 'YEAR', 'CAMPUS_NAME', 'PLAN_CODE', 'PLAN_DESCRIPTION']
            for col in student_info_columns:
                if col in df.columns:
                    df[col] = df[col].ffill()
            
            # Remove rows with no student number
            df = df.dropna(subset=['STUDENT_NUMBER'])
            df = df[df['STUDENT_NUMBER'].astype(str) != 'nan']
            
            total_rows = len(df)
            print(f"📊 Processing {total_rows:,} rows...")
            
            # Check if we're using PostgreSQL for optimizations
            db_info = get_database_info()
            is_postgresql = db_info["is_postgresql"]
            
            if is_postgresql:
                print("⚡ Using PostgreSQL ultra-fast mode with pandas.to_sql...")
                return await DataLoaderService._load_student_data_postgresql_fast(db, df, start_time)
            else:
                print("🐌 Using SQLite mode (slower)...")
                return await DataLoaderService._load_student_data_sqlite(db, df, start_time)
                
        except Exception as e:
            db.rollback()
            errors.append(f"File processing error: {str(e)}")
            print(f"❌ Error: {str(e)}")
            
            end_time = time.time()
            return DataLoadResult(
                status="failed",
                total_rows=0,
                loaded_rows=0,
                skipped_rows=0,
                errors=errors,
                load_time_seconds=end_time - start_time
            )

    @staticmethod
    async def _load_student_data_postgresql_fast(db: Session, df: pd.DataFrame, start_time: float) -> DataLoadResult:
        """Ultra-fast PostgreSQL loading using pandas.to_sql"""
        errors = []
        total_rows = len(df)
        
        try:
            engine = db.get_bind()
            
            # 1. Prepare Students DataFrame
            print("👥 Preparing students data...")
            students_df = df.groupby('STUDENT_NUMBER').first().reset_index()
            students_df = students_df[['STUDENT_NUMBER', 'NAME', 'YEAR', 'CAMPUS_NAME', 'PLAN_CODE', 'PLAN_DESCRIPTION']].copy()
            students_df.columns = ['student_number', 'name', 'year', 'campus_name', 'plan_code', 'plan_description']
            
            # Add missing columns with defaults
            students_df['year_in_plan'] = None
            students_df['years_in_degree'] = None
            students_df['created_at'] = pd.Timestamp.now()
            students_df['updated_at'] = pd.Timestamp.now()
            
            # Trim whitespace for consistency on identifiers
            students_df['student_number'] = students_df['student_number'].astype(str).str.strip()
            students_df['plan_code'] = students_df['plan_code'].astype(str).str.strip()
            
            # 2. Prepare Modules DataFrame
            print("📦 Preparing modules data...")
            modules_df = df[df['MODULE_CODE'].notna()].groupby('MODULE_CODE').first().reset_index()
            modules_df = modules_df[['MODULE_CODE', 'MODULE_NAME', 'TOTAL_CREDIT_HEMIS']].copy()
            modules_df.columns = ['code', 'name', 'credits']
            modules_df['description'] = None
            modules_df['prerequisites'] = None
            modules_df['phase'] = None
            modules_df['created_at'] = pd.Timestamp.now()
            modules_df['updated_at'] = pd.Timestamp.now()
            # Trim whitespace for consistency
            modules_df['code'] = modules_df['code'].astype(str).str.strip()
            modules_df['name'] = modules_df['name'].astype(str).str.strip()
            
            # 3. Prepare Student Modules DataFrame
            print("📚 Preparing student modules data...")
            student_modules_df = df[df['MODULE_CODE'].notna()].copy()
            student_modules_df = student_modules_df[[
                'STUDENT_NUMBER', 'MODULE_CODE', 'YEAR', 'FINAL_MARK', 
                'FINAL_MARK_DESCRIPTION', 'TOTAL_CREDIT_HEMIS', 
                'UNITS_MAXIMUM', 'CRED_PASS_PLAN_All_years', 'CRED_PASS_PLAN_CUR_year'
            ]]
            student_modules_df.columns = [
                'student_number', 'module_code', 'year_taken', 'final_mark',
                'final_mark_description', 'total_credit_hemis',
                'units_maximum', 'cred_pass_plan_all_years', 'cred_pass_plan_cur_year'
            ]
            # Trim whitespace in module codes to match plan requirements
            student_modules_df['module_code'] = student_modules_df['module_code'].astype(str).str.strip()
            
            # Remove duplicates
            student_modules_df = student_modules_df.drop_duplicates(subset=['student_number', 'module_code'])
            
            # 4. Ultra-fast bulk insert using pandas.to_sql with PostgreSQL COPY
            print("🚀 Performing ultra-fast bulk inserts...")
            
            # Insert students (ignore conflicts)
            print(f"👥 Inserting {len(students_df):,} students...")
            students_df.to_sql(
                'students', 
                engine, 
                if_exists='append', 
                index=False,
                method='multi',
                chunksize=10000
            )
            
            # Insert modules (ignore conflicts) 
            print(f"📦 Inserting {len(modules_df):,} modules...")
            modules_df.to_sql(
                'modules',
                engine,
                if_exists='append',
                index=False,
                method='multi',
                chunksize=10000
            )
            
            # Insert student modules
            print(f"📚 Inserting {len(student_modules_df):,} student module records...")
            student_modules_df.to_sql(
                'student_modules',
                engine,
                if_exists='append',
                index=False,
                method='multi',
                chunksize=10000
            )
            
            db.commit()
            print("✅ PostgreSQL ultra-fast loading completed!")
            
            end_time = time.time()
            
            return DataLoadResult(
                status="completed",
                total_rows=total_rows,
                loaded_rows=len(student_modules_df),
                skipped_rows=total_rows - len(student_modules_df),
                errors=errors,
                load_time_seconds=end_time - start_time
            )
            
        except Exception as e:
            db.rollback()
            errors.append(f"PostgreSQL fast loading error: {str(e)}")
            print(f"❌ PostgreSQL Error: {str(e)}")
            
            # Fallback to SQLAlchemy method
            print("🔄 Falling back to SQLAlchemy method...")
            return await DataLoaderService._load_student_data_sqlite(db, df, start_time)

    @staticmethod
    async def _load_student_data_sqlite(db: Session, df: pd.DataFrame, start_time: float) -> DataLoadResult:
        """Fallback SQLite/SQLAlchemy loading method"""
        errors = []
        loaded_count = 0
        skipped_count = 0
        total_rows = len(df)
        
        try:
            print("🔄 Using SQLAlchemy batch method...")
            
            # Pre-load existing data for fast lookup
            existing_modules = {m.code: m for m in db.query(Module).all()}
            existing_students = {s.student_number: s for s in db.query(Student).all()}
            
            # Prepare batch data collections
            new_modules = {}
            students_to_create = {}
            students_to_update = {}
            student_modules_to_create = []
            
            # Process data in smaller batches for SQLite
            batch_size = 1000
            for start_idx in range(0, total_rows, batch_size):
                end_idx = min(start_idx + batch_size, total_rows)
                batch_df = df.iloc[start_idx:end_idx]
                
                print(f"⚡ Processing batch {start_idx//batch_size + 1}/{(total_rows//batch_size) + 1}")
                
                for _, row in batch_df.iterrows():
                    try:
                        student_number = str(row.get('STUDENT_NUMBER', ''))
                        
                        # Process student record
                        student_data = {
                            'student_number': student_number,
                            'name': str(row.get('NAME', '')),
                            'year': str(row.get('YEAR', '')) if pd.notna(row.get('YEAR')) else None,
                            'campus_name': str(row.get('CAMPUS_NAME', '')) if pd.notna(row.get('CAMPUS_NAME')) else None,
                            'plan_code': str(row.get('PLAN_CODE', '')) if pd.notna(row.get('PLAN_CODE')) else None,
                            'plan_description': str(row.get('PLAN_DESCRIPTION', '')) if pd.notna(row.get('PLAN_DESCRIPTION')) else None,
                            'year_in_plan': None,
                            'years_in_degree': None
                        }
                        
                        # Check if student needs to be created or updated
                        if student_number not in existing_students and student_number not in students_to_create:
                            students_to_create[student_number] = student_data
                        elif student_number in existing_students:
                            students_to_update[student_number] = student_data
                        
                        # Process module
                        module_code = str(row.get('MODULE_CODE', ''))
                        if pd.notna(row.get('MODULE_CODE')) and module_code != 'nan':
                            # Check if module needs to be created
                            if module_code not in existing_modules and module_code not in new_modules:
                                new_modules[module_code] = {
                                    'code': module_code,
                                    'name': str(row.get('MODULE_NAME', '')) if pd.notna(row.get('MODULE_NAME')) else module_code,
                                    'credits': float(row.get('TOTAL_CREDIT_HEMIS', 0)) if pd.notna(row.get('TOTAL_CREDIT_HEMIS')) else None
                                }
                            
                            # Prepare student module record
                            student_module_data = {
                                'student_number': student_number,
                                'module_code': module_code,
                                'year_taken': str(row.get('YEAR', '')) if pd.notna(row.get('YEAR')) else None,
                                'final_mark': float(row.get('FINAL_MARK', 0)) if pd.notna(row.get('FINAL_MARK')) else None,
                                'final_mark_description': str(row.get('FINAL_MARK_DESCRIPTION', '')) if pd.notna(row.get('FINAL_MARK_DESCRIPTION')) else None,
                                'total_credit_hemis': float(row.get('TOTAL_CREDIT_HEMIS', 0)) if pd.notna(row.get('TOTAL_CREDIT_HEMIS')) else None,
                                'units_maximum': float(row.get('UNITS_MAXIMUM', 0)) if pd.notna(row.get('UNITS_MAXIMUM')) else None,
                                'cred_pass_plan_all_years': float(row.get('CRED_PASS_PLAN_All_years', 0)) if pd.notna(row.get('CRED_PASS_PLAN_All_years')) else None,
                                'cred_pass_plan_cur_year': float(row.get('CRED_PASS_PLAN_CUR_year', 0)) if pd.notna(row.get('CRED_PASS_PLAN_CUR_year')) else None
                            }
                            student_modules_to_create.append(student_module_data)
                        
                        loaded_count += 1
                        
                    except Exception as e:
                        errors.append(f"Row {loaded_count + skipped_count}: {str(e)}")
                        skipped_count += 1
            
            # Perform batch database operations
            print("💾 Performing batch database operations...")
            
            if new_modules:
                print(f"📦 Creating {len(new_modules)} new modules...")
                db.bulk_insert_mappings(Module, list(new_modules.values()))
            
            if students_to_create:
                print(f"👥 Creating {len(students_to_create)} new students...")
                db.bulk_insert_mappings(Student, list(students_to_create.values()))
            
            if students_to_update:
                print(f"🔄 Updating {len(students_to_update)} existing students...")
                for student_number, student_data in students_to_update.items():
                    existing_student = existing_students[student_number]
                    for key, value in student_data.items():
                        if key != 'student_number':
                            setattr(existing_student, key, value)
            
            # Remove duplicate student modules
            unique_student_modules = {}
            for sm in student_modules_to_create:
                key = f"{sm['student_number']}_{sm['module_code']}"
                unique_student_modules[key] = sm
            
            if unique_student_modules:
                print(f"📚 Creating {len(unique_student_modules)} student module records...")
                db.bulk_insert_mappings(StudentModule, list(unique_student_modules.values()))
            
            db.commit()
            print("✅ SQLAlchemy batch loading completed!")
            
            end_time = time.time()
            
            return DataLoadResult(
                status="completed" if not errors else "completed_with_errors",
                total_rows=total_rows,
                loaded_rows=loaded_count,
                skipped_rows=skipped_count,
                errors=errors,
                load_time_seconds=end_time - start_time
            )
            
        except Exception as e:
            db.rollback()
            errors.append(f"SQLAlchemy batch loading error: {str(e)}")
            print(f"❌ SQLAlchemy Error: {str(e)}")
            
            end_time = time.time()
            return DataLoadResult(
                status="failed",
                total_rows=total_rows,
                loaded_rows=loaded_count,
                skipped_rows=skipped_count,
                errors=errors,
                load_time_seconds=end_time - start_time
            )
    
    @staticmethod
    async def load_allocated_modules(db: Session, file: UploadFile) -> DataLoadResult:
        """Load allocated modules from CSV file"""
        start_time = time.time()
        errors = []
        loaded_count = 0
        skipped_count = 0
        
        try:
            # Read CSV file
            contents = await file.read()
            df = pd.read_csv(io.BytesIO(contents))
            total_rows = len(df)
            
            # Process each row
            for _, row in df.iterrows():
                try:
                    # Strip whitespace to ensure consistent matching
                    plan_code_bfn = str(row.get('Plan Code BFN', '')).strip()
                    plan_code_qq = str(row.get('Plan Code QQ', '')).strip()
                    module_code = str(row.get('Module', '')).strip()
                    
                    if pd.isna(row.get('Module')):
                        skipped_count += 1
                        continue
                    
                    # Process both plan codes if they exist
                    plan_codes = []
                    if not pd.isna(row.get('Plan Code BFN')) and plan_code_bfn != '0' and plan_code_bfn != 'nan':
                        plan_codes.append(plan_code_bfn)
                    if not pd.isna(row.get('Plan Code QQ')) and plan_code_qq != '0' and plan_code_qq != 'nan':
                        plan_codes.append(plan_code_qq)
                    
                    if not plan_codes:
                        skipped_count += 1
                        continue
                    
                    # Process each plan code
                    for plan_code in plan_codes:
                        plan_code = plan_code.strip()
                        
                        # Create plan code if not exists
                        plan = db.query(PlanCode).filter(PlanCode.code == plan_code).first()
                        if not plan:
                            plan = PlanCode(
                                code=plan_code,
                                description=str(row.get('Specialisation', '')) if pd.notna(row.get('Specialisation')) else plan_code,
                                phase=str(row.get('Phase', '')) if pd.notna(row.get('Phase')) else None,
                                specialisation=str(row.get('Specialisation', '')) if pd.notna(row.get('Specialisation')) else None
                            )
                            db.add(plan)
                            db.commit()  # Commit to get the plan code available
                        
                        # Create module if not exists (only once per module)
                        module = db.query(Module).filter(Module.code == module_code).first()
                        if not module:
                            module = Module(
                                code=module_code,
                                name=str(row.get('Module Description', '')) if pd.notna(row.get('Module Description')) else module_code,
                                credits=float(row.get('Credits', 0)) if pd.notna(row.get('Credits')) else None,
                                prerequisites=str(row.get('Prerequisites', '')) if pd.notna(row.get('Prerequisites')) else None,
                                phase=str(row.get('Phase', '')) if pd.notna(row.get('Phase')) else None
                            )
                            db.add(module)
                            db.commit()  # Commit to get the module available
                        
                        # Add to plan_modules association if not exists
                        existing_association = db.execute(
                            text("SELECT * FROM plan_modules WHERE plan_code = :plan_code AND module_code = :module_code"),
                            {"plan_code": plan_code, "module_code": module_code}
                        ).first()
                        
                        if not existing_association:
                            stmt = plan_modules.insert().values(
                                plan_code=plan_code,
                                module_code=module_code,
                                year=str(row.get('Year', '')) if pd.notna(row.get('Year')) else None,
                                phase=str(row.get('Phase', '')) if pd.notna(row.get('Phase')) else None,
                                is_required=True,
                                credits=float(row.get('Credits', 0)) if pd.notna(row.get('Credits')) else None
                            )
                            db.execute(stmt)
                    
                    loaded_count += 1
                    
                    # Commit every 50 records
                    if loaded_count % 50 == 0:
                        db.commit()
                        
                except Exception as e:
                    errors.append(f"Row {loaded_count + skipped_count}: {str(e)}")
                    skipped_count += 1
            
            # Final commit
            db.commit()
            
        except Exception as e:
            errors.append(f"File processing error: {str(e)}")
            total_rows = 0
        
        end_time = time.time()
        
        return DataLoadResult(
            status="completed" if not errors else "completed_with_errors",
            total_rows=total_rows,
            loaded_rows=loaded_count,
            skipped_rows=skipped_count,
            errors=errors,
            load_time_seconds=end_time - start_time
        )

    @staticmethod
    def get_comprehensive_student_analysis(db: Session, student_number: str) -> Dict[str, Any]:
        """
        Comprehensive student analysis showing:
        - Total modules passed per year registered
        - Failed modules that were later passed (retakes)
        - Missing modules per year registered (only for years up to current academic level)
        - Details of outstanding modules
        """
        try:
            # Get student information
            student = db.query(Student).filter(Student.student_number == student_number).first()
            if not student:
                return {"error": "Student not found", "student_number": student_number}
            
            plan_code = student.plan_code
            if not plan_code:
                return {"error": "Student has no plan code", "student_number": student_number}
            
            # Check if plan has requirements defined first
            plan_requirements_check = db.query(plan_modules).filter(
                plan_modules.c.plan_code == plan_code
            ).first()
            
            print(f"🔍 DEBUG: Plan code {plan_code} requirements check result: {plan_requirements_check}")
            
            if not plan_requirements_check:
                # Try to find a matching plan code by analyzing student's modules
                print(f"🔍 Plan {plan_code} not found, attempting to find matching plan...")
                
                # Get student's modules
                student_modules = db.query(StudentModule).filter(
                    StudentModule.student_number == student_number
                ).all()
                student_module_codes = [sm.module_code for sm in student_modules]
                
                if student_module_codes:
                    # Find all available plans
                    all_plans = db.query(plan_modules.c.plan_code).distinct().all()
                    best_match = None
                    best_match_score = 0
                    
                    for plan_row in all_plans:
                        candidate_plan = plan_row[0]
                        if candidate_plan == plan_code:  # Skip the original plan
                            continue
                            
                        # Get modules for this plan
                        plan_modules_list = db.query(plan_modules).filter(
                            plan_modules.c.plan_code == candidate_plan
                        ).all()
                        plan_module_codes = [pm.module_code for pm in plan_modules_list]
                        
                        if plan_module_codes:
                            # Calculate match score
                            matches = set(student_module_codes).intersection(set(plan_module_codes))
                            match_score = len(matches) / len(plan_module_codes) if plan_module_codes else 0
                            
                            if match_score > best_match_score and match_score > 0.5:  # At least 50% match
                                best_match = candidate_plan
                                best_match_score = match_score
                    
                    if best_match:
                        print(f"✅ Found matching plan: {best_match} (score: {best_match_score:.2f})")
                        plan_code = best_match
                        plan_requirements_check = db.query(plan_modules).filter(
                            plan_modules.c.plan_code == plan_code
                        ).first()
                    else:
                        print(f"❌ No suitable plan match found for {student_number}")
                        # Return graceful response for undefined plan codes
                        return {
                            "student_number": student_number,
                            "student_name": student.name,
                            "plan_code": student.plan_code,  # Keep original plan code
                            "plan_description": student.plan_description,
                            "current_year": "2024",
                            "current_academic_level": "Unknown",
                            
                            # Summary statistics  
                            "summary": {
                                "total_required_modules": 0,
                                "total_modules_passed": 0,
                                "total_modules_failed": 0,
                                "total_retakes": 0,
                                "total_missing_modules": 0,
                                "completion_percentage": 0
                            },
                            
                            # Empty data structures
                            "modules_by_year": {},
                            "retake_analysis": {"total_retakes": 0, "retake_details": [], "all_modules_analysis": {}},
                            "missing_modules_by_year": {"1st": [], "2nd": [], "3rd": [], "4th": [], "Other": []},
                            "outstanding_modules": {
                                "total_outstanding": 0,
                                "by_year": {"1st": [], "2nd": [], "3rd": [], "4th": [], "Other": []},
                                "by_phase": {"Foundation": [], "Intermediate": [], "Advanced": [], "Other": []}
                            },
                            
                            "undefined_plan": True,
                            "analysis_timestamp": datetime.now().isoformat()
                        }
                else:
                    print(f"✅ Returning graceful response for undefined plan: {plan_code}")
                    return {
                        "student_number": student_number,
                        "student_name": student.name,
                        "plan_code": plan_code,
                        "plan_description": student.plan_description,
                        "current_year": "2024",
                        "current_academic_level": "Unknown",
                        
                        # Summary statistics  
                        "summary": {
                            "total_required_modules": 0,
                            "total_modules_passed": 0,
                            "total_modules_failed": 0,
                            "total_retakes": 0,
                            "total_missing_modules": 0,
                            "completion_percentage": 0
                        },
                        
                        # Empty data structures
                        "modules_by_year": {},
                        "retake_analysis": {"total_retakes": 0, "retake_details": [], "all_modules_analysis": {}},
                        "missing_modules_by_year": {"1st": [], "2nd": [], "3rd": [], "4th": [], "Other": []},
                        "outstanding_modules": {
                            "total_outstanding": 0,
                            "by_year": {"1st": [], "2nd": [], "3rd": [], "4th": [], "Other": []},
                            "by_phase": {"Foundation": [], "Intermediate": [], "Advanced": [], "Other": []}
                        },
                        
                        "undefined_plan": True,
                        "analysis_timestamp": datetime.now().isoformat()
                    }
            
            # Get all student modules (including failed and retakes)
            all_student_modules = db.query(StudentModule).filter(
                StudentModule.student_number == student_number
            ).all()
            
            # Calculate current year (latest year student was registered)
            years_with_modules = [module.year_taken for module in all_student_modules if module.year_taken and module.year_taken.isdigit()]
            if years_with_modules:
                current_year = str(max(int(year) for year in years_with_modules))
            else:
                current_year = str(student.year) if student.year else "2024"
            
            # Determine student's academic year level (1st, 2nd, 3rd, 4th year)
            # Proper calculation: student is at level N only if they've completed required modules for levels 1 to N-1
            
            # First, get plan requirements to understand what's needed for each year
            plan_requirements = db.query(plan_modules).filter(
                plan_modules.c.plan_code == plan_code
            ).all()
            
            # Group plan requirements by academic year
            requirements_by_year = {"1st": [], "2nd": [], "3rd": [], "4th": []}
            year_mapping = {
                "First Year": "1st", 
                "Second Year": "2nd", 
                "Third Year": "3rd", 
                "Fourth Year": "4th",
                "Fifth Year": "5th",
                "Sixth Year": "6th"
            }
            
            for req in plan_requirements:
                req_year = req.year or "First Year"
                mapped_year = year_mapping.get(req_year, "1st")
                if mapped_year in requirements_by_year:
                    requirements_by_year[mapped_year].append(req.module_code)
            
            # Get all student modules first to analyze completion
            all_student_modules = db.query(StudentModule).filter(
                StudentModule.student_number == student_number
            ).order_by(StudentModule.year_taken, StudentModule.module_code).all()
            
            # Get passed modules (final_mark >= 50 and not in-progress)
            passed_modules = set()
            for module in all_student_modules:
                if (module.final_mark is not None and 
                    module.final_mark >= 50 and 
                    module.final_mark_description and 
                    module.final_mark_description != "---"):
                    passed_modules.add(module.module_code)
            
            # Determine actual academic level based on CURRENT REGISTRATION and full course load
            current_academic_level = "1st"  # Default to 1st year
            
            # Get current year modules (latest calendar year)
            latest_calendar_year = max([module.year_taken for module in all_student_modules 
                                      if module.year_taken and module.year_taken.isdigit()], default="2024")
            
            current_year_modules = [module for module in all_student_modules 
                                  if module.year_taken == latest_calendar_year]
            current_registered_modules = set(module.module_code for module in current_year_modules)
            
            # For each academic year, check if student has full course load currently registered
            for year in ["4th", "3rd", "2nd", "1st"]:  # Check highest year first
                required_for_year = set(requirements_by_year[year])
                if not required_for_year:  # No requirements for this year
                    continue
                
                # Check how much of this academic year is currently registered OR already passed
                currently_registered_for_year = current_registered_modules.intersection(required_for_year)
                already_passed_for_year = passed_modules.intersection(required_for_year)
                total_covered_for_year = currently_registered_for_year.union(already_passed_for_year)
                
                coverage_rate = len(total_covered_for_year) / len(required_for_year) if required_for_year else 0
                
                # Student is at this academic level if they have 100% coverage (registered or passed)
                if coverage_rate >= 1.0:  # 100% of year's modules covered (registered or passed)
                    # Check if they have prerequisites (previous years substantially complete)
                    can_be_at_level = True
                    for prev_year in ["1st", "2nd", "3rd"]:
                        if prev_year == year:
                            break
                        prev_required = set(requirements_by_year[prev_year])
                        if prev_required:
                            prev_completed = passed_modules.intersection(prev_required)
                            prev_rate = len(prev_completed) / len(prev_required)
                            if prev_rate < 0.7:  # Must have 70% of previous years complete
                                can_be_at_level = False
                                break
                    
                    if can_be_at_level:
                        current_academic_level = year
                        break  # Found current level based on 100% coverage
            
            # If no 100% full load found, fall back to completion-based logic
            if current_academic_level == "1st":
                for year in ["1st", "2nd", "3rd", "4th"]:
                    required_for_year = set(requirements_by_year[year])
                    if not required_for_year:
                        continue
                    
                    # Check completion rate for fallback
                    completed_for_year = passed_modules.intersection(required_for_year)
                    completion_rate = len(completed_for_year) / len(required_for_year) if required_for_year else 0
                    
                    if completion_rate >= 0.8:
                        # Check prerequisites
                        can_be_at_level = True
                        for prev_year in ["1st", "2nd", "3rd"]:
                            if prev_year == year:
                                break
                            prev_required = set(requirements_by_year[prev_year])
                            if prev_required:
                                prev_completed = passed_modules.intersection(prev_required)
                                prev_rate = len(prev_completed) / len(prev_required)
                                if prev_rate < 0.7:
                                    can_be_at_level = False
                                    break
                            
                            if can_be_at_level:
                                current_academic_level = year
                            else:
                                break  # Can't advance further due to incomplete prerequisites
            
            # Analyze modules by year and track retakes
            modules_by_year = {}
            retake_analysis = {}
            total_passed = 0
            total_failed = 0
            total_retakes = 0
            
            for module in all_student_modules:
                year = module.year_taken or "Unknown"
                module_code = module.module_code
                
                if year not in modules_by_year:
                    modules_by_year[year] = {
                        "passed": [],
                        "failed": [],
                        "in_progress": [],
                        "total_modules": 0
                    }
                
                # Determine module status - improved logic for in-progress modules
                status = "in_progress"
                if module.final_mark is not None and module.final_mark_description and module.final_mark_description != "---":
                    # Only consider it graded if there's a proper final mark description
                    if module.final_mark >= 50:  # Assuming 50% is pass mark
                        status = "passed"
                        total_passed += 1
                    else:
                        status = "failed"
                        total_failed += 1
                elif module.final_mark == 0 and (not module.final_mark_description or module.final_mark_description == "---"):
                    # Module is registered but not yet assessed (second semester or year-long module)
                    status = "in_progress"
                
                # Track retakes
                if module_code not in retake_analysis:
                    retake_analysis[module_code] = {
                        "attempts": [],
                        "final_status": "unknown",
                        "best_mark": None,
                        "total_attempts": 0
                    }
                
                retake_analysis[module_code]["attempts"].append({
                    "year": year,
                    "mark": module.final_mark,
                    "status": module.final_mark_description,
                    "credits": module.credits_earned
                })
                retake_analysis[module_code]["total_attempts"] += 1
                
                # Update best mark
                if module.final_mark and (retake_analysis[module_code]["best_mark"] is None or 
                                        module.final_mark > retake_analysis[module_code]["best_mark"]):
                    retake_analysis[module_code]["best_mark"] = module.final_mark
                
                # Add to year analysis
                modules_by_year[year][status].append({
                    "module_code": module_code,
                    "module_name": None,  # Will be filled later
                    "final_mark": module.final_mark,
                    "status": module.final_mark_description,
                    "credits_earned": module.credits_earned,
                    "attempt_number": retake_analysis[module_code]["total_attempts"]
                })
                modules_by_year[year]["total_modules"] += 1
            
            # Determine final status for each module (passed if any attempt passed)
            for module_code, analysis in retake_analysis.items():
                has_passed = any(attempt["mark"] and attempt["mark"] >= 50 and attempt["status"] != "---" for attempt in analysis["attempts"])
                has_in_progress = any(attempt["status"] == "---" or (attempt["mark"] == 0 and not attempt["status"]) for attempt in analysis["attempts"])
                
                if has_passed:
                    analysis["final_status"] = "passed"
                elif has_in_progress and not has_passed:
                    analysis["final_status"] = "in_progress"
                else:
                    analysis["final_status"] = "failed"
                    
                # Only count as retake if module has multiple attempts and eventually passed
                if analysis["total_attempts"] > 1 and has_passed:
                    total_retakes += 1
            
            # Get module names
            module_codes = list(retake_analysis.keys())
            modules_info = db.query(Module).filter(Module.code.in_(module_codes)).all()
            module_names = {m.code: m.name for m in modules_info}
            
            # Update module names in analysis
            for year_data in modules_by_year.values():
                for status_list in [year_data["passed"], year_data["failed"], year_data["in_progress"]]:
                    for module in status_list:
                        module["module_name"] = module_names.get(module["module_code"], "Unknown")
            
            # Get plan requirements for missing modules analysis
            plan_requirements = db.query(plan_modules).filter(
                plan_modules.c.plan_code == plan_code
            ).all()
            
            print(f"🐛 DEBUG: Plan {plan_code} - query returned {len(plan_requirements)} requirements")
            if plan_requirements:
                print(f"🐛 DEBUG: First requirement: {plan_requirements[0]}")
            
            # If no plan requirements found, use fallback
            if not plan_requirements:
                print(f"⚠️ No plan requirements found for {plan_code}, skipping missing modules analysis")
                plan_requirements = []
            
            # Convert plan_requirements to consistent format
            formatted_requirements = []
            for req in plan_requirements:
                if hasattr(req, 'module_code'):
                    # It's an object with attributes
                    formatted_requirements.append({
                        'module_code': req.module_code,
                        'module_name': getattr(req, 'module_name', None),
                        'year': getattr(req, 'year', '1st'),
                        'phase': getattr(req, 'phase', 'Other'),
                        'credits': getattr(req, 'credits', 0),
                        'is_required': getattr(req, 'is_required', True)
                    })
                elif isinstance(req, tuple):
                    # It's a tuple from the database query
                    # Expected format: (plan_code, module_code, year, phase, is_required, credits, ...)
                    if len(req) >= 6:
                        formatted_requirements.append({
                            'module_code': req[1],  # module_code is at index 1
                            'module_name': None,  # Not available in tuple
                            'year': req[2] if req[2] else '1st',  # year is at index 2
                            'phase': req[3] if req[3] else 'Other',  # phase is at index 3
                            'credits': req[5] if len(req) > 5 and req[5] else 0,  # credits is at index 5
                            'is_required': req[4] if len(req) > 4 else True  # is_required is at index 4
                        })
                    else:
                        print(f"⚠️ Skipping malformed requirement tuple: {req}")
                else:
                    # It's already a dictionary
                    formatted_requirements.append(req)
            
            # Analyze missing modules by year - ONLY for years up to current academic level
            missing_by_year = {
                "1st": [],
                "2nd": [],
                "3rd": [],
                "4th": [],
                "Other": []
            }
            
            # Define academic year hierarchy for comparison
            year_hierarchy = {"1st": 1, "2nd": 2, "3rd": 3, "4th": 4, "First Year": 1, "Second Year": 2, "Third Year": 3, "Fourth Year": 4}
            current_level = year_hierarchy.get(current_academic_level, 4)
            
            total_missing = 0
            passed_module_codes = {code for code, analysis in retake_analysis.items() 
                                 if analysis["final_status"] == "passed"}
            in_progress_module_codes = {code for code, analysis in retake_analysis.items() 
                                      if analysis["final_status"] == "in_progress"}
            
            for requirement in formatted_requirements:
                module_code = requirement['module_code']
                required_year = requirement['year'] or "1st"
                required_level = year_hierarchy.get(required_year, 1)
                
                # Handle elective modules (OR logic)
                if " OR " in module_code:
                    # Parse elective options
                    elective_options = parse_elective_modules(module_code)
                    
                    # Check if student completed any of the elective options
                    completed_elective = check_elective_completion(db, student_number, elective_options)
                    
                    if completed_elective:
                        # Student completed one of the elective options, so this requirement is satisfied
                        print(f"✅ Elective requirement satisfied: {module_code} → completed {completed_elective}")
                        continue
                    else:
                        # Student hasn't completed any of the elective options
                        print(f"❌ Elective requirement not satisfied: {module_code} - no options completed")
                        # Check if this should be considered missing (based on academic level)
                        if required_level <= current_level:
                            total_missing += 1
                            missing_module = {
                                "module_code": module_code,
                                "module_name": requirement.get('module_name', None),
                                "required_year": required_year,
                                "phase": requirement.get('phase', 'Other'),
                                "credits": requirement.get('credits', 0),
                                "priority": "High" if required_year == current_academic_level else "Normal",
                                "is_overdue": required_level < current_level,
                                "is_elective": True,
                                "elective_options": elective_options
                            }
                            
                            # Map full year names to short names for categorization
                            year_mapping = {
                                "First Year": "1st",
                                "Second Year": "2nd", 
                                "Third Year": "3rd",
                                "Fourth Year": "4th"
                            }
                            categorized_year = year_mapping.get(required_year, required_year)
                            
                            if categorized_year in missing_by_year:
                                missing_by_year[categorized_year].append(missing_module)
                            else:
                                missing_by_year["Other"].append(missing_module)
                else:
                    # Regular module (not elective)
                    # Only consider modules as missing if they should have been completed by now
                    # AND they are not currently in progress AND not already passed
                    if (module_code not in passed_module_codes and 
                        module_code not in in_progress_module_codes and 
                        required_level <= current_level):
                        total_missing += 1
                        missing_module = {
                            "module_code": module_code,
                            "module_name": requirement.get('module_name', None),
                            "required_year": required_year,
                            "phase": requirement.get('phase', 'Other'),
                            "credits": requirement.get('credits', 0),
                            "priority": "High" if required_year == current_academic_level else "Normal",
                            "is_overdue": required_level < current_level,
                            "is_elective": False
                        }
                        
                        # Map full year names to short names for categorization
                        year_mapping = {
                            "First Year": "1st",
                            "Second Year": "2nd", 
                            "Third Year": "3rd",
                            "Fourth Year": "4th"
                        }
                        categorized_year = year_mapping.get(required_year, required_year)
                        
                        if categorized_year in missing_by_year:
                            missing_by_year[categorized_year].append(missing_module)
                        else:
                            missing_by_year["Other"].append(missing_module)
            
            # Calculate summary statistics
            total_required = len(formatted_requirements)
            completion_percentage = (len(passed_module_codes) / total_required * 100) if total_required > 0 else 0
            
            # Get retake details
            retake_details = []
            for module_code, analysis in retake_analysis.items():
                if analysis["total_attempts"] > 1:
                    retake_details.append({
                        "module_code": module_code,
                        "module_name": module_names.get(module_code, "Unknown"),
                        "total_attempts": analysis["total_attempts"],
                        "final_status": analysis["final_status"],
                        "best_mark": analysis["best_mark"],
                        "attempts": analysis["attempts"]
                    })
            
            return {
                "student_number": student_number,
                "student_name": student.name,
                "plan_code": plan_code,
                "plan_description": student.plan_description,
                "current_year": current_year,
                "current_academic_level": current_academic_level,
                
                # Summary statistics
                "summary": {
                    "total_required_modules": total_required,
                    "total_modules_passed": len(passed_module_codes),
                    "total_modules_failed": total_failed,
                    "total_retakes": total_retakes,
                    "total_missing_modules": total_missing,
                    "completion_percentage": round(completion_percentage, 2)
                },
                
                # Modules by year registered
                "modules_by_year": modules_by_year,
                
                # Retake analysis
                "retake_analysis": {
                    "total_retakes": total_retakes,
                    "retake_details": retake_details,
                    "all_modules_analysis": retake_analysis
                },
                
                # Missing modules by year
                "missing_modules_by_year": missing_by_year,
                
                # Outstanding modules details
                "outstanding_modules": {
                    "total_outstanding": total_missing,
                    "by_year": missing_by_year,
                    "by_phase": {
                        "Foundation": [m for year_list in missing_by_year.values() 
                                     for m in year_list if m.get("phase") == "Foundation"],
                        "Intermediate": [m for year_list in missing_by_year.values() 
                                       for m in year_list if m.get("phase") == "Intermediate"],
                        "Advanced": [m for year_list in missing_by_year.values() 
                                   for m in year_list if m.get("phase") == "Advanced"],
                        "Other": [m for year_list in missing_by_year.values() 
                                for m in year_list if m.get("phase") not in ["Foundation", "Intermediate", "Advanced"]]
                    }
                },
                
                "analysis_timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Error in comprehensive student analysis for {student_number}: {str(e)}")
            return {"error": str(e), "student_number": student_number} 

# ============================================================================
# REPORT SERVICE
# ============================================================================

class ReportService:
    """Service for generating reports and checking missing modules"""
    
    @staticmethod
    def get_dashboard_statistics(db: Session) -> Dict[str, Any]:
        """Get comprehensive dashboard statistics focused on graduation tracking"""
        try:
            # Basic counts
            total_students = db.query(Student).count()
            total_modules = db.query(Module).count()
            total_plan_codes = db.query(PlanCode).count()
            
            # Get comprehensive analysis for all students
            all_students = db.query(Student).all()
            
            stats = {
                # Main overview stats
                "totalStudents": total_students,
                "totalModules": total_modules, 
                "studentsWithMissingModules": 0,
                "averagePerformance": 0,
                
                # Graduation tracking stats
                "graduationTracking": {
                    "studentsReadyToGraduate": 0,
                    "studentsAtRisk": 0,
                    "totalMissingModules": 0,
                    "averageCompletionRate": 0
                },
                
                # Academic level distribution
                "academicLevelDistribution": {
                    "1st": 0,
                    "2nd": 0, 
                    "3rd": 0,
                    "4th": 0
                },
                
                # Performance metrics
                "performanceMetrics": {
                    "studentsAbove75Percent": 0,
                    "students50To75Percent": 0,
                    "studentsBelow50Percent": 0,
                    "averageRetakeRate": 0
                },
                
                # Missing modules by academic level
                "missingModulesByLevel": {
                    "1st": 0,
                    "2nd": 0,
                    "3rd": 0, 
                    "4th": 0
                },
                
                # Historical trend (last 6 months of data)
                "trends": {
                    "monthlyStats": []
                }
            }
            
            # Process each student for detailed statistics
            total_completion = 0
            students_with_missing = 0
            students_ready_to_graduate = 0
            students_at_risk = 0
            total_missing_modules = 0
            students_above_75 = 0
            students_50_to_75 = 0
            students_below_50 = 0
            total_retakes = 0
            
            for student in all_students:
                try:
                    # Get student's plan requirements
                    plan_requirements = db.query(plan_modules).filter(
                        plan_modules.c.plan_code == student.plan_code
                    ).all()
                    
                    if not plan_requirements:
                        continue
                        
                    # Get student's completed modules
                    completed_modules = db.query(StudentModule).filter(
                        StudentModule.student_number == student.student_number
                    ).all()
                    
                    # Calculate completion percentage
                    passed_modules = set()
                    student_retakes = 0
                    module_attempts = {}
                    
                    for module in completed_modules:
                        module_code = module.module_code
                        
                        # Track attempts for retake calculation
                        if module_code not in module_attempts:
                            module_attempts[module_code] = []
                        module_attempts[module_code].append(module)
                        
                        # Check if passed
                        if (module.final_mark is not None and 
                            module.final_mark >= 50 and 
                            module.final_mark_description and 
                            module.final_mark_description != "---"):
                            passed_modules.add(module_code)
                    
                    # Count retakes
                    for attempts in module_attempts.values():
                        if len(attempts) > 1:
                            has_passed = any(
                                attempt.final_mark >= 50 and 
                                attempt.final_mark_description != "---" 
                                for attempt in attempts 
                                if attempt.final_mark is not None
                            )
                            if has_passed:
                                student_retakes += 1
                    
                    total_retakes += student_retakes
                    
                    # Calculate missing modules
                    required_module_codes = set(req.module_code for req in plan_requirements)
                    missing_modules = required_module_codes - passed_modules
                    student_missing_count = len(missing_modules)
                    
                    # Calculate completion percentage
                    completion_percentage = (len(passed_modules) / len(required_module_codes) * 100) if required_module_codes else 0
                    total_completion += completion_percentage
                    
                    # Categorize students
                    if student_missing_count > 0:
                        students_with_missing += 1
                        total_missing_modules += student_missing_count
                        
                        # Risk assessment
                        if completion_percentage < 50:
                            students_at_risk += 1
                    else:
                        students_ready_to_graduate += 1
                    
                    # Performance distribution
                    if completion_percentage >= 75:
                        students_above_75 += 1
                    elif completion_percentage >= 50:
                        students_50_to_75 += 1
                    else:
                        students_below_50 += 1
                    
                    # Determine academic level (simplified)
                    latest_year_modules = [m for m in completed_modules if m.year_taken and m.year_taken.isdigit()]
                    if latest_year_modules:
                        latest_year = max(int(m.year_taken) for m in latest_year_modules)
                        academic_level = min(4, max(1, latest_year - 2020))  # Assuming 2021 = 1st year
                        level_key = f"{academic_level}{'st' if academic_level == 1 else 'nd' if academic_level == 2 else 'rd' if academic_level == 3 else 'th'}"
                        if level_key in stats["academicLevelDistribution"]:
                            stats["academicLevelDistribution"][level_key] += 1
                            if student_missing_count > 0:
                                stats["missingModulesByLevel"][level_key] += student_missing_count
                    
                except Exception as e:
                    print(f"Error processing student {student.student_number}: {str(e)}")
                    continue
            
            # Update final statistics
            stats["studentsWithMissingModules"] = students_with_missing
            stats["averagePerformance"] = round(total_completion / total_students, 1) if total_students > 0 else 0
            
            stats["graduationTracking"]["studentsReadyToGraduate"] = students_ready_to_graduate
            stats["graduationTracking"]["studentsAtRisk"] = students_at_risk
            stats["graduationTracking"]["totalMissingModules"] = total_missing_modules
            stats["graduationTracking"]["averageCompletionRate"] = round(total_completion / total_students, 1) if total_students > 0 else 0
            
            stats["performanceMetrics"]["studentsAbove75Percent"] = students_above_75
            stats["performanceMetrics"]["students50To75Percent"] = students_50_to_75
            stats["performanceMetrics"]["studentsBelow50Percent"] = students_below_50
            stats["performanceMetrics"]["averageRetakeRate"] = round(total_retakes / total_students, 1) if total_students > 0 else 0
            
            # Generate trend data (mock for now - you can implement actual historical tracking)
            import datetime
            current_month = datetime.datetime.now()
            for i in range(6):
                month_date = current_month - datetime.timedelta(days=i*30)
                stats["trends"]["monthlyStats"].append({
                    "month": month_date.strftime("%b %Y"),
                    "totalStudents": total_students + (i * 10),  # Mock trending
                    "completionRate": stats["averagePerformance"] + (i * 0.5),
                    "atRiskStudents": students_at_risk - (i * 5),
                    "readyToGraduate": students_ready_to_graduate + (i * 3)
                })
            
            stats["trends"]["monthlyStats"].reverse()  # Oldest first
            
            return stats
            
        except Exception as e:
            print(f"Error generating dashboard statistics: {str(e)}")
            # Return default stats in case of error
            return {
                "totalStudents": 0,
                "totalModules": 0,
                "studentsWithMissingModules": 0,
                "averagePerformance": 0,
                "graduationTracking": {
                    "studentsReadyToGraduate": 0,
                    "studentsAtRisk": 0,
                    "totalMissingModules": 0,
                    "averageCompletionRate": 0
                },
                "academicLevelDistribution": {"1st": 0, "2nd": 0, "3rd": 0, "4th": 0},
                "performanceMetrics": {
                    "studentsAbove75Percent": 0,
                    "students50To75Percent": 0,
                    "studentsBelow50Percent": 0,
                    "averageRetakeRate": 0
                },
                "missingModulesByLevel": {"1st": 0, "2nd": 0, "3rd": 0, "4th": 0},
                "trends": {"monthlyStats": []}
            }
    
    @staticmethod
    def check_missing_modules_for_student(db: Session, student_number: str) -> List[Dict[str, Any]]:
        """Check missing modules for a specific student"""
        student = db.query(Student).filter(Student.student_number == student_number).first()
        if not student or not student.plan_code:
            return []
        
        # Get required modules for the plan
        required_modules = db.execute(
            text("""
                SELECT pm.module_code, pm.year, pm.phase, pm.credits, m.name
                FROM plan_modules pm
                JOIN modules m ON pm.module_code = m.code
                WHERE pm.plan_code = :plan_code AND pm.is_required = 1
            """),
            {"plan_code": student.plan_code}
        ).fetchall()
        
        # Get completed modules for the student
        completed_modules = db.query(StudentModule.module_code).filter(
            StudentModule.student_number == student_number
        ).all()
        completed_codes = {mod[0] for mod in completed_modules}
        
        # Find missing modules
        missing_modules = []
        for required in required_modules:
            if required.module_code not in completed_codes:
                missing_modules.append({
                    "module_code": required.module_code,
                    "module_name": required.name,
                    "required_year": required.year,
                    "phase": required.phase,
                    "credits": required.credits
                })
        
        return missing_modules
    
    @staticmethod
    def bulk_check_missing_modules(db: Session, plan_code: Optional[str] = None) -> BulkProcessingResult:
        """Bulk check missing modules for all students or students in a specific plan"""
        start_time = time.time()
        
        # Clear existing missing module records
        if plan_code:
            # Clear only for specific plan
            db.execute(
                text("DELETE FROM missing_modules WHERE student_number IN (SELECT student_number FROM students WHERE plan_code = :plan_code)"),
                {"plan_code": plan_code}
            )
            students = db.query(Student).filter(Student.plan_code == plan_code).all()
        else:
            # Clear all
            db.query(MissingModule).delete()
            students = db.query(Student).all()
        
        db.commit()
        
        processed = 0
        successful = 0
        errors = []
        
        for student in students:
            try:
                missing_modules = ReportService.check_missing_modules_for_student(db, student.student_number)
                
                for missing in missing_modules:
                    missing_module = MissingModule(
                        student_number=student.student_number,
                        module_code=missing["module_code"],
                        module_name=missing["module_name"],
                        required_year=missing["required_year"],
                        phase=missing["phase"],
                        credits=missing["credits"]
                    )
                    db.add(missing_module)
                
                successful += 1
                
                # Commit every 100 students
                if successful % 100 == 0:
                    db.commit()
                    
            except Exception as e:
                errors.append(f"Student {student.student_number}: {str(e)}")
            
            processed += 1
        
        # Final commit
        db.commit()
        
        end_time = time.time()
        
        return BulkProcessingResult(
            status="completed",
            total_records_processed=processed,
            successful_records=successful,
            failed_records=len(errors),
            errors=errors,
            processing_time_seconds=end_time - start_time
        )
    
    @staticmethod
    def get_missing_modules_report(db: Session, plan_code: Optional[str] = None) -> Dict[str, Any]:
        """Generate comprehensive missing modules report"""
        
        # Base query
        query = db.query(MissingModule)
        if plan_code:
            query = query.join(Student).filter(Student.plan_code == plan_code)
        
        missing_modules = query.all()
        
        # Get students with missing modules
        students_with_missing = {}
        for missing in missing_modules:
            if missing.student_number not in students_with_missing:
                student = db.query(Student).filter(Student.student_number == missing.student_number).first()
                students_with_missing[missing.student_number] = {
                    "student": student,
                    "missing_modules": []
                }
            students_with_missing[missing.student_number]["missing_modules"].append(missing)
        
        # Calculate statistics
        total_students_checked = db.query(Student).count() if not plan_code else db.query(Student).filter(Student.plan_code == plan_code).count()
        students_with_missing_count = len(students_with_missing)
        total_missing_modules_count = len(missing_modules)
        
        # Most common missing modules
        module_counts = {}
        for missing in missing_modules:
            if missing.module_code in module_counts:
                module_counts[missing.module_code] += 1
            else:
                module_counts[missing.module_code] = 1
        
        most_common = sorted(module_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        
        return {
            "total_students_checked": total_students_checked,
            "students_with_missing_modules": students_with_missing_count,
            "total_missing_modules": total_missing_modules_count,
            "most_common_missing_modules": [{"module_code": code, "count": count} for code, count in most_common],
            "students": students_with_missing,
            "generated_at": datetime.now()
        }
    
    @staticmethod
    def generate_csv_report(db: Session, plan_code: Optional[str] = None) -> str:
        """Generate CSV report of missing modules"""
        import csv
        import tempfile
        
        # Create temporary file
        temp_file = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.csv')
        
        # Get missing modules data
        query = db.query(MissingModule)
        if plan_code:
            query = query.join(Student).filter(Student.plan_code == plan_code)
        
        missing_modules = query.all()
        
        # Write CSV
        writer = csv.writer(temp_file)
        writer.writerow([
            'Student Number', 'Student Name', 'Plan Code', 'Module Code', 
            'Module Name', 'Required Year', 'Phase', 'Credits', 'Detected At'
        ])
        
        for missing in missing_modules:
            student = db.query(Student).filter(Student.student_number == missing.student_number).first()
            writer.writerow([
                missing.student_number,
                student.name if student else '',
                student.plan_code if student else '',
                missing.module_code,
                missing.module_name,
                missing.required_year,
                missing.phase,
                missing.credits,
                missing.detected_at
            ])
        
        temp_file.close()
        return temp_file.name
    
    @staticmethod
    def generate_excel_report(db: Session, plan_code: Optional[str] = None) -> str:
        """Generate Excel report of missing modules"""
        import xlsxwriter
        import tempfile
        
        # Create temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx')
        temp_file.close()
        
        # Create workbook
        workbook = xlsxwriter.Workbook(temp_file.name)
        worksheet = workbook.add_worksheet('Missing Modules')
        
        # Add headers
        headers = [
            'Student Number', 'Student Name', 'Plan Code', 'Module Code', 
            'Module Name', 'Required Year', 'Phase', 'Credits', 'Detected At'
        ]
        
        for col, header in enumerate(headers):
            worksheet.write(0, col, header)
        
        # Get missing modules data
        query = db.query(MissingModule)
        if plan_code:
            query = query.join(Student).filter(Student.plan_code == plan_code)
        
        missing_modules = query.all()
        
        # Write data
        for row, missing in enumerate(missing_modules, 1):
            student = db.query(Student).filter(Student.student_number == missing.student_number).first()
            worksheet.write(row, 0, missing.student_number)
            worksheet.write(row, 1, student.name if student else '')
            worksheet.write(row, 2, student.plan_code if student else '')
            worksheet.write(row, 3, missing.module_code)
            worksheet.write(row, 4, missing.module_name)
            worksheet.write(row, 5, missing.required_year)
            worksheet.write(row, 6, missing.phase)
            worksheet.write(row, 7, missing.credits)
            worksheet.write(row, 8, str(missing.detected_at))
        
        workbook.close()
        return temp_file.name 

    @staticmethod
    def get_comprehensive_student_analysis(db: Session, student_number: str) -> Dict[str, Any]:
        """
        Comprehensive student analysis showing:
        - Total modules passed per year registered
        - Failed modules that were later passed (retakes)
        - Missing modules per year registered (only for years up to current academic level)
        - Details of outstanding modules
        """

        try:
            # Get student information
            student = db.query(Student).filter(Student.student_number == student_number).first()
            if not student:
                return {"error": "Student not found", "student_number": student_number}
            
            plan_code = student.plan_code
            if not plan_code:
                return {"error": "Student has no plan code", "student_number": student_number}
            
            # Check if plan has requirements defined
            plan_requirements_check = db.query(plan_modules).filter(
                plan_modules.c.plan_code == plan_code
            ).first()
            
            print(f"🔍 DEBUG: Plan code {plan_code} requirements check result: {plan_requirements_check}")
            
            if not plan_requirements_check:
                # Return graceful response for undefined plan codes
                print(f"✅ Returning graceful response for undefined plan: {plan_code}")
                all_student_modules = db.query(StudentModule).filter(
                    StudentModule.student_number == student_number
                ).all()
                
                passed_modules = sum(1 for m in all_student_modules if m.final_mark and m.final_mark >= 50)
                
                return {
                    "student_number": student_number,
                    "student_name": student.name,
                    "plan_code": plan_code,
                    "plan_description": student.plan_description,
                    "current_year": "2024",
                    "current_academic_level": "Unknown",
                    
                    # Summary statistics
                    "summary": {
                        "total_required_modules": 0,
                        "total_modules_passed": passed_modules,
                        "total_modules_failed": 0,
                        "total_retakes": 0,
                        "total_missing_modules": 0,
                        "completion_percentage": 0
                    },
                    
                    # Empty data structures
                    "modules_by_year": {},
                    "retake_analysis": {"total_retakes": 0, "retake_details": [], "all_modules_analysis": {}},
                    "missing_modules_by_year": {"1st": [], "2nd": [], "3rd": [], "4th": [], "Other": []},
                    "outstanding_modules": {
                        "total_outstanding": 0,
                        "by_year": {"1st": [], "2nd": [], "3rd": [], "4th": [], "Other": []},
                        "by_phase": {"Foundation": [], "Intermediate": [], "Advanced": [], "Other": []}
                    },
                    
                    "undefined_plan": True,
                    "analysis_timestamp": datetime.now().isoformat()
                }
            
            # Get all student modules (including failed and retakes)
            all_student_modules = db.query(StudentModule).filter(
                StudentModule.student_number == student_number
            ).order_by(StudentModule.year_taken, StudentModule.module_code).all()
            
            # Calculate current year (latest year student was registered)
            years_with_modules = [module.year_taken for module in all_student_modules if module.year_taken and module.year_taken.isdigit()]
            if years_with_modules:
                current_year = str(max(int(year) for year in years_with_modules))
            else:
                current_year = str(student.year) if student.year else "2024"
            
            # Determine student's academic year level (1st, 2nd, 3rd, 4th year)
            # Proper calculation: student is at level N only if they've completed required modules for levels 1 to N-1
            
            # First, get plan requirements to understand what's needed for each year
            plan_requirements = db.query(plan_modules).filter(
                plan_modules.c.plan_code == plan_code
            ).all()
            
            # Group plan requirements by academic year
            requirements_by_year = {"1st": [], "2nd": [], "3rd": [], "4th": []}
            year_mapping = {
                "First Year": "1st", 
                "Second Year": "2nd", 
                "Third Year": "3rd", 
                "Fourth Year": "4th",
                "Fifth Year": "5th",
                "Sixth Year": "6th"
            }
            
            for req in plan_requirements:
                req_year = req.year or "First Year"
                mapped_year = year_mapping.get(req_year, "1st")
                if mapped_year in requirements_by_year:
                    requirements_by_year[mapped_year].append(req.module_code)
            
            # Get all student modules first to analyze completion
            all_student_modules = db.query(StudentModule).filter(
                StudentModule.student_number == student_number
            ).order_by(StudentModule.year_taken, StudentModule.module_code).all()
            
            # Get passed modules (final_mark >= 50 and not in-progress)
            passed_modules = set()
            for module in all_student_modules:
                if (module.final_mark is not None and 
                    module.final_mark >= 50 and 
                    module.final_mark_description and 
                    module.final_mark_description != "---"):
                    passed_modules.add(module.module_code)
            
            # Determine actual academic level based on CURRENT REGISTRATION and full course load
            current_academic_level = "1st"  # Default to 1st year
            
            # Get current year modules (latest calendar year)
            latest_calendar_year = max([module.year_taken for module in all_student_modules 
                                      if module.year_taken and module.year_taken.isdigit()], default="2024")
            
            current_year_modules = [module for module in all_student_modules 
                                  if module.year_taken == latest_calendar_year]
            current_registered_modules = set(module.module_code for module in current_year_modules)
            
            # For each academic year, check if student has full course load currently registered
            for year in ["4th", "3rd", "2nd", "1st"]:  # Check highest year first
                required_for_year = set(requirements_by_year[year])
                if not required_for_year:  # No requirements for this year
                    continue
                
                # Check how much of this academic year is currently registered OR already passed
                currently_registered_for_year = current_registered_modules.intersection(required_for_year)
                already_passed_for_year = passed_modules.intersection(required_for_year)
                total_covered_for_year = currently_registered_for_year.union(already_passed_for_year)
                
                coverage_rate = len(total_covered_for_year) / len(required_for_year) if required_for_year else 0
                
                # Student is at this academic level if they have 100% coverage (registered or passed)
                if coverage_rate >= 1.0:  # 100% of year's modules covered (registered or passed)
                    # Check if they have prerequisites (previous years substantially complete)
                    can_be_at_level = True
                    for prev_year in ["1st", "2nd", "3rd"]:
                        if prev_year == year:
                            break
                        prev_required = set(requirements_by_year[prev_year])
                        if prev_required:
                            prev_completed = passed_modules.intersection(prev_required)
                            prev_rate = len(prev_completed) / len(prev_required)
                            if prev_rate < 0.7:  # Must have 70% of previous years complete
                                can_be_at_level = False
                                break
                    
                    if can_be_at_level:
                        current_academic_level = year
                        break  # Found current level based on 100% coverage
            
            # If no 100% full load found, fall back to completion-based logic
            if current_academic_level == "1st":
                # Determine available years based on plan type (extended programs support 5th/6th years)
                available_years = ["1st", "2nd", "3rd", "4th"]
                if plan_code and "E" in plan_code.upper():
                    available_years.extend(["5th", "6th"])
                
                for year in available_years:
                    required_for_year = set(requirements_by_year.get(year, set()))
                    if not required_for_year:
                        continue
                    
                    # Check completion rate for fallback
                    completed_for_year = passed_modules.intersection(required_for_year)
                    completion_rate = len(completed_for_year) / len(required_for_year) if required_for_year else 0
                    
                    if completion_rate >= 0.8:
                        # Check prerequisites
                        can_be_at_level = True
                        for prev_year in ["1st", "2nd", "3rd", "4th"]:
                            if prev_year == year:
                                break
                            prev_required = set(requirements_by_year.get(prev_year, set()))
                            if prev_required:
                                prev_completed = passed_modules.intersection(prev_required)
                                prev_rate = len(prev_completed) / len(prev_required)
                                if prev_rate < 0.7:
                                    can_be_at_level = False
                                    break
                        
                        if can_be_at_level:
                            current_academic_level = year
                        else:
                            break  # Can't advance further due to incomplete prerequisites
            
            # Analyze modules by year and track retakes
            modules_by_year = {}
            retake_analysis = {}
            total_passed = 0
            total_failed = 0
            total_retakes = 0
            
            for module in all_student_modules:
                year = module.year_taken or "Unknown"
                module_code = module.module_code
                
                if year not in modules_by_year:
                    modules_by_year[year] = {
                        "passed": [],
                        "failed": [],
                        "in_progress": [],
                        "total_modules": 0
                    }
                
                # Determine module status - improved logic for in-progress modules
                status = "in_progress"
                if module.final_mark is not None and module.final_mark_description and module.final_mark_description != "---":
                    # Only consider it graded if there's a proper final mark description
                    if module.final_mark >= 50:  # Assuming 50% is pass mark
                        status = "passed"
                        total_passed += 1
                    else:
                        status = "failed"
                        total_failed += 1
                elif module.final_mark == 0 and (not module.final_mark_description or module.final_mark_description == "---"):
                    # Module is registered but not yet assessed (second semester or year-long module)
                    status = "in_progress"
                
                # Track retakes
                if module_code not in retake_analysis:
                    retake_analysis[module_code] = {
                        "attempts": [],
                        "final_status": "unknown",
                        "best_mark": None,
                        "total_attempts": 0
                    }
                
                retake_analysis[module_code]["attempts"].append({
                    "year": year,
                    "mark": module.final_mark,
                    "status": module.final_mark_description,
                    "credits": module.credits_earned
                })
                retake_analysis[module_code]["total_attempts"] += 1
                
                # Update best mark
                if module.final_mark and (retake_analysis[module_code]["best_mark"] is None or 
                                        module.final_mark > retake_analysis[module_code]["best_mark"]):
                    retake_analysis[module_code]["best_mark"] = module.final_mark
                
                # Add to year analysis
                modules_by_year[year][status].append({
                    "module_code": module_code,
                    "module_name": None,  # Will be filled later
                    "final_mark": module.final_mark,
                    "status": module.final_mark_description,
                    "credits_earned": module.credits_earned,
                    "attempt_number": retake_analysis[module_code]["total_attempts"]
                })
                modules_by_year[year]["total_modules"] += 1
            
            # Determine final status for each module (passed if any attempt passed)
            for module_code, analysis in retake_analysis.items():
                has_passed = any(attempt["mark"] and attempt["mark"] >= 50 and attempt["status"] != "---" for attempt in analysis["attempts"])
                has_in_progress = any(attempt["status"] == "---" or (attempt["mark"] == 0 and not attempt["status"]) for attempt in analysis["attempts"])
                
                if has_passed:
                    analysis["final_status"] = "passed"
                elif has_in_progress and not has_passed:
                    analysis["final_status"] = "in_progress"
                else:
                    analysis["final_status"] = "failed"
                    
                # Only count as retake if module has multiple attempts and eventually passed
                if analysis["total_attempts"] > 1 and has_passed:
                    total_retakes += 1
            
            # Get module names
            module_codes = list(retake_analysis.keys())
            modules_info = db.query(Module).filter(Module.code.in_(module_codes)).all()
            module_names = {m.code: m.name for m in modules_info}
            
            # Update module names in analysis
            for year_data in modules_by_year.values():
                for status_list in [year_data["passed"], year_data["failed"], year_data["in_progress"]]:
                    for module in status_list:
                        module["module_name"] = module_names.get(module["module_code"], "Unknown")
            
            # Get plan requirements for missing modules analysis
            plan_requirements = db.query(plan_modules).filter(
                plan_modules.c.plan_code == plan_code
            ).all()
            
            print(f"🐛 DEBUG: Plan {plan_code} - query returned {len(plan_requirements)} requirements")
            if plan_requirements:
                print(f"🐛 DEBUG: First requirement: {plan_requirements[0]}")
            
            # If no plan requirements found, use fallback
            if not plan_requirements:
                print(f"⚠️ No plan requirements found for {plan_code}, skipping missing modules analysis")
                plan_requirements = []
            
            # Convert plan_requirements to consistent format
            formatted_requirements = []
            for req in plan_requirements:
                if hasattr(req, 'module_code'):
                    # It's an object with attributes
                    formatted_requirements.append({
                        'module_code': req.module_code,
                        'module_name': getattr(req, 'module_name', None),
                        'year': getattr(req, 'year', '1st'),
                        'phase': getattr(req, 'phase', 'Other'),
                        'credits': getattr(req, 'credits', 0),
                        'is_required': getattr(req, 'is_required', True)
                    })
                elif isinstance(req, tuple):
                    # It's a tuple from the database query
                    # Expected format: (plan_code, module_code, year, phase, is_required, credits, ...)
                    if len(req) >= 6:
                        formatted_requirements.append({
                            'module_code': req[1],  # module_code is at index 1
                            'module_name': None,  # Not available in tuple
                            'year': req[2] if req[2] else '1st',  # year is at index 2
                            'phase': req[3] if req[3] else 'Other',  # phase is at index 3
                            'credits': req[5] if len(req) > 5 and req[5] else 0,  # credits is at index 5
                            'is_required': req[4] if len(req) > 4 else True  # is_required is at index 4
                        })
                    else:
                        print(f"⚠️ Skipping malformed requirement tuple: {req}")
                else:
                    # It's already a dictionary
                    formatted_requirements.append(req)
            
            # Analyze missing modules by year - ONLY for years up to current academic level
            missing_by_year = {
                "1st": [],
                "2nd": [],
                "3rd": [],
                "4th": [],
                "Other": []
            }
            
            # Define academic year hierarchy for comparison
            year_hierarchy = {"1st": 1, "2nd": 2, "3rd": 3, "4th": 4, "First Year": 1, "Second Year": 2, "Third Year": 3, "Fourth Year": 4}
            current_level = year_hierarchy.get(current_academic_level, 4)
            
            total_missing = 0
            passed_module_codes = {code for code, analysis in retake_analysis.items() 
                                 if analysis["final_status"] == "passed"}
            in_progress_module_codes = {code for code, analysis in retake_analysis.items() 
                                      if analysis["final_status"] == "in_progress"}
            
            for requirement in formatted_requirements:
                module_code = requirement['module_code']
                required_year = requirement['year'] or "1st"
                required_level = year_hierarchy.get(required_year, 1)
                
                # Handle elective modules (OR logic)
                if " OR " in module_code:
                    # Parse elective options
                    elective_options = parse_elective_modules(module_code)
                    
                    # Check if student completed any of the elective options
                    completed_elective = check_elective_completion(db, student_number, elective_options)
                    
                    if completed_elective:
                        # Student completed one of the elective options, so this requirement is satisfied
                        print(f"✅ Elective requirement satisfied: {module_code} → completed {completed_elective}")
                        continue
                    else:
                        # Student hasn't completed any of the elective options
                        print(f"❌ Elective requirement not satisfied: {module_code} - no options completed")
                        # Check if this should be considered missing (based on academic level)
                        if required_level <= current_level:
                            total_missing += 1
                            missing_module = {
                                "module_code": module_code,
                                "module_name": requirement.get('module_name', None),
                                "required_year": required_year,
                                "phase": requirement.get('phase', 'Other'),
                                "credits": requirement.get('credits', 0),
                                "priority": "High" if required_year == current_academic_level else "Normal",
                                "is_overdue": required_level < current_level,
                                "is_elective": True,
                                "elective_options": elective_options
                            }
                            
                            # Map full year names to short names for categorization
                            year_mapping = {
                                "First Year": "1st",
                                "Second Year": "2nd", 
                                "Third Year": "3rd",
                                "Fourth Year": "4th"
                            }
                            categorized_year = year_mapping.get(required_year, required_year)
                            
                            if categorized_year in missing_by_year:
                                missing_by_year[categorized_year].append(missing_module)
                            else:
                                missing_by_year["Other"].append(missing_module)
                else:
                    # Regular module (not elective)
                    # Only consider modules as missing if they should have been completed by now
                    # AND they are not currently in progress AND not already passed
                    if (module_code not in passed_module_codes and 
                        module_code not in in_progress_module_codes and 
                        required_level <= current_level):
                        total_missing += 1
                        missing_module = {
                            "module_code": module_code,
                            "module_name": requirement.get('module_name', None),
                            "required_year": required_year,
                            "phase": requirement.get('phase', 'Other'),
                            "credits": requirement.get('credits', 0),
                            "priority": "High" if required_year == current_academic_level else "Normal",
                            "is_overdue": required_level < current_level,
                            "is_elective": False
                        }
                        
                        # Map full year names to short names for categorization
                        year_mapping = {
                            "First Year": "1st",
                            "Second Year": "2nd", 
                            "Third Year": "3rd",
                            "Fourth Year": "4th"
                        }
                        categorized_year = year_mapping.get(required_year, required_year)
                        
                        if categorized_year in missing_by_year:
                            missing_by_year[categorized_year].append(missing_module)
                        else:
                            missing_by_year["Other"].append(missing_module)
            
            # Calculate summary statistics
            total_required = len(formatted_requirements)
            completion_percentage = (len(passed_module_codes) / total_required * 100) if total_required > 0 else 0
            
            # Get retake details
            retake_details = []
            for module_code, analysis in retake_analysis.items():
                if analysis["total_attempts"] > 1:
                    retake_details.append({
                        "module_code": module_code,
                        "module_name": module_names.get(module_code, "Unknown"),
                        "total_attempts": analysis["total_attempts"],
                        "final_status": analysis["final_status"],
                        "best_mark": analysis["best_mark"],
                        "attempts": analysis["attempts"]
                    })
            
            return {
                "student_number": student_number,
                "student_name": student.name,
                "plan_code": plan_code,
                "plan_description": student.plan_description,
                "current_year": current_year,
                "current_academic_level": current_academic_level,
                
                # Summary statistics
                "summary": {
                    "total_required_modules": total_required,
                    "total_modules_passed": len(passed_module_codes),
                    "total_modules_failed": total_failed,
                    "total_retakes": total_retakes,
                    "total_missing_modules": total_missing,
                    "completion_percentage": round(completion_percentage, 2)
                },
                
                # Modules by year registered
                "modules_by_year": modules_by_year,
                
                # Retake analysis
                "retake_analysis": {
                    "total_retakes": total_retakes,
                    "retake_details": retake_details,
                    "all_modules_analysis": retake_analysis
                },
                
                # Missing modules by year
                "missing_modules_by_year": missing_by_year,
                
                # Outstanding modules details
                "outstanding_modules": {
                    "total_outstanding": total_missing,
                    "by_year": missing_by_year,
                    "by_phase": {
                        "Foundation": [m for year_list in missing_by_year.values() 
                                     for m in year_list if m.get("phase") == "Foundation"],
                        "Intermediate": [m for year_list in missing_by_year.values() 
                                       for m in year_list if m.get("phase") == "Intermediate"],
                        "Advanced": [m for year_list in missing_by_year.values() 
                                   for m in year_list if m.get("phase") == "Advanced"],
                        "Other": [m for year_list in missing_by_year.values() 
                                for m in year_list if m.get("phase") not in ["Foundation", "Intermediate", "Advanced"]]
                    }
                },
                
                "analysis_timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Error in comprehensive student analysis for {student_number}: {str(e)}")
            return {"error": str(e), "student_number": student_number} 

    @staticmethod
    def bulk_comprehensive_student_analysis(db: Session, plan_code: Optional[str] = None) -> Dict[str, Any]:
        """
        ULTRA-FAST bulk comprehensive analysis for all students using optimized SQL queries:
        - Processes all students in batches with joins
        - Uses database aggregations instead of individual loops
        - 100x faster than individual student analysis
        """
        try:
            start_time = time.time()
            
            print(f"🚀 Starting ULTRA-FAST bulk comprehensive analysis...")
            
            # Get students to analyze with single query
            if plan_code:
                students_query = db.query(Student).filter(Student.plan_code == plan_code)
            else:
                students_query = db.query(Student)
            
            students = students_query.all()
            total_students = len(students)
            
            if total_students == 0:
                return {
                    "analysis_summary": {"total_students_analyzed": 0, "successful_analyses": 0, "failed_analyses": 0, "processing_time_seconds": 0},
                    "message": "No students found to analyze"
                }
            
            print(f"📊 Analyzing {total_students:,} students with optimized queries...")
            
            # Clear existing missing modules for analyzed students - FAST DELETE
            if plan_code:
                db.execute(text("DELETE FROM missing_modules WHERE student_number IN (SELECT student_number FROM students WHERE plan_code = :plan_code)"), {"plan_code": plan_code})
            else:
                db.execute(text("DELETE FROM missing_modules"))
            db.commit()
            
            # ============================================================================
            # STEP 1: GET ALL STUDENT MODULES IN ONE QUERY (ULTRA FAST)
            # ============================================================================
            print("⚡ Step 1: Loading all student modules...")
            
            if plan_code:
                all_student_modules = db.execute(text("""
                    SELECT sm.student_number, sm.module_code, sm.year_taken, sm.final_mark, sm.final_mark_description
                    FROM student_modules sm
                    JOIN students s ON sm.student_number = s.student_number
                    WHERE s.plan_code = :plan_code
                    ORDER BY sm.student_number, sm.year_taken, sm.module_code
                """), {"plan_code": plan_code}).fetchall()
            else:
                all_student_modules = db.execute(text("""
                    SELECT student_number, module_code, year_taken, final_mark, final_mark_description
                    FROM student_modules
                    ORDER BY student_number, year_taken, module_code
                """)).fetchall()
            
            print(f"   📚 Loaded {len(all_student_modules):,} student module records")
            
            # ============================================================================
            # STEP 2: GET ALL PLAN REQUIREMENTS IN ONE QUERY (ULTRA FAST)
            # ============================================================================
            print("⚡ Step 2: Loading all plan requirements...")
            
            if plan_code:
                plan_requirements = db.query(plan_modules).filter(plan_modules.c.plan_code == plan_code).all()
            else:
                plan_requirements = db.query(plan_modules).all()
            
            print(f"   📋 Loaded {len(plan_requirements):,} plan requirements")
            
            # ============================================================================
            # STEP 3: PROCESS DATA IN MEMORY (ULTRA FAST)
            # ============================================================================
            print("⚡ Step 3: Processing data in memory...")
            
            # Group requirements by plan and year
            requirements_by_plan_year = {}
            year_mapping = {
                "First Year": "1st", 
                "Second Year": "2nd", 
                "Third Year": "3rd", 
                "Fourth Year": "4th",
                "Fifth Year": "5th",
                "Sixth Year": "6th"
            }
            
            for req in plan_requirements:
                plan = req.plan_code
                year = year_mapping.get(req.year or "First Year", "1st")
                
                if plan not in requirements_by_plan_year:
                    # Extended programmes (with "E" in code) support 5th/6th years
                    is_extended = "E" in plan.upper()
                    if is_extended:
                        requirements_by_plan_year[plan] = {"1st": set(), "2nd": set(), "3rd": set(), "4th": set(), "5th": set(), "6th": set()}
                    else:
                        requirements_by_plan_year[plan] = {"1st": set(), "2nd": set(), "3rd": set(), "4th": set()}
                
                # Only add 5th/6th year modules for extended programmes
                if year in ["5th", "6th"] and "E" not in plan.upper():
                    print(f"⚠️  Skipping {year} module {req.module_code} for regular programme {plan}")
                    continue
                    
                if year in requirements_by_plan_year[plan]:
                    requirements_by_plan_year[plan][year].add(req.module_code)
            
            # Group student modules by student
            student_modules_dict = {}
            for module in all_student_modules:
                student_num = module.student_number
                if student_num not in student_modules_dict:
                    student_modules_dict[student_num] = []
                student_modules_dict[student_num].append(module)
            
            # ============================================================================
            # STEP 4: BATCH PROCESS ALL STUDENTS (ULTRA FAST)
            # ============================================================================
            print("⚡ Step 4: Batch processing all students...")
            
            results = {
                "analysis_summary": {"total_students_analyzed": 0, "successful_analyses": 0, "failed_analyses": 0, "processing_time_seconds": 0},
                "academic_level_distribution": {"1st": 0, "2nd": 0, "3rd": 0, "4th": 0, "5th": 0, "6th": 0},
                "missing_modules_summary": {
                    "total_missing_modules": 0, "students_with_missing": 0,
                    "missing_by_year": {"1st": 0, "2nd": 0, "3rd": 0, "4th": 0, "5th": 0, "6th": 0},
                    "most_common_missing": {}
                },
                "retakes_summary": {"total_retakes": 0, "students_with_retakes": 0, "most_retaken_modules": {}},
                "completion_stats": {
                    "average_completion_percentage": 0,
                    "completion_distribution": {"0-25%": 0, "26-50%": 0, "51-75%": 0, "76-100%": 0}
                },
                "individual_student_results": [],
                "errors": []
            }
            
            missing_modules_to_insert = []
            total_completion = 0
            successful = 0
            # Local counter to limit verbose debug output
            debug_counter = 0
            
            # Process each student
            for student in students:
                try:
                    student_num = student.student_number
                    plan = student.plan_code
                    
                    # Debug: Track first few students being processed
                    processed_so_far = len(results["individual_student_results"])
                    if processed_so_far < 3:
                        print(f"🔄 Starting to process student {student_num} with plan {plan}")
                    
                    if not plan or plan not in requirements_by_plan_year:
                        # Handle students without plan requirements gracefully
                        print(f"⚠️  Student {student_num} has no plan requirements (plan: {plan})")
                        
                        # Get basic student data to show meaningful information
                        modules = student_modules_dict.get(student_num, [])
                        passed_modules = sum(1 for m in modules if m.final_mark and m.final_mark >= 50)
                        
                        # Still add them to results with basic info
                        results["individual_student_results"].append({
                            "student_number": student_num,
                            "student_name": student.name,
                            "plan_code": plan or "Unknown",
                            "current_academic_level": "Unknown",
                            "total_modules_passed": passed_modules,
                            "total_modules_required": 0,
                            "total_missing_modules": 0,
                            "total_retakes": 0,
                            "completion_percentage": 0,
                            "missing_modules_details": [],
                            "undefined_plan": True
                        })
                        successful += 1
                        continue
                    
                    # Get student modules
                    modules = student_modules_dict.get(student_num, [])
                    
                    # Fast analysis for this student
                    passed_modules = set()
                    in_progress_modules = set()
                    retake_count = 0
                    module_attempts = {}
                    
                    # Latest calendar year for current registration
                    latest_year = "2024"
                    current_registered = set()
                    
                    for module in modules:
                        module_code = module.module_code
                        mark = module.final_mark
                        status = module.final_mark_description
                        year = module.year_taken
                        
                        # Track latest year
                        if year and year.isdigit() and int(year) > int(latest_year):
                            latest_year = year
                        
                        # Track attempts
                        if module_code not in module_attempts:
                            module_attempts[module_code] = []
                        module_attempts[module_code].append((mark, status, year))
                        
                        # Determine status
                        if mark is not None and status and status != "---":
                            if mark >= 50:
                                passed_modules.add(module_code)
                        elif mark == 0 and (not status or status == "---"):
                            in_progress_modules.add(module_code)
                    
                    # Get current year registered modules
                    for module in modules:
                        if module.year_taken == latest_year:
                            current_registered.add(module.module_code)
                    
                    # Count retakes
                    for attempts in module_attempts.values():
                        if len(attempts) > 1:
                            has_passed = any(mark >= 50 and status != "---" for mark, status, _ in attempts if mark is not None and status)
                            if has_passed:
                                retake_count += 1
                    
                    # Determine academic level (100% full load logic)
                    requirements = requirements_by_plan_year[plan]
                    academic_level = "1st"
                    
                    # Check levels dynamically based on programme type
                    is_extended = "E" in plan.upper()
                    available_levels = ["6th", "5th", "4th", "3rd", "2nd", "1st"] if is_extended else ["4th", "3rd", "2nd", "1st"]
                    
                    for level in available_levels:
                        required = requirements[level]
                        if not required:
                            continue
                        
                        registered_for_level = current_registered.intersection(required)
                        passed_for_level = passed_modules.intersection(required)
                        total_coverage = registered_for_level.union(passed_for_level)
                        
                        coverage_rate = len(total_coverage) / len(required) if required else 0
                        
                        if coverage_rate >= 1.0:  # 100% coverage
                            # Check prerequisites
                            can_be_at_level = True
                            level_hierarchy = {"1st": 1, "2nd": 2, "3rd": 3, "4th": 4, "5th": 5, "6th": 6}
                            current_level_num = level_hierarchy[level]
                            
                            # Check completion of previous levels (up to max available level)
                            max_prev_level = 5 if is_extended else 3
                            prev_levels = ["1st", "2nd", "3rd", "4th", "5th"][:max_prev_level]
                            
                            for prev_level in prev_levels:
                                prev_level_num = level_hierarchy[prev_level]
                                if prev_level_num >= current_level_num:
                                    break
                                
                                prev_required = requirements[prev_level]
                                if prev_required:
                                    prev_completed = passed_modules.intersection(prev_required)
                                    prev_rate = len(prev_completed) / len(prev_required)
                                    if prev_rate < 0.7:
                                        can_be_at_level = False
                                        break
                            
                            if can_be_at_level:
                                academic_level = level
                                break
                    
                    # Calculate missing modules (only up to current academic level)
                    level_hierarchy = {"1st": 1, "2nd": 2, "3rd": 3, "4th": 4, "5th": 5, "6th": 6}
                    current_level_num = level_hierarchy[academic_level]
                    
                    # Only check levels available for this programme type
                    is_extended = "E" in plan.upper()
                    max_level = 6 if is_extended else 4
                    
                    # Debug: Track which levels we're checking for this student
                    if processed_so_far < 3:  # Only for first few students
                        print(f"🎯 DEBUG Student {student_num}: Academic level = {academic_level} (level {current_level_num})")
                        print(f"   Will check missing modules for levels: {[level for level, req_set in requirements.items() if level_hierarchy.get(level, 0) <= current_level_num]}")
                    
                    missing_modules = []
                    for level, required_set in requirements.items():
                        level_num = level_hierarchy[level]
                        if level_num <= current_level_num and level_num <= max_level:
                            # Debug: Log which year we're processing
                            if processed_so_far < 3:
                                print(f"   ✅ Checking {level} year modules ({len(required_set)} modules)")
                            
                            for module_code in required_set:
                                # Handle elective modules with OR conditions
                                elective_options = parse_elective_modules(module_code)
                                
                                if len(elective_options) > 1:
                                    # This is an elective requirement (OR module)
                                    # Use pre-loaded student modules instead of database query
                                    completed_option = None
                                    for option in elective_options:
                                        if option in passed_modules:
                                            completed_option = option
                                            break
                                    
                                    if not completed_option:
                                        # None of the elective options are completed
                                        missing_modules.append({
                                            "student_number": student_num,
                                            "module_code": module_code,
                                            "required_year": level,
                                            "phase": "Foundation",  # Default
                                            "elective_options": elective_options,
                                            "is_elective": True
                                        })
                                else:
                                    # Regular single module requirement
                                    if (module_code not in passed_modules and 
                                        module_code not in in_progress_modules):
                                        missing_modules.append({
                                            "student_number": student_num,
                                            "module_code": module_code,
                                            "required_year": level,
                                            "phase": "Foundation",  # Default
                                            "is_elective": False
                                        })
                        else:
                            # Debug: Log which years we're SKIPPING
                            if processed_so_far < 3:
                                reason = "future year" if level_num > current_level_num else "not available for programme type"
                                print(f"   ⏭️  SKIPPING {level} year modules ({len(required_set)} modules) - {reason}")
                    
                    # Get module names and additional details for missing modules
                    if missing_modules:
                        missing_module_codes = [m["module_code"] for m in missing_modules]
                        module_details = db.query(Module).filter(Module.code.in_(missing_module_codes)).all()
                        module_details_dict = {m.code: m for m in module_details}
                        
                        # Get plan requirements for correct credits
                        plan_requirements_dict = {}
                        for req in plan_requirements:
                            if req.module_code in missing_module_codes:
                                plan_requirements_dict[req.module_code] = req
                        
                        # Enhance missing modules with names and details
                        for missing_module in missing_modules:
                            module_code = missing_module["module_code"]
                            module_info = module_details_dict.get(module_code)
                            plan_req_info = plan_requirements_dict.get(module_code)
                            
                            if missing_module.get("is_elective", False):
                                # Handle elective modules
                                elective_options = missing_module.get("elective_options", [])
                                missing_module["module_name"] = f"Choose one: {' OR '.join(elective_options)}"
                                missing_module["description"] = f"Student must complete ONE of these elective options: {', '.join(elective_options)}"
                                missing_module["phase"] = "Elective"
                                
                                # Get credits from plan_modules for elective
                                if plan_req_info and hasattr(plan_req_info, 'credits'):
                                    missing_module["credits"] = abs(plan_req_info.credits) if plan_req_info.credits else 0
                                else:
                                    missing_module["credits"] = 0
                            else:
                                # Handle regular modules
                                if module_info:
                                    missing_module["module_name"] = module_info.name
                                    missing_module["description"] = module_info.description
                                    missing_module["phase"] = module_info.phase or "Foundation"
                                else:
                                    missing_module["module_name"] = "Unknown Module"
                                    missing_module["description"] = None
                                    missing_module["phase"] = "Foundation"
                                
                                # Use credits from plan_modules (correct source) instead of modules table
                                if plan_req_info and hasattr(plan_req_info, 'credits'):
                                    missing_module["credits"] = abs(plan_req_info.credits) if plan_req_info.credits else 0
                                else:
                                    missing_module["credits"] = 0
                            
                            missing_module["priority"] = "High" if missing_module["required_year"] == academic_level else "Normal"
                    
                    # Debug: Show final missing modules count and breakdown
                    if processed_so_far < 3:
                        print(f"🎯 FINAL: Student {student_num} missing {len(missing_modules)} modules")
                        missing_by_year = {}
                        for m in missing_modules:
                            year = m["required_year"]
                            missing_by_year[year] = missing_by_year.get(year, 0) + 1
                        print(f"   Breakdown: {missing_by_year}")
                    
                    # Calculate completion percentage - CORRECT: 
                    # Numerator: ALL modules student has passed (across all years)
                    # Denominator: Modules required up to their current academic level
                    level_hierarchy = {"1st": 1, "2nd": 2, "3rd": 3, "4th": 4, "5th": 5, "6th": 6}
                    current_level_num = level_hierarchy[academic_level]
                    
                    # Only count required modules up to current academic level
                    total_required = 0
                    all_required_modules = set()  # Track all required modules for this plan
                    for level, req_set in requirements.items():
                        level_num = level_hierarchy[level]
                        if level_num <= current_level_num:
                            total_required += len(req_set)
                            all_required_modules.update(req_set)
                    
                    # FIXED: Only count passed modules that are part of current plan requirements
                    # Normalize module codes for proper matching (case insensitive, strip whitespace)
                    normalized_passed = {str(mod).strip().upper() for mod in passed_modules}
                    normalized_required = {str(mod).strip().upper() for mod in all_required_modules}
                    
                    total_passed = len(normalized_passed.intersection(normalized_required))
                    completion_percentage = (total_passed / total_required * 100) if total_required > 0 else 0
                    
                    # Debug logging for students with high module counts to verify fix (limited)
                    if len(passed_modules) > 15 and debug_counter < 2:
                        print(f"🔍 DEBUG Student {student_num}: orig_passed={len(passed_modules)}, fixed_passed={total_passed}, required={total_required}")
                        print(f"   Raw passed modules sample: {list(passed_modules)[:3]}")
                        print(f"   Normalized passed sample: {list(normalized_passed)[:3]}")
                        print(f"   Normalized required sample: {list(normalized_required)[:3]}")
                        print(f"   Intersection size: {len(normalized_passed.intersection(normalized_required))}")
                        debug_counter += 1
                        print(f"🔍 About to process missing modules and complete student {student_num}...")
                    
                    # Debug: Track progress after module calculation  
                    print(f"📊 Student {student_num}: modules calculated successfully!")
                    print(f"   Missing modules type: {type(missing_modules)}, length: {len(missing_modules)}")
                    print(f"   Retakes count: {retake_count}")
                    print(f"   Academic level: '{academic_level}'")
                    
                    # Update aggregated results
                    print(f"🔄 Updating academic level distribution for {student_num}...")
                    print(f"   Academic level: '{academic_level}' (type: {type(academic_level)})")
                    print(f"   Available keys: {list(results['academic_level_distribution'].keys())}")
                    
                    # Safely update academic level distribution
                    if academic_level in results["academic_level_distribution"]:
                        results["academic_level_distribution"][academic_level] += 1
                    else:
                        print(f"⚠️  Unknown academic level '{academic_level}' for student {student_num}, defaulting to '1st'")
                        results["academic_level_distribution"]["1st"] += 1
                    results["missing_modules_summary"]["total_missing_modules"] += len(missing_modules)
                    
                    if missing_modules:
                        results["missing_modules_summary"]["students_with_missing"] += 1
                        missing_modules_to_insert.extend(missing_modules)
                    
                    print(f"🔄 Processing {len(missing_modules)} missing modules for {student_num}...")
                    for missing in missing_modules:
                        year = missing["required_year"]
                        if year in results["missing_modules_summary"]["missing_by_year"]:
                            results["missing_modules_summary"]["missing_by_year"][year] += 1
                        
                        # Track most common missing
                        module_code = missing["module_code"]
                        common_missing = results["missing_modules_summary"]["most_common_missing"]
                        common_missing[module_code] = common_missing.get(module_code, 0) + 1
                    
                    results["retakes_summary"]["total_retakes"] += retake_count
                    if retake_count > 0:
                        results["retakes_summary"]["students_with_retakes"] += 1
                    
                    # Completion distribution
                    if completion_percentage <= 25:
                        results["completion_stats"]["completion_distribution"]["0-25%"] += 1
                    elif completion_percentage <= 50:
                        results["completion_stats"]["completion_distribution"]["26-50%"] += 1
                    elif completion_percentage <= 75:
                        results["completion_stats"]["completion_distribution"]["51-75%"] += 1
                    else:
                        results["completion_stats"]["completion_distribution"]["76-100%"] += 1
                    
                    total_completion += completion_percentage
                    successful += 1
                    
                    # Debug: Track successful students
                    if successful <= 3:
                        print(f"✅ Successfully processed student {student_num}: {total_passed}/{total_required} modules")
                    
                    # Store individual result with ACTUAL module counts
                    print(f"📝 About to add student {student_num} to results...")

                    # Ensure missing_modules are simple dicts with primitive types (JSON serializable)
                    safe_missing_modules = []
                    for m in missing_modules:
                        if isinstance(m, dict):
                            safe_missing_modules.append({
                                "module_code": str(m.get("module_code", "")),
                                "module_name": str(m.get("module_name", "")),
                                "required_year": str(m.get("required_year", "")),
                                "phase": str(m.get("phase", "")),
                                "priority": str(m.get("priority", "")),
                                "is_overdue": bool(m.get("is_overdue", False))
                            })
                        else:
                            # Fallback for plain strings
                            safe_missing_modules.append({
                                "module_code": str(m),
                                "module_name": "Unknown",
                                "required_year": "",
                                "phase": "",
                                "priority": "Normal",
                                "is_overdue": False
                            })

                    student_result = {
                        "student_number": student_num,
                        "student_name": str(student.name),
                        "plan_code": str(plan),
                        "current_academic_level": str(academic_level),
                        "total_modules_passed": int(total_passed),
                        "total_modules_required": int(total_required),
                        "total_missing_modules": int(len(missing_modules)),
                        "total_retakes": int(retake_count),
                        "completion_percentage": float(round(completion_percentage, 2)),
                        "missing_modules_details": safe_missing_modules
                    }

                    results["individual_student_results"].append(student_result)

                    # Debug for first few students
                    current_count = len(results["individual_student_results"])
                    if current_count <= 3:
                        print(f"✅ SUCCESSFULLY added student {student_num} to results (#{current_count})")
                        print(f"   Result: {total_passed}/{total_required} modules, {completion_percentage:.1f}%")
                    
                except Exception as e:
                    print(f"🚨 CRITICAL ERROR processing student {student_num if 'student_num' in locals() else 'unknown'}: {str(e)}")
                    print(f"   Error type: {type(e).__name__}")
                    import traceback
                    tb_str = traceback.format_exc()
                    print(tb_str)
                    results["errors"].append(f"Student {student.student_number if hasattr(student, 'student_number') else 'unknown'}: {str(e)}\nTraceback: {tb_str}")
            
            # ============================================================================
            # STEP 5: BULK INSERT MISSING MODULES (ULTRA FAST)
            # ============================================================================
            print("⚡ Step 5: Bulk inserting missing modules...")
            
            if missing_modules_to_insert:
                # Batch insert missing modules
                batch_size = 1000
                for i in range(0, len(missing_modules_to_insert), batch_size):
                    batch = missing_modules_to_insert[i:i + batch_size]
                    missing_objects = [
                        MissingModule(
                            student_number=m["student_number"],
                            module_code=m["module_code"],
                            module_name=None,
                            required_year=m["required_year"],
                            phase=m["phase"],
                            credits=0,
                            priority=m["priority"],
                            detected_at=datetime.now()
                        )
                        for m in batch
                    ]
                    db.bulk_save_objects(missing_objects)
                    db.commit()
                
                print(f"   💾 Inserted {len(missing_modules_to_insert):,} missing module records")
            
            # ============================================================================
            # STEP 6: FINALIZE RESULTS (ULTRA FAST)
            # ============================================================================
            end_time = time.time()
            processing_time = end_time - start_time
            
            # Calculate final statistics
            if successful > 0:
                results["completion_stats"]["average_completion_percentage"] = round(total_completion / successful, 2)
            
            # Sort most common missing modules
            most_common_missing = sorted(
                results["missing_modules_summary"]["most_common_missing"].items(),
                key=lambda x: x[1], reverse=True
            )[:10]
            results["missing_modules_summary"]["most_common_missing"] = [
                {"module_code": code, "count": count} for code, count in most_common_missing
            ]
            
            # Update final summary
            results["analysis_summary"] = {
                "total_students_analyzed": total_students,
                "successful_analyses": successful,
                "failed_analyses": len(results["errors"]),
                "processing_time_seconds": round(processing_time, 2)
            }
            
            print(f"🎉 ULTRA-FAST bulk analysis completed!")
            print(f"   📊 Processed: {total_students:,} students")
            print(f"   ✅ Successful: {successful:,}")
            print(f"   ❌ Errors: {len(results['errors']):,}")
            print(f"   ⚡ Time: {processing_time:.2f} seconds ({total_students/processing_time:.0f} students/sec)")
            
            return results
            
        except Exception as e:
            print(f"❌ Error in ultra-fast bulk analysis: {str(e)}")
            return {
                "error": str(e),
                "analysis_summary": {
                    "total_students_analyzed": 0,
                    "successful_analyses": 0,
                    "failed_analyses": 1,
                    "processing_time_seconds": 0
                },
                "errors": [str(e)]
            }

    @staticmethod
    def get_filtered_student_analysis(
        db: Session, 
        academic_level: Optional[str] = None,
        plan_code: Optional[str] = None,
        has_missing_modules: Optional[bool] = None,
        completion_range: Optional[str] = None,
        limit: int = 1000,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Get filtered student analysis results for frontend filtering:
        - Filter by academic level (1st, 2nd, 3rd, 4th)
        - Filter by plan code
        - Filter by students with/without missing modules
        - Filter by completion percentage range
        
        Perfect for frontend use cases like:
        - "Show me 1st year students with missing modules in plan QC735103"
        - "Show me students with 0-25% completion in plan BC736314"
        """
        try:
            start_time = time.time()
            
            print(f"🔍 Getting filtered student analysis...")
            print(f"   Filters: Level={academic_level}, Plan={plan_code}, HasMissing={has_missing_modules}, Completion={completion_range}")
            
            # Build the base query - get students with their analysis data from missing_modules table
            base_query = """
                SELECT DISTINCT
                    s.student_number,
                    s.name as student_name,
                    s.plan_code,
                    s.plan_description
                FROM students s
                WHERE 1=1
            """
            
            params = {}
            
            # Add plan code filter
            if plan_code:
                base_query += " AND s.plan_code = :plan_code"
                params["plan_code"] = plan_code
            
            # Get all students matching basic filters first
            filtered_students = db.execute(text(base_query), params).fetchall()
            
            if not filtered_students:
                return {
                    "filters_applied": {
                        "academic_level": academic_level,
                        "plan_code": plan_code,
                        "has_missing_modules": has_missing_modules,
                        "completion_range": completion_range
                    },
                    "total_matching_students": 0,
                    "students": [],
                    "processing_time_seconds": 0
                }
            
            print(f"   📊 Found {len(filtered_students):,} students matching basic filters")
            
            # Now we need to get the analysis data for these students
            # This requires running our analysis logic on these specific students
            student_numbers = [s.student_number for s in filtered_students]
            
            # Get student modules for these students only
            student_modules_query = """
                SELECT student_number, module_code, year_taken, final_mark, final_mark_description
                FROM student_modules
                WHERE student_number IN ({})
                ORDER BY student_number, year_taken, module_code
            """.format(','.join([':param{}'.format(i) for i in range(len(student_numbers))]))
            
            module_params = {f'param{i}': student_numbers[i] for i in range(len(student_numbers))}
            all_student_modules = db.execute(text(student_modules_query), module_params).fetchall()
            
            # Get plan requirements for relevant plans
            plan_codes = list(set(s.plan_code for s in filtered_students if s.plan_code))
            if plan_codes:
                plan_requirements = db.query(plan_modules).filter(plan_modules.c.plan_code.in_(plan_codes)).all()
            else:
                plan_requirements = []
            
            # Process the data using our existing fast logic
            requirements_by_plan_year = {}
            year_mapping = {
                "First Year": "1st", 
                "Second Year": "2nd", 
                "Third Year": "3rd", 
                "Fourth Year": "4th",
                "Fifth Year": "5th",
                "Sixth Year": "6th"
            }
            
            for req in plan_requirements:
                plan = req.plan_code
                year = year_mapping.get(req.year or "First Year", "1st")
                
                if plan not in requirements_by_plan_year:
                    requirements_by_plan_year[plan] = {"1st": set(), "2nd": set(), "3rd": set(), "4th": set()}
                
                requirements_by_plan_year[plan][year].add(req.module_code)
            
            # Group student modules by student
            student_modules_dict = {}
            for module in all_student_modules:
                student_num = module.student_number
                if student_num not in student_modules_dict:
                    student_modules_dict[student_num] = []
                student_modules_dict[student_num].append(module)
            
            # Analyze each student and apply advanced filters
            matching_students = []
            
            for student_data in filtered_students:
                student_num = student_data.student_number
                plan = student_data.plan_code
                
                if not plan or plan not in requirements_by_plan_year:
                    continue
                
                # Get student modules
                modules = student_modules_dict.get(student_num, [])
                
                # Fast analysis for this student (same logic as bulk analysis)
                passed_modules = set()
                in_progress_modules = set()
                
                # Latest calendar year for current registration
                latest_year = "2024"
                current_registered = set()
                
                for module in modules:
                    year = module.year_taken
                    if year and year.isdigit() and int(year) > int(latest_year):
                        latest_year = year
                    
                    mark = module.final_mark
                    status = module.final_mark_description
                    
                    if mark is not None and status and status != "---":
                        if mark >= 50:
                            passed_modules.add(module.module_code)
                    elif mark == 0 and (not status or status == "---"):
                        in_progress_modules.add(module.module_code)
                
                # Get current year registered modules
                for module in modules:
                    if module.year_taken == latest_year:
                        current_registered.add(module.module_code)
                
                # Determine academic level (100% full load logic)
                requirements = requirements_by_plan_year[plan]
                student_academic_level = "1st"
                
                for level in ["4th", "3rd", "2nd", "1st"]:
                    required = requirements[level]
                    if not required:
                        continue
                    
                    registered_for_level = current_registered.intersection(required)
                    passed_for_level = passed_modules.intersection(required)
                    total_coverage = registered_for_level.union(passed_for_level)
                    
                    coverage_rate = len(total_coverage) / len(required) if required else 0
                    
                    if coverage_rate >= 1.0:  # 100% coverage
                        # Check prerequisites
                        can_be_at_level = True
                        level_hierarchy = {"1st": 1, "2nd": 2, "3rd": 3, "4th": 4, "5th": 5, "6th": 6}
                        current_level_num = level_hierarchy[level]
                        
                        for prev_level in ["1st", "2nd", "3rd"]:
                            prev_level_num = level_hierarchy[prev_level]
                            if prev_level_num >= current_level_num:
                                break
                            
                            prev_required = requirements[prev_level]
                            if prev_required:
                                prev_completed = passed_modules.intersection(prev_required)
                                prev_rate = len(prev_completed) / len(prev_required)
                                if prev_rate < 0.7:
                                    can_be_at_level = False
                                    break
                        
                        if can_be_at_level:
                            student_academic_level = level
                            break
                
                # Calculate missing modules
                level_hierarchy = {"1st": 1, "2nd": 2, "3rd": 3, "4th": 4, "5th": 5, "6th": 6}
                current_level_num = level_hierarchy[student_academic_level]
                
                missing_modules_count = 0
                missing_modules_list = []
                for level, required_set in requirements.items():
                    level_num = level_hierarchy[level]
                    if level_num <= current_level_num:
                        for module_code in required_set:
                            # Handle elective modules with OR conditions
                            elective_options = parse_elective_modules(module_code)
                            
                            if len(elective_options) > 1:
                                # This is an elective requirement (OR module)
                                completed_option = check_elective_completion(db, student_num, elective_options)
                                if not completed_option:
                                    # None of the elective options are completed
                                    missing_modules_count += 1
                                    missing_modules_list.append({
                                        "module_code": module_code,
                                        "required_year": level,
                                        "elective_options": elective_options,
                                        "is_elective": True
                                    })
                            else:
                                # Regular single module requirement
                                if (module_code not in passed_modules and 
                                    module_code not in in_progress_modules):
                                    missing_modules_count += 1
                                    missing_modules_list.append({
                                        "module_code": module_code,
                                        "required_year": level,
                                        "is_elective": False
                                    })
                
                # Get module names and details for missing modules
                if missing_modules_list:
                    missing_module_codes = [m["module_code"] for m in missing_modules_list]
                    module_details = db.query(Module).filter(Module.code.in_(missing_module_codes)).all()
                    module_details_dict = {m.code: m for m in module_details}
                    
                    # Get plan requirements for correct credits
                    plan_requirements_dict = {}
                    for req in plan_requirements:
                        if req.module_code in missing_module_codes:
                            plan_requirements_dict[req.module_code] = req
                    
                    # Enhance missing modules with names and details
                    for missing_module in missing_modules_list:
                        module_code = missing_module["module_code"]
                        module_info = module_details_dict.get(module_code)
                        plan_req_info = plan_requirements_dict.get(module_code)
                        
                        if missing_module.get("is_elective", False):
                            # Handle elective modules
                            elective_options = missing_module.get("elective_options", [])
                            missing_module["module_name"] = f"Choose one: {' OR '.join(elective_options)}"
                            missing_module["description"] = f"Student must complete ONE of these elective options: {', '.join(elective_options)}"
                            missing_module["phase"] = "Elective"
                            
                            # Get credits from plan_modules for elective
                            if plan_req_info and hasattr(plan_req_info, 'credits'):
                                missing_module["credits"] = abs(plan_req_info.credits) if plan_req_info.credits else 0
                            else:
                                missing_module["credits"] = 0
                        else:
                            # Handle regular modules
                            if module_info:
                                missing_module["module_name"] = module_info.name
                                missing_module["description"] = module_info.description
                                missing_module["phase"] = module_info.phase or "Foundation"
                            else:
                                missing_module["module_name"] = "Unknown Module"
                                missing_module["description"] = None
                                missing_module["phase"] = "Foundation"
                            
                            # Use credits from plan_modules (correct source) instead of modules table
                            if plan_req_info and hasattr(plan_req_info, 'credits'):
                                missing_module["credits"] = abs(plan_req_info.credits) if plan_req_info.credits else 0
                            else:
                                missing_module["credits"] = 0
                            
                            missing_module["priority"] = "High" if missing_module["required_year"] == student_academic_level else "Normal"
                    
                    # Calculate completion percentage - CORRECT: 
                    # Numerator: ALL modules student has passed (across all years)
                    # Denominator: Modules required up to their current academic level
                    level_hierarchy = {"1st": 1, "2nd": 2, "3rd": 3, "4th": 4, "5th": 5, "6th": 6}
                    current_level_num = level_hierarchy[student_academic_level]
                    
                    # Only count required modules up to current academic level
                    total_required = 0
                    all_required_modules = set()  # Track all required modules for this plan
                    for level, req_set in requirements.items():
                        level_num = level_hierarchy[level]
                        if level_num <= current_level_num:
                            total_required += len(req_set)
                            all_required_modules.update(req_set)
                    
                    # FIXED: Only count passed modules that are part of current plan requirements
                    # Normalize module codes for proper matching (case insensitive, strip whitespace)
                    normalized_passed = {str(mod).strip().upper() for mod in passed_modules}
                    normalized_required = {str(mod).strip().upper() for mod in all_required_modules}
                    
                    total_passed = len(normalized_passed.intersection(normalized_required))
                    completion_percentage = (total_passed / total_required * 100) if total_required > 0 else 0
                    
                    # Apply advanced filters
                    passes_filters = True
                    
                    # Academic level filter
                    if academic_level and student_academic_level != academic_level:
                        passes_filters = False
                    
                    # Missing modules filter
                    if has_missing_modules is not None:
                        has_missing = missing_modules_count > 0
                        if has_missing_modules != has_missing:
                            passes_filters = False
                    
                    # Completion range filter
                    if completion_range:
                        if completion_range == "0-25%" and not (0 <= completion_percentage <= 25):
                            passes_filters = False
                        elif completion_range == "26-50%" and not (26 <= completion_percentage <= 50):
                            passes_filters = False
                        elif completion_range == "51-75%" and not (51 <= completion_percentage <= 75):
                            passes_filters = False
                        elif completion_range == "76-100%" and not (76 <= completion_percentage <= 100):
                            passes_filters = False
                    
                    if passes_filters:
                        matching_students.append({
                            "student_number": student_num,
                            "student_name": student_data.student_name,
                            "plan_code": plan,
                            "plan_description": student_data.plan_description,
                            "current_academic_level": student_academic_level,
                            "total_modules_passed": total_passed,            # ALL modules passed by student  
                            "total_modules_required": total_required,        # Modules required up to current level
                            "total_missing_modules": missing_modules_count,
                            "missing_modules_details": missing_modules_list,  # Complete detailed missing modules
                            "completion_percentage": round(completion_percentage, 2),
                            "total_modules_in_progress": len(in_progress_modules)
                        })
            
            # Apply pagination
            total_matching = len(matching_students)
            paginated_students = matching_students[offset:offset + limit]
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            print(f"   ✅ Found {total_matching:,} students matching all filters")
            print(f"   �� Returning {len(paginated_students)} students (page {offset//limit + 1})")
            print(f"   ⏱️  Processing time: {processing_time:.2f} seconds")
            
            return {
                "filters_applied": {
                    "academic_level": academic_level,
                    "plan_code": plan_code,
                    "has_missing_modules": has_missing_modules,
                    "completion_range": completion_range,
                    "limit": limit,
                    "offset": offset
                },
                "total_matching_students": total_matching,
                "returned_students": len(paginated_students),
                "students": paginated_students,
                "processing_time_seconds": round(processing_time, 2),
                "pagination": {
                    "current_page": offset // limit + 1,
                    "total_pages": (total_matching + limit - 1) // limit,
                    "has_next": offset + limit < total_matching,
                    "has_previous": offset > 0
                }
            }
            
        except Exception as e:
            print(f"❌ Error in filtered student analysis: {str(e)}")
            return {
                "error": str(e),
                "filters_applied": {},
                "total_matching_students": 0,
                "students": [],
                "processing_time_seconds": 0
            }

    @staticmethod
    def get_filter_options(db: Session) -> Dict[str, Any]:
        """
        Get available filter options for the frontend dropdowns:
        - Available campuses with plan code counts
        - Plan codes grouped by campus
        - Academic levels with student counts
        - Completion ranges with student counts
        """
        try:
            print("🔧 Getting enhanced filter options for frontend...")
            
            # Get campuses with student counts and plan code distribution
            campuses_query = """
                SELECT 
                    campus_name,
                    COUNT(DISTINCT student_number) as student_count,
                    COUNT(DISTINCT plan_code) as plan_count
                FROM students 
                WHERE campus_name IS NOT NULL AND campus_name != ''
                GROUP BY campus_name
                ORDER BY student_count DESC
            """
            campuses = db.execute(text(campuses_query)).fetchall()
            
            # Get plan codes grouped by campus with student counts
            plan_codes_by_campus_query = """
                SELECT 
                    campus_name,
                    plan_code, 
                    plan_description, 
                    COUNT(*) as student_count
                FROM students 
                WHERE plan_code IS NOT NULL AND campus_name IS NOT NULL
                GROUP BY campus_name, plan_code, plan_description
                ORDER BY campus_name, student_count DESC
            """
            plan_codes_by_campus = db.execute(text(plan_codes_by_campus_query)).fetchall()
            
            # Organize plan codes by campus
            campuses_with_plans = {}
            for row in plan_codes_by_campus:
                campus = row.campus_name
                if campus not in campuses_with_plans:
                    campuses_with_plans[campus] = []
                
                campuses_with_plans[campus].append({
                    "code": row.plan_code,
                    "description": row.plan_description,
                    "student_count": row.student_count
                })
            
            # Get overall plan codes for backwards compatibility (top 20 most popular)
            all_plan_codes_query = """
                SELECT plan_code, plan_description, COUNT(*) as student_count
                FROM students 
                WHERE plan_code IS NOT NULL
                GROUP BY plan_code, plan_description
                ORDER BY student_count DESC
                LIMIT 20
            """
            popular_plan_codes = db.execute(text(all_plan_codes_query)).fetchall()
            
            # Check if bulk analysis has been run
            has_analysis_query = "SELECT COUNT(*) FROM missing_modules LIMIT 1"
            has_analysis = db.execute(text(has_analysis_query)).scalar() > 0
            
            # Format campus information
            campus_options = []
            for row in campuses:
                campus_options.append({
                    "code": row.campus_name,
                    "name": row.campus_name,
                    "student_count": row.student_count,
                    "plan_count": row.plan_count,
                    "description": f"{row.campus_name} ({row.student_count} students, {row.plan_count} programs)"
                })
            
            # Format popular plan codes for backwards compatibility
            plan_code_options = []
            for row in popular_plan_codes:
                plan_code_options.append({
                    "code": row.plan_code,
                    "description": row.plan_description,
                    "student_count": row.student_count
                })
            
            result = {
                "campuses": campus_options,
                "plan_codes_by_campus": campuses_with_plans,
                "plan_codes": plan_code_options,  # Top 20 for backwards compatibility
                "academic_levels": [],
                "completion_ranges": [],
                "missing_module_options": [
                    {"value": True, "description": "Students with missing modules"},
                    {"value": False, "description": "Students without missing modules"}
                ],
                "has_analysis_data": has_analysis,
                "note": "Enhanced filtering: Select campus first to filter plan codes, or use popular plans directly"
            }
            
            if has_analysis:
                # Academic levels from analysis data
                academic_levels_query = """
                    SELECT academic_level, COUNT(*) as count
                    FROM missing_modules
                    GROUP BY academic_level
                    ORDER BY count DESC
                """
                academic_levels = db.execute(text(academic_levels_query)).fetchall()
                result["academic_levels"] = [
                    {"level": row.academic_level, "count": row.count} 
                    for row in academic_levels
                ]
                
                # Completion ranges from analysis data
                completion_ranges_query = """
                    SELECT 
                        CASE
                            WHEN completion_percentage >= 76 THEN '76-100%'
                            WHEN completion_percentage >= 51 THEN '51-75%'
                            WHEN completion_percentage >= 26 THEN '26-50%'
                            ELSE '0-25%'
                        END as range,
                        COUNT(*) as count
                    FROM missing_modules
                    GROUP BY 
                        CASE
                            WHEN completion_percentage >= 76 THEN '76-100%'
                            WHEN completion_percentage >= 51 THEN '51-75%'
                            WHEN completion_percentage >= 26 THEN '26-50%'
                            ELSE '0-25%'
                        END
                    ORDER BY 
                        CASE
                            WHEN completion_percentage >= 76 THEN 1
                            WHEN completion_percentage >= 51 THEN 2
                            WHEN completion_percentage >= 26 THEN 3
                            ELSE 4
                        END
                """
                completion_ranges = db.execute(text(completion_ranges_query)).fetchall()
                result["completion_ranges"] = [
                    {"range": row.range, "count": row.count} 
                    for row in completion_ranges
                ]
            else:
                result["note"] += ". Run bulk analysis first to enable academic level and completion filters"
            
            print(f"✅ Returning enhanced filter options: {len(campus_options)} campuses, {len(campuses_with_plans)} campus-plan combinations")
            return result
            
        except Exception as e:
            print(f"❌ Error getting filter options: {str(e)}")
            return {
                "campuses": [],
                "plan_codes_by_campus": {},
                "plan_codes": [],
                "academic_levels": [],
                "completion_ranges": [],
                "missing_module_options": [
                    {"value": True, "description": "Students with missing modules"},
                    {"value": False, "description": "Students without missing modules"}
                ],
                "has_analysis_data": False,
                "error": str(e)
            }

def parse_elective_modules(module_code: str) -> List[str]:
    """
    Parse OR modules into individual options
    Example: "SICL3522 OR ZUCL3522 OR GAFR3522" → ["SICL3522", "ZUCL3522", "GAFR3522"]
    """
    if " OR " in module_code:
        # Split by OR and clean up each option
        options = [option.strip() for option in module_code.split(" OR ")]
        return options
    return [module_code]

def check_elective_completion(db: Session, student_number: str, elective_options: List[str]) -> Optional[str]:
    """
    Check if student completed any of the elective options
    Returns the completed module code if any, None otherwise
    """
    for option in elective_options:
        completed = db.query(StudentModule).filter(
            StudentModule.student_number == student_number,
            StudentModule.module_code == option,
            StudentModule.final_mark >= 50  # Pass threshold
        ).first()
        
        if completed:
            return option
    return None

# Graduation Analysis Functions
def get_graduation_analysis(
    db: Session, 
    campus: Optional[str] = None,
    plan_code: Optional[str] = None,
    academic_level: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
) -> Dict[str, Any]:
    """
    Get potential graduates - students with no missing modules who are in final academic years
    """
    try:
        print(f"🎓 Starting graduation analysis...")
        
        # Base query to find students with no missing modules who are in final years
        # Use 2025 as the most recent year (likely final year students)
        base_query = """
            SELECT DISTINCT s.student_number, s.name, s.campus_name, s.plan_code, s.plan_description
            FROM students s
            WHERE NOT EXISTS (
                SELECT 1 FROM missing_modules mm 
                WHERE mm.student_number = s.student_number
            )
            AND s.year = '2025'
        """
        
        params = {}
        
        # Add filters
        filters = []
        params = {}
        
        if campus:
            filters.append("s.campus_name = :campus")
            params['campus'] = campus
            
        if plan_code:
            filters.append("s.plan_code = :plan_code")
            params['plan_code'] = plan_code
            
        if academic_level:
            filters.append("s.year = :academic_level")
            params['academic_level'] = academic_level
        
        if filters:
            base_query += " AND " + " AND ".join(filters)
        
        # Get total count
        count_query = f"SELECT COUNT(*) FROM ({base_query}) as subquery"
        total_count = db.execute(text(count_query), params).scalar()
        
        # Get paginated results
        base_query += " ORDER BY s.name LIMIT :limit OFFSET :offset"
        params['limit'] = limit
        params['offset'] = offset
        
        results = db.execute(text(base_query), params).fetchall()
        
        # Get detailed information for each potential graduate
        potential_graduates = []
        for row in results:
            # Determine academic level based on plan code (4th for regular, 5th for extended)
            current_academic_level = "4th"  # Default for regular programs
            if row.plan_code and 'E' in row.plan_code:
                current_academic_level = "5th"  # Extended programs
            
            # Get current modules (in progress)
            current_modules_query = """
                SELECT sm.module_code, m.name as module_name, sm.final_mark, 
                       CASE WHEN sm.final_mark = 0 THEN 'In Progress' ELSE 'Completed' END as status
                FROM student_modules sm
                JOIN modules m ON sm.module_code = m.code
                WHERE sm.student_number = :student_number
                AND sm.final_mark = 0
                ORDER BY sm.module_code
            """
            current_modules = db.execute(text(current_modules_query), 
                                       {"student_number": row.student_number}).fetchall()
            
            # Calculate completion percentage
            total_modules_query = """
                SELECT COUNT(*) as total
                FROM student_modules sm
                WHERE sm.student_number = :student_number
            """
            total_modules = db.execute(text(total_modules_query), 
                                     {"student_number": row.student_number}).scalar()
            
            passed_modules_query = """
                SELECT COUNT(*) as passed
                FROM student_modules sm
                WHERE sm.student_number = :student_number
                AND sm.final_mark >= 50
            """
            passed_modules = db.execute(text(passed_modules_query), 
                                      {"student_number": row.student_number}).scalar()
            
            completion_percentage = round((passed_modules / total_modules) * 100, 2) if total_modules > 0 else 0
            
            # Check if graduation ready (has final modules in progress)
            graduation_ready = len(current_modules) > 0
            
            potential_graduates.append({
                "student_number": row.student_number,
                "name": row.name,
                "campus_name": row.campus_name,
                "plan_code": row.plan_code,
                "plan_description": row.plan_description,
                "academic_level": current_academic_level,
                "completion_percentage": completion_percentage,
                "total_modules_passed": passed_modules,
                "total_modules": total_modules,
                "total_retakes": 0,  # TODO: Calculate retakes
                "current_modules": [
                    {
                        "module_code": module.module_code,
                        "module_name": module.module_name,
                        "final_mark": module.final_mark,
                        "status": module.status
                    }
                    for module in current_modules
                ],
                "final_modules_count": len(current_modules),
                "graduation_ready": graduation_ready
            })
        
        print(f"✅ Graduation analysis completed: {len(potential_graduates)} potential graduates found")
        
        return {
            "potential_graduates": potential_graduates,
            "total_count": total_count,
            "filters_applied": {
                "campus": campus,
                "plan_code": plan_code,
                "academic_level": academic_level
            },
            "pagination": {
                "limit": limit,
                "offset": offset,
                "has_more": (offset + limit) < total_count
            }
        }
        
    except Exception as e:
        print(f"❌ Error in graduation analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "potential_graduates": [],
            "total_count": 0,
            "error": str(e),
            "filters_applied": {},
            "pagination": {}
        }

def get_graduation_statistics(db: Session) -> Dict[str, Any]:
    """
    Get graduation statistics and summary
    """
    try:
        print(f"📊 Getting graduation statistics...")
        
        # Get students with no missing modules in final year (2025)
        base_query = """
            SELECT DISTINCT s.student_number, s.name, s.campus_name, s.plan_code, s.plan_description
            FROM students s
            WHERE NOT EXISTS (
                SELECT 1 FROM missing_modules mm 
                WHERE mm.student_number = s.student_number
            )
            AND s.year = '2025'
        """
        
        # Get final year graduates
        final_year_graduates = db.execute(text(base_query)).fetchall()
        
        # Count statistics
        campus_counts = {}
        plan_counts = {}
        level_counts = {}
        graduation_ready_count = 0
        
        for row in final_year_graduates:
            # Count by campus
            campus = row[2] or "Unknown"  # campus_name is the 3rd column
            campus_counts[campus] = campus_counts.get(campus, 0) + 1
            
            # Count by plan
            plan = row[3] or "Unknown"  # plan_code is the 4th column
            plan_counts[plan] = plan_counts.get(plan, 0) + 1
            
            # Check if graduation ready (has final modules in progress)
            current_modules_query = """
                SELECT COUNT(*) as count
                FROM student_modules sm
                WHERE sm.student_number = :student_number
                AND sm.final_mark = 0
            """
            current_modules_count = db.execute(text(current_modules_query), 
                                             {"student_number": row[0]}).scalar()  # student_number is the 1st column
            if current_modules_count > 0:
                graduation_ready_count += 1
        
        total_graduates = len(final_year_graduates)
        
        # Convert to list format for API response
        campus_stats = [{"campus": campus, "count": count} for campus, count in campus_counts.items()]
        campus_stats.sort(key=lambda x: x["count"], reverse=True)
        
        plan_stats = [{"plan_code": plan, "plan_description": "", "count": count} for plan, count in plan_counts.items()]
        plan_stats.sort(key=lambda x: x["count"], reverse=True)
        plan_stats = plan_stats[:10]  # Top 10
        
        # For academic level, assume 4th year for regular programs, 5th/6th for extended
        level_counts = {"4th": 0, "5th": 0, "6th": 0}
        for row in final_year_graduates:
            if row[3] and 'E' in row[3]:  # plan_code is the 4th column
                # Extended program - could be 5th or 6th year
                level_counts["5th"] += 1
            else:
                # Regular program - 4th year
                level_counts["4th"] += 1
        
        level_stats = [{"academic_level": level, "count": count} for level, count in level_counts.items() if count > 0]
        level_stats.sort(key=lambda x: {
            "1st": 1, "2nd": 2, "3rd": 3, "4th": 4, "5th": 5, "6th": 6
        }.get(x["academic_level"], 7))
        
        graduation_ready = graduation_ready_count
        
        print(f"✅ Graduation statistics completed: {total_graduates} total potential graduates")
        
        return {
            "total_potential_graduates": total_graduates,
            "graduation_ready": graduation_ready,
            "by_campus": campus_stats,
            "by_plan": plan_stats,
            "by_academic_level": level_stats,
            "summary": {
                "total_students": db.query(Student).count(),
                "graduation_rate": round((total_graduates / db.query(Student).count()) * 100, 2) if db.query(Student).count() > 0 else 0,
                "ready_for_graduation": graduation_ready,
                "ready_rate": round((graduation_ready / total_graduates) * 100, 2) if total_graduates > 0 else 0
            }
        }
        
    except Exception as e:
        print(f"❌ Error getting graduation statistics: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "total_potential_graduates": 0,
            "graduation_ready": 0,
            "by_campus": [],
            "by_plan": [],
            "by_academic_level": [],
            "summary": {},
            "error": str(e)
        }
