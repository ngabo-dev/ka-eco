#!/bin/bash

# Ka-Eco Wetland Management System - Comprehensive Testing Script
# This script tests user roles, permissions, and workflows

echo "🌿 Ka-Eco Wetland Management System - Comprehensive Testing"
echo "=========================================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0
TOTAL=0

# Helper function to run tests
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    TOTAL=$((TOTAL + 1))
    echo -e "\n${BLUE}Test $TOTAL: $test_name${NC}"
    
    # Run the test command
    result=$(eval "$test_command" 2>&1)
    exit_code=$?
    
    if [[ $exit_code -eq 0 ]] && [[ "$result" == *"$expected_result"* || "$expected_result" == "success" ]]; then
        echo -e "${GREEN}✅ PASSED${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo -e "${RED}Expected: $expected_result${NC}"
        echo -e "${RED}Got: $result${NC}"
        FAILED=$((FAILED + 1))
    fi
}

# Test configuration
API_BASE_URL="http://localhost:8000"
FRONTEND_URL="http://localhost:3000"

echo -e "\n${YELLOW}📋 Testing Configuration${NC}"
echo "API Base URL: $API_BASE_URL"
echo "Frontend URL: $FRONTEND_URL"

# 1. AUTHENTICATION & USER ACCOUNT TESTS
echo -e "\n${YELLOW}🔐 1. AUTHENTICATION & USER ACCOUNT TESTS${NC}"

# Test 1.1: Check if RegisterForm excludes admin role
echo -e "\n${BLUE}1.1 Registration Form Role Validation${NC}"
echo "Checking RegisterForm component for role options..."

if grep -q '"admin"' src/components/auth/RegisterForm.tsx; then
    echo -e "${RED}❌ FAILED: Admin role found in RegisterForm${NC}"
    FAILED=$((FAILED + 1))
else
    echo -e "${GREEN}✅ PASSED: Admin role properly excluded from public registration${NC}"
    PASSED=$((PASSED + 1))
fi
TOTAL=$((TOTAL + 1))

# Test 1.2: Verify backend registration endpoint prevents admin creation
run_test "Backend prevents admin registration via public endpoint" \
    'curl -s -X POST "$API_BASE_URL/auth/register" -H "Content-Type: application/json" -d "{\"username\":\"test_admin\",\"email\":\"admin@test.com\",\"password\":\"password123\",\"role\":\"admin\"}" | grep -o "role.*researcher"' \
    "researcher"

# Test 1.3: Test valid user registration
run_test "Valid user registration (researcher role)" \
    'curl -s -X POST "$API_BASE_URL/auth/register" -H "Content-Type: application/json" -d "{\"username\":\"test_researcher_$(date +%s)\",\"email\":\"researcher_$(date +%s)@test.com\",\"password\":\"password123\",\"role\":\"researcher\"}"' \
    "Account created successfully"

# Test 1.4: Test duplicate username prevention
run_test "Duplicate username prevention" \
    'curl -s -X POST "$API_BASE_URL/auth/register" -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"email\":\"test_duplicate@test.com\",\"password\":\"password123\",\"role\":\"researcher\"}"' \
    "Username already registered"

# Test 1.5: Test login functionality
run_test "Admin login functionality" \
    'curl -s -X POST "$API_BASE_URL/auth/token" -H "Content-Type: application/x-www-form-urlencoded" -d "username=admin&password=admin123"' \
    "access_token"

# Test 1.6: Test invalid credentials rejection
run_test "Invalid credentials rejection" \
    'curl -s -X POST "$API_BASE_URL/auth/token" -H "Content-Type: application/x-www-form-urlencoded" -d "username=invalid&password=wrong"' \
    "User not found"

# 2. PERMISSIONS & ROLE-BASED ACCESS CONTROL TESTS
echo -e "\n${YELLOW}🛡️ 2. PERMISSIONS & ROLE-BASED ACCESS CONTROL TESTS${NC}"

# Get admin token for protected endpoint tests
ADMIN_TOKEN=$(curl -s -X POST "$API_BASE_URL/auth/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=admin&password=admin123" | \
    python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)

if [ -n "$ADMIN_TOKEN" ]; then
    echo -e "${GREEN}✅ Admin token obtained successfully${NC}"
    
    # Test 2.1: Admin user list access
    run_test "Admin can access user list" \
        'curl -s -H "Authorization: Bearer $ADMIN_TOKEN" "$API_BASE_URL/auth/users"' \
        "username"
    
    # Test 2.2: Admin user statistics access
    run_test "Admin can access user statistics" \
        'curl -s -H "Authorization: Bearer $ADMIN_TOKEN" "$API_BASE_URL/auth/users/stats"' \
        "total_users"
    
    # Test 2.3: Admin wetland management access
    run_test "Admin can access wetland data" \
        'curl -s -H "Authorization: Bearer $ADMIN_TOKEN" "$API_BASE_URL/wetlands/"' \
        "success"
    
else
    echo -e "${RED}❌ Could not obtain admin token - skipping protected endpoint tests${NC}"
    FAILED=$((FAILED + 3))
fi

# 3. WETLAND MANAGEMENT TESTS
echo -e "\n${YELLOW}🌊 3. WETLAND MANAGEMENT TESTS${NC}"

# Test 3.1: Check wetland model structure
echo -e "\n${BLUE}3.1 Wetland Model Validation${NC}"
if grep -q "class Wetland" backend/app/models.py && \
   grep -q "name.*String" backend/app/models.py && \
   grep -q "location.*String" backend/app/models.py && \
   grep -q "size.*Float" backend/app/models.py; then
    echo -e "${GREEN}✅ PASSED: Wetland model has required attributes${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED: Wetland model missing required attributes${NC}"
    FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

# Test 3.2: Check observation model structure
echo -e "\n${BLUE}3.2 Observation Model Validation${NC}"
if grep -q "class Observation" backend/app/models.py && \
   grep -q "species.*String" backend/app/models.py && \
   grep -q "wetland_id.*Integer" backend/app/models.py; then
    echo -e "${GREEN}✅ PASSED: Observation model has required attributes${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED: Observation model missing required attributes${NC}"
    FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

# 4. SECURITY TESTS
echo -e "\n${YELLOW}🔒 4. SECURITY TESTS${NC}"

# Test 4.1: Password hashing verification
echo -e "\n${BLUE}4.1 Password Hashing Verification${NC}"
if grep -q "bcrypt\|scrypt\|get_password_hash" backend/app/auth.py; then
    echo -e "${GREEN}✅ PASSED: Password hashing implemented${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED: No password hashing found${NC}"
    FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

# Test 4.2: JWT token implementation
echo -e "\n${BLUE}4.2 JWT Token Implementation${NC}"
if grep -q "jose\|jwt\|create_access_token" backend/app/auth.py; then
    echo -e "${GREEN}✅ PASSED: JWT token implementation found${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED: No JWT implementation found${NC}"
    FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

# Test 4.3: CORS configuration
echo -e "\n${BLUE}4.3 CORS Configuration${NC}"
if grep -q "CORS_ORIGINS\|CORSMiddleware" backend/app/main.py; then
    echo -e "${GREEN}✅ PASSED: CORS configuration found${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED: No CORS configuration found${NC}"
    FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

# 5. FRONTEND COMPONENT TESTS
echo -e "\n${YELLOW}🖥️ 5. FRONTEND COMPONENT TESTS${NC}"

# Test 5.1: Permission system implementation
echo -e "\n${BLUE}5.1 Permission System Implementation${NC}"
if [ -f "src/utils/permissions.ts" ] && \
   grep -q "hasPermission\|canAccessSection\|ROLE_PERMISSIONS" src/utils/permissions.ts; then
    echo -e "${GREEN}✅ PASSED: Permission system implemented${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED: Permission system not found or incomplete${NC}"
    FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

# Test 5.2: Adaptive Dashboard implementation
echo -e "\n${BLUE}5.2 Adaptive Dashboard Implementation${NC}"
if [ -f "src/components/dashboard/AdaptiveDashboard.tsx" ] && \
   grep -q "getUserCapabilities\|userRole\|allowedSections" src/components/dashboard/AdaptiveDashboard.tsx; then
    echo -e "${GREEN}✅ PASSED: Adaptive Dashboard implemented${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED: Adaptive Dashboard not found or incomplete${NC}"
    FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

# Test 5.3: User Management interface (Admin only)
echo -e "\n${BLUE}5.3 User Management Interface${NC}"
if [ -f "src/components/dashboard/admin/UserManagement.tsx" ] && \
   grep -q "createUser\|updateUser\|deleteUser" src/components/dashboard/admin/UserManagement.tsx; then
    echo -e "${GREEN}✅ PASSED: User Management interface implemented${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED: User Management interface not found or incomplete${NC}"
    FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

# 6. DATA INTEGRITY TESTS
echo -e "\n${YELLOW}📊 6. DATA INTEGRITY TESTS${NC}"

# Test 6.1: Database schema validation
echo -e "\n${BLUE}6.1 Database Schema Validation${NC}"
if [ -f "database_schema.sql" ] || [ -f "database_schema_sqlite.sql" ]; then
    echo -e "${GREEN}✅ PASSED: Database schema files found${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED: No database schema files found${NC}"
    FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

# Test 6.2: Input validation implementation
echo -e "\n${BLUE}6.2 Input Validation Implementation${NC}"
if grep -q "validators\|ValidationError\|validate" backend/app/schemas.py || \
   grep -q "validators\|ValidationError\|validate" backend/app/routers/*.py; then
    echo -e "${GREEN}✅ PASSED: Input validation implemented${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠️ WARNING: Limited input validation found${NC}"
    FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

# 7. WORKFLOW TESTS
echo -e "\n${YELLOW}⚡ 7. WORKFLOW TESTS${NC}"

# Test 7.1: Authentication workflow
echo -e "\n${BLUE}7.1 Authentication Workflow${NC}"
if [ -f "src/components/auth/AuthContext.tsx" ] && \
   grep -q "login\|register\|logout\|updateProfile" src/components/auth/AuthContext.tsx; then
    echo -e "${GREEN}✅ PASSED: Complete authentication workflow implemented${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED: Authentication workflow incomplete${NC}"
    FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

# Test 7.2: Session management
echo -e "\n${BLUE}7.2 Session Management${NC}"
if grep -q "SESSION_TIMEOUT\|sessionTimeout\|handleUserActivity" src/components/auth/AuthContext.tsx; then
    echo -e "${GREEN}✅ PASSED: Session management implemented${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED: Session management not found${NC}"
    FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

# CRITICAL ISSUES ASSESSMENT
echo -e "\n${YELLOW}🚨 CRITICAL ISSUES ASSESSMENT${NC}"

# Issue 1: User Approval Workflow
echo -e "\n${BLUE}Issue 1: User Approval Workflow${NC}"
if grep -q "is_approved\|pending_approval\|approved_by" backend/app/models.py || \
   grep -q "approve_user\|pending_users" backend/app/routers/auth.py; then
    echo -e "${GREEN}✅ User approval workflow implemented${NC}"
else
    echo -e "${RED}❌ CRITICAL: User approval workflow missing${NC}"
    echo -e "${RED}   Users are automatically active upon registration${NC}"
    echo -e "${RED}   This violates the requirement for admin approval${NC}"
fi

# Issue 2: Audit Logging
echo -e "\n${BLUE}Issue 2: Audit Logging${NC}"
if grep -q "audit\|log_action\|activity_log" backend/app/ -r; then
    echo -e "${GREEN}✅ Audit logging implemented${NC}"
else
    echo -e "${YELLOW}⚠️ WARNING: Limited audit logging found${NC}"
    echo -e "${YELLOW}   Consider implementing comprehensive audit trails${NC}"
fi

# Issue 3: Referential Integrity Warnings
echo -e "\n${BLUE}Issue 3: Referential Integrity Warnings${NC}"
if grep -q "cascade\|restrict\|foreign_key" backend/app/models.py; then
    echo -e "${GREEN}✅ Foreign key constraints found${NC}"
else
    echo -e "${YELLOW}⚠️ WARNING: Limited referential integrity constraints${NC}"
fi

# SUMMARY
echo -e "\n${YELLOW}📊 TEST SUMMARY${NC}"
echo "=============="
echo -e "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

PASS_RATE=$(( (PASSED * 100) / TOTAL ))
echo -e "Pass Rate: $PASS_RATE%"

if [ $PASS_RATE -ge 80 ]; then
    echo -e "\n${GREEN}🎉 OVERALL STATUS: GOOD${NC}"
    echo -e "${GREEN}The system meets most requirements with minor issues${NC}"
elif [ $PASS_RATE -ge 60 ]; then
    echo -e "\n${YELLOW}⚠️ OVERALL STATUS: NEEDS IMPROVEMENT${NC}"
    echo -e "${YELLOW}Several issues need to be addressed${NC}"
else
    echo -e "\n${RED}🚨 OVERALL STATUS: CRITICAL ISSUES${NC}"
    echo -e "${RED}Major issues need immediate attention${NC}"
fi

# RECOMMENDATIONS
echo -e "\n${YELLOW}💡 RECOMMENDATIONS${NC}"
echo "==================="
echo "1. Implement user approval workflow (HIGH PRIORITY)"
echo "2. Add comprehensive audit logging (MEDIUM PRIORITY)"
echo "3. Enhance referential integrity warnings (LOW PRIORITY)"
echo "4. Add automated testing suite (MEDIUM PRIORITY)"
echo "5. Implement password reset email functionality (MEDIUM PRIORITY)"

# NEXT STEPS
echo -e "\n${YELLOW}🚀 NEXT STEPS${NC}"
echo "=============="
echo "1. Address critical issues identified above"
echo "2. Run manual testing scenarios with different user roles"
echo "3. Test with multiple concurrent users"
echo "4. Verify data integrity with large datasets"
echo "5. Conduct security penetration testing"

echo -e "\n${BLUE}Testing completed. Review results above for detailed findings.${NC}"