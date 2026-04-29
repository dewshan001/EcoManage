# EcoManage - Comprehensive Test Cases Documentation

**Project:** EcoManage - Waste Management System  
**Date:** April 29, 2026  
**Scope:** Unit Tests, Integration Tests, System Tests  
**Test Data:** Includes sample values and patterns  

---

## Table of Contents

1. [Backend Unit Tests - Authentication](#backend-unit-tests---authentication--user-management)
2. [Backend Unit Tests - Reports](#backend-unit-tests---reports)
3. [Backend Unit Tests - Tasks & Billing](#backend-unit-tests---tasks--billing)
4. [Backend Unit Tests - Vehicles](#backend-unit-tests---vehicles)
5. [Backend Unit Tests - Database & Audit](#backend-unit-tests---database--audit)
6. [Frontend Component Tests](#frontend-component-unit-tests)
7. [System Integration Tests - Resident](#system-integration-tests---resident-workflows)
8. [System Integration Tests - Admin](#system-integration-tests---admin--complete-workflows)

---

## BACKEND UNIT TESTS - AUTHENTICATION & USER MANAGEMENT

| Test ID | Scenario | Input Data | Expected Output | Assertion | Priority |
|---------|----------|-----------|-----------------|-----------|----------|
| **AUTH-01** | Valid Resident Registration | `{ fullName: "John Doe", email: "john@gmail.com", password: "Password123!" }` | 201 Status, `{ user, id, role: "Resident" }` | Email stored in Users table, password hashed with bcrypt, role defaults to Resident | **HIGH** |
| **AUTH-02** | Registration - Invalid Email (non-Gmail) | `{ fullName: "Jane Smith", email: "jane@yahoo.com", password: "Password123!" }` | 400 Status, Error: "Email must end with @gmail.com" | Validation rejects non-Gmail addresses | **HIGH** |
| **AUTH-03** | Registration - Weak Password (no uppercase) | `{ fullName: "Bob Jones", email: "bob@gmail.com", password: "password123!" }` | 400 Status, Error: "Password must contain uppercase & special character" | Validation fails regex: `/^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/` | **HIGH** |
| **AUTH-04** | Registration - Duplicate Email | User 1: `john@gmail.com` exists, User 2: attempt same email | 409 Status, Error: "Email already registered" | UNIQUE constraint on Users.email enforced | **HIGH** |
| **AUTH-05** | Registration - Invalid Name (includes numbers) | `{ fullName: "John123 Doe", email: "john123@gmail.com", password: "Password123!" }` | 400 Status, Error: "Name must contain letters & spaces only" | Regex validation enforces `/^[\p{L} ]+$/u` | **MEDIUM** |
| **AUTH-06** | Valid User Login (Resident) | `{ email: "john@gmail.com", password: "Password123!" }` | 200 Status, `{ user, id, role: "Resident" }` | Bcrypt password comparison succeeds, user data returned with session info | **HIGH** |
| **AUTH-07** | Login - Incorrect Password | `{ email: "john@gmail.com", password: "WrongPassword1!" }` | 401 Status, Error: "Invalid credentials" | Bcrypt hash comparison fails, no user info leaked | **HIGH** |
| **AUTH-08** | Login - Non-existent Email | `{ email: "nonexistent@gmail.com", password: "Password123!" }` | 401 Status, Error: "Invalid credentials" | User not found in Users or Workers table | **HIGH** |
| **AUTH-09** | Login - Worker Returns Correct Role | Worker email: "worker@gmail.com", password: "WPassword123!" | 200 Status, `{ user, id, role: "Worker", skill: "...", workerRole: "..." }` | Fallback to Workers table returns Worker role with additional fields | **HIGH** |
| **AUTH-10** | Update Profile - Valid Change | `{ userId: 1, fullName: "John Updated", password: "NewPass123!" }` | 200 Status, Updated user object | Name & password updated in Users table, password re-hashed | **MEDIUM** |
| **AUTH-11** | Update Profile - Missing Required Field | `{ userId: 1, fullName: "" }` | 400 Status, Error: "Name is required" | Validation prevents empty fields | **MEDIUM** |
| **AUTH-12** | Register Manager (Admin Only) | Admin POST: `{ fullName: "Mgr Smith", email: "mgr@gmail.com", password: "MgrPass123!", contactNumber: "555-1234" }` | 201 Status, `{ user, role: "GarbageManager" }` | User created in Users table with role=GarbageManager, contact stored | **HIGH** |
| **AUTH-13** | Register Manager - Non-Admin Attempt | Non-admin POST same data to `/api/auth/register-manager` | 403 Status, Error: "Unauthorized" | Role-based access control enforced | **HIGH** |
| **AUTH-14** | Get All Managers | Admin GET `/api/auth/managers` | 200 Status, `{ managers: [{ id, fullName, email, contactNumber, ... }] }` | Returns only GarbageManager role users, sorted by creation date | **MEDIUM** |
| **AUTH-15** | Delete Manager (Admin Only) | Admin DELETE `/api/auth/managers/2` | 200 Status, `{ message: "Manager deleted" }` | User ID=2 removed from Users table | **MEDIUM** |

**Test Execution Path:** `tests/backend/unit/auth.test.js`

---

## BACKEND UNIT TESTS - REPORTS

| Test ID | Scenario | Input Data | Expected Output | Assertion | Priority |
|---------|----------|-----------|-----------------|-----------|----------|
| **REP-01** | Create Report - Resident Submission | Resident ID=1 POST `/api/reports`: `{ location: "Block A, Street 5", description: "Overflowing trash bin", imageUrl: "img_url.jpg" }` | 201 Status, `{ reportId: "REP-xxxxx", id, message }` | Report created with unique reportId, status='Pending', citizenId=1, timestamp recorded | **HIGH** |
| **REP-02** | Create Report - Missing Description | POST: `{ location: "Block A", imageUrl: null }` | 400 Status, Error: "Description required" | Validation prevents submission without required fields | **HIGH** |
| **REP-03** | Get All Reports (Admin View) | Admin GET `/api/reports` | 200 Status, `[{ reportId, location, status, citizenName, linkedTaskId, decisionDate, ... }]` | All reports returned, joined with citizen names, sorted by creation date | **HIGH** |
| **REP-04** | Get Resident's Reports (Filtered) | Resident ID=5 GET `/api/reports?userId=5` | 200 Status, `[{ reportId, ... }]` only user 5's reports | Query filter applied, authorization enforced, pagination supported | **HIGH** |
| **REP-05** | Update Report Status - Admin Approve | Admin PUT `/api/reports/1`: `{ status: "Approved", linkedTaskId: 10, priority: "High", scheduleDate: "2026-05-15" }` | 200 Status, Updated report + Task auto-created in Tasks table | Report status changed to "Approved", decisionDate set, Task entry created with linkedTaskId | **HIGH** |
| **REP-06** | Update Report - Resident Edit Own Report | Resident ID=1 PUT `/api/reports/1` (their own): `{ location: "Updated location", description: "New desc" }` | 200 Status, Updated report | Only location & description updated, status preserved, editDate updated | **MEDIUM** |
| **REP-07** | Update Report - Resident Cannot Edit Others | Resident ID=1 PUT `/api/reports/3` (belongs to ID=2) | 403 Status, Error: "Unauthorized" | Authorization check fails, no data modified | **HIGH** |
| **REP-08** | Set Decision Date on Status Change | Admin PUT `/api/reports/1` with status change from "Pending" to "Approved" | 200 Status, decisionDate set to current ISO timestamp | Timestamp auto-populated on admin status updates | **MEDIUM** |
| **REP-09** | Delete Report (Admin) | Admin DELETE `/api/reports/2` | 200 Status, `{ message: "Report deleted" }` | Report ID=2 removed from database, linked tasks notified | **MEDIUM** |
| **REP-10** | Report Status Progression - Pending→Approved | Report starts "Pending", Admin updates to "Approved" | 200 Status | Status transitions validate: Pending → Approved, Rejected, or In Review | **MEDIUM** |
| **REP-11** | Report Status Progression - Approved→Resolved | Report is "Approved" with task assigned, task completes | Status auto-updates report to "Resolved" | Linked report status changes when linked task status='Completed' | **MEDIUM** |
| **REP-12** | Reject Report with Comment | Admin PUT `/api/reports/1`: `{ status: "Rejected", rejectionReason: "Insufficient details" }` | 200 Status, Report status='Rejected', rejectionReason stored | Rejection tracked with reason for resident feedback | **LOW** |

**Test Execution Path:** `tests/backend/unit/reports.test.js`

---

## BACKEND UNIT TESTS - TASKS & BILLING

### Tasks Tests

| Test ID | Scenario | Input Data | Expected Output | Assertion | Priority |
|---------|----------|-----------|-----------------|-----------|----------|
| **TASK-01** | Create Task from Report | Admin POST `/api/tasks`: `{ reportId: 5, priority: "High", scheduleDate: "2026-05-20", workers: "W001", vehicleType: "Compactor Truck" }` | 201 Status, `{ taskId: "TSK-xxxxx", id, message }` | Task created with unique taskId, status='Pending', all fields stored | **HIGH** |
| **TASK-02** | Task Auto-link to Report | When task created with reportId=5, report's linkedTaskId updated | GET `/api/reports/5` returns linkedTaskId = task.id | Report.linkedTaskId = task.id cross-reference | **HIGH** |
| **TASK-03** | Update Task Status - Pending→Pending Worker | PUT `/api/tasks/1`: `{ status: "Pending Worker", assignedTo: "W001" }` | 200 Status, Task status changed, worker assigned | Status progression logged, worker assignment tracked | **HIGH** |
| **TASK-04** | Update Task Status - Mark Complete (Auto-Invoice) | PUT `/api/tasks/1`: `{ status: "Completed" }` | 200 Status, Task status='Pending Invoice', report status='Resolved' | Status auto-converts, linked report updated, invoice-ready state set | **HIGH** |
| **TASK-05** | Task Status Must Follow Sequence | Attempt invalid: "Pending" → "Payment Completed" (skip steps) | 400 Status or allowed (depends on business rule) | Clarify: Is strict sequence enforced or flexible? Document behavior | **MEDIUM** |
| **TASK-06** | Assign Vehicle to Task | PUT `/api/tasks/1`: `{ assignedVehicle: "VH-001" }` | 200 Status, Task.assignedVehicle = "VH-001" | Vehicle field updated, vehicle status may auto-change to "In Use" | **MEDIUM** |
| **TASK-07** | Get All Tasks (Joined with Report Data) | Admin GET `/api/tasks` | 200 Status, `[{ taskId, location, description, status, ... }]` | Report fields included via JOIN, sorted by priority & schedule | **MEDIUM** |
| **TASK-08** | Get Single Task by ID | GET `/api/tasks/1` | 200 Status, `{ taskId, reportId, status, ... }` | Specific task returned with all linked data | **LOW** |
| **TASK-09** | Delete Task | Admin DELETE `/api/tasks/1` | 200 Status, `{ message: "Task deleted" }` | Task removed, report's linkedTaskId cleared | **LOW** |
| **TASK-10** | Get Task with Invalid ID | GET `/api/tasks/999` | 404 Status, Error: "Task not found" | Proper 404 error handling | **LOW** |

### Billing Tests

| Test ID | Scenario | Input Data | Expected Output | Assertion | Priority |
|---------|----------|-----------|-----------------|-----------|----------|
| **BILL-01** | Create Invoice from Task | POST `/api/billing`: `{ taskId: 1, residentId: 5, taskType: "Bulk Waste", wasteFee: 50, laborFee: 30, vehicleFee: 40 }` | 201 Status, `{ invoiceId: "INV-xxxx", invoice, message }` | Invoice created, task status auto-updates to 'Pending Payment', total=$120 | **HIGH** |
| **BILL-02** | Fee Structure Applied (Default) | POST invoice with `taskType: "General Waste"` (no custom fees) | 201 Status, invoice total = (20+15+25) = $60 | Default fees from hardcoded structure applied | **HIGH** |
| **BILL-03** | List All Invoices (Admin) | Admin GET `/api/billing` | 200 Status, `[{ invoiceId, residentName, total, status: "Unpaid"/"Paid", paidAt, ... }]` | All invoices returned, pagination supported | **MEDIUM** |
| **BILL-04** | Get Invoices by Resident | Resident GET `/api/billing/resident/5` | 200 Status, `[{ invoiceId, ... }]` (only resident 5's) | Filtered by residentId, authorization enforced | **MEDIUM** |
| **BILL-05** | Mark Invoice as Paid | Admin PUT `/api/billing/1/pay` | 200 Status, Status="Paid", paidAt=timestamp, task status→'Payment Completed' | Invoice marked paid, timestamp recorded, task updated | **HIGH** |
| **BILL-06** | Delete Unpaid Invoice | Admin DELETE `/api/billing/1` | 200 Status, `{ message: "Invoice deleted" }` | Invoice removed, linked task status reverts to 'Pending Invoice' | **MEDIUM** |
| **BILL-07** | Available Tasks for Invoicing | GET `/api/billing/available-tasks` | 200 Status, `[{ taskId, reportId, location, residentName, ... }]` | Shows tasks ready for invoice (status='Pending Invoice' or eligible) | **MEDIUM** |
| **BILL-08** | Billing Migration (Legacy Tasks) | GET `/api/billing/migrate-tasks` | 200 Status, `{ message, changes: count }` | One-time migration updates old task statuses to 'Pending Invoice' | **LOW** |

**Test Execution Path:** `tests/backend/unit/tasks-billing.test.js`

---

## BACKEND UNIT TESTS - VEHICLES

| Test ID | Scenario | Input Data | Expected Output | Assertion | Priority |
|---------|----------|-----------|-----------------|-----------|----------|
| **VEH-01** | Register Vehicle | Admin POST `/api/vehicles`: `{ vehicleId: "VH-001", type: "Compactor Truck", driver: "John Driver", plateNumber: "XYZ-1234" }` | 201 Status, `{ vehicleId, id, message }` | Vehicle created, status='Available', condition='Good', fuelLevel=100 | **HIGH** |
| **VEH-02** | Register Vehicle - Duplicate ID | POST first vehicle VH-001, then POST same vehicleId | 409 Status, Error: "Vehicle ID already exists" | UNIQUE constraint on Vehicles.vehicleId enforced | **HIGH** |
| **VEH-03** | List All Vehicles | Admin GET `/api/vehicles` | 200 Status, `[{ vehicleId, type, driver, status, condition, fuelLevel, lastMaintenance, nextMaintenance, ... }]` | All vehicles returned, sorted by creation date DESC | **MEDIUM** |
| **VEH-04** | Get Single Vehicle | GET `/api/vehicles/1` (by numeric id) | 200 Status, Vehicle object with all fields | Specific vehicle returned with complete data | **LOW** |
| **VEH-05** | Update Vehicle - Status Change | PUT `/api/vehicles/1`: `{ status: "In Use", location: "Block A" }` | 200 Status, Vehicle status updated to "In Use" | Status field changed, location tracked | **MEDIUM** |
| **VEH-06** | Update Vehicle - Fuel Level | PUT `/api/vehicles/1`: `{ fuelLevel: 45 }` | 200 Status, fuelLevel=45 | Fuel level updated and tracked for fleet management | **MEDIUM** |
| **VEH-07** | Update Vehicle - Maintenance Fields | PUT `/api/vehicles/1`: `{ lastMaintenance: "2026-04-20", nextMaintenance: "2026-06-20", condition: "Fair" }` | 200 Status, Fields updated | Maintenance dates and condition tracked for fleet operations | **MEDIUM** |
| **VEH-08** | Delete Vehicle | Admin DELETE `/api/vehicles/1` | 200 Status, `{ message: "Vehicle deleted" }` | Vehicle removed from database, tasks may lose assignment | **LOW** |

**Test Execution Path:** `tests/backend/unit/vehicles.test.js`

---

## BACKEND UNIT TESTS - DATABASE & AUDIT

| Test ID | Scenario | Input Data | Expected Output | Assertion | Priority |
|---------|----------|-----------|-----------------|-----------|----------|
| **DB-01** | Database Initialization on Startup | Server startup without existing DB file | DB file created at path specified in ECOMANAGE_DB_PATH, all tables exist | Tables created: Users, Workers, Reports, Tasks, Vehicles, Invoices, AuditLogs | **HIGH** |
| **DB-02** | Schema Migration - Add Missing Columns | DB exists but lacks `userId` column on Reports table | Migration runs automatically during server init, column added via ALTER TABLE | ALTER TABLE executes without errors, data preserved | **HIGH** |
| **DB-03** | Email Unique Constraint | Insert user 1 with email "test@gmail.com", insert user 2 with same email | 2nd insert fails with UNIQUE constraint error | Database prevents duplicate emails in Users table | **HIGH** |
| **DB-04** | reportId Unique Constraint | Insert 2 reports with identical reportId | 2nd insert fails with UNIQUE constraint error | UNIQUE constraint enforced on Reports.reportId | **MEDIUM** |
| **DB-05** | Audit Log - Log User Creation | Admin creates new manager user, logAuditAction called with `{ adminId: 1, action: "CREATE_USER", targetType: "User", targetId: 5, changes: {...} }` | Audit entry recorded in AuditLogs table with timestamp | Row inserted: adminId, action, targetType, targetId, changes, timestamp | **HIGH** |
| **DB-06** | Audit Log - Retrieve Logs for User | Call getAuditLogsForUser(userId=5, limit=10) | `[{ id, adminId, adminName, action, targetId, changes, timestamp }]` max 10 records | Logs joined with admin name, sorted by timestamp DESC | **MEDIUM** |
| **DB-07** | Audit Log - Date Range Filter | Call getAuditLogsByDateRange("2026-04-01", "2026-04-30") | `[{ ... }]` only logs in April 2026 range | Date filtering works, timestamps compared correctly | **LOW** |
| **DB-08** | Audit Log - All Logs (Paginated) | Call getAllAuditLogs(limit=20, offset=0) | `[{ ... }]` 20 records starting from offset 0 | Pagination applied correctly, offset skips records | **LOW** |

**Test Execution Path:** `tests/backend/unit/database.test.js`

---

## FRONTEND COMPONENT UNIT TESTS

| Test ID | Component | Scenario | Input/User Action | Expected Output | Assertion | Priority |
|---------|-----------|----------|-------------------|-----------------|-----------|----------|
| **FE-01** | Login.jsx | Valid Login Attempt | User enters email "john@gmail.com", password "Password123!", clicks Submit | POST to `/api/auth/login`, session storage sets user object, redirects to Dashboard | SessionStorage contains user data with id/role, navigation to Dashboard triggered | **HIGH** |
| **FE-02** | Login.jsx | Invalid Credentials | User enters "john@gmail.com", "WrongPass1!", clicks Submit | POST fails with 401 status | Error message displayed: "Invalid credentials", no redirect occurs | **HIGH** |
| **FE-03** | Register.jsx | Valid Registration | Form filled: name="Jane Doe", email="jane@gmail.com", password="JanePass123!", confirm matches, clicks Submit | POST to `/api/auth/register`, receives user object, redirects to Login | New user created in Users table, session cleared, navigation to Login | **HIGH** |
| **FE-04** | Register.jsx | Password Mismatch | Enters password="Password123!" but confirm="Different123!" | Inline validation runs on confirm field blur | Error displays: "Passwords do not match", Submit button disabled | **HIGH** |
| **FE-05** | Register.jsx | Real-time Email Validation | Enters email="invalid@yahoo.com", loses focus | Validation runs on blur event | Error displays: "Email must end with @gmail.com" | **MEDIUM** |
| **FE-06** | Register.jsx | Real-time Password Strength | Enters password="weak", loses focus | Regex validation runs on password field blur | Error: "Min 8 chars, 1 uppercase, 1 special symbol" shown | **MEDIUM** |
| **FE-07** | Reports.jsx | Submit New Report | Fills location="Block A", description="Trash overflow", selects image file, clicks Submit | POST `/api/reports`, reportId returned, added to history list, form clears | New report appears in history table, success alert shown, form reset | **HIGH** |
| **FE-08** | Reports.jsx | View Report History | Resident with 3 submitted reports loads Reports page | GET `/api/reports?userId=X`, data populates component state | History list displays all 3 reports in table format | **HIGH** |
| **FE-09** | Reports.jsx | Edit Own Report | Resident clicks Edit button on report, changes description, clicks Save | PUT `/api/reports/1` with updated data, response received | Report description updated in table, success message shown | **MEDIUM** |
| **FE-10** | ReportReview.jsx | Admin Reviews Report | Admin selects report, clicks Approve button, assigns priority="High", scheduleDate="2026-05-15" | PUT `/api/reports/1` with status="Approved", linkedTaskId created | Report moves to "Approved" section, task assignment confirmed, success message shown | **HIGH** |
| **FE-11** | Billing.jsx (Resident View) | Resident Views Invoices | Resident loads Billing page | GET `/api/billing/resident/X`, data populates state | Invoices table displays all user's invoices with status, total, paidAt | **HIGH** |
| **FE-12** | Billing.jsx (Admin View) | Admin Creates Invoice | Admin selects task from dropdown, enters taskType="General Waste", clicks Create Invoice | POST `/api/billing` with fees, invoiceId generated | Invoice appears in table, task status updates in DB, confirmation shown | **HIGH** |
| **FE-13** | VehicleManagement.jsx | Add New Vehicle | Admin fills vehicleId="VH-005", type="Compactor Truck", driver="Smith", clicks Register | POST `/api/vehicles`, vehicle added to fleet list state | Vehicle appears in table with status="Available", timestamp shown | **MEDIUM** |
| **FE-14** | VehicleManagement.jsx | Update Vehicle Fuel | Admin clicks Edit on vehicle, changes fuelLevel=65, clicks Save | PUT `/api/vehicles/1` with fuelLevel=65 | Vehicle row updates with new fuel level, success confirmation | **LOW** |
| **FE-15** | Settings.jsx | Update Password | User enters old password, new password="NewPass123!", confirm matches, clicks Save | PUT `/api/auth/settings` with new password hashed | Password updated in DB, success alert shown, form clears | **MEDIUM** |

**Test Execution Path:** `tests/frontend/unit/components.test.js`

---

## SYSTEM INTEGRATION TESTS - RESIDENT WORKFLOWS

| Test ID | Workflow | Steps | Test Data | Expected Result | Verification |
|---------|----------|-------|-----------|-----------------|--------------|
| **SYS-01** | Resident Complete Registration & Login | 1. POST `/api/auth/register` 2. Verify record in Users table 3. POST `/api/auth/login` 4. Verify sessionStorage set | `{ fullName: "Alice Johnson", email: "alice@gmail.com", password: "AlicePass123!" }` | User created with role='Resident', login succeeds, sessionStorage populated | User ID assigned, profile accessible post-login, correct role returned |
| **SYS-02** | Resident Submit Report → Admin Reviews → Approve | 1. Resident POST `/api/reports` 2. Admin GET `/reports` 3. Admin PUT `/reports/1` to "Approved" 4. GET `/reports/1` | Resident ID=1, Report: `{ location: "Block C", description: "Pile of trash", imageUrl: "url" }` | Report created, status='Pending', Admin sees report, status→'Approved', decisionDate set | Report queryable with all fields, linked to resident, accessible in admin view |
| **SYS-03** | Report Approval → Task Auto-Created → Track Completion | 1. Admin approves report + links task 2. GET `/tasks/1` 3. Verify Tasks entry 4. Worker updates status to 'Completed' 5. Report status auto-updates | Report ID=1, Admin approval with priority="High", scheduleDate="2026-05-20" | Task auto-created when linkedTaskId set, after completion task='Pending Invoice', report='Resolved' | Cross-table consistency verified, linked relationships intact |
| **SYS-04** | Task Completion → Invoice Creation → Resident Receives Bill | 1. Task marked 'Pending Invoice' 2. Admin POST `/api/billing` 3. Invoice created, task→'Pending Payment' 4. GET `/api/billing/resident/1` | Task ID=1, taskType="General Waste", fees: wasteFee=20, laborFee=15, vehicleFee=25 | Invoice created with invoiceId, total=$60, task status updated, resident sees invoice | Invoice persisted, all fee fields correct, status='Unpaid', linked to resident |
| **SYS-05** | Resident Pays Invoice → Task Status Updates | 1. Resident clicks Pay Now 2. PUT `/api/billing/1/pay` 3. GET `/api/billing/resident/1` 4. GET `/tasks/1` | Invoice ID=1, Amount=$60 | Invoice status='Paid', paidAt timestamp set, task status→'Payment Completed' | Payment flow completes, report/task lifecycle closed, history recorded |
| **SYS-06** | Resident Edit Own Report (Pre-Approval) | 1. Resident GET own reports 2. Click Edit on 'Pending' report 3. PUT `/api/reports/1` with new description 4. GET `/reports/1` | Resident ID=1, Report ID=1, Status="Pending", New description="Updated trash description" | Description updated, location preserved, status stays 'Pending' | Only editable fields changed, other fields immutable |
| **SYS-07** | Resident Cannot Edit Other's Report | 1. Resident ID=1 attempts PUT `/api/reports/3` (belongs to ID=2) | Resident ID=1, Report ID=3 (owner=2) | 403 Status, Authorization error | Request rejected at route handler, no data modified |
| **SYS-08** | Resident Profile Update | 1. Resident logged in 2. PUT `/api/auth/settings` with new name & password | Resident ID=1, `{ fullName: "Alice Updated", password: "NewAlicePass123!" }` | Profile updated, both name and password changed in Users table | Re-login with new password succeeds, old password rejected |
| **SYS-09** | Complete Resident Journey: Register → Report → Payment | 1. New user registers 2. Submits report 3. Admin approves & assigns task 4. Task completed 5. Invoice created 6. Payment made 7. Report resolved | New user "bob@gmail.com", Report: location="Block D", Task: priority="Medium", Invoice: taskType="Bulk Waste" | All statuses progress: Report (Pending→Approved→Resolved), Task (Pending→Completed→Pending Invoice→Pending Payment→Payment Completed), Invoice (Unpaid→Paid) | End-to-end workflow validates all integrations, data consistency |
| **SYS-10** | Resident Views Multi-Report History with Pagination | 1. Resident created 5 reports 2. GET `/api/reports?userId=1` 3. Verify pagination | Resident ID=1, 5 reports with different statuses | All 5 reports listed, each with correct status/location/description/image | History displays accurately, pagination works |

**Test Execution Path:** `tests/backend/integration/resident-workflow.test.js`

---

## SYSTEM INTEGRATION TESTS - ADMIN & COMPLETE WORKFLOWS

| Test ID | Workflow | Steps | Test Data | Expected Result | Verification |
|---------|----------|-------|-----------|-----------------|--------------|
| **SYS-11** | Admin Complete User Lifecycle: Register Manager → Manage | 1. Admin POST `/api/auth/register-manager` 2. GET `/api/auth/managers` 3. PUT `/api/auth/managers/1` update 4. DELETE `/api/auth/managers/1` | Manager: `{ fullName: "Manager Smith", email: "mgr@gmail.com", password: "MgrPass123!", contactNumber: "555-0001" }`, Updated: contactNumber="555-0002" | Manager created with role='GarbageManager', in list, details updated, deletion removes from table | Manager CRUD complete, role verification correct |
| **SYS-12** | Admin Register Worker → Assign to Task → Track Work | 1. Admin POST `/api/auth/register-worker` 2. GET `/api/auth/workers` 3. Assign worker to task 4. GET `/api/tasks/1` | Worker: `{ fullName: "Worker John", email: "worker@gmail.com", password: "WorkPass123!", workerRole: "Driver", skill: "Waste Sorting" }` | Worker created with role='Worker', listed in workers, task shows assignedTo="W001" | Worker table populated, task linkage correct |
| **SYS-13** | Fleet Management: Register Vehicles → Assign → Track | 1. Admin POST 3 vehicles 2. GET `/api/vehicles` 3. Assign vehicle to task 4. Update fuel/condition 5. GET `/api/vehicles/1` | Vehicles: VH-001 (Compactor), VH-002 (Mini Loader), VH-003 (Roll-Off), Assign VH-001 to Task 1, Update: fuelLevel=50, condition="Fair", lastMaintenance="2026-04-15" | 3 vehicles created, listed, VH-001 assigned to task, status/fuel/maintenance tracked | Vehicle assignments linked to tasks, fleet status accurate |
| **SYS-14** | Admin Billing Dashboard: Create Multi-Invoices → Track Revenue | 1. Admin GET `/api/billing/available-tasks` 2. Creates 3 invoices 3. GET `/api/billing` 4. Resident pays invoice 1 5. Admin views dashboard | 3 Invoices: Inv-1 (General Waste, $60), Inv-2 (Bulk Waste, $120), Inv-3 (Hazardous Waste, $210) | Available tasks filtered, invoices created with correct IDs & totals, paid status tracked | Billing pipeline validated, payment reconciliation accurate |
| **SYS-15** | Audit Trail: Admin Actions Logged & Retrievable | 1. Admin creates user 2. Admin updates report status 3. Admin deletes task 4. GET audit logs 5. Verify actions | Admin ID=1, Actions: Create Manager (Smith), Update Report 1 (Pending→Approved), Delete Task 1 | Each action logged to AuditLogs table with admin ID, action type, target ID, timestamp | Audit trail complete, actions traced, compliance verified |
| **SYS-16** | Role-Based Access Control: Verify Permissions | 1. Resident attempts `/api/auth/register-manager` (admin-only) 2. Worker GET `/api/tasks` 3. Manager GET `/api/auth/users` (admin-only) 4. Admin completes all | Users: Resident, Worker, Manager, Admin | Resident denied (403), Worker allowed (200), Manager denied (403), Admin allowed (200) | Role enforcement working, authorization gates functional |
| **SYS-17** | Rate Limiting: Verify Endpoint Protection | 1. Send 11+ rapid requests to `/api/auth/users` within 5 minutes | Requests 1-10: normal rate, Requests 11+: rapid | Requests 1-10 succeed (200), Request 11+ rejected (429 Too Many Requests) | Rate limiter enforced at 10 req/5 min |
| **SYS-18** | Error Handling & Edge Cases | 1. POST missing required field 2. GET with invalid ID 3. PUT with malformed data | Missing: `{ email: "test@gmail.com" }`, Invalid ID: GET `/reports/99999`, Malformed: `{ status: null }` | 400 for validation, 404 for not found, 400 for malformed | Consistent error structure, proper HTTP status codes |
| **SYS-19** | Data Integrity: Verify Constraints & Cascading | 1. Create user→report→task→invoice chain 2. Delete task 3. Verify report behavior 4. Delete invoice 5. Verify task status reverts | Chain: User→Report→Task→Invoice | After delete: cascading behavior documented | Referential integrity validated |
| **SYS-20** | Performance & Stress Test: Large Dataset | 1. Insert 100 residents 2. Each submits 5 reports = 500 total 3. GET `/api/reports` pagination 4. Search performance | 500 reports, pagination limit=50 | All reports queryable, pagination works, search <500ms response time | Database handles volume, no timeout |

**Test Execution Path:** `tests/backend/integration/admin-workflow.test.js`

---

## Test Data Reference

### Valid Test Data
```json
{
  "validResident": {
    "fullName": "John Doe",
    "email": "john@gmail.com",
    "password": "Password123!"
  },
  "validWorker": {
    "fullName": "Worker Jane",
    "email": "worker@gmail.com",
    "password": "WorkerPass123!",
    "workerRole": "Driver",
    "skill": "Waste Sorting"
  },
  "validManager": {
    "fullName": "Manager Smith",
    "email": "manager@gmail.com",
    "password": "ManagerPass123!",
    "contactNumber": "555-1234"
  },
  "validReport": {
    "location": "Block A, Street 5",
    "description": "Overflowing trash bin",
    "imageUrl": "https://example.com/image.jpg"
  },
  "validTask": {
    "reportId": 1,
    "priority": "High",
    "scheduleDate": "2026-05-20",
    "workers": "W001",
    "vehicleType": "Compactor Truck"
  },
  "validVehicle": {
    "vehicleId": "VH-001",
    "type": "Compactor Truck",
    "driver": "John Driver",
    "plateNumber": "XYZ-1234"
  },
  "validInvoice": {
    "taskId": 1,
    "residentId": 1,
    "taskType": "General Waste",
    "wasteFee": 20,
    "laborFee": 15,
    "vehicleFee": 25
  }
}
```

### Invalid Test Data (Error Cases)
```json
{
  "invalidEmail": "invalid@yahoo.com",
  "weakPassword": "weak",
  "invalidPassword": "password123",
  "invalidName": "John123",
  "duplicateEmail": "existing@gmail.com",
  "missingField": { "email": "test@gmail.com" },
  "malformedData": { "status": null }
}
```

---

## Fee Structure Reference

| Task Type | Waste Fee | Labor Fee | Vehicle Fee | Total |
|-----------|-----------|-----------|-------------|-------|
| General Waste | $20 | $15 | $25 | **$60** |
| Bulk Waste | $50 | $30 | $40 | **$120** |
| Hazardous Waste | $100 | $50 | $60 | **$210** |
| Recyclables | $10 | $10 | $15 | **$35** |

---

## Status Progressions

### Report Status Flow
```
Pending → In Review → Approved → Resolved
       ↘ Rejected
```

### Task Status Flow
```
Pending → Pending Worker → Pending Invoice → Pending Payment → Payment Completed
```

### Invoice Status Flow
```
Unpaid → Paid
```

### Vehicle Status
- **Available** - Ready for deployment
- **In Use** - Currently assigned to task
- **Maintenance** - Under maintenance

---

## Notes for Test Execution

1. **Test Database**: Use separate test database (ECOMANAGE_DB_TEST) to avoid data conflicts
2. **Session Management**: Clear session storage between tests
3. **Mock External APIs**: Image uploads should be mocked in unit tests
4. **Authentication**: Use bearer tokens for protected routes
5. **Timestamps**: Compare ISO date strings, allow ±1 second tolerance
6. **Cleanup**: Delete test records after each test suite
7. **Rollback**: Use database transactions for atomic test execution

---

**Document Version:** 1.0  
**Last Updated:** April 29, 2026  
**Maintainer:** QA Team
