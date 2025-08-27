import requests
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class TravelAgencyAPITester:
    def __init__(self, base_url="https://travelagent.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tokens = {}  # Store tokens for different users
        self.users = {}   # Store user data
        self.trips = {}   # Store created trips
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Optional[Dict] = None, token: Optional[str] = None, 
                 files: Optional[Dict] = None) -> tuple[bool, Dict]:
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        if files:
            # Remove Content-Type for file uploads
            headers.pop('Content-Type', None)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, data=data, files=files, headers=headers)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_user_registration(self, role: str, email: str, password: str, first_name: str, last_name: str):
        """Test user registration for different roles"""
        success, response = self.run_test(
            f"Register {role} user",
            "POST",
            "auth/register",
            200,
            data={
                "email": email,
                "password": password,
                "first_name": first_name,
                "last_name": last_name,
                "role": role
            }
        )
        
        if success and 'token' in response:
            self.tokens[role] = response['token']
            self.users[role] = response['user']
            print(f"   ✅ {role} user registered and token stored")
            return True
        return False

    def test_user_login(self, role: str, email: str, password: str):
        """Test user login"""
        success, response = self.run_test(
            f"Login {role} user",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        
        if success and 'token' in response:
            self.tokens[role] = response['token']
            self.users[role] = response['user']
            print(f"   ✅ {role} user logged in and token stored")
            return True
        return False

    def test_get_current_user(self, role: str):
        """Test getting current user info"""
        if role not in self.tokens:
            print(f"❌ No token for {role}")
            return False
            
        success, response = self.run_test(
            f"Get current user info ({role})",
            "GET",
            "auth/me",
            200,
            token=self.tokens[role]
        )
        return success

    def test_create_trip(self, role: str, trip_data: Dict):
        """Test trip creation (admin/agent only)"""
        if role not in self.tokens:
            print(f"❌ No token for {role}")
            return None
            
        success, response = self.run_test(
            f"Create trip ({role})",
            "POST",
            "trips",
            200,
            data=trip_data,
            token=self.tokens[role]
        )
        
        if success and 'id' in response:
            trip_id = response['id']
            self.trips[f"{role}_trip"] = trip_id
            print(f"   ✅ Trip created with ID: {trip_id}")
            return trip_id
        return None

    def test_get_trips(self, role: str):
        """Test getting trips for user"""
        if role not in self.tokens:
            print(f"❌ No token for {role}")
            return False
            
        success, response = self.run_test(
            f"Get trips ({role})",
            "GET",
            "trips",
            200,
            token=self.tokens[role]
        )
        
        if success:
            print(f"   ✅ Retrieved {len(response)} trips")
        return success

    def test_get_trip_by_id(self, role: str, trip_id: str):
        """Test getting specific trip"""
        if role not in self.tokens:
            print(f"❌ No token for {role}")
            return False
            
        success, response = self.run_test(
            f"Get trip by ID ({role})",
            "GET",
            f"trips/{trip_id}",
            200,
            token=self.tokens[role]
        )
        return success

    def test_cruise_info_creation(self, role: str, trip_id: str):
        """Test cruise info creation"""
        if role not in self.tokens:
            print(f"❌ No token for {role}")
            return False
            
        cruise_data = {
            "trip_id": trip_id,
            "ship_name": "Royal Caribbean Explorer",
            "cabin_number": "A123",
            "departure_time": (datetime.now() + timedelta(days=30)).isoformat(),
            "return_time": (datetime.now() + timedelta(days=37)).isoformat(),
            "ship_facilities": ["Pool", "Spa", "Restaurant", "Casino"]
        }
        
        success, response = self.run_test(
            f"Create cruise info ({role})",
            "POST",
            f"trips/{trip_id}/cruise-info",
            200,
            data=cruise_data,
            token=self.tokens[role]
        )
        return success

    def test_get_cruise_info(self, role: str, trip_id: str):
        """Test getting cruise info"""
        if role not in self.tokens:
            print(f"❌ No token for {role}")
            return False
            
        success, response = self.run_test(
            f"Get cruise info ({role})",
            "GET",
            f"trips/{trip_id}/cruise-info",
            200,
            token=self.tokens[role]
        )
        return success

    def test_create_client_note(self, role: str, trip_id: str):
        """Test client note creation (client only)"""
        if role not in self.tokens:
            print(f"❌ No token for {role}")
            return False
            
        note_data = {
            "trip_id": trip_id,
            "day_number": 1,
            "note_text": "This is a test note for day 1 of the trip"
        }
        
        success, response = self.run_test(
            f"Create client note ({role})",
            "POST",
            f"trips/{trip_id}/notes",
            200,
            data=note_data,
            token=self.tokens[role]
        )
        return success

    def test_get_client_notes(self, role: str, trip_id: str):
        """Test getting client notes"""
        if role not in self.tokens:
            print(f"❌ No token for {role}")
            return False
            
        success, response = self.run_test(
            f"Get client notes ({role})",
            "GET",
            f"trips/{trip_id}/notes",
            200,
            token=self.tokens[role]
        )
        
        if success:
            print(f"   ✅ Retrieved {len(response)} notes")
        return success

    def test_dashboard_stats(self, role: str):
        """Test dashboard stats for each role"""
        if role not in self.tokens:
            print(f"❌ No token for {role}")
            return False
            
        success, response = self.run_test(
            f"Get dashboard stats ({role})",
            "GET",
            "dashboard/stats",
            200,
            token=self.tokens[role]
        )
        
        if success:
            print(f"   ✅ Dashboard stats: {response}")
        return success

    def test_get_users_admin_only(self, role: str):
        """Test getting all users (admin only)"""
        if role not in self.tokens:
            print(f"❌ No token for {role}")
            return False
            
        expected_status = 200 if role == "admin" else 403
        success, response = self.run_test(
            f"Get all users ({role})",
            "GET",
            "users",
            expected_status,
            token=self.tokens[role]
        )
        
        if success and role == "admin":
            print(f"   ✅ Retrieved {len(response)} users")
        return success

    def test_unauthorized_access(self):
        """Test unauthorized access"""
        success, response = self.run_test(
            "Unauthorized access to trips",
            "GET",
            "trips",
            401  # Should fail without token
        )
        return success

    def test_trip_update_partial(self, role: str, trip_id: str):
        """Test partial trip update functionality"""
        if role not in self.tokens:
            print(f"❌ No token for {role}")
            return False
            
        # Test partial update with only title
        partial_update_data = {
            "title": "Updated Mediterranean Cruise Adventure"
        }
        
        success, response = self.run_test(
            f"Partial trip update - title only ({role})",
            "PUT",
            f"trips/{trip_id}",
            200,
            data=partial_update_data,
            token=self.tokens[role]
        )
        
        if success:
            print(f"   ✅ Trip title updated successfully")
            
        # Test partial update with multiple fields
        multi_field_update = {
            "title": "Luxury Mediterranean Experience",
            "description": "Updated description for the luxury cruise experience",
            "status": "active"
        }
        
        success2, response2 = self.run_test(
            f"Partial trip update - multiple fields ({role})",
            "PUT",
            f"trips/{trip_id}",
            200,
            data=multi_field_update,
            token=self.tokens[role]
        )
        
        if success2:
            print(f"   ✅ Trip multiple fields updated successfully")
            
        # Test update with invalid trip_id
        success3, response3 = self.run_test(
            f"Trip update with invalid ID ({role})",
            "PUT",
            f"trips/invalid-trip-id",
            404,
            data=partial_update_data,
            token=self.tokens[role]
        )
        
        return success and success2 and success3

    def test_analytics_agent_commissions(self, role: str, year: int = None, agent_id: str = None):
        """Test agent commissions analytics endpoint"""
        if role not in self.tokens:
            print(f"❌ No token for {role}")
            return False
            
        # Build endpoint with query parameters
        endpoint = "analytics/agent-commissions"
        params = []
        if year:
            params.append(f"year={year}")
        if agent_id:
            params.append(f"agent_id={agent_id}")
        
        if params:
            endpoint += "?" + "&".join(params)
            
        expected_status = 200 if role in ["admin", "agent"] else 403
        
        success, response = self.run_test(
            f"Get agent commissions analytics ({role})",
            "GET",
            endpoint,
            expected_status,
            token=self.tokens[role]
        )
        
        if success and role in ["admin", "agent"]:
            print(f"   ✅ Analytics data retrieved: {len(response.get('trips', []))} trips")
            print(f"   📊 Total revenue: {response.get('total_revenue', 0)}")
            print(f"   💰 Total agent commission: {response.get('total_agent_commission', 0)}")
            
        return success

    def test_analytics_yearly_summary(self, role: str, year: int):
        """Test yearly summary analytics endpoint"""
        if role not in self.tokens:
            print(f"❌ No token for {role}")
            return False
            
        expected_status = 200 if role in ["admin", "agent"] else 403
        
        success, response = self.run_test(
            f"Get yearly summary analytics for {year} ({role})",
            "GET",
            f"analytics/yearly-summary/{year}",
            expected_status,
            token=self.tokens[role]
        )
        
        if success and role in ["admin", "agent"]:
            print(f"   ✅ Yearly summary for {year}: {response.get('total_confirmed_trips', 0)} trips")
            print(f"   📊 Total revenue: {response.get('total_revenue', 0)}")
            print(f"   💰 Total commissions: {response.get('total_gross_commission', 0)}")
            
        return success

    def test_create_trip_admin_data(self, role: str, trip_id: str):
        """Test creating trip administrative data for analytics"""
        if role not in self.tokens:
            print(f"❌ No token for {role}")
            return False
            
        # Create trip admin data to have something for analytics
        admin_data = {
            "trip_id": trip_id,
            "practice_number": "PRAC2024001",
            "booking_number": "BOOK2024001",
            "gross_amount": 5000.0,
            "net_amount": 4200.0,
            "discount": 200.0,
            "practice_confirm_date": datetime.now().isoformat(),
            "client_departure_date": (datetime.now() + timedelta(days=30)).isoformat(),
            "confirmation_deposit": 1000.0
        }
        
        expected_status = 200 if role in ["admin", "agent"] else 403
        
        success, response = self.run_test(
            f"Create trip admin data ({role})",
            "POST",
            f"trips/{trip_id}/admin",
            expected_status,
            data=admin_data,
            token=self.tokens[role]
        )
        
        if success and role in ["admin", "agent"]:
            print(f"   ✅ Trip admin data created for analytics testing")
            
            # Update status to confirmed for analytics
            admin_id = response.get('id')
            if admin_id:
                update_success, _ = self.run_test(
                    f"Update trip admin status to confirmed ({role})",
                    "PUT",
                    f"trip-admin/{admin_id}",
                    200,
                    data={"status": "confirmed"},
                    token=self.tokens[role]
                )
                if update_success:
                    print(f"   ✅ Trip admin status updated to confirmed")
            
        return success

def main():
    print("🚀 Starting Travel Agency API Tests")
    print("=" * 50)
    
    tester = TravelAgencyAPITester()
    
    # Test data
    test_users = {
        "admin": {
            "email": "admin@test.com",
            "password": "password123",
            "first_name": "Admin",
            "last_name": "User"
        },
        "agent": {
            "email": "agent@test.com", 
            "password": "password123",
            "first_name": "Agent",
            "last_name": "User"
        },
        "client": {
            "email": "client@test.com",
            "password": "password123", 
            "first_name": "Client",
            "last_name": "User"
        }
    }
    
    print("\n📝 PHASE 1: User Registration & Authentication")
    print("-" * 40)
    
    # Test user registration for all roles
    for role, user_data in test_users.items():
        if not tester.test_user_registration(role, **user_data):
            print(f"❌ Registration failed for {role}, trying login...")
            if not tester.test_user_login(role, user_data["email"], user_data["password"]):
                print(f"❌ Both registration and login failed for {role}")
                continue
    
    # Test getting current user info
    for role in test_users.keys():
        tester.test_get_current_user(role)
    
    # Test unauthorized access
    tester.test_unauthorized_access()
    
    print("\n🎯 PHASE 2: Trip Management")
    print("-" * 40)
    
    # Create test trips
    if "client" in tester.users:
        client_id = tester.users["client"]["id"]
        
        # Test trip creation by agent
        trip_data = {
            "title": "Mediterranean Cruise Adventure",
            "destination": "Mediterranean Sea",
            "description": "7-day cruise through the Mediterranean with stops in Italy, Spain, and France",
            "start_date": (datetime.now() + timedelta(days=30)).isoformat(),
            "end_date": (datetime.now() + timedelta(days=37)).isoformat(),
            "client_id": client_id,
            "trip_type": "cruise"
        }
        
        # Agent creates trip
        agent_trip_id = tester.test_create_trip("agent", trip_data)
        
        # Admin creates trip
        admin_trip_data = {
            **trip_data,
            "title": "Resort Vacation in Maldives",
            "destination": "Maldives",
            "trip_type": "resort"
        }
        admin_trip_id = tester.test_create_trip("admin", admin_trip_data)
        
        # Test getting trips for all roles
        for role in test_users.keys():
            tester.test_get_trips(role)
        
        # Test getting specific trip
        if agent_trip_id:
            for role in test_users.keys():
                tester.test_get_trip_by_id(role, agent_trip_id)

    print("\n🔄 PHASE 2.1: Trip Update Testing (Critical)")
    print("-" * 40)
    
    # Test trip update functionality - CRITICAL TEST
    if agent_trip_id:
        # Test agent updating their own trip
        tester.test_trip_update_partial("agent", agent_trip_id)
        
        # Test admin updating any trip
        if admin_trip_id:
            tester.test_trip_update_partial("admin", admin_trip_id)
        
        # Test client trying to update trip (should fail)
        expected_status_backup = tester.run_test.__defaults__
        success, response = tester.run_test(
            "Client attempting trip update (should fail)",
            "PUT",
            f"trips/{agent_trip_id}",
            403,  # Should fail
            data={"title": "Client trying to update"},
            token=tester.tokens.get("client")
        )
        print(f"   ✅ Client update properly blocked: {success}")
    
    print("\n💰 PHASE 2.2: Trip Admin Data Setup for Analytics")
    print("-" * 40)
    
    # Create trip admin data for analytics testing
    if agent_trip_id:
        tester.test_create_trip_admin_data("agent", agent_trip_id)
    if admin_trip_id:
        tester.test_create_trip_admin_data("admin", admin_trip_id)
    
    print("\n🚢 PHASE 3: Cruise-Specific Features")
    print("-" * 40)
    
    # Test cruise info creation and retrieval
    if "agent_trip" in tester.trips:
        trip_id = tester.trips["agent_trip"]
        tester.test_cruise_info_creation("agent", trip_id)
        tester.test_get_cruise_info("agent", trip_id)
        tester.test_get_cruise_info("client", trip_id)
    
    print("\n📝 PHASE 4: Client Notes System")
    print("-" * 40)
    
    # Test client notes
    if "agent_trip" in tester.trips:
        trip_id = tester.trips["agent_trip"]
        tester.test_create_client_note("client", trip_id)
        tester.test_get_client_notes("client", trip_id)
    
    print("\n📊 PHASE 5: Dashboard & Admin Features")
    print("-" * 40)
    
    # Test dashboard stats for all roles
    for role in test_users.keys():
        tester.test_dashboard_stats(role)
    
    # Test admin-only features
    tester.test_get_users_admin_only("admin")
    tester.test_get_users_admin_only("agent")  # Should fail
    tester.test_get_users_admin_only("client")  # Should fail

    print("\n📈 PHASE 6: Analytics Testing (Critical)")
    print("-" * 40)
    
    # Test analytics endpoints - CRITICAL TESTS
    current_year = datetime.now().year
    
    # Test agent commissions analytics
    for role in test_users.keys():
        # Test without parameters
        tester.test_analytics_agent_commissions(role)
        
        # Test with year parameter
        tester.test_analytics_agent_commissions(role, year=current_year)
        
        # Test with agent_id parameter (admin only)
        if role == "admin" and "agent" in tester.users:
            agent_id = tester.users["agent"]["id"]
            tester.test_analytics_agent_commissions(role, agent_id=agent_id)
            
            # Test with both year and agent_id
            tester.test_analytics_agent_commissions(role, year=current_year, agent_id=agent_id)
    
    # Test yearly summary analytics
    for role in test_users.keys():
        tester.test_analytics_yearly_summary(role, current_year)
        tester.test_analytics_yearly_summary(role, current_year - 1)  # Previous year
    
    print("\n" + "=" * 50)
    print(f"📊 FINAL RESULTS: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())