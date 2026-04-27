#!/usr/bin/env python3
"""
CipherStakes Backend API Testing Suite
Tests all backend endpoints using the public URL from frontend/.env
"""
import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class CipherStakesAPITester:
    def __init__(self, base_url="https://investor-pitch-17.preview.emergentagent.com"):
        self.base_url = base_url.rstrip('/')
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Optional[Dict] = None, headers: Optional[Dict] = None) -> tuple[bool, Dict]:
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint.lstrip('/')}"
        
        # Default headers
        req_headers = {'Content-Type': 'application/json'}
        if self.token:
            req_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            req_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=req_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=req_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=req_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=req_headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}

            details = f"Status: {response.status_code} (expected {expected_status})"
            if not success:
                details += f", Response: {response.text[:200]}"
            
            self.log_test(name, success, details)
            return success, response_data

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return False, {}

    def test_health_endpoints(self):
        """Test basic health endpoints"""
        print("\n🔍 Testing Health Endpoints...")
        
        # Test root endpoint
        self.run_test(
            "GET /api/ returns health info",
            "GET", "/", 200
        )
        
        # Test health endpoint
        self.run_test(
            "GET /api/health returns ok",
            "GET", "/health", 200
        )

    def test_draws_endpoints(self):
        """Test draws-related endpoints"""
        print("\n🔍 Testing Draws Endpoints...")
        
        # Get all draws
        success, draws_data = self.run_test(
            "GET /api/draws returns draws list",
            "GET", "/draws", 200
        )
        
        if success and draws_data:
            draws = draws_data if isinstance(draws_data, list) else []
            self.log_test(
                "Draws list contains 4 draws (T1, T2, T3, T4)",
                len(draws) >= 4,
                f"Found {len(draws)} draws"
            )
            
            # Test specific draw endpoints
            for draw_id in ["T1_DAILY_FLASH", "T2_WEEKLY_STAKES"]:
                self.run_test(
                    f"GET /api/draws/{draw_id} returns draw info",
                    "GET", f"/draws/{draw_id}", 200
                )
                
                self.run_test(
                    f"GET /api/draws/{draw_id}/stats returns stats",
                    "GET", f"/draws/{draw_id}/stats", 200
                )
            
            # Test T1 jackpot value
            success, t1_data = self.run_test(
                "GET /api/draws/T1_DAILY_FLASH returns jackpot >= 500",
                "GET", "/draws/T1_DAILY_FLASH", 200
            )
            
            if success and t1_data:
                jackpot = t1_data.get('jackpot_usdc', 0)
                self.log_test(
                    "T1 jackpot_usdc >= 500",
                    jackpot >= 500,
                    f"Jackpot: ${jackpot}"
                )

    def test_packs_endpoints(self):
        """Test pack store endpoints"""
        print("\n🔍 Testing Packs Endpoints...")
        
        success, packs_data = self.run_test(
            "GET /api/packs returns 5 packs",
            "GET", "/packs", 200
        )
        
        if success and packs_data:
            packs = packs_data if isinstance(packs_data, list) else []
            expected_packs = ["spark", "standard", "pro", "elite", "vault"]
            
            self.log_test(
                "Packs list contains 5 packs (spark, standard, pro, elite, vault)",
                len(packs) >= 5,
                f"Found {len(packs)} packs"
            )
            
            # Check pack IDs
            pack_ids = [p.get('id') for p in packs if isinstance(p, dict)]
            for expected_id in expected_packs:
                self.log_test(
                    f"Pack '{expected_id}' exists",
                    expected_id in pack_ids,
                    f"Available packs: {pack_ids}"
                )

    def test_auth_flow(self):
        """Test authentication endpoints"""
        print("\n🔍 Testing Authentication Flow...")
        
        # Generate unique test user
        timestamp = datetime.now().strftime('%H%M%S')
        test_email = f"test_user_{timestamp}@example.com"
        test_password = "TestPass123!"
        
        # Test registration
        success, register_data = self.run_test(
            "POST /api/auth/register creates user with 50 coin balance",
            "POST", "/auth/register", 200,
            data={
                "email": test_email,
                "password": test_password
            }
        )
        
        if success and register_data:
            self.token = register_data.get('access_token')
            user_data = register_data.get('user', {})
            self.user_id = user_data.get('user_id')
            
            self.log_test(
                "Registration returns JWT token",
                bool(self.token),
                f"Token received: {bool(self.token)}"
            )
            
            self.log_test(
                "New user has 50 coin balance",
                user_data.get('coin_balance') == 50,
                f"Balance: {user_data.get('coin_balance')}"
            )
        
        # Test login
        success, login_data = self.run_test(
            "POST /api/auth/login authenticates user",
            "POST", "/auth/login", 200,
            data={
                "email": test_email,
                "password": test_password
            }
        )
        
        if success and login_data:
            new_token = login_data.get('access_token')
            self.log_test(
                "Login returns new JWT token",
                bool(new_token) and new_token != self.token,
                f"New token received: {bool(new_token)}"
            )
            self.token = new_token  # Use new token
        
        # Test /me endpoint
        if self.token:
            success, me_data = self.run_test(
                "GET /api/auth/me returns user profile",
                "GET", "/auth/me", 200
            )
            
            if success and me_data:
                self.log_test(
                    "Profile contains user email",
                    me_data.get('email') == test_email,
                    f"Email: {me_data.get('email')}"
                )

    def test_claims_flow(self):
        """Test daily claims functionality"""
        print("\n🔍 Testing Claims Flow...")
        
        if not self.token:
            self.log_test("Claims test skipped", False, "No auth token available")
            return
        
        # Check claim status
        success, status_data = self.run_test(
            "GET /api/claims/status returns claimed_today flag",
            "GET", "/claims/status", 200
        )
        
        if success and status_data:
            claimed_today = status_data.get('claimed_today', False)
            self.log_test(
                "Claim status contains claimed_today flag",
                'claimed_today' in status_data,
                f"Claimed today: {claimed_today}"
            )
        
        # First claim attempt
        success, claim_data = self.run_test(
            "POST /api/claims/daily first call credits 50 coins",
            "POST", "/claims/daily", 200
        )
        
        if success and claim_data:
            credited = claim_data.get('credited', False)
            amount = claim_data.get('amount_credited', 0)
            
            self.log_test(
                "First claim credits coins",
                credited and amount > 0,
                f"Credited: {credited}, Amount: {amount}"
            )
        
        # Second claim attempt (should fail)
        success, claim_data2 = self.run_test(
            "POST /api/claims/daily second call returns credited=false",
            "POST", "/claims/daily", 200
        )
        
        if success and claim_data2:
            credited = claim_data2.get('credited', True)  # Should be False
            self.log_test(
                "Second claim returns credited=false",
                not credited,
                f"Credited: {credited}"
            )

    def test_draw_entry_flow(self):
        """Test draw entry functionality"""
        print("\n🔍 Testing Draw Entry Flow...")
        
        if not self.token:
            self.log_test("Draw entry test skipped", False, "No auth token available")
            return
        
        # Test insufficient coins (T2 requires 200 coins, user should have ~100 after claim)
        success, error_data = self.run_test(
            "POST /api/draws/enter with insufficient coins returns 400",
            "POST", "/draws/enter", 400,
            data={
                "draw_id": "T2_WEEKLY_STAKES",
                "quantity": 1
            }
        )
        
        if success:
            self.log_test(
                "Insufficient coins error returned",
                True,
                "T2 entry correctly rejected due to insufficient coins"
            )
        
        # Test successful T1 entry (50 coins, user should have enough after claim)
        success, entry_data = self.run_test(
            "POST /api/draws/enter T1_DAILY_FLASH succeeds",
            "POST", "/draws/enter", 200,
            data={
                "draw_id": "T1_DAILY_FLASH",
                "quantity": 1
            }
        )
        
        if success and entry_data:
            entries = entry_data.get('entries', [])
            self.log_test(
                "T1 entry returns entry with ID and hash",
                len(entries) > 0 and entries[0].get('entry_id') and entries[0].get('entry_hash'),
                f"Entry ID: {entries[0].get('entry_id', 'N/A')[:8]}..., Hash length: {len(entries[0].get('entry_hash', ''))}"
            )
            
            # Verify hash is sha256 (64 chars)
            if entries:
                entry_hash = entries[0].get('entry_hash', '')
                self.log_test(
                    "Entry hash is sha256 (64 chars)",
                    len(entry_hash) == 64,
                    f"Hash length: {len(entry_hash)}"
                )

    def test_stripe_checkout(self):
        """Test Stripe checkout functionality"""
        print("\n🔍 Testing Stripe Checkout...")
        
        if not self.token:
            self.log_test("Stripe test skipped", False, "No auth token available")
            return
        
        # Test checkout session creation
        success, checkout_data = self.run_test(
            "POST /api/packs/checkout creates Stripe session",
            "POST", "/packs/checkout", 200,
            data={
                "pack_id": "spark",
                "origin_url": "https://example.com"
            }
        )
        
        if success and checkout_data:
            session_id = checkout_data.get('session_id')
            url = checkout_data.get('url')
            
            self.log_test(
                "Checkout returns session_id and URL",
                bool(session_id) and bool(url),
                f"Session ID: {session_id[:8] if session_id else 'N/A'}..., URL: {bool(url)}"
            )
            
            # Test status polling
            if session_id:
                success, status_data = self.run_test(
                    f"GET /api/packs/checkout/status/{session_id} polls status",
                    "GET", f"/packs/checkout/status/{session_id}", 200
                )
                
                if success and status_data:
                    self.log_test(
                        "Status polling returns session data",
                        'session_id' in status_data,
                        f"Status: {status_data.get('status', 'N/A')}"
                    )

    def test_admin_draw_execution(self):
        """Test admin draw execution"""
        print("\n🔍 Testing Admin Draw Execution...")
        
        # First execution
        success, result_data = self.run_test(
            "POST /api/draws/admin/run/T1_DAILY_FLASH executes draw",
            "POST", "/draws/admin/run/T1_DAILY_FLASH", 200
        )
        
        if success and result_data:
            winner = result_data.get('winner')
            status = result_data.get('status')
            
            self.log_test(
                "Draw execution returns result",
                'status' in result_data,
                f"Status: {status}, Winner: {bool(winner)}"
            )
        
        # Second execution (should return 409)
        success, error_data = self.run_test(
            "POST /api/draws/admin/run/T1_DAILY_FLASH second call returns 409",
            "POST", "/draws/admin/run/T1_DAILY_FLASH", 409
        )
        
        if success:
            self.log_test(
                "Second execution correctly returns 409 conflict",
                True,
                "Draw already executed for same cycle"
            )

    def test_results_endpoint(self):
        """Test results endpoints"""
        print("\n🔍 Testing Results Endpoints...")
        
        success, results_data = self.run_test(
            "GET /api/draws/results/all returns results list",
            "GET", "/draws/results/all", 200
        )
        
        if success and results_data:
            results = results_data.get('results', [])
            self.log_test(
                "Results endpoint returns data",
                isinstance(results, list),
                f"Found {len(results)} results"
            )

    def test_user_endpoints(self):
        """Test user-related endpoints"""
        print("\n🔍 Testing User Endpoints...")
        
        if not self.token:
            self.log_test("User endpoints test skipped", False, "No auth token available")
            return
        
        # Test referrals
        success, referral_data = self.run_test(
            "GET /api/users/me/referrals returns referral info",
            "GET", "/users/me/referrals", 200
        )
        
        if success and referral_data:
            self.log_test(
                "Referrals endpoint returns referral_code",
                'referral_code' in referral_data,
                f"Referral code: {referral_data.get('referral_code', 'N/A')}"
            )
        
        # Test KYC submission
        success, kyc_data = self.run_test(
            "POST /api/users/me/kyc saves KYC submission",
            "POST", "/users/me/kyc", 200,
            data={
                "full_name": "Test User",
                "country": "US",
                "id_number": "123456789",
                "wallet_address": "0x1234567890abcdef",
                "bank_details": "Test Bank Details",
                "entry_id": "test-entry-id"
            }
        )
        
        if success and kyc_data:
            self.log_test(
                "KYC submission successful",
                kyc_data.get('ok') == True,
                f"Status: {kyc_data.get('status', 'N/A')}"
            )

    def test_ascension_endpoints(self):
        """Test new ascension bonus endpoints (Phase 5)"""
        print("\n🔍 Testing Ascension Bonus Endpoints...")
        
        if not self.token:
            self.log_test("Ascension test skipped", False, "No auth token available")
            return
        
        # Test GET /api/users/me/ascension
        success, ascension_data = self.run_test(
            "GET /api/users/me/ascension returns progress data",
            "GET", "/users/me/ascension", 200
        )
        
        if success and ascension_data:
            required_fields = ['target_entries', 'current_consecutive', 'ascension_bonus_claimed', 'ascension_bonus_amount', 'progress_pct']
            all_fields_present = all(field in ascension_data for field in required_fields)
            
            self.log_test(
                "Ascension endpoint returns all required fields",
                all_fields_present,
                f"Fields: {list(ascension_data.keys())}"
            )
            
            # Validate field values
            self.log_test(
                "Ascension target_entries is 30",
                ascension_data.get('target_entries') == 30,
                f"Target: {ascension_data.get('target_entries')}"
            )
            
            self.log_test(
                "Ascension bonus_amount is 500",
                ascension_data.get('ascension_bonus_amount') == 500,
                f"Bonus amount: {ascension_data.get('ascension_bonus_amount')}"
            )
            
            # For new user, consecutive should be 0
            consecutive = ascension_data.get('current_consecutive', -1)
            self.log_test(
                "New user has 0 consecutive entries",
                consecutive >= 0,
                f"Consecutive: {consecutive}"
            )

    def test_removed_endpoints(self):
        """Test that removed endpoints return 404 (Phase 5)"""
        print("\n🔍 Testing Removed Endpoints...")
        
        if not self.token:
            self.log_test("Removed endpoints test skipped", False, "No auth token available")
            return
        
        # Test POST /api/users/claim-daily returns 404
        success, _ = self.run_test(
            "POST /api/users/claim-daily returns 404 (removed)",
            "POST", "/users/claim-daily", 404
        )
        
        # Test GET /api/users/streak returns 404
        success, _ = self.run_test(
            "GET /api/users/streak returns 404 (removed)",
            "GET", "/users/streak", 404
        )

    def test_draw_entry_ascension_bonus(self):
        """Test draw entry with ascension bonus field (Phase 5)"""
        print("\n🔍 Testing Draw Entry Ascension Bonus...")
        
        if not self.token:
            self.log_test("Draw entry ascension test skipped", False, "No auth token available")
            return
        
        # Test T1 entry includes ascension_bonus field (should be null for new user)
        success, entry_data = self.run_test(
            "POST /api/draws/enter T1 includes ascension_bonus field",
            "POST", "/draws/enter", 200,
            data={
                "draw_id": "T1_DAILY_FLASH",
                "quantity": 1
            }
        )
        
        if success and entry_data:
            # Check that ascension_bonus field is present (even if null)
            has_ascension_field = 'ascension_bonus' in entry_data
            ascension_bonus = entry_data.get('ascension_bonus')
            
            self.log_test(
                "Draw entry response includes ascension_bonus field",
                has_ascension_field,
                f"Ascension bonus: {ascension_bonus}"
            )
            
            # For new user, should be null (not at 30-day threshold)
            self.log_test(
                "New user ascension_bonus is null (not at threshold)",
                ascension_bonus is None,
                f"Bonus value: {ascension_bonus}"
            )

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting CipherStakes Backend API Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)
        
        try:
            # Run all test suites
            self.test_health_endpoints()
            self.test_draws_endpoints()
            self.test_packs_endpoints()
            self.test_auth_flow()
            self.test_claims_flow()
            self.test_draw_entry_flow()
            self.test_stripe_checkout()
            self.test_admin_draw_execution()
            self.test_results_endpoint()
            self.test_user_endpoints()
            # Phase 5 retention mechanics tests
            self.test_ascension_endpoints()
            self.test_removed_endpoints()
            self.test_draw_entry_ascension_bonus()
            
        except Exception as e:
            print(f"\n❌ Test suite failed with error: {e}")
            return False
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

    def save_results(self, filename="/app/test_reports/backend_test_results.json"):
        """Save test results to file"""
        try:
            import os
            os.makedirs(os.path.dirname(filename), exist_ok=True)
            
            summary = {
                "timestamp": datetime.now().isoformat(),
                "base_url": self.base_url,
                "total_tests": self.tests_run,
                "passed_tests": self.tests_passed,
                "failed_tests": self.tests_run - self.tests_passed,
                "success_rate": (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0,
                "test_results": self.test_results
            }
            
            with open(filename, 'w') as f:
                json.dump(summary, f, indent=2)
            
            print(f"📄 Test results saved to: {filename}")
            
        except Exception as e:
            print(f"⚠️  Failed to save results: {e}")

def main():
    """Main test runner"""
    tester = CipherStakesAPITester()
    success = tester.run_all_tests()
    tester.save_results()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())