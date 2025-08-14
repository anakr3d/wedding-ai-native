import requests
import sys
import json
from datetime import datetime
import time

class WeddingAPITester:
    def __init__(self, base_url="https://celebrate-together.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_comment_id = None
        self.test_session_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2, default=str)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "api/health",
            200
        )
        return success

    def test_get_gift_packages(self):
        """Test get gift packages endpoint"""
        success, response = self.run_test(
            "Get Gift Packages",
            "GET",
            "api/gift-packages",
            200
        )
        if success:
            # Verify expected packages exist
            expected_packages = ["small", "medium", "large", "custom"]
            for package in expected_packages:
                if package not in response:
                    print(f"❌ Missing expected package: {package}")
                    return False
            print("✅ All expected gift packages found")
        return success

    def test_get_comments_empty(self):
        """Test get comments when empty"""
        success, response = self.run_test(
            "Get Comments (Empty)",
            "GET",
            "api/comments",
            200
        )
        if success:
            if isinstance(response, list):
                print(f"✅ Comments endpoint returns list with {len(response)} items")
            else:
                print("❌ Comments endpoint should return a list")
                return False
        return success

    def test_add_comment(self):
        """Test adding a new comment"""
        test_comment = {
            "guest_name": "Test Guest",
            "message": "Congratulations on your special day! Wishing you both a lifetime of happiness."
        }
        
        success, response = self.run_test(
            "Add Comment",
            "POST",
            "api/comments",
            200,
            data=test_comment
        )
        
        if success and response:
            # Store comment ID for later tests
            self.test_comment_id = response.get('id')
            if self.test_comment_id:
                print(f"✅ Comment created with ID: {self.test_comment_id}")
            
            # Verify response structure
            required_fields = ['id', 'guest_name', 'message', 'timestamp']
            for field in required_fields:
                if field not in response:
                    print(f"❌ Missing field in response: {field}")
                    return False
            print("✅ Comment response has all required fields")
        
        return success

    def test_get_comments_with_data(self):
        """Test get comments after adding one"""
        success, response = self.run_test(
            "Get Comments (With Data)",
            "GET",
            "api/comments",
            200
        )
        
        if success and isinstance(response, list) and len(response) > 0:
            # Check if our test comment is in the list
            found_test_comment = False
            for comment in response:
                if comment.get('guest_name') == 'Test Guest':
                    found_test_comment = True
                    break
            
            if found_test_comment:
                print("✅ Test comment found in comments list")
            else:
                print("❌ Test comment not found in comments list")
                return False
        
        return success

    def test_payment_checkout_invalid_package(self):
        """Test payment checkout with invalid package"""
        invalid_payment = {
            "package_id": "invalid_package",
            "guest_name": "Test User",
            "origin_url": "https://example.com"
        }
        
        success, response = self.run_test(
            "Payment Checkout (Invalid Package)",
            "POST",
            "api/payments/checkout",
            400,
            data=invalid_payment
        )
        return success

    def test_payment_checkout_custom_invalid_amount(self):
        """Test payment checkout with custom package and invalid amount"""
        invalid_payment = {
            "package_id": "custom",
            "guest_name": "Test User",
            "custom_amount": 0.5,  # Less than $1.00
            "origin_url": "https://example.com"
        }
        
        success, response = self.run_test(
            "Payment Checkout (Invalid Custom Amount)",
            "POST",
            "api/payments/checkout",
            400,
            data=invalid_payment
        )
        return success

    def test_payment_checkout_valid_small(self):
        """Test payment checkout with valid small package"""
        valid_payment = {
            "package_id": "small",
            "guest_name": "Test User",
            "origin_url": "https://example.com"
        }
        
        success, response = self.run_test(
            "Payment Checkout (Valid Small Package)",
            "POST",
            "api/payments/checkout",
            200,
            data=valid_payment
        )
        
        if success and response:
            # Check if response has required fields
            required_fields = ['url', 'session_id']
            for field in required_fields:
                if field not in response:
                    print(f"❌ Missing field in payment response: {field}")
                    return False
            
            self.test_session_id = response.get('session_id')
            print(f"✅ Payment session created with ID: {self.test_session_id}")
        
        return success

    def test_payment_status_invalid_session(self):
        """Test payment status with invalid session ID"""
        success, response = self.run_test(
            "Payment Status (Invalid Session)",
            "GET",
            "api/payments/status/invalid_session_id",
            404
        )
        return success

    def test_payment_status_valid_session(self):
        """Test payment status with valid session ID"""
        if not self.test_session_id:
            print("⚠️  Skipping payment status test - no valid session ID")
            return True
        
        success, response = self.run_test(
            "Payment Status (Valid Session)",
            "GET",
            f"api/payments/status/{self.test_session_id}",
            200
        )
        
        if success and response:
            # Check if response has required fields
            required_fields = ['session_id', 'status', 'payment_status', 'guest_name']
            for field in required_fields:
                if field not in response:
                    print(f"❌ Missing field in payment status response: {field}")
                    return False
            print("✅ Payment status response has all required fields")
        
        return success

    def test_get_transactions(self):
        """Test get transactions endpoint"""
        success, response = self.run_test(
            "Get Transactions",
            "GET",
            "api/transactions",
            200
        )
        
        if success:
            if isinstance(response, list):
                print(f"✅ Transactions endpoint returns list with {len(response)} items")
            else:
                print("❌ Transactions endpoint should return a list")
                return False
        
        return success

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting Wedding Website Backend API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)

        # Basic health and setup tests
        self.test_health_check()
        self.test_get_gift_packages()
        
        # Comment system tests
        self.test_get_comments_empty()
        self.test_add_comment()
        self.test_get_comments_with_data()
        
        # Payment system tests
        self.test_payment_checkout_invalid_package()
        self.test_payment_checkout_custom_invalid_amount()
        self.test_payment_checkout_valid_small()
        self.test_payment_status_invalid_session()
        self.test_payment_status_valid_session()
        
        # Admin/monitoring tests
        self.test_get_transactions()

        # Print final results
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed! Backend API is working correctly.")
            return 0
        else:
            print(f"❌ {self.tests_run - self.tests_passed} tests failed.")
            return 1

def main():
    tester = WeddingAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())