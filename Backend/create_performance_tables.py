#!/usr/bin/env python3
"""
Performance optimization database migration script
Adds indexes, materialized views, and pre-calculated tables for ultra-fast queries
"""

import os
import sys
from sqlalchemy import text, create_engine
from sqlalchemy.orm import sessionmaker
from app.database import get_database_info, engine
from app.models import Base, StudentAnalysisSummary, DashboardStatistics, ModulePerformanceStats

def create_performance_indexes(engine):
    """Create performance indexes for critical tables"""
    indexes = [
        # Student table indexes
        "CREATE INDEX IF NOT EXISTS idx_students_plan_code ON students(plan_code)",
        "CREATE INDEX IF NOT EXISTS idx_students_campus_year ON students(campus_name, year)",
        "CREATE INDEX IF NOT EXISTS idx_students_plan_year ON students(plan_code, year)",
        "CREATE INDEX IF NOT EXISTS idx_students_search ON students(name, student_number)",
        
        # StudentModule table indexes (most critical for performance)
        "CREATE INDEX IF NOT EXISTS idx_student_modules_student ON student_modules(student_number)",
        "CREATE INDEX IF NOT EXISTS idx_student_modules_module ON student_modules(module_code)",
        "CREATE INDEX IF NOT EXISTS idx_student_modules_year ON student_modules(year_taken)",
        "CREATE INDEX IF NOT EXISTS idx_student_modules_marks ON student_modules(final_mark, final_mark_description)",
        "CREATE INDEX IF NOT EXISTS idx_student_modules_student_year ON student_modules(student_number, year_taken)",
        "CREATE INDEX IF NOT EXISTS idx_student_modules_student_module ON student_modules(student_number, module_code)",
        "CREATE INDEX IF NOT EXISTS idx_student_modules_composite ON student_modules(student_number, year_taken, final_mark)",
        "CREATE INDEX IF NOT EXISTS idx_student_modules_passed ON student_modules(student_number, final_mark)",
        
        # MissingModule table indexes
        "CREATE INDEX IF NOT EXISTS idx_missing_modules_student ON missing_modules(student_number)",
        "CREATE INDEX IF NOT EXISTS idx_missing_modules_module ON missing_modules(module_code)",
        "CREATE INDEX IF NOT EXISTS idx_missing_modules_year ON missing_modules(required_year)",
        "CREATE INDEX IF NOT EXISTS idx_missing_modules_phase ON missing_modules(phase)",
        "CREATE INDEX IF NOT EXISTS idx_missing_modules_priority ON missing_modules(priority)",
        "CREATE INDEX IF NOT EXISTS idx_missing_modules_student_year ON missing_modules(student_number, required_year)",
        "CREATE INDEX IF NOT EXISTS idx_missing_modules_count ON missing_modules(student_number, phase)",
        
        # Plan modules table indexes
        "CREATE INDEX IF NOT EXISTS idx_plan_modules_plan_code ON plan_modules(plan_code)",
        "CREATE INDEX IF NOT EXISTS idx_plan_modules_year_phase ON plan_modules(year, phase)",
        "CREATE INDEX IF NOT EXISTS idx_plan_modules_composite ON plan_modules(plan_code, year, phase)",
        
        # Module table indexes
        "CREATE INDEX IF NOT EXISTS idx_modules_name ON modules(name)",
        "CREATE INDEX IF NOT EXISTS idx_modules_phase ON modules(phase)",
        "CREATE INDEX IF NOT EXISTS idx_modules_search ON modules(code, name)",
        
        # Plan codes table indexes
        "CREATE INDEX IF NOT EXISTS idx_plan_codes_phase ON plan_codes(phase)",
        "CREATE INDEX IF NOT EXISTS idx_plan_codes_specialisation ON plan_codes(specialisation)",
        "CREATE INDEX IF NOT EXISTS idx_plan_codes_search ON plan_codes(code, description)",
        
        # Audit logs table indexes
        "CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp)",
        "CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id)",
        "CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, timestamp)"
    ]
    
    print("🔧 Creating performance indexes...")
    
    with engine.connect() as conn:
        for i, index_sql in enumerate(indexes, 1):
            try:
                conn.execute(text(index_sql))
                print(f"   ✅ {i}/{len(indexes)}: Created index")
            except Exception as e:
                print(f"   ⚠️  {i}/{len(indexes)}: Index already exists or error: {str(e)[:50]}")
        
        conn.commit()
    
    print("✅ Performance indexes created successfully!")

def create_performance_tables(engine):
    """Create performance optimization tables"""
    print("🔧 Creating performance optimization tables...")
    
    try:
        # Create all tables defined in models
        Base.metadata.create_all(bind=engine)
        print("✅ Performance tables created successfully!")
    except Exception as e:
        print(f"❌ Error creating tables: {str(e)}")

def create_postgresql_materialized_views(engine):
    """Create PostgreSQL materialized views for ultra-fast queries"""
    db_info = get_database_info()
    
    if not db_info.get("is_postgresql", False):
        print("⚠️  Skipping materialized views - PostgreSQL not detected")
        return
    
    materialized_views = [
        # Student progress materialized view
        """
        CREATE MATERIALIZED VIEW IF NOT EXISTS mv_student_progress AS
        SELECT 
            s.student_number,
            s.name as student_name,
            s.plan_code,
            s.campus_name,
            COUNT(sm.id) as total_modules_attempted,
            COUNT(CASE WHEN sm.final_mark >= 50 THEN 1 END) as modules_passed,
            COUNT(CASE WHEN sm.final_mark < 50 AND sm.final_mark > 0 THEN 1 END) as modules_failed,
            COUNT(CASE WHEN sm.final_mark = 0 OR sm.final_mark IS NULL THEN 1 END) as modules_in_progress,
            AVG(CASE WHEN sm.final_mark > 0 THEN sm.final_mark END) as average_mark,
            MAX(sm.year_taken) as latest_year
        FROM students s
        LEFT JOIN student_modules sm ON s.student_number = sm.student_number
        GROUP BY s.student_number, s.name, s.plan_code, s.campus_name
        """,
        
        # Module performance materialized view
        """
        CREATE MATERIALIZED VIEW IF NOT EXISTS mv_module_performance AS
        SELECT 
            m.code as module_code,
            m.name as module_name,
            COUNT(sm.id) as total_enrollments,
            COUNT(CASE WHEN sm.final_mark >= 50 THEN 1 END) as total_passes,
            COUNT(CASE WHEN sm.final_mark < 50 AND sm.final_mark > 0 THEN 1 END) as total_fails,
            ROUND(AVG(CASE WHEN sm.final_mark > 0 THEN sm.final_mark END), 2) as average_mark,
            ROUND(
                (COUNT(CASE WHEN sm.final_mark >= 50 THEN 1 END)::float / 
                 NULLIF(COUNT(CASE WHEN sm.final_mark > 0 THEN 1 END), 0)) * 100, 2
            ) as pass_rate
        FROM modules m
        LEFT JOIN student_modules sm ON m.code = sm.module_code
        GROUP BY m.code, m.name
        """,
        
        # Plan code statistics materialized view
        """
        CREATE MATERIALIZED VIEW IF NOT EXISTS mv_plan_statistics AS
        SELECT 
            s.plan_code,
            COUNT(DISTINCT s.student_number) as total_students,
            COUNT(DISTINCT CASE WHEN mm.student_number IS NOT NULL THEN s.student_number END) as students_with_missing,
            AVG(
                CASE WHEN total_required.required_count > 0 THEN
                    (passed_count.passed_count::float / total_required.required_count) * 100
                ELSE 0 END
            ) as average_completion_percentage
        FROM students s
        LEFT JOIN missing_modules mm ON s.student_number = mm.student_number
        LEFT JOIN (
            SELECT 
                s2.student_number,
                COUNT(CASE WHEN sm2.final_mark >= 50 THEN 1 END) as passed_count
            FROM students s2
            LEFT JOIN student_modules sm2 ON s2.student_number = sm2.student_number
            GROUP BY s2.student_number
        ) passed_count ON s.student_number = passed_count.student_number
        LEFT JOIN (
            SELECT 
                s3.plan_code,
                COUNT(DISTINCT pm.module_code) as required_count
            FROM students s3
            LEFT JOIN plan_modules pm ON s3.plan_code = pm.plan_code
            GROUP BY s3.plan_code
        ) total_required ON s.plan_code = total_required.plan_code
        WHERE s.plan_code IS NOT NULL
        GROUP BY s.plan_code
        """
    ]
    
    print("🔧 Creating PostgreSQL materialized views...")
    
    with engine.connect() as conn:
        for i, view_sql in enumerate(materialized_views, 1):
            try:
                conn.execute(text(view_sql))
                print(f"   ✅ {i}/{len(materialized_views)}: Created materialized view")
            except Exception as e:
                print(f"   ⚠️  {i}/{len(materialized_views)}: View already exists or error: {str(e)[:80]}")
        
        conn.commit()
    
    print("✅ Materialized views created successfully!")

def create_refresh_functions(engine):
    """Create PostgreSQL functions to refresh materialized views"""
    db_info = get_database_info()
    
    if not db_info.get("is_postgresql", False):
        print("⚠️  Skipping refresh functions - PostgreSQL not detected")
        return
    
    refresh_function = """
    CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
    RETURNS void AS $$
    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_student_progress;
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_module_performance;
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_plan_statistics;
    END;
    $$ LANGUAGE plpgsql;
    """
    
    print("🔧 Creating materialized view refresh functions...")
    
    with engine.connect() as conn:
        try:
            conn.execute(text(refresh_function))
            conn.commit()
            print("✅ Refresh functions created successfully!")
        except Exception as e:
            print(f"⚠️  Error creating refresh functions: {str(e)[:100]}")

def main():
    """Main migration function"""
    print("🚀 Starting performance optimization migration...")
    print(f"Database: {get_database_info()}")
    
    try:
        # Step 1: Create performance tables
        create_performance_tables(engine)
        
        # Step 2: Create indexes
        create_performance_indexes(engine)
        
        # Step 3: Create materialized views (PostgreSQL only)
        create_postgresql_materialized_views(engine)
        
        # Step 4: Create refresh functions (PostgreSQL only)
        create_refresh_functions(engine)
        
        print("\n✅ Performance optimization migration completed successfully!")
        print("\n📊 Next steps:")
        print("1. Restart your FastAPI server to use new indexes")
        print("2. Call /api/performance/refresh-analysis to populate pre-calculated data")
        print("3. Call /api/performance/refresh-dashboard-stats to populate dashboard cache")
        print("4. Use /api/fast-bulk-analysis instead of /api/bulk-comprehensive-analysis")
        print("5. Monitor performance improvements with /api/performance/cache-status")
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 