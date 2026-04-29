# EcoManage API Testing with cURL

**Server Base URL:** `http://localhost:5000/api`

---

## Authentication API

### Register Resident

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@gmail.com",
    "password": "Password123!"
  }'
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "fullName": "John Doe",
    "email": "john@gmail.com",
    "role": "Resident"
  },
  "id": 1,
  "role": "Resident"
}
```

---

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@gmail.com",
    "password": "Password123!"
  }'
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "fullName": "John Doe",
    "email": "john@gmail.com",
    "role": "Resident"
  },
  "id": 1,
  "role": "Resident",
  "token": "jwt-token-here"
}
```

---

### Update Profile

```bash
curl -X PUT http://localhost:5000/api/auth/settings \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "fullName": "John Updated",
    "password": "NewPassword456!"
  }'
```

---

### Register Manager (Admin Only)

```bash
curl -X POST http://localhost:5000/api/auth/register-manager \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "fullName": "Manager Smith",
    "email": "mgr@gmail.com",
    "password": "ManagerPass123!",
    "contactNumber": "555-1234"
  }'
```

---

### Get All Managers (Admin Only)

```bash
curl -X GET http://localhost:5000/api/auth/managers \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

### Update Manager

```bash
curl -X PUT http://localhost:5000/api/auth/managers/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "fullName": "Manager Updated",
    "contactNumber": "555-5678"
  }'
```

---

### Delete Manager

```bash
curl -X DELETE http://localhost:5000/api/auth/managers/1 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

### Register Worker (Admin Only)

```bash
curl -X POST http://localhost:5000/api/auth/register-worker \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "fullName": "Worker John",
    "email": "worker@gmail.com",
    "password": "WorkerPass123!",
    "workerRole": "Driver",
    "skill": "Waste Sorting"
  }'
```

---

### Get All Workers

```bash
curl -X GET http://localhost:5000/api/auth/workers \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

### Get All Residents

```bash
curl -X GET http://localhost:5000/api/auth/residents \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## Reports API

### Create Report

```bash
curl -X POST http://localhost:5000/api/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{
    "location": "Block A, Street 5",
    "description": "Overflowing trash bin",
    "imageUrl": "https://example.com/image.jpg"
  }'
```

**Response:**
```json
{
  "reportId": "REP-12345",
  "id": 1,
  "message": "Report submitted successfully"
}
```

---

### Get All Reports (Admin)

```bash
curl -X GET "http://localhost:5000/api/reports" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

### Get Resident's Reports

```bash
curl -X GET "http://localhost:5000/api/reports?userId=1" \
  -H "Authorization: Bearer USER_TOKEN"
```

---

### Update Report Status (Admin)

```bash
curl -X PUT http://localhost:5000/api/reports/REP-12345 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "status": "Approved",
    "priority": "High",
    "scheduleDate": "2026-05-20",
    "linkedTaskId": 10
  }'
```

---

### Edit Own Report (Resident)

```bash
curl -X PUT http://localhost:5000/api/reports/REP-12345 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{
    "location": "Updated location",
    "description": "Updated description"
  }'
```

---

### Delete Report

```bash
curl -X DELETE http://localhost:5000/api/reports/REP-12345 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## Tasks API

### Create Task

```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "reportId": 1,
    "priority": "High",
    "scheduleDate": "2026-05-20",
    "workers": "W001",
    "vehicleType": "Compactor Truck"
  }'
```

**Response:**
```json
{
  "taskId": "TSK-54321",
  "id": 1,
  "message": "Task created successfully"
}
```

---

### Get All Tasks

```bash
curl -X GET http://localhost:5000/api/tasks \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

### Get Single Task

```bash
curl -X GET http://localhost:5000/api/tasks/TSK-54321 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

### Update Task Status

```bash
curl -X PUT http://localhost:5000/api/tasks/TSK-54321 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "status": "Pending Worker",
    "assignedTo": "W001",
    "assignedVehicle": "VH-001"
  }'
```

---

### Mark Task Complete

```bash
curl -X PUT http://localhost:5000/api/tasks/TSK-54321 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "status": "Completed"
  }'
```

---

### Delete Task

```bash
curl -X DELETE http://localhost:5000/api/tasks/TSK-54321 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## Vehicles API

### Register Vehicle

```bash
curl -X POST http://localhost:5000/api/vehicles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "vehicleId": "VH-001",
    "type": "Compactor Truck",
    "driver": "John Driver",
    "plateNumber": "XYZ-1234"
  }'
```

**Response:**
```json
{
  "vehicleId": "VH-001",
  "id": 1,
  "message": "Vehicle registered successfully"
}
```

---

### Get All Vehicles

```bash
curl -X GET http://localhost:5000/api/vehicles \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

### Get Single Vehicle

```bash
curl -X GET http://localhost:5000/api/vehicles/VH-001 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

### Update Vehicle Status

```bash
curl -X PUT http://localhost:5000/api/vehicles/VH-001 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "status": "In Use",
    "fuelLevel": 85,
    "location": "Block A"
  }'
```

---

### Update Vehicle Maintenance

```bash
curl -X PUT http://localhost:5000/api/vehicles/VH-001 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "lastMaintenance": "2026-04-15",
    "nextMaintenance": "2026-06-15",
    "condition": "Fair"
  }'
```

---

### Delete Vehicle

```bash
curl -X DELETE http://localhost:5000/api/vehicles/VH-001 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## Billing API

### Get Available Tasks for Invoicing

```bash
curl -X GET http://localhost:5000/api/billing/available-tasks \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

### Create Invoice

```bash
curl -X POST http://localhost:5000/api/billing \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "taskId": 1,
    "residentId": 1,
    "taskType": "General Waste",
    "wasteFee": 20,
    "laborFee": 15,
    "vehicleFee": 25
  }'
```

**Response:**
```json
{
  "invoiceId": "INV-1001",
  "invoice": {
    "id": 1,
    "invoiceId": "INV-1001",
    "taskId": 1,
    "residentId": 1,
    "total": 60,
    "status": "Unpaid"
  },
  "message": "Invoice created successfully"
}
```

---

### Get All Invoices (Admin)

```bash
curl -X GET http://localhost:5000/api/billing \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

### Get Resident's Invoices

```bash
curl -X GET http://localhost:5000/api/billing/resident/1 \
  -H "Authorization: Bearer USER_TOKEN"
```

---

### Mark Invoice as Paid

```bash
curl -X PUT http://localhost:5000/api/billing/INV-1001/pay \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Response:**
```json
{
  "invoice": {
    "id": 1,
    "invoiceId": "INV-1001",
    "status": "Paid",
    "paidAt": "2026-04-29T10:30:00Z"
  },
  "message": "Invoice marked as paid"
}
```

---

### Delete Invoice

```bash
curl -X DELETE http://localhost:5000/api/billing/INV-1001 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

### Migrate Legacy Tasks (One-time)

```bash
curl -X GET http://localhost:5000/api/billing/migrate-tasks \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## Error Response Examples

### 400 Bad Request

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "invalid@yahoo.com",
    "password": "short"
  }'
```

**Response:**
```json
{
  "message": "Email must end with @gmail.com"
}
```

---

### 401 Unauthorized

```bash
curl -X GET http://localhost:5000/api/auth/managers \
  -H "Authorization: Bearer invalid-token"
```

**Response:**
```json
{
  "message": "Unauthorized"
}
```

---

### 403 Forbidden

```bash
curl -X POST http://localhost:5000/api/auth/register-manager \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{
    "fullName": "Manager",
    "email": "mgr@gmail.com",
    "password": "Pass123!"
  }'
```

**Response:**
```json
{
  "message": "Unauthorized - Admin only"
}
```

---

### 404 Not Found

```bash
curl -X GET http://localhost:5000/api/reports/REP-NONEXISTENT \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Response:**
```json
{
  "message": "Report not found"
}
```

---

### 409 Conflict

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Duplicate User",
    "email": "existing@gmail.com",
    "password": "Password123!"
  }'
```

**Response:**
```json
{
  "message": "Email already registered"
}
```

---

## Testing with Variables

### Using Environment Variables

```bash
# Define variables
ADMIN_TOKEN="your-admin-token"
BASE_URL="http://localhost:5000/api"

# Use in request
curl -X GET $BASE_URL/reports \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

### Saving Response to Variable

```bash
# Get user ID from registration response
USER_ID=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@gmail.com",
    "password": "Password123!"
  }' | jq -r '.id')

echo "Created user: $USER_ID"

# Use in next request
curl -X PUT http://localhost:5000/api/auth/settings \
  -H "Content-Type: application/json" \
  -d '{
    "userId": '$USER_ID',
    "fullName": "Updated Name"
  }'
```

---

## Batch Testing Script

Create `test-api.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:5000/api"
ADMIN_TOKEN="test-admin-token"
USER_TOKEN="test-user-token"

echo "=== Testing EcoManage API ==="

# Test 1: Register User
echo "Test 1: Register User..."
curl -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@gmail.com",
    "password": "Password123!"
  }' | jq .

# Test 2: Login
echo "Test 2: Login..."
curl -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@gmail.com",
    "password": "Password123!"
  }' | jq .

# Test 3: Submit Report
echo "Test 3: Submit Report..."
curl -X POST $BASE_URL/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "location": "Block A",
    "description": "Test report",
    "imageUrl": "https://example.com/image.jpg"
  }' | jq .

echo "=== Test Complete ==="
```

Run script:
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## Rate Limiting Testing

### Test Rate Limit

```bash
# Send 15 rapid requests (limit is 10 per 5 min)
for i in {1..15}; do
  echo "Request $i:"
  curl -X GET http://localhost:5000/api/auth/users \
    -H "Authorization: Bearer ADMIN_TOKEN" \
    -w "\nStatus: %{http_code}\n"
  sleep 0.1
done
```

**Expected Result:**
- Requests 1-10: 200 OK
- Requests 11-15: 429 Too Many Requests

---

## Performance Testing

### Load Testing with Apache Bench

```bash
# Install Apache Bench
# macOS: brew install httpd
# Linux: sudo apt-get install apache2-utils

# Test GET /reports endpoint
ab -n 100 -c 10 \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:5000/api/reports

# Test with POST data
ab -n 100 -c 10 -p data.json \
  -T application/json \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:5000/api/reports
```

---

## Tips & Tricks

### Pretty Print JSON
```bash
curl ... | jq .
curl ... | jq '.[] | {id, name}'
```

### Save Response to File
```bash
curl -X GET http://localhost:5000/api/reports > reports.json
```

### Extract Specific Field
```bash
curl ... | jq -r '.invoiceId'
curl ... | jq -r '.[] | .id'
```

### Conditional Requests
```bash
# Only if modified
curl -H "If-Modified-Since: Wed, 29 Apr 2026 00:00:00 GMT" ...

# With ETag
curl -H "If-None-Match: abc123" ...
```

---

**Last Updated:** April 29, 2026
