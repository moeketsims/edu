# Student Module Checker - Backend API

A FastAPI-based backend system to automate the process of identifying missing modules for BEd students by comparing their academic records against required modules for their specific plan codes.

## Features

- **Student Management**: CRUD operations for student records
- **Module Management**: Manage academic modules and requirements
- **Plan Code Management**: Configure degree programs and required modules
- **Missing Module Detection**: Automated detection of missing modules for students
- **Bulk Processing**: Process large datasets efficiently
- **Data Loading**: Import student data from Excel and module allocations from CSV
- **Comprehensive Reporting**: Generate reports in JSON, CSV, and Excel formats
- **RESTful API**: Well-documented API endpoints with Swagger UI

## Project Structure

```
Backend/
├── main.py                     # FastAPI application entry point
├── fastapi_requirements.txt    # Python dependencies
├── README.md                   # This file
├── run.py                      # Development server script
└── app/
    ├── __init__.py
    ├── database.py             # Database configuration
    ├── models.py               # SQLAlchemy models
    ├── schemas.py              # Pydantic schemas
    ├── services.py             # Business logic services
    ├── static/                 # Static assets (minimal)
    └── templates/              # Basic templates (minimal)
```

## Installation & Setup

### 1. Create Virtual Environment

```bash
cd Backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r fastapi_requirements.txt
```

### 3. Start the Development Server

```bash
# Option 1: Using uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Option 2: Using the run script (recommended)
python run.py
```

### 4. Access the API

- **API Documentation (Swagger)**: http://localhost:8000/docs
- **Alternative Docs (ReDoc)**: http://localhost:8000/redoc
- **API Root**: http://localhost:8000/
- **Health Check**: http://localhost:8000/health
- **System Stats**: http://localhost:8000/stats

## API Endpoints

### System Endpoints
- `GET /` - API root with basic information
- `GET /health` - Health check and database status
- `GET /stats` - System statistics

### Student Management
- `POST /api/students/` - Create a new student
- `GET /api/students/{student_number}` - Get student by number
- `GET /api/students/` - List students (with pagination)
- `PUT /api/students/{student_number}` - Update student
- `DELETE /api/students/{student_number}` - Delete student

### Module Management
- `POST /api/modules/` - Create a new module
- `GET /api/modules/{module_code}` - Get module by code
- `GET /api/modules/` - List modules (with pagination)

### Plan Code Management
- `POST /api/plancodes/` - Create plan code with required modules
- `GET /api/plancodes/{plan_code}` - Get plan code details
- `GET /api/plancodes/` - List all plan codes

### Missing Module Detection
- `POST /api/check-missing-modules/{student_number}` - Check missing modules for a student
- `POST /api/bulk-check-missing-modules` - Bulk check for all students or specific plan
- `GET /api/missing-modules-report` - Generate missing modules report

### Data Loading
- `POST /api/load-student-data` - Upload student data from Excel file
- `POST /api/load-allocated-modules` - Upload allocated modules from CSV file

## Usage Examples

### 1. Load Student Data

```bash
curl -X POST "http://localhost:8000/api/load-student-data" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@data.xlsx"
```

### 2. Load Allocated Modules

```bash
curl -X POST "http://localhost:8000/api/load-allocated-modules" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@Allocated_Modules_to_Specialisations_and_Plans.csv"
```

### 3. Check Missing Modules for a Student

```bash
curl -X POST "http://localhost:8000/api/check-missing-modules/1996237523"
```

### 4. Run Bulk Missing Module Check

```bash
curl -X POST "http://localhost:8000/api/bulk-check-missing-modules"
```

### 5. Generate Missing Modules Report (CSV)

```bash
curl "http://localhost:8000/api/missing-modules-report?format=csv" \
     --output missing_modules_report.csv
```

### 6. Get System Statistics

```bash
curl "http://localhost:8000/stats"
```

## Database

The application uses SQLite by default for simplicity. The database file (`student_module_checker.db`) will be created automatically in the Backend directory when you first run the application.

### Database Schema

- **students**: Student information and enrollment details
- **modules**: Available academic modules
- **plan_codes**: Degree programs and specializations
- **plan_modules**: Association between plan codes and required modules
- **student_modules**: Student completion records
- **missing_modules**: Detected missing modules for students

## Data Format Requirements

### Student Data (Excel)
Expected columns:
- STUDENT_NUMBER
- NAME
- YEAR
- CAMPUS_NAME
- PLAN_CODE
- PLAN_DESCRIPTION
- MODULE_CODE
- MODULE_NAME
- FINAL_MARK
- FINAL_MARK_DESCRIPTION
- And other academic details...

### Allocated Modules (CSV)
Expected columns:
- Plan Code BFN
- Module
- Module Description
- Phase
- Specialisation
- Year
- Credits
- Prerequisites

## Development

### Running Tests
```bash
# Add pytest to requirements and run
pytest
```

### API Documentation
The API is fully documented with OpenAPI/Swagger. Visit `/docs` when the server is running to explore the interactive documentation.

### Environment Configuration
You can configure the database URL and other settings by modifying `app/database.py`.

## Production Deployment

For production deployment, consider:

1. **Database**: Switch to PostgreSQL or MySQL
2. **Security**: Add authentication/authorization
3. **Performance**: Configure proper caching and connection pooling
4. **Monitoring**: Add logging and health monitoring
5. **Docker**: Containerize the application

## Support

For issues or questions, refer to the API documentation at `/docs` or check the application logs. 