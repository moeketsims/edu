#!/usr/bin/env python3
"""
FastAPI Student Module Checker - Backend API
Automates the process of identifying missing modules for BEd students
"""

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional, List
import pandas as pd
import os
from sqlalchemy import text

from app.database import get_db, create_tables, get_database_info
from app.models import Student, Module, StudentModule, PlanCode, MissingModule
from app.services import StudentService, ModuleService, PlanCodeService, DataLoaderService, ReportService
from app.schemas import (
    StudentCreate, ModuleCreate, StudentModuleCreate,
    StudentResponse, ModuleResponse, PlanCodeResponse, 
    MissingModuleResponse, DataLoadResult, SystemStats
)

# Create FastAPI app
app = FastAPI(
    title="Student Module Checker API",
    description="API for managing and analyzing student academic progress",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000", 
        "http://localhost:3001", 
        "http://127.0.0.1:3001",
        "http://localhost:3002", 
        "http://127.0.0.1:3002",
        "http://localhost:3003", 
        "http://127.0.0.1:3003",
        "http://localhost:3004", 
        "http://127.0.0.1:3004",
        "http://localhost:3005", 
        "http://127.0.0.1:3005",
        "http://localhost", 
        "http://127.0.0.1"
    ],  # React development server and Docker
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables on startup
@app.on_event("startup")
def startup_event():
    create_tables()

# Health check endpoint
@app.get("/")
def read_root():
    return {"message": "Student Module Checker API", "status": "healthy"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "database": get_database_info()}

# System statistics
@app.get("/stats", response_model=SystemStats)
def get_system_stats(db: Session = Depends(get_db)):
    return DataLoaderService.get_system_stats(db)

@app.get("/api/dashboard-stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get comprehensive dashboard statistics focused on graduation tracking"""
    return ReportService.get_dashboard_statistics(db)

# Database info endpoint
@app.get("/database-info")
def database_info():
    return get_database_info()

# ============================================================================
# PLAN CODE ENDPOINTS
# ============================================================================

@app.get("/api/plancodes/", response_model=List[PlanCodeResponse])
def get_plan_codes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all plan codes with pagination"""
    return PlanCodeService.get_plan_codes(db, skip=skip, limit=limit)

@app.get("/api/plancodes/{code}", response_model=PlanCodeResponse)
def get_plan_code(code: str, db: Session = Depends(get_db)):
    """Get plan code by code"""
    plan_code = PlanCodeService.get_plan_code(db, code)
    if plan_code is None:
        raise HTTPException(status_code=404, detail="Plan code not found")
    return plan_code

@app.get("/api/campuses/{campus}/plancodes")
def get_plan_codes_by_campus(campus: str, db: Session = Depends(get_db)):
    """Get plan codes available at a specific campus"""
    try:
        query = text("""
            SELECT plan_code, plan_description, COUNT(*) as student_count
            FROM students 
            WHERE campus_name = :campus AND plan_code IS NOT NULL
            GROUP BY plan_code, plan_description
            ORDER BY student_count DESC
        """)
        
        result = db.execute(query, {"campus": campus}).fetchall()
        
        plan_codes = [
            {
                "code": row.plan_code,
                "description": row.plan_description,
                "student_count": row.student_count
            }
            for row in result
        ]
        
        return {
            "campus": campus,
            "plan_codes": plan_codes,
            "total_programs": len(plan_codes)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting plan codes for campus: {str(e)}")

# ============================================================================
# DATA LOADING ENDPOINTS
# ============================================================================

@app.post("/api/load-student-data", response_model=DataLoadResult)
async def load_student_data(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Load student data from Excel file"""
    return await DataLoaderService.load_student_data(db, file)

@app.post("/api/load-allocated-modules", response_model=DataLoadResult)
async def load_allocated_modules(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Load allocated modules from CSV file"""
    return await DataLoaderService.load_allocated_modules(db, file)

# ============================================================================
# STUDENT ENDPOINTS
# ============================================================================

@app.get("/api/students/", response_model=List[StudentResponse])
def get_students(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all students with pagination"""
    return StudentService.get_students(db, skip=skip, limit=limit)

@app.get("/api/students/{student_number}", response_model=StudentResponse)
def get_student(student_number: str, db: Session = Depends(get_db)):
    """Get student by student number"""
    student = StudentService.get_student(db, student_number)
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

# ============================================================================
# MODULE ENDPOINTS
# ============================================================================

@app.get("/api/modules/", response_model=List[ModuleResponse])
def get_modules(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all modules with pagination"""
    return ModuleService.get_modules(db, skip=skip, limit=limit)

@app.get("/api/modules/{code}", response_model=ModuleResponse)
def get_module(code: str, db: Session = Depends(get_db)):
    """Get module by code"""
    module = ModuleService.get_module(db, code)
    if module is None:
        raise HTTPException(status_code=404, detail="Module not found")
    return module

# ============================================================================
# MISSING MODULES ENDPOINTS
# ============================================================================

@app.get("/api/missing-modules/{student_number}", response_model=List[MissingModuleResponse])
def check_missing_modules(student_number: str, db: Session = Depends(get_db)):
    """Check missing modules for a specific student"""
    return DataLoaderService.check_missing_modules_for_student(db, student_number)

@app.get("/api/missing-modules-report", response_model=List[MissingModuleResponse])
def generate_missing_modules_report(db: Session = Depends(get_db)):
    """Generate missing modules report for all students"""
    return DataLoaderService.generate_missing_modules_report(db)

@app.post("/api/bulk-check-missing-modules")
def bulk_check_missing_modules(db: Session = Depends(get_db)):
    """Bulk check missing modules for all students"""
    return DataLoaderService.bulk_check_missing_modules(db)

@app.get("/api/analyze-student-missing-modules/{student_number}")
def analyze_student_missing_modules(student_number: str, db: Session = Depends(get_db)):
    """Analyze missing modules for a specific student by year"""
    return DataLoaderService.analyze_student_missing_modules_by_year(db, student_number)

@app.post("/api/bulk-analyze-missing-modules")
def bulk_analyze_missing_modules(db: Session = Depends(get_db)):
    """Bulk analyze missing modules for all students by year"""
    return DataLoaderService.bulk_analyze_missing_modules_by_year(db)

@app.get("/api/comprehensive-student-analysis/{student_number}")
def comprehensive_student_analysis(student_number: str, db: Session = Depends(get_db)):
    """Get comprehensive student analysis with passed modules per year, retakes, and missing modules"""
    return DataLoaderService.get_comprehensive_student_analysis(db, student_number)

@app.post("/api/bulk-comprehensive-analysis")
def bulk_comprehensive_analysis(plan_code: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Bulk comprehensive analysis for all students using improved logic:
    - 100% full load academic level calculation (registration + passed)
    - Proper missing modules detection (excludes in-progress and future modules)
    - Accurate retake tracking
    """
    return ReportService.bulk_comprehensive_student_analysis(db, plan_code)

@app.get("/api/filtered-student-analysis")
def filtered_student_analysis(
    academic_level: Optional[str] = None,
    plan_code: Optional[str] = None,
    has_missing_modules: Optional[bool] = None,
    completion_range: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    Get filtered student analysis results for frontend:
    - Filter by academic level (1st, 2nd, 3rd, 4th)
    - Filter by plan code
    - Filter by students with/without missing modules
    - Filter by completion percentage range (0-25%, 26-50%, 51-75%, 76-100%)
    
    Examples:
    - /api/filtered-student-analysis?academic_level=1st&plan_code=QC735103&has_missing_modules=true
    - /api/filtered-student-analysis?completion_range=0-25%&plan_code=BC736314
    """
    return ReportService.get_filtered_student_analysis(
        db, academic_level, plan_code, has_missing_modules, completion_range, limit, offset
    )

@app.get("/api/filter-options")
def get_filter_options(db: Session = Depends(get_db)):
    """
    Get available filter options for frontend dropdowns:
    - Available plan codes with student counts
    - Academic levels
    - Completion ranges
    - Missing module options
    """
    return ReportService.get_filter_options(db)

# ============================================================================
# SUMMARY ENDPOINTS
# ============================================================================

@app.get("/api/test-summary")
def test_summary():
    """Test endpoint for summary"""
    return {"message": "Summary test endpoint works"}

@app.get("/api/summary/missing-modules")
def get_missing_modules_summary(db: Session = Depends(get_db)):
    """Get comprehensive summary of missing modules by phase and year"""
    return DataLoaderService.get_missing_modules_summary(db)

# ============================================================================
# EXPORT ENDPOINTS
# ============================================================================

@app.get("/api/export/missing-modules")
def export_missing_modules_report(format: str = "csv", db: Session = Depends(get_db)):
    """Export missing modules report (CSV or Excel)"""
    return DataLoaderService.export_missing_modules_report(db, format)

# ============================================================================
# GRADUATION ANALYSIS ENDPOINTS
# ============================================================================

@app.get("/api/graduation-analysis")
def get_graduation_analysis(
    campus: Optional[str] = None,
    plan_code: Optional[str] = None,
    academic_level: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get potential graduates - students with no missing modules who are registered for final modules"""
    try:
        from app.services import get_graduation_analysis
        return get_graduation_analysis(db, campus, plan_code, academic_level, limit, offset)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in graduation analysis: {str(e)}")

@app.get("/api/graduation-stats")
def get_graduation_statistics(db: Session = Depends(get_db)):
    """Get graduation statistics and summary"""
    try:
        from app.services import get_graduation_statistics
        return get_graduation_statistics(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting graduation statistics: {str(e)}")

@app.get("/api/debug/plan-modules/{plan_code}")
def debug_plan_modules(plan_code: str, db: Session = Depends(get_db)):
    """Debug endpoint to check plan_modules data"""
    from sqlalchemy import text
    try:
        # Get plan_modules data
        query = text("""
            SELECT module_code, year, phase, is_required, credits 
            FROM plan_modules 
            WHERE plan_code = :plan_code 
            ORDER BY year, module_code
            LIMIT 20
        """)
        result = db.execute(query, {"plan_code": plan_code}).fetchall()
        
        return {
            "plan_code": plan_code,
            "modules": [
                {
                    "module_code": row.module_code,
                    "year": row.year,
                    "phase": row.phase,
                    "is_required": row.is_required,
                    "credits": row.credits
                }
                for row in result
            ],
            "total_found": len(result)
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 