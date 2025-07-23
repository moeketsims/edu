#!/usr/bin/env python3
"""
Data Migration Script: SQLite to PostgreSQL
Migrates all student data from SQLite to PostgreSQL for performance optimizations
"""

import os
import sys
import sqlite3
import psycopg2
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import pandas as pd
from datetime import datetime

def migrate_data():
    print("🔄 Starting SQLite to PostgreSQL migration...")
    
    # Connect to SQLite
    sqlite_path = "./student_module_checker.db"
    if not os.path.exists(sqlite_path):
        print(f"❌ SQLite database not found: {sqlite_path}")
        return False
    
    sqlite_conn = sqlite3.connect(sqlite_path)
    print(f"✅ Connected to SQLite: {sqlite_path}")
    
    # Connect to PostgreSQL
    pg_url = "postgresql://edu_user:edu_password@postgres:5432/edu_database"
    try:
        pg_engine = create_engine(pg_url)
        with pg_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✅ Connected to PostgreSQL")
    except Exception as e:
        print(f"❌ PostgreSQL connection failed: {e}")
        return False
    
    # Get all tables from SQLite
    cursor = sqlite_conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    print(f"📊 Found {len(tables)} tables in SQLite: {tables}")
    
    # Migration order (to handle foreign key constraints)
    migration_order = [
        'students',
        'modules', 
        'plan_codes',
        'student_modules',
        'missing_modules'
    ]
    
    migrated_counts = {}
    
    for table in migration_order:
        if table not in tables:
            print(f"⚠️  Table '{table}' not found in SQLite, skipping...")
            continue
            
        try:
            print(f"\n🔄 Migrating table: {table}")
            
            # Read data from SQLite
            df = pd.read_sql_query(f"SELECT * FROM {table}", sqlite_conn)
            print(f"   📊 Found {len(df)} rows in SQLite")
            
            if len(df) == 0:
                print(f"   ⚠️  No data to migrate for {table}")
                continue
            
            # Clear existing data in PostgreSQL
            with pg_engine.connect() as conn:
                conn.execute(text(f"DELETE FROM {table}"))
                conn.commit()
                print(f"   🗑️  Cleared existing data in PostgreSQL")
            
            # Insert data into PostgreSQL
            df.to_sql(table, pg_engine, if_exists='append', index=False, method='multi')
            
            # Verify migration
            with pg_engine.connect() as conn:
                result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                pg_count = result.scalar()
            
            migrated_counts[table] = {'sqlite': len(df), 'postgresql': pg_count}
            print(f"   ✅ Migrated {len(df)} rows → PostgreSQL has {pg_count} rows")
            
        except Exception as e:
            print(f"   ❌ Failed to migrate {table}: {e}")
            continue
    
    sqlite_conn.close()
    
    # Summary
    print("\n" + "="*60)
    print("📊 MIGRATION SUMMARY")
    print("="*60)
    total_sqlite = 0
    total_postgresql = 0
    
    for table, counts in migrated_counts.items():
        sqlite_rows = counts['sqlite']
        pg_rows = counts['postgresql']
        status = "✅" if sqlite_rows == pg_rows else "⚠️"
        print(f"{status} {table:20} | SQLite: {sqlite_rows:6,} → PostgreSQL: {pg_rows:6,}")
        total_sqlite += sqlite_rows
        total_postgresql += pg_rows
    
    print("-" * 60)
    print(f"🎯 TOTAL:              | SQLite: {total_sqlite:6,} → PostgreSQL: {total_postgresql:6,}")
    
    if total_sqlite == total_postgresql:
        print("🎉 Migration completed successfully!")
        return True
    else:
        print("⚠️  Migration completed with some discrepancies")
        return False

if __name__ == "__main__":
    print("🚀 SQLite to PostgreSQL Data Migration")
    print("=" * 50)
    success = migrate_data()
    
    if success:
        print("\n✅ All data migrated successfully!")
        print("🔥 Performance optimizations are now active!")
    else:
        print("\n⚠️  Migration completed with issues")
    
    print("\n🔄 Next steps:")
    print("1. Refresh performance tables: curl -X POST http://localhost:8000/api/performance/refresh-analysis")
    print("2. Test fast endpoints: curl -X POST http://localhost:8000/api/fast-bulk-analysis") 