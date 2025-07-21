# Use Python 3.11 (more stable than 3.13 for dependencies)
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies for PostgreSQL and pandas
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    postgresql-client \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better Docker layer caching
COPY fastapi_requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r fastapi_requirements.txt

# Install additional dependencies that may not be in requirements
RUN pip install --no-cache-dir \
    psycopg2-binary==2.9.9 \
    pandas>=2.0.0 \
    openpyxl>=3.1.0

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p uploads temp

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start command
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"] 