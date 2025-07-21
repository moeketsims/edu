#!/usr/bin/env python3
"""
Development server script for Student Module Checker API
"""

import uvicorn

if __name__ == "__main__":
    print("🚀 Starting Student Module Checker API...")
    print("📚 Documentation available at: http://localhost:8000/docs")
    print("🔍 Health check available at: http://localhost:8000/health")
    print("📊 Statistics available at: http://localhost:8000/stats")
    print("\nPress Ctrl+C to stop the server")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 