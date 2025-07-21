"""
Pydantic schemas for request/response validation
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# ============================================================================
# STUDENT SCHEMAS
# ============================================================================

class StudentBase(BaseModel):
    name: str = Field(..., description="Student name")
    year: Optional[str] = Field(None, description="Academic year")
    campus_name: Optional[str] = Field(None, description="Campus name")
    plan_code: Optional[str] = Field(None, description="Plan code")
    plan_description: Optional[str] = Field(None, description="Plan description")
    year_in_plan: Optional[int] = Field(None, description="Year in plan")
    years_in_degree: Optional[int] = Field(None, description="Total years in degree")

class StudentCreate(StudentBase):
    student_number: str = Field(..., description="Student number")

class StudentUpdate(StudentBase):
    pass

class StudentResponse(StudentBase):
    student_number: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# ============================================================================
# MODULE SCHEMAS
# ============================================================================

class ModuleBase(BaseModel):
    name: str = Field(..., description="Module name")
    description: Optional[str] = Field(None, description="Module description")
    credits: Optional[float] = Field(None, description="Module credits")
    prerequisites: Optional[str] = Field(None, description="Prerequisites")
    phase: Optional[str] = Field(None, description="Phase (Foundation, Intermediate, etc.)")

class ModuleCreate(ModuleBase):
    code: str = Field(..., description="Module code")

class ModuleUpdate(ModuleBase):
    pass

class ModuleResponse(ModuleBase):
    code: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# ============================================================================
# PLAN CODE SCHEMAS
# ============================================================================

class PlanModuleAssignment(BaseModel):
    module_code: str = Field(..., description="Module code")
    year: Optional[str] = Field(None, description="Required year")
    phase: Optional[str] = Field(None, description="Phase")
    is_required: bool = Field(True, description="Is module required")
    credits: Optional[float] = Field(None, description="Credits for this module")

class PlanCodeBase(BaseModel):
    description: str = Field(..., description="Plan description")
    phase: Optional[str] = Field(None, description="Phase")
    specialisation: Optional[str] = Field(None, description="Specialisation")
    total_credits: Optional[float] = Field(None, description="Total credits required")
    duration_years: Optional[int] = Field(None, description="Duration in years")

class PlanCodeCreate(PlanCodeBase):
    code: str = Field(..., description="Plan code")
    modules: Optional[List[PlanModuleAssignment]] = Field([], description="Required modules")

class PlanCodeUpdate(PlanCodeBase):
    modules: Optional[List[PlanModuleAssignment]] = Field(None, description="Required modules")

class PlanCodeResponse(PlanCodeBase):
    code: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    modules: Optional[List[ModuleResponse]] = []
    
    class Config:
        from_attributes = True

# ============================================================================
# STUDENT MODULE SCHEMAS
# ============================================================================

class StudentModuleBase(BaseModel):
    year_taken: Optional[str] = Field(None, description="Year taken")
    final_mark: Optional[float] = Field(None, description="Final mark")
    final_mark_description: Optional[str] = Field(None, description="Final mark description")
    credits_earned: Optional[float] = Field(None, description="Credits earned")
    total_credit_hemis: Optional[float] = Field(None, description="Total credit HEMIS")
    units_maximum: Optional[float] = Field(None, description="Units maximum")
    cred_pass_plan_all_years: Optional[float] = Field(None, description="Credits passed all years")
    cred_pass_plan_cur_year: Optional[float] = Field(None, description="Credits passed current year")

class StudentModuleCreate(StudentModuleBase):
    student_number: str = Field(..., description="Student number")
    module_code: str = Field(..., description="Module code")

class StudentModuleResponse(StudentModuleBase):
    id: int
    student_number: str
    module_code: str
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# ============================================================================
# MISSING MODULE SCHEMAS
# ============================================================================

class MissingModuleBase(BaseModel):
    module_code: str = Field(..., description="Missing module code")
    module_name: Optional[str] = Field(None, description="Module name")
    required_year: Optional[str] = Field(None, description="Required year")
    phase: Optional[str] = Field(None, description="Phase")
    credits: Optional[float] = Field(None, description="Credits")
    is_prerequisite_met: bool = Field(True, description="Are prerequisites met")
    priority: str = Field("Normal", description="Priority level")

class MissingModuleCreate(MissingModuleBase):
    student_number: str = Field(..., description="Student number")

class MissingModuleResponse(MissingModuleBase):
    id: int
    student_number: str
    detected_at: datetime
    
    class Config:
        from_attributes = True

# ============================================================================
# REPORT SCHEMAS
# ============================================================================

class StudentMissingModulesReport(BaseModel):
    student_number: str
    student_name: str
    plan_code: str
    plan_description: Optional[str]
    missing_modules: List[MissingModuleResponse]
    total_missing_credits: float
    completion_percentage: float

class MissingModuleReport(BaseModel):
    total_students_checked: int
    students_with_missing_modules: int
    total_missing_modules: int
    most_common_missing_modules: List[Dict[str, Any]]
    students: List[StudentMissingModulesReport]
    generated_at: datetime

class BulkProcessingResult(BaseModel):
    status: str = Field(..., description="Processing status")
    total_records_processed: int = Field(..., description="Total records processed")
    successful_records: int = Field(..., description="Successfully processed records")
    failed_records: int = Field(..., description="Failed records")
    errors: List[str] = Field([], description="List of errors encountered")
    processing_time_seconds: float = Field(..., description="Processing time in seconds")

# ============================================================================
# DATA LOADING SCHEMAS
# ============================================================================

class DataLoadResult(BaseModel):
    status: str = Field(..., description="Load status")
    total_rows: int = Field(..., description="Total rows in file")
    loaded_rows: int = Field(..., description="Successfully loaded rows")
    skipped_rows: int = Field(..., description="Skipped rows")
    errors: List[str] = Field([], description="Load errors")
    load_time_seconds: float = Field(..., description="Load time in seconds")

# ============================================================================
# SYSTEM SCHEMAS
# ============================================================================

class SystemStats(BaseModel):
    total_students: int
    total_modules: int
    total_plan_codes: int
    students_with_missing_modules: int
    total_missing_modules: int
    last_bulk_check: Optional[datetime]

class HealthCheck(BaseModel):
    status: str
    service: str
    database_connected: bool
    timestamp: datetime 