"""
Performance optimization service for Student Module Checker
Handles caching, pre-calculated tables, and background data refresh
"""

import time
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from sqlalchemy.exc import SQLAlchemyError
import json
import logging

from app.models import (
    Student, StudentModule, MissingModule, plan_modules,
    StudentAnalysisSummary, DashboardStatistics, ModulePerformanceStats
)
from app.database import get_database_info

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PerformanceService:
    """Service for performance optimization and caching"""
    
    # In-memory cache
    _cache = {}
    _cache_timestamps = {}
    _cache_ttl = 300  # 5 minutes default TTL
    
    @classmethod
    def get_cached(cls, key: str, ttl_seconds: int = None) -> Optional[Any]:
        """Get data from cache if not expired"""
        ttl = ttl_seconds or cls._cache_ttl
        
        if key in cls._cache and key in cls._cache_timestamps:
            age = time.time() - cls._cache_timestamps[key]
            if age < ttl:
                logger.info(f"Cache HIT for {key} (age: {age:.1f}s)")
                return cls._cache[key]
            else:
                logger.info(f"Cache EXPIRED for {key} (age: {age:.1f}s)")
                cls.invalidate_cache(key)
        
        logger.info(f"Cache MISS for {key}")
        return None
    
    @classmethod
    def set_cache(cls, key: str, data: Any):
        """Set data in cache"""
        cls._cache[key] = data
        cls._cache_timestamps[key] = time.time()
        logger.info(f"Cache SET for {key}")
    
    @classmethod
    def invalidate_cache(cls, key: str = None):
        """Invalidate cache entry or all cache"""
        if key:
            cls._cache.pop(key, None)
            cls._cache_timestamps.pop(key, None)
            logger.info(f"Cache INVALIDATED for {key}")
        else:
            cls._cache.clear()
            cls._cache_timestamps.clear()
            logger.info("All cache INVALIDATED")
    
    @staticmethod
    def refresh_student_analysis_summary(db: Session, plan_code: Optional[str] = None) -> Dict[str, Any]:
        """
        Refresh the pre-calculated student analysis summary table
        This replaces the need for bulk comprehensive analysis on every request
        """
        start_time = time.time()
        
        try:
            logger.info(f"🔄 Refreshing student analysis summary (plan_code={plan_code})...")
            
            # Clear existing data for the specified plan or all
            if plan_code:
                db.execute(text("DELETE FROM student_analysis_summary WHERE plan_code = :plan_code"), 
                          {"plan_code": plan_code})
            else:
                db.execute(text("DELETE FROM student_analysis_summary"))
            db.commit()
            
            # Get students to process
            if plan_code:
                students = db.query(Student).filter(Student.plan_code == plan_code).all()
            else:
                students = db.query(Student).all()
            
            if not students:
                return {"status": "completed", "students_processed": 0, "processing_time": 0}
            
            logger.info(f"📊 Processing {len(students):,} students...")
            
            # Get all student modules in one query for efficiency
            if plan_code:
                student_modules_query = text("""
                    SELECT sm.student_number, sm.module_code, sm.year_taken, sm.final_mark, sm.final_mark_description
                    FROM student_modules sm
                    JOIN students s ON sm.student_number = s.student_number
                    WHERE s.plan_code = :plan_code
                    ORDER BY sm.student_number, sm.year_taken
                """)
                all_modules = db.execute(student_modules_query, {"plan_code": plan_code}).fetchall()
            else:
                all_modules = db.execute(text("""
                    SELECT student_number, module_code, year_taken, final_mark, final_mark_description
                    FROM student_modules
                    ORDER BY student_number, year_taken
                """)).fetchall()
            
            # Group modules by student
            modules_by_student = {}
            for module in all_modules:
                student_num = module.student_number
                if student_num not in modules_by_student:
                    modules_by_student[student_num] = []
                modules_by_student[student_num].append(module)
            
            # Get plan requirements
            if plan_code:
                plan_requirements = db.query(plan_modules).filter(plan_modules.c.plan_code == plan_code).all()
            else:
                plan_requirements = db.query(plan_modules).all()
            
            # Group requirements by plan and year
            requirements_by_plan_year = {}
            for req in plan_requirements:
                plan = req.plan_code
                year = req.year or "First Year"
                
                if plan not in requirements_by_plan_year:
                    requirements_by_plan_year[plan] = {"1st": [], "2nd": [], "3rd": [], "4th": []}
                
                # Map year names to academic levels
                year_mapping = {
                    "First Year": "1st", "Second Year": "2nd",
                    "Third Year": "3rd", "Fourth Year": "4th"
                }
                mapped_year = year_mapping.get(year, "1st")
                requirements_by_plan_year[plan][mapped_year].append(req.module_code)
            
            # Process each student and calculate analysis data
            summary_records = []
            for student in students:
                try:
                    student_modules = modules_by_student.get(student.student_number, [])
                    plan = student.plan_code
                    
                    if not plan or plan not in requirements_by_plan_year:
                        continue
                    
                    # Calculate passed modules
                    passed_modules = set()
                    retakes = 0
                    latest_year = "2024"
                    
                    module_attempts = {}
                    for module in student_modules:
                        code = module.module_code
                        mark = module.final_mark
                        status = module.final_mark_description
                        year = module.year_taken or "2024"
                        
                        if year > latest_year:
                            latest_year = year
                        
                        # Track attempts for retake calculation
                        if code not in module_attempts:
                            module_attempts[code] = []
                        module_attempts[code].append({"mark": mark, "status": status, "year": year})
                        
                        # Check if passed (mark >= 50 and has status)
                        if mark and mark >= 50 and status and status != "---":
                            passed_modules.add(code)
                    
                    # Calculate retakes
                    for code, attempts in module_attempts.items():
                        if len(attempts) > 1:
                            retakes += len(attempts) - 1
                    
                    # Determine academic level based on course load and progression
                    requirements = requirements_by_plan_year[plan]
                    academic_level = "1st"
                    
                    # Check if student has passed all requirements for each year
                    if len(passed_modules.intersection(set(requirements["1st"]))) == len(requirements["1st"]):
                        academic_level = "2nd"
                        if len(passed_modules.intersection(set(requirements["2nd"]))) == len(requirements["2nd"]):
                            academic_level = "3rd"
                            if len(passed_modules.intersection(set(requirements["3rd"]))) == len(requirements["3rd"]):
                                academic_level = "4th"
                    
                    # Calculate total requirements and missing modules
                    all_requirements = set()
                    for year_reqs in requirements.values():
                        all_requirements.update(year_reqs)
                    
                    total_required = len(all_requirements)
                    total_passed = len(passed_modules.intersection(all_requirements))
                    missing_modules = len(all_requirements - passed_modules)
                    
                    completion_percentage = (total_passed / total_required * 100) if total_required > 0 else 0
                    
                    # Determine risk level
                    risk_level = "Low"
                    if completion_percentage < 25:
                        risk_level = "High"
                    elif completion_percentage < 50:
                        risk_level = "Medium"
                    
                    # Create summary record
                    summary_record = StudentAnalysisSummary(
                        student_number=student.student_number,
                        student_name=student.name,
                        plan_code=student.plan_code,
                        campus_name=student.campus_name,
                        academic_level=academic_level,
                        total_modules_passed=total_passed,
                        total_modules_required=total_required,
                        total_missing_modules=missing_modules,
                        completion_percentage=round(completion_percentage, 2),
                        total_retakes=retakes,
                        risk_level=risk_level,
                        last_activity_year=latest_year,
                        last_updated=datetime.now()
                    )
                    summary_records.append(summary_record)
                    
                except Exception as e:
                    logger.error(f"Error processing student {student.student_number}: {str(e)}")
                    continue
            
            # Bulk insert summary records
            if summary_records:
                db.bulk_save_objects(summary_records)
                db.commit()
                logger.info(f"✅ Inserted {len(summary_records):,} student analysis summary records")
            
            # Invalidate related cache
            PerformanceService.invalidate_cache("dashboard_stats")
            PerformanceService.invalidate_cache("student_analysis")
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            return {
                "status": "completed",
                "students_processed": len(summary_records),
                "processing_time_seconds": round(processing_time, 2),
                "plan_code": plan_code
            }
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error refreshing student analysis summary: {str(e)}")
            return {
                "status": "failed",
                "error": str(e),
                "students_processed": 0,
                "processing_time_seconds": time.time() - start_time
            }
    
    @staticmethod
    def refresh_dashboard_statistics(db: Session) -> Dict[str, Any]:
        """Refresh pre-calculated dashboard statistics"""
        start_time = time.time()
        
        try:
            logger.info("🔄 Refreshing dashboard statistics...")
            
            # Clear existing statistics
            db.execute(text("DELETE FROM dashboard_statistics"))
            db.commit()
            
            # Calculate global statistics
            global_stats = db.execute(text("""
                SELECT 
                    COUNT(*) as total_students,
                    COUNT(CASE WHEN total_missing_modules > 0 THEN 1 END) as students_with_missing,
                    AVG(completion_percentage) as avg_completion,
                    COUNT(CASE WHEN completion_percentage < 50 THEN 1 END) as students_at_risk,
                    COUNT(CASE WHEN total_missing_modules = 0 AND academic_level IN ('4th', '5th') THEN 1 END) as potential_graduates
                FROM student_analysis_summary
            """)).fetchone()
            
            if global_stats:
                global_record = DashboardStatistics(
                    stat_type='global',
                    stat_key='global',
                    total_students=global_stats.total_students or 0,
                    students_with_missing_modules=global_stats.students_with_missing or 0,
                    average_completion_percentage=round(global_stats.avg_completion or 0, 2),
                    students_at_risk=global_stats.students_at_risk or 0,
                    potential_graduates=global_stats.potential_graduates or 0,
                    last_calculated=datetime.now()
                )
                db.add(global_record)
            
            # Calculate statistics by plan code
            plan_stats = db.execute(text("""
                SELECT 
                    plan_code,
                    COUNT(*) as total_students,
                    COUNT(CASE WHEN total_missing_modules > 0 THEN 1 END) as students_with_missing,
                    AVG(completion_percentage) as avg_completion,
                    COUNT(CASE WHEN completion_percentage < 50 THEN 1 END) as students_at_risk,
                    COUNT(CASE WHEN total_missing_modules = 0 AND academic_level IN ('4th', '5th') THEN 1 END) as potential_graduates
                FROM student_analysis_summary
                WHERE plan_code IS NOT NULL
                GROUP BY plan_code
            """)).fetchall()
            
            for stat in plan_stats:
                plan_record = DashboardStatistics(
                    stat_type='plan_code',
                    stat_key=stat.plan_code,
                    total_students=stat.total_students or 0,
                    students_with_missing_modules=stat.students_with_missing or 0,
                    average_completion_percentage=round(stat.avg_completion or 0, 2),
                    students_at_risk=stat.students_at_risk or 0,
                    potential_graduates=stat.potential_graduates or 0,
                    last_calculated=datetime.now()
                )
                db.add(plan_record)
            
            # Calculate statistics by campus
            campus_stats = db.execute(text("""
                SELECT 
                    campus_name,
                    COUNT(*) as total_students,
                    COUNT(CASE WHEN total_missing_modules > 0 THEN 1 END) as students_with_missing,
                    AVG(completion_percentage) as avg_completion,
                    COUNT(CASE WHEN completion_percentage < 50 THEN 1 END) as students_at_risk,
                    COUNT(CASE WHEN total_missing_modules = 0 AND academic_level IN ('4th', '5th') THEN 1 END) as potential_graduates
                FROM student_analysis_summary
                WHERE campus_name IS NOT NULL
                GROUP BY campus_name
            """)).fetchall()
            
            for stat in campus_stats:
                campus_record = DashboardStatistics(
                    stat_type='campus',
                    stat_key=stat.campus_name,
                    total_students=stat.total_students or 0,
                    students_with_missing_modules=stat.students_with_missing or 0,
                    average_completion_percentage=round(stat.avg_completion or 0, 2),
                    students_at_risk=stat.students_at_risk or 0,
                    potential_graduates=stat.potential_graduates or 0,
                    last_calculated=datetime.now()
                )
                db.add(campus_record)
            
            db.commit()
            
            # Invalidate cache
            PerformanceService.invalidate_cache("dashboard_stats")
            
            end_time = time.time()
            logger.info(f"✅ Dashboard statistics refreshed in {end_time - start_time:.2f}s")
            
            return {
                "status": "completed",
                "processing_time_seconds": round(end_time - start_time, 2),
                "global_stats": global_stats._asdict() if global_stats else {},
                "plan_codes_processed": len(plan_stats),
                "campuses_processed": len(campus_stats)
            }
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error refreshing dashboard statistics: {str(e)}")
            return {
                "status": "failed",
                "error": str(e),
                "processing_time_seconds": time.time() - start_time
            }
    
    @staticmethod
    def get_fast_dashboard_stats(db: Session) -> Dict[str, Any]:
        """Get dashboard statistics from pre-calculated table (ultra-fast)"""
        cache_key = "dashboard_stats"
        cached_data = PerformanceService.get_cached(cache_key, ttl_seconds=300)  # 5 min cache
        
        if cached_data:
            return cached_data
        
        try:
            # Get global stats
            global_stats = db.query(DashboardStatistics).filter(
                DashboardStatistics.stat_type == 'global'
            ).first()
            
            # Get plan code stats
            plan_stats = db.query(DashboardStatistics).filter(
                DashboardStatistics.stat_type == 'plan_code'
            ).all()
            
            # Get campus stats
            campus_stats = db.query(DashboardStatistics).filter(
                DashboardStatistics.stat_type == 'campus'
            ).all()
            
            result = {
                "global": {
                    "total_students": global_stats.total_students if global_stats else 0,
                    "students_with_missing_modules": global_stats.students_with_missing_modules if global_stats else 0,
                    "average_completion_percentage": global_stats.average_completion_percentage if global_stats else 0,
                    "students_at_risk": global_stats.students_at_risk if global_stats else 0,
                    "potential_graduates": global_stats.potential_graduates if global_stats else 0,
                    "last_updated": global_stats.last_calculated.isoformat() if global_stats else None
                },
                "by_plan_code": {
                    stat.stat_key: {
                        "total_students": stat.total_students,
                        "students_with_missing_modules": stat.students_with_missing_modules,
                        "average_completion_percentage": stat.average_completion_percentage,
                        "students_at_risk": stat.students_at_risk,
                        "potential_graduates": stat.potential_graduates
                    } for stat in plan_stats
                },
                "by_campus": {
                    stat.stat_key: {
                        "total_students": stat.total_students,
                        "students_with_missing_modules": stat.students_with_missing_modules,
                        "average_completion_percentage": stat.average_completion_percentage,
                        "students_at_risk": stat.students_at_risk,
                        "potential_graduates": stat.potential_graduates
                    } for stat in campus_stats
                },
                "cache_status": "miss"
            }
            
            # Cache the result
            PerformanceService.set_cache(cache_key, result)
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting fast dashboard stats: {str(e)}")
            return {
                "global": {"total_students": 0, "students_with_missing_modules": 0},
                "by_plan_code": {},
                "by_campus": {},
                "error": str(e)
            }
    
    @staticmethod
    def get_fast_student_analysis(db: Session, 
                                 plan_code: Optional[str] = None,
                                 academic_level: Optional[str] = None,
                                 campus: Optional[str] = None,
                                 limit: int = 100,
                                 offset: int = 0) -> Dict[str, Any]:
        """Get student analysis from pre-calculated table (ultra-fast)"""
        
        try:
            # Build query from pre-calculated table
            query = db.query(StudentAnalysisSummary)
            
            # Apply filters
            if plan_code:
                query = query.filter(StudentAnalysisSummary.plan_code == plan_code)
            if academic_level:
                query = query.filter(StudentAnalysisSummary.academic_level == academic_level)
            if campus:
                query = query.filter(StudentAnalysisSummary.campus_name == campus)
            
            # Get total count
            total_count = query.count()
            
            # Apply pagination and get results
            results = query.offset(offset).limit(limit).all()
            
            # Convert to response format
            students = []
            for result in results:
                students.append({
                    "student_number": result.student_number,
                    "student_name": result.student_name,
                    "plan_code": result.plan_code,
                    "campus_name": result.campus_name,
                    "academic_level": result.academic_level,
                    "total_modules_passed": result.total_modules_passed,
                    "total_modules_required": result.total_modules_required,
                    "total_missing_modules": result.total_missing_modules,
                    "completion_percentage": result.completion_percentage,
                    "total_retakes": result.total_retakes,
                    "risk_level": result.risk_level,
                    "last_activity_year": result.last_activity_year,
                    "last_updated": result.last_updated.isoformat() if result.last_updated else None
                })
            
            return {
                "students": students,
                "total_count": total_count,
                "filters_applied": {
                    "plan_code": plan_code,
                    "academic_level": academic_level,
                    "campus": campus
                },
                "pagination": {
                    "limit": limit,
                    "offset": offset,
                    "has_more": offset + len(students) < total_count
                },
                "data_source": "pre_calculated_table"
            }
            
        except Exception as e:
            logger.error(f"Error getting fast student analysis: {str(e)}")
            return {
                "students": [],
                "total_count": 0,
                "error": str(e)
            }
    
    @staticmethod
    async def background_refresh_all(db: Session):
        """Background task to refresh all pre-calculated data"""
        logger.info("🔄 Starting background refresh of all pre-calculated data...")
        
        try:
            # Refresh student analysis summary
            summary_result = PerformanceService.refresh_student_analysis_summary(db)
            logger.info(f"Student analysis summary: {summary_result['status']}")
            
            # Refresh dashboard statistics
            stats_result = PerformanceService.refresh_dashboard_statistics(db)
            logger.info(f"Dashboard statistics: {stats_result['status']}")
            
            logger.info("✅ Background refresh completed successfully")
            
        except Exception as e:
            logger.error(f"❌ Background refresh failed: {str(e)}") 