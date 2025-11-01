# API Architecture Changes - v2.1.0

**Date**: November 1, 2024
**Status**: Breaking Changes
**Impact**: Frontend Integration Required

---

## Overview

The backend API has been refactored to simplify the rental workflow. Instead of managing 5 separate CRUD entities (Company → Vehicle → Driver → Load → Payment), we now have a **unified transaction endpoint** that handles the complete rental flow in a single API call with atomic database transactions.

### Key Changes

- **Vehicle Model Removed**: No separate vehicle records. Vehicle info stored as fields in Payment records.
- **Unified Endpoint**: Single API call to create company, driver, load, and both payment records.
- **Atomic Transactions**: All-or-nothing operations - if any step fails, entire transaction rolls back.
- **Simplified Data Flow**: One form submission = Complete rental transaction.

---

## New Unified Transaction Endpoint

### Endpoint

```
POST /api/transactions/rental
```

### Purpose

Creates a complete rental transaction atomically, including:
1. Company (find or create)
2. Driver (find or create)
3. Vehicle Acquisition Payment
4. Load Record
5. Driver Rental Payment

---

## Request Body

```json
{
  "// ===== COMPANY ===== (Either company_id OR company_name required)": "",
  "company_id": "OPTIONAL - existing company ObjectId",
  "company_name": "OPTIONAL - new or existing company name",
  "company_contact": "Contact person name (required if creating new company)",
  "company_address": "Company address (required if creating new company)",
  "company_email": "company@email.com",
  "company_phone_country_code": "+91",
  "company_phone_number": "9876543210",

  "// ===== DRIVER ===== (Either driver_id OR (driver_name + driver_iqama_id) required)": "",
  "driver_id": "OPTIONAL - existing driver ObjectId",
  "driver_name": "OPTIONAL - new or existing driver name",
  "driver_iqama_id": "OPTIONAL - driver iqama/id (required if creating new driver)",
  "driver_phone_country_code": "+966",
  "driver_phone_number": "0501234567",

  "// ===== VEHICLE & ACQUISITION (REQUIRED) =====": "",
  "vehicle_type": "Truck",
  "plate_no": "ABC-1234",
  "acquisition_cost": 500000,
  "acquisition_date": "2024-11-01",

  "// ===== LOAD & RENTAL (REQUIRED) =====": "",
  "from_location": "Riyadh",
  "to_location": "Jeddah",
  "load_description": "Goods delivery",
  "rental_price_per_day": 5000,
  "rental_type": "per_day",
  "rental_date": "2024-11-01",
  "start_date": "2024-11-01",
  "end_date": "2024-11-05",
  "distance_km": 450
}
```

### Request Body Details

#### Company Section
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `company_id` | String (ObjectId) | No* | Use if company already exists in system |
| `company_name` | String | No* | Use to create new company or find existing |
| `company_contact` | String | If creating new | Contact person name |
| `company_address` | String | If creating new | Company address |
| `company_email` | String | No | Company email |
| `company_phone_country_code` | String | No | Default: `+91` |
| `company_phone_number` | String | No | Company phone |

*Either `company_id` OR `company_name` must be provided

#### Driver Section
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `driver_id` | String (ObjectId) | No* | Use if driver already exists in system |
| `driver_name` | String | No* | Use to create new driver or find existing |
| `driver_iqama_id` | String | If creating new | Unique driver iqama ID (used to find existing) |
| `driver_phone_country_code` | String | No | Default: `+966` |
| `driver_phone_number` | String | No | Driver phone number |

*Either `driver_id` OR (`driver_name` + `driver_iqama_id`) must be provided

#### Vehicle & Acquisition Section
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `vehicle_type` | String | Yes | e.g., "Truck", "Van", "Car", "Bus" |
| `plate_no` | String | No | Vehicle plate number |
| `acquisition_cost` | Number | Yes | Amount company paid for vehicle |
| `acquisition_date` | Date | Yes | Date of acquisition (ISO format) |

#### Load & Rental Section
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `from_location` | String | Yes | Pickup location |
| `to_location` | String | Yes | Drop-off location |
| `load_description` | String | No | Description of goods |
| `rental_price_per_day` | Number | Yes | Price per unit (day/job/km) |
| `rental_type` | String | No | `"per_day"` \| `"per_job"` \| `"per_km"` (default: `"per_day"`) |
| `rental_date` | Date | No | Date of rental (defaults to start_date) |
| `start_date` | Date | Yes | Rental start date (ISO format) |
| `end_date` | Date | Yes | Rental end date (ISO format) |
| `distance_km` | Number | If rental_type is per_km | Distance in kilometers |

---

## Success Response (201 Created)

```json
{
  "message": "Rental transaction created successfully",
  "data": {
    "company": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "XYZ Transport",
      "company_code": "CMP001"
    },
    "driver": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Ahmed Khan",
      "driver_code": "DRV001"
    },
    "load": {
      "_id": "507f1f77bcf86cd799439013",
      "rental_code": "RNT001",
      "from_location": "Riyadh",
      "to_location": "Jeddah"
    },
    "payments": {
      "acquisition_payment_id": "507f1f77bcf86cd799439014",
      "acquisition_amount": 500000,
      "rental_payment_id": "507f1f77bcf86cd799439015",
      "rental_amount": 20000
    }
  }
}
```

---

## Error Responses

### 400 Bad Request - Missing Fields

```json
{
  "message": "Missing required fields: vehicle_type, acquisition_cost, from_location, to_location, rental_price_per_day"
}
```

### 400 Bad Request - Invalid Company/Driver

```json
{
  "message": "Either company_id or company_name is required"
}
```

or

```json
{
  "message": "Either driver_id or (driver_name + driver_iqama_id) is required"
}
```

### 404 Not Found

```json
{
  "message": "Company not found"
}
```

or

```json
{
  "message": "Driver not found"
}
```

---

## Frontend Implementation Guide

### Step 1: Create a Single Form Component

Instead of 5 separate forms, create ONE form with these sections:

```jsx
<Form>
  {/* Company Section */}
  <CompanySelect />
  <CompanyCreateForm />

  {/* Driver Section */}
  <DriverSelect />
  <DriverCreateForm />

  {/* Vehicle Type */}
  <VehicleTypeInput />
  <AcquisitionCostInput />
  <AcquisitionDateInput />

  {/* Load Details */}
  <LocationInput from="from_location" to="to_location" />
  <RentalPriceInput />
  <RentalTypeSelect />
  <DateRangeInput start="start_date" end="end_date" />

  <SubmitButton />
</Form>
```

### Step 2: Handle Company Selection Logic

```javascript
const handleCompanySelection = (selectedCompany) => {
  if (selectedCompany.type === 'existing') {
    // User selected existing company
    formData.company_id = selectedCompany._id;
    delete formData.company_name; // Remove create fields
  } else {
    // User wants to create new company
    formData.company_name = selectedCompany.name;
    formData.company_contact = selectedCompany.contact;
    formData.company_address = selectedCompany.address;
    delete formData.company_id; // Remove selection field
  }
};
```

### Step 3: Handle Driver Selection Logic

```javascript
const handleDriverSelection = (selectedDriver) => {
  if (selectedDriver.type === 'existing') {
    // User selected existing driver
    formData.driver_id = selectedDriver._id;
    delete formData.driver_name; // Remove create fields
    delete formData.driver_iqama_id;
  } else {
    // User wants to create new driver
    formData.driver_name = selectedDriver.name;
    formData.driver_iqama_id = selectedDriver.iqama_id;
    formData.driver_phone_number = selectedDriver.phone;
    delete formData.driver_id; // Remove selection field
  }
};
```

### Step 4: Make Single API Call

```javascript
const submitRentalTransaction = async (formData) => {
  try {
    const response = await fetch('/api/transactions/rental', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Company
        company_id: formData.company_id || undefined,
        company_name: formData.company_name || undefined,
        company_contact: formData.company_contact,
        company_address: formData.company_address,
        company_email: formData.company_email,

        // Driver
        driver_id: formData.driver_id || undefined,
        driver_name: formData.driver_name || undefined,
        driver_iqama_id: formData.driver_iqama_id || undefined,
        driver_phone_number: formData.driver_phone_number,

        // Vehicle & Acquisition
        vehicle_type: formData.vehicle_type,
        plate_no: formData.plate_no,
        acquisition_cost: formData.acquisition_cost,
        acquisition_date: formData.acquisition_date,

        // Load & Rental
        from_location: formData.from_location,
        to_location: formData.to_location,
        load_description: formData.load_description,
        rental_price_per_day: formData.rental_price_per_day,
        rental_type: formData.rental_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        distance_km: formData.distance_km,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data = await response.json();
    console.log('Transaction created:', data);
    // Show success message and navigate/refresh

  } catch (error) {
    console.error('Error:', error.message);
    // Show error to user
  }
};
```

---

## Deprecated Endpoints

The following endpoints are **REMOVED** and should NOT be used:

### Vehicle Endpoints (ALL REMOVED)
- `GET /api/vehicles` ❌
- `POST /api/vehicles` ❌
- `GET /api/vehicles/:id` ❌
- `PUT /api/vehicles/:id` ❌
- `DELETE /api/vehicles/:id` ❌
- `GET /api/vehicles/search?query=...` ❌
- `GET /api/vehicles/filter?...` ❌

---

## Still Available Endpoints

These endpoints **REMAIN UNCHANGED** and can be used for individual entity management:

### Company Endpoints
- `GET /api/companies` - Get all companies
- `POST /api/companies` - Create company (alternative to transaction endpoint)
- `GET /api/companies/:id` - Get company by ID
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company
- `GET /api/companies/search?query=...` - Search companies

### Driver Endpoints
- `GET /api/drivers` - Get all drivers
- `POST /api/drivers` - Create driver (alternative to transaction endpoint)
- `GET /api/drivers/:id` - Get driver by ID
- `PUT /api/drivers/:id` - Update driver
- `DELETE /api/drivers/:id` - Delete driver
- `GET /api/drivers/search?query=...` - Search drivers

### Load Endpoints
- `GET /api/loads` - Get all loads
- `POST /api/loads` - Create load (standalone, without transaction)
- `GET /api/loads/:id` - Get load by ID
- `PUT /api/loads/:id` - Update load
- `DELETE /api/loads/:id` - Delete load
- `GET /api/loads/search?query=...` - Search loads (by rental code or vehicle type)
- `POST /api/loads/:id/assign-driver` - Assign driver to load
- `POST /api/loads/:id/complete` - Mark load as completed

### Payment Endpoints (UPDATED)
- `GET /api/payments` - Get all payments
- `POST /api/payments` - Create payment (standalone, without transaction)
- `GET /api/payments/:id` - Get payment by ID
- `PUT /api/payments/:id` - Update payment
- `DELETE /api/payments/:id` - Delete payment
- `GET /api/payments/search?query=...` - Search payments (updated to work without vehicle_id)
- `POST /api/payments/:id/installments` - Register installment payment
- `PUT /api/payments/:id/installments/:installmentId` - Update installment
- `DELETE /api/payments/:id/installments/:installmentId` - Delete installment

### Report Endpoints (UPDATED)
- `GET /api/reports/balance` - Balance report (unchanged)
- `GET /api/reports/payment-history` - Payment history (unchanged)
- `GET /api/reports/vehicle-utilization` - Vehicle type utilization (updated)
- `GET /api/reports/driver-performance` - Driver performance (unchanged)

---

## Migration Checklist

- [ ] Remove all Vehicle-related form fields from frontend
- [ ] Create new unified rental transaction form
- [ ] Implement company selection/creation logic
- [ ] Implement driver selection/creation logic
- [ ] Update API endpoint from multiple calls to single `/api/transactions/rental` call
- [ ] Update error handling for transaction response
- [ ] Update success handling to capture returned IDs
- [ ] Test with existing company (company_id provided)
- [ ] Test with new company (company_name provided)
- [ ] Test with existing driver (driver_id provided)
- [ ] Test with new driver (driver_name + driver_iqama_id provided)
- [ ] Update any vehicle search/filter UI to vehicle type instead
- [ ] Remove vehicle management pages from navigation
- [ ] Update load list to show vehicle_type instead of vehicle plate number

---

## Data Model Changes

### Payment Schema (Updated)

**Added Fields:**
- `vehicle_type` (String) - Type of vehicle
- `plate_no` (String) - Vehicle plate number
- `from_location` (String) - Rental pickup location
- `to_location` (String) - Rental drop-off location
- `acquisition_date` (Date) - Date vehicle was acquired
- `rental_date` (Date) - Date of rental
- `company_id` (ObjectId) - Reference to Company

**Removed Fields:**
- `vehicle_id` (was ObjectId reference to Vehicle model - REMOVED)

### Load Schema (Updated)

**Changed Field:**
- `vehicle_id` → `vehicle_type` (String, instead of ObjectId reference)

### Company Schema
No changes

### Driver Schema
No changes

---

## Example Implementation Flow

### Before (Old Flow - Multiple API Calls)
```
1. POST /api/companies → Create company
2. POST /api/vehicles → Create vehicle  ❌ REMOVED
3. POST /api/drivers → Create driver
4. POST /api/payments → Create acquisition payment
5. POST /api/loads → Create load
6. POST /api/payments → Create rental payment
7. PATCH /api/loads/:id/assign-driver → Assign driver
```

### After (New Flow - Single API Call)
```
1. POST /api/transactions/rental → Complete transaction ✅
   (Internally creates: Company, Driver, Acquisition Payment, Load, Rental Payment)
```

---

## Support

For questions or issues:
1. Check the request/response examples above
2. Verify all required fields are being sent
3. Check database logs for detailed error messages
4. Contact backend team with error response

---

**Version**: 2.1.0
**Last Updated**: November 1, 2024
