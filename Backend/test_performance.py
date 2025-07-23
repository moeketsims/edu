#!/usr/bin/env python3
"""
Performance testing script to demonstrate optimization improvements
"""

import requests
import time
import json
from typing import Dict, Any

API_BASE_URL = "http://localhost:8000"

def test_endpoint_performance(endpoint: str, method: str = "GET", data: Dict = None, name: str = None) -> Dict[str, Any]:
    """Test the performance of an API endpoint"""
    display_name = name or endpoint
    
    print(f"🧪 Testing {display_name}...")
    
    start_time = time.time()
    
    try:
        if method == "POST":
            if data:
                response = requests.post(f"{API_BASE_URL}{endpoint}", json=data)
            else:
                response = requests.post(f"{API_BASE_URL}{endpoint}")
        else:
            response = requests.get(f"{API_BASE_URL}{endpoint}")
        
        end_time = time.time()
        duration = end_time - start_time
        
        if response.status_code == 200:
            result = response.json()
            
            # Extract relevant metrics
            if "individual_student_results" in result:
                student_count = len(result["individual_student_results"])
            elif "students" in result:
                student_count = len(result["students"])
            elif "total_students" in result:
                student_count = result["total_students"]
            else:
                student_count = "N/A"
            
            print(f"   ✅ {display_name}: {duration:.2f}s (Students: {student_count})")
            
            return {
                "endpoint": endpoint,
                "name": display_name,
                "duration": duration,
                "status": "success",
                "student_count": student_count,
                "data_source": result.get("data_source", "unknown")
            }
        else:
            print(f"   ❌ {display_name}: Failed ({response.status_code})")
            return {
                "endpoint": endpoint,
                "name": display_name,
                "duration": duration,
                "status": "failed",
                "error": response.text[:100]
            }
    
    except Exception as e:
        end_time = time.time()
        duration = end_time - start_time
        print(f"   ❌ {display_name}: Error - {str(e)[:100]}")
        return {
            "endpoint": endpoint,
            "name": display_name,
            "duration": duration,
            "status": "error",
            "error": str(e)[:100]
        }

def run_performance_comparison():
    """Run a comprehensive performance comparison"""
    
    print("🚀 Performance Optimization Test Suite")
    print("=" * 50)
    
    # Test basic health and setup
    print("\n1. Health Check")
    health_result = test_endpoint_performance("/health", name="Health Check")
    
    print("\n2. Database Info")
    db_info_result = test_endpoint_performance("/database-info", name="Database Info")
    
    # Test optimization setup
    print("\n3. Performance Setup")
    
    # Refresh pre-calculated data
    refresh_analysis = test_endpoint_performance(
        "/api/performance/refresh-analysis",
        method="POST",
        name="Refresh Analysis Data"
    )
    
    refresh_stats = test_endpoint_performance(
        "/api/performance/refresh-dashboard-stats",
        method="POST",
        name="Refresh Dashboard Stats"
    )
    
    # Performance comparison tests
    print("\n4. Performance Comparison")
    
    # Test slow vs fast endpoints
    tests = [
        {
            "old": "/api/bulk-comprehensive-analysis",
            "new": "/api/fast-bulk-analysis",
            "method": "POST",
            "description": "Bulk Student Analysis"
        },
        {
            "old": "/stats",
            "new": "/api/performance/fast-dashboard-stats",
            "method": "GET",
            "description": "Dashboard Statistics"
        }
    ]
    
    results = []
    
    for test in tests:
        print(f"\n   Testing: {test['description']}")
        
        # Test old endpoint
        old_result = test_endpoint_performance(
            test["old"],
            method=test["method"],
            name=f"{test['description']} (OLD)"
        )
        
        # Test new endpoint
        new_result = test_endpoint_performance(
            test["new"],
            method=test["method"],
            name=f"{test['description']} (NEW)"
        )
        
        # Calculate improvement
        if old_result["status"] == "success" and new_result["status"] == "success":
            improvement = old_result["duration"] / new_result["duration"]
            print(f"   📊 Performance Improvement: {improvement:.1f}x faster")
        
        results.append({
            "test": test["description"],
            "old": old_result,
            "new": new_result
        })
    
    # Test caching
    print("\n5. Cache Performance Test")
    
    # First call (cache miss)
    cache_miss = test_endpoint_performance(
        "/api/performance/fast-dashboard-stats",
        name="Dashboard Stats (Cache Miss)"
    )
    
    # Second call (cache hit)
    cache_hit = test_endpoint_performance(
        "/api/performance/fast-dashboard-stats",
        name="Dashboard Stats (Cache Hit)"
    )
    
    if cache_miss["status"] == "success" and cache_hit["status"] == "success":
        cache_improvement = cache_miss["duration"] / cache_hit["duration"]
        print(f"   📊 Cache Performance: {cache_improvement:.1f}x faster")
    
    # Cache status
    cache_status = test_endpoint_performance(
        "/api/performance/cache-status",
        name="Cache Status"
    )
    
    # Generate summary report
    print("\n" + "=" * 50)
    print("📊 PERFORMANCE TEST SUMMARY")
    print("=" * 50)
    
    for result in results:
        test_name = result["test"]
        old = result["old"]
        new = result["new"]
        
        print(f"\n{test_name}:")
        if old["status"] == "success" and new["status"] == "success":
            improvement = old["duration"] / new["duration"]
            print(f"  Old: {old['duration']:.2f}s")
            print(f"  New: {new['duration']:.2f}s")
            print(f"  Improvement: {improvement:.1f}x faster ⚡")
            
            if improvement > 10:
                print(f"  🎉 EXCELLENT: >10x improvement!")
            elif improvement > 5:
                print(f"  ✅ GREAT: >5x improvement!")
            elif improvement > 2:
                print(f"  👍 GOOD: >2x improvement!")
            else:
                print(f"  📈 MODEST: {improvement:.1f}x improvement")
        else:
            print(f"  ⚠️  Test incomplete - check server status")
    
    print(f"\n💡 Recommendations:")
    print(f"  1. Use /api/fast-bulk-analysis instead of /api/bulk-comprehensive-analysis")
    print(f"  2. Use /api/performance/fast-dashboard-stats for dashboard data")
    print(f"  3. Set up automated refresh schedule for pre-calculated data")
    print(f"  4. Monitor cache performance with /api/performance/cache-status")
    
    return results

def test_data_freshness():
    """Test data freshness and accuracy"""
    print("\n6. Data Freshness Test")
    
    # Compare results from old vs new endpoints to ensure accuracy
    try:
        # Get data from new fast endpoint
        fast_response = requests.post(f"{API_BASE_URL}/api/fast-bulk-analysis")
        if fast_response.status_code == 200:
            fast_data = fast_response.json()
            student_count = len(fast_data.get("individual_student_results", []))
            print(f"   ✅ Fast endpoint returned {student_count} students")
            
            # Check data source
            data_source = fast_data.get("data_source", "unknown")
            print(f"   📊 Data source: {data_source}")
            
            if data_source == "pre_calculated_optimized":
                print(f"   🚀 Using optimized pre-calculated data!")
            
        else:
            print(f"   ❌ Fast endpoint failed: {fast_response.status_code}")
    
    except Exception as e:
        print(f"   ❌ Data freshness test failed: {str(e)}")

if __name__ == "__main__":
    print("Starting performance test suite...")
    print("Make sure your FastAPI server is running on http://localhost:8000")
    print()
    
    try:
        results = run_performance_comparison()
        test_data_freshness()
        
        print("\n✅ Performance testing completed!")
        print("Check the results above to see performance improvements.")
        
    except KeyboardInterrupt:
        print("\n⛔ Testing interrupted by user")
    except Exception as e:
        print(f"\n❌ Testing failed: {str(e)}")
        print("Make sure your FastAPI server is running and accessible") 