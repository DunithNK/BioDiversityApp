"""
Test Script for Wildlife Tracking Backend
Verify model and API functionality
"""
import requests
import json
from pathlib import Path
from PIL import Image
import io

# Configuration
BASE_URL = "http://localhost:8000"
TEST_IMAGE_PATH = Path(__file__).parent / "detaset" / "animals" / "leopard"


def test_health_check():
    """Test health check endpoint"""
    print("\n" + "=" * 60)
    print("🏥 Testing Health Check Endpoint")
    print("=" * 60)
    
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        assert response.status_code == 200
        print("✅ Health check passed")
        return True
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False


def test_prediction():
    """Test leopard detection endpoint"""
    print("\n" + "=" * 60)
    print("🐆 Testing Leopard Detection")
    print("=" * 60)
    
    # Find a test image
    test_images = list(TEST_IMAGE_PATH.glob("*.jpg"))[:3]
    
    if not test_images:
        print("⚠️  No test images found")
        return False
    
    success_count = 0
    
    for img_path in test_images:
        print(f"\n📸 Testing with: {img_path.name}")
        
        try:
            with open(img_path, 'rb') as f:
                files = {'file': (img_path.name, f, 'image/jpeg')}
                response = requests.post(f"{BASE_URL}/predict", files=files)
            
            print(f"   Status Code: {response.status_code}")
            if response.status_code == 200:
                result = response.json()
                print(f"   Result: {result['result']}")
                print(f"   Confidence: {result['confidence']:.2%}")
                print(f"   Model Loaded: {result['model_loaded']}")
                
                if result['result'] == "Leopard Detected":
                    print("   ✅ Correctly detected as leopard")
                    success_count += 1
                else:
                    print("   ⚠️  Not detected as leopard")
            else:
                print(f"   ❌ Error: {response.text}")
        
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    print(f"\n✅ Detection accuracy: {success_count}/{len(test_images)} correct")
    return success_count > 0


def test_alert_creation():
    """Test alert creation and retrieval"""
    print("\n" + "=" * 60)
    print("📍 Testing Alert System")
    print("=" * 60)
    
    # Create test alert
    test_alert = {
        "alert_id": "test-123456",
        "timestamp": "2024-03-02T10:30:00Z",
        "latitude": 7.1,
        "longitude": 81.4,
        "source": "Camera"
    }
    
    try:
        print("\n📝 Creating test alert...")
        response = requests.post(f"{BASE_URL}/alert", json=test_alert)
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        print("\n📋 Retrieving all alerts...")
        response = requests.get(f"{BASE_URL}/alerts")
        alerts = response.json()
        print(f"   Total alerts: {len(alerts)}")
        
        # Check if our test alert exists
        found = any(alert['alert_id'] == test_alert['alert_id'] for alert in alerts)
        
        if found:
            print("   ✅ Test alert found in database")
            return True
        else:
            print("   ⚠️  Test alert not found")
            return False
    
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False


def test_assessment():
    """Test assessment creation and retrieval"""
    print("\n" + "=" * 60)
    print("🏥 Testing Assessment System")
    print("=" * 60)
    
    # Create test assessment
    test_assessment = {
        "alert_id": "test-123456",
        "severity": "Moderate",
        "score": 50,
        "indicators": {
            "limping": True,
            "visible_injury": False,
            "abnormal_behavior": True,
            "near_human_area": False
        }
    }
    
    try:
        print("\n📝 Creating test assessment...")
        response = requests.post(f"{BASE_URL}/assessment", json=test_assessment)
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        print("\n📋 Retrieving assessment...")
        response = requests.get(f"{BASE_URL}/assessment/test-123456")
        
        if response.status_code == 200:
            assessment = response.json()
            print(f"   Severity: {assessment['severity']}")
            print(f"   Score: {assessment['score']}")
            print(f"   Indicators: limping={assessment['limping']}, "
                  f"injury={assessment['visible_injury']}")
            print("   ✅ Assessment system working")
            return True
        else:
            print(f"   ❌ Error: {response.text}")
            return False
    
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False


def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("🧪 WILDLIFE TRACKING BACKEND TEST SUITE")
    print("=" * 60)
    print(f"🌐 Testing server at: {BASE_URL}")
    
    results = {
        "Health Check": test_health_check(),
        "Leopard Detection": test_prediction(),
        "Alert System": test_alert_creation(),
        "Assessment System": test_assessment()
    }
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    for test_name, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{test_name:.<40} {status}")
    
    passed_count = sum(results.values())
    total_count = len(results)
    
    print("\n" + "=" * 60)
    print(f"Result: {passed_count}/{total_count} tests passed")
    print("=" * 60)
    
    if passed_count == total_count:
        print("\n🎉 All tests passed! Backend is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Please check the logs above.")


if __name__ == "__main__":
    main()
