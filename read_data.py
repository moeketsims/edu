#!/usr/bin/env python3
"""
Script to read and explore data.xlsx file
"""

import pandas as pd
import sys
from pathlib import Path

def read_excel_file(filename):
    """
    Read Excel file and return DataFrame
    
    Args:
        filename (str): Path to the Excel file
        
    Returns:
        pandas.DataFrame: The loaded data
    """
    try:
        # Check if file exists
        file_path = Path(filename)
        if not file_path.exists():
            print(f"Error: File '{filename}' not found.")
            return None
        
        print(f"Reading '{filename}'...")
        
        # Read Excel file with proper headers (skip first 3 rows)
        print("Skipping first 3 rows to get proper headers...")
        df = pd.read_excel(filename, engine='openpyxl', skiprows=3)
        
        if df is not None and not df.empty:
            # Forward fill student information columns that should be the same for each student
            # These columns typically have the student info only in the first row for each student
            student_info_columns = [
                'STUDENT_NUMBER', 'NAME', 'YEAR', 'CAMPUS_NAME', 
                'PLAN_CODE', 'PLAN_DESCRIPTION'
            ]
            
            print("Forward filling student information columns...")
            for col in student_info_columns:
                if col in df.columns:
                    df[col] = df[col].ffill()
            
            print(f"✅ Successfully loaded '{filename}' and filled missing student information")
            return df
        else:
            print("❌ Failed to load any data from the file")
            return None
        
    except Exception as e:
        print(f"❌ Error reading '{filename}': {str(e)}")
        return None

def explore_data(df):
    """
    Display basic information about the DataFrame
    
    Args:
        df (pandas.DataFrame): The DataFrame to explore
    """
    if df is None:
        return
    
    print("\n" + "="*50)
    print("DATA EXPLORATION")
    print("="*50)
    
    # Basic info
    print(f"\n📊 Dataset Shape: {df.shape[0]} rows × {df.shape[1]} columns")
    
    # Column information
    print(f"\n📋 Columns ({len(df.columns)}):")
    for i, col in enumerate(df.columns, 1):
        print(f"  {i:2d}. {col}")
    
    # Data types
    print(f"\n🔍 Data Types:")
    print(df.dtypes)
    
    # First few rows
    print(f"\n👀 First 5 rows:")
    print(df.head())
    
    # Basic statistics for numeric columns
    numeric_cols = df.select_dtypes(include=['number']).columns
    if len(numeric_cols) > 0:
        print(f"\n📈 Basic Statistics (Numeric Columns):")
        print(df[numeric_cols].describe())
    
    # Missing values
    missing_values = df.isnull().sum()
    if missing_values.sum() > 0:
        print(f"\n⚠️  Missing Values:")
        for col, count in missing_values[missing_values > 0].items():
            print(f"  {col}: {count} missing ({count/len(df)*100:.1f}%)")
    else:
        print(f"\n✅ No missing values found")
    
    # Show unique students info after forward fill
    unique_students = df['STUDENT_NUMBER'].nunique() if 'STUDENT_NUMBER' in df.columns else 0
    if unique_students > 0:
        print(f"\n👥 Unique Students: {unique_students}")
        print(f"📚 Total Module Records: {len(df)}")
        print(f"📊 Average Modules per Student: {len(df)/unique_students:.1f}")
        
        # Show example of filled data for first student
        if 'STUDENT_NUMBER' in df.columns:
            first_student = df[df['STUDENT_NUMBER'].notna()].iloc[0]['STUDENT_NUMBER']
            first_student_data = df[df['STUDENT_NUMBER'] == first_student]
            if len(first_student_data) > 1:
                print(f"\n📝 Example - First student has {len(first_student_data)} module records")
                print("   Student info now properly filled across all module rows:")

def main():
    """Main function"""
    filename = "data.xlsx"
    
    print("📁 Excel File Reader")
    print("-" * 20)
    
    # Read the Excel file
    df = read_excel_file(filename)
    
    if df is not None:
        # Explore the data
        explore_data(df)
        
        # Ask user if they want to save as CSV
        print(f"\n💾 Would you like to save the data as CSV? (y/n): ", end="")
        try:
            choice = input().lower().strip()
            if choice in ['y', 'yes']:
                csv_filename = filename.replace('.xlsx', '.csv')
                df.to_csv(csv_filename, index=False)
                print(f"✅ Data saved as '{csv_filename}'")
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            
    else:
        print("❌ Failed to load data")
        sys.exit(1)

if __name__ == "__main__":
    main() 