# Vehicle Rental System - Business Flow Update 2.0

## Overview of Changes

Based on refined business requirements, this document outlines the **MAJOR restructuring** needed to properly implement automatic payment creation, simplified vehicle onboarding, and intelligent rental pricing discovery.

---

## Key Conceptual Changes

### 1. **Automatic Payment Creation** ✅
Instead of manually creating payments, the system should **auto-generate payment records**:
- **Vehicle Acquisition Payment**: Created automatically when a vehicle is added to the company
- **Driver Rental Payment**: Created automatically when a load/rental is completed

### 2. **Simplified Vehicle Onboarding** ✅
Vehicle doesn't need driver rental pricing at creation time:
- Admin adds vehicle with acquisition details only
- Driver rental pricing is determined per-job when creating rental requests

### 3. **Dynamic Rental Pricing** ✅
When admin creates a rental request:
- Select vehicle first
- System shows available rental pricing for that vehicle
- Admin can override or accept the default pricing
- Pricing is calculated/confirmed at rental request time, not at vehicle creation

### 4. **Country Code Separation** ✅
All phone numbers should be stored separately:
- `country_code` field (e.g., "+91", "+1", "+44")
- `phone_number` field (just digits)
- Better for internationalization and formatting

---

## Updated Data Models

### 1. Vehicle Model Changes

**Remove Fields:**
- ❌ `driver_rental_price`
- ❌ `driver_rental_type`

**Keep/Add Fields:**
```javascript
{
  company_id: ObjectId,
  vehicle_type: String,
  plate_no: String (unique),
  status: String (enum: available, rented, maintenance),
  manufacturer: String,
  year: Number,
  capacity: Number,

  // Acquisition fields
  acquisition_cost: Number,           // What company paid
  acquisition_type: String,           // enum: ['bought', 'rented']
  acquisition_date: Date,             // When acquired
}
```

**Removed:**
- `driver_rental_price` ❌
- `driver_rental_type` ❌

---

### 2. Load/Rental Request Model Changes

**Updated Fields:**
```javascript
{
  vehicle_id: ObjectId,
  driver_id: ObjectId,
  from_location: String,
  to_location: String,
  load_description: String,

  // NEW: Dynamic pricing fields
  rental_price_per_day: Number,       // ✅ NEW: What driver pays per day for this rental
  rental_type: String,                // ✅ NEW: enum: ['per_day', 'per_job', 'per_km']
  distance_km: Number,                // For per-km calculations

  // Calculated fields
  start_date: Date,
  end_date: Date,
  days_rented: Number,                // Calculated from dates
  rental_amount: Number,              // Calculated: days × rental_price_per_day (or fixed per_job)
  actual_rental_cost: Number,         // Same as rental_amount

  status: String,                     // enum: [pending, assigned, in-transit, completed, cancelled]
}
```

**Key Difference:**
- Rental pricing is NOW specific to each load/job
- NOT inherited from vehicle table
- Allows flexibility: same vehicle, different prices for different jobs

---

### 3. Payment Model (Updated)

```javascript
{
  payer: String,
  payer_id: ObjectId,
  payee: String,
  payee_id: ObjectId,
  amount: Number,
  balance: Number,
  description: String,

  payment_type: String,               // enum: ['vehicle-acquisition', 'driver-rental', 'maintenance', 'commission', 'other']
  status: String,                     // enum: ['pending', 'completed', 'failed', 'refunded']

  vehicle_id: ObjectId,               // Which vehicle this payment relates to
  load_id: ObjectId,                  // Which rental job (for driver-rental payments)

  transaction_date: Date,
  related_payment_id: ObjectId,       // Link acquisition to rental payments
}
```

---

### 4. Company Model - Add Country Code to Phone

**Update Fields:**
```javascript
{
  name: String,
  address: String,
  email: String,

  // Updated phone fields
  phone_country_code: String,         // e.g., "+91", "+1", "+44"
  phone_number: String,               // Just digits: "9876543210"

  // ... other fields
}
```

---

### 5. Driver Model - Add Country Code to Phone

**Update Fields:**
```javascript
{
  name: String,
  contact: String,
  license_no: String,
  email: String,
  address: String,
  status: String,

  // Updated phone fields
  phone_country_code: String,         // e.g., "+91"
  phone_number: String,               // Just digits

  // ... other fields
}
```

---

## Updated Business Workflow

### Step 1: Company Adds Vehicle
```
1. Admin navigates to Vehicles page
2. Clicks "Add Vehicle"
3. Fills form:
   ├── Company (dropdown)
   ├── Vehicle Type (text: Truck, Van, etc.)
   ├── Plate Number (text: unique ID)
   ├── Acquisition Cost (number: what company paid)
   ├── Acquisition Type (dropdown: Bought or Rented from Supplier)
   ├── Acquisition Date (date picker)
   └── Status (dropdown: Available, Rented, Maintenance)

4. System saves vehicle
5. System AUTOMATICALLY creates Payment record:
   ├── Type: 'vehicle-acquisition'
   ├── Payer: Company
   ├── Payee: Supplier (or "Unknown")
   ├── Amount: acquisition_cost
   ├── Vehicle: This vehicle
   ├── Status: completed
   └── Description: "Acquired [Vehicle Type] - [Plate No]"

6. User sees toast: "Vehicle added and acquisition payment recorded"
```

**What Admin Does NOT See:**
- ❌ Driver rental price field
- ❌ Rental type selector
- ❌ Manual payment creation (happens automatically)

---

### Step 2: Admin Creates Rental Request
```
1. Admin navigates to Loads page
2. Clicks "Create Load"
3. Fills form - Stage 1:
   ├── Vehicle (dropdown) ← SELECT FIRST
   ├── From Location (text)
   ├── To Location (text)
   └── Load Description (textarea)

4. After vehicle selection, system SHOWS:
   ├── (Vehicle info: Plate No, Type, Capacity)
   ├── Rental Price Per Day (text input - editable)
   ├── Rental Type (dropdown: per_day / per_job / per_km)
   └── Distance KM (text input - if per_km selected)

5. Continue filling:
   ├── Start Date (date)
   ├── End Date (date)
   └── System CALCULATES:
       └── Days Rented: end_date - start_date
       └── Rental Amount: days_rented × rental_price_per_day

6. System saves load
   └── Status: 'pending'
```

**What's Different:**
- Rental pricing is NOW set per-job, not per-vehicle
- Same vehicle can have different prices for different rentals
- Price is calculated at rental time, not vehicle creation

---

### Step 3: Admin Assigns Driver
```
1. Load status: 'pending'
2. Admin clicks "Assign" button on load
3. Selects driver from dropdown
4. System updates:
   ├── Load status: 'assigned'
   └── Vehicle status: 'rented'
5. No payment created yet
```

---

### Step 4: Driver Completes Rental
```
1. Driver completes the job (Location A → B)
2. Admin marks load as "Completed"
3. System AUTOMATICALLY creates Payment record:
   ├── Type: 'driver-rental'
   ├── Payer: Driver
   ├── Payee: Company
   ├── Amount: rental_amount (or actual_rental_cost)
   ├── Vehicle: This vehicle
   ├── Load: This load
   ├── Status: completed
   └── Description: "Rental payment for [Load] - [Plate No]"

4. System updates:
   ├── Load status: 'completed'
   └── Vehicle status: 'available'

5. User sees toast: "Load completed and rental payment recorded"
```

---

## Two Payment Types - Visual Flow

### Payment 1: Vehicle Acquisition (Happens at Vehicle Creation)
```
Timeline: Admin adds vehicle
          ↓
Payment Created Automatically
├── Type: vehicle-acquisition
├── Payer: ABC Transport (Company)
├── Payee: XYZ Supply Company (Supplier)
├── Amount: ₹500,000
├── Vehicle: Truck ABC123
├── Date: 2024-10-28
└── Status: completed
```

### Payment 2: Driver Rental (Happens at Load Completion)
```
Timeline: Admin marks load as completed
          ↓
Payment Created Automatically
├── Type: driver-rental
├── Payer: John Smith (Driver)
├── Payee: ABC Transport (Company)
├── Amount: ₹5,000 (2 days × ₹2,500/day)
├── Vehicle: Truck ABC123
├── Load: Load #001
├── Date: 2024-10-28
└── Status: completed
```

---

## Frontend UI Changes

### Vehicle Form - SIMPLIFIED
```
Modal Title: "Add New Vehicle"

Fields:
┌─────────────────────────────────────┐
│ Company * (dropdown)                 │
│ [Select Company...]                  │
├─────────────────────────────────────┤
│ Vehicle Type * (text)                │
│ [e.g., Truck, Van]                   │
├─────────────────────────────────────┤
│ Plate Number * (text)                │
│ [e.g., ABC123]                       │
├─────────────────────────────────────┤
│ Acquisition Cost * (number)          │
│ [₹500000]                            │
├─────────────────────────────────────┤
│ Acquisition Type * (dropdown)        │
│ ◉ Bought  ○ Rented from Supplier    │
├─────────────────────────────────────┤
│ Acquisition Date * (date)            │
│ [2024-10-28]                         │
├─────────────────────────────────────┤
│ Status (dropdown)                    │
│ ◉ Available  ○ Rented  ○ Maintenance│
├─────────────────────────────────────┤
│ Manufacturer (text)                  │
│ [e.g., Volvo]                        │
├─────────────────────────────────────┤
│ Year (number)                        │
│ [2022]                               │
├─────────────────────────────────────┤
│ Capacity (tons) (number)             │
│ [25]                                 │
└─────────────────────────────────────┘

Removed Fields:
❌ Driver Rental Price
❌ Driver Rental Type
```

### Load/Rental Form - DYNAMIC PRICING
```
Modal Title: "Create New Rental Request"

Stage 1 - Basic Info:
┌─────────────────────────────────────┐
│ Vehicle * (dropdown)                 │
│ [Truck ABC123 - Capacity: 25 tons]  │
└─────────────────────────────────────┘
   ↓ ON SELECT → Show rental pricing

Stage 2 - Rental Pricing (Dynamic):
┌─────────────────────────────────────┐
│ Current Vehicle: Truck ABC123        │
│                                      │
│ Rental Price Per Day * (number)      │
│ [₹2500]  ← Editable per-job          │
├─────────────────────────────────────┤
│ Rental Type (dropdown)               │
│ ◉ Per Day  ○ Per Job  ○ Per KM      │
├─────────────────────────────────────┤
│ Distance KM (number)                 │
│ [100] ← Shows only if "Per KM"       │
└─────────────────────────────────────┘

Stage 3 - Rental Details:
┌─────────────────────────────────────┐
│ From Location * (text)               │
│ [Mumbai]                             │
├─────────────────────────────────────┤
│ To Location * (text)                 │
│ [Delhi]                              │
├─────────────────────────────────────┤
│ Load Description (textarea)          │
│ [Electronics shipment...]            │
├─────────────────────────────────────┤
│ Start Date (datetime)                │
│ [2024-10-28 09:00]                   │
├─────────────────────────────────────┤
│ End Date (datetime)                  │
│ [2024-10-30 18:00]                   │
├─────────────────────────────────────┤
│ CALCULATED:                          │
│ Days Rented: 2 days                  │
│ Rental Amount: ₹5000 (2 × ₹2500)    │
└─────────────────────────────────────┘

Removed:
❌ Manual rent_amount input
✅ Auto-calculated from dates and daily rate
```

### Payment Page - READ-ONLY AUTO-GENERATED
```
Table Columns:
┌─────┬────────┬────────┬──────────────┬────────────┬──────────┐
│Payer│ Payee  │Amount  │Payment Type  │ Status     │  Date    │
├─────┼────────┼────────┼──────────────┼────────────┼──────────┤
│ABC  │Supplier│500000  │Vehicle Acq.  │ Completed  │28-10-24  │
│John │ABC     │5000    │Driver Rental │ Completed  │28-10-24  │
│Jane │ABC     │7500    │Driver Rental │ Completed  │28-10-24  │
└─────┴────────┴────────┴──────────────┴────────────┴──────────┘

Key Point:
- Payments are auto-created
- Admins can VIEW and EDIT status only
- No manual payment creation needed
```

---

## Company & Driver Phone Number Fields

### Company Form - Updated
```
┌─────────────────────────────────────┐
│ Company Name * (text)                │
│ [ABC Transport]                      │
├─────────────────────────────────────┤
│ Email (text)                         │
│ [contact@abc.com]                    │
├─────────────────────────────────────┤
│ Address (textarea)                   │
│ [123 Business Street...]             │
├─────────────────────────────────────┤
│ Phone Number * (with country code)   │
│                                      │
│ Country Code * (dropdown)            │
│ [+91 ▼] (India)                      │
│                                      │
│ Phone * (text)                       │
│ [9876543210]                         │
└─────────────────────────────────────┘

Database Storage:
{
  phone_country_code: "+91",
  phone_number: "9876543210"
}

Display Format: "+91 9876543210"
```

### Driver Form - Updated
```
┌─────────────────────────────────────┐
│ Name * (text)                        │
│ [John Smith]                         │
├─────────────────────────────────────┤
│ License Number * (text)              │
│ [DL1234567890]                       │
├─────────────────────────────────────┤
│ Contact Person * (text)              │
│ [Jane Smith]                         │
├─────────────────────────────────────┤
│ Email (text)                         │
│ [john@email.com]                     │
├─────────────────────────────────────┤
│ Phone Number (with country code)     │
│                                      │
│ Country Code (dropdown)              │
│ [+91 ▼] (India)                      │
│                                      │
│ Phone (text)                         │
│ [9876543210]                         │
├─────────────────────────────────────┤
│ Address (textarea)                   │
│ [456 Worker Lane...]                 │
├─────────────────────────────────────┤
│ Status (dropdown)                    │
│ ◉ Active  ○ Inactive  ○ Suspended   │
└─────────────────────────────────────┘

Database Storage:
{
  phone_country_code: "+91",
  phone_number: "9876543210"
}
```

---

## Backend API Changes

### 1. Vehicle Creation - AUTO-CREATE PAYMENT
```javascript
POST /api/vehicles

Request Body:
{
  company_id: "507f1f77bcf86cd799439011",
  vehicle_type: "Truck",
  plate_no: "ABC123",
  acquisition_cost: 500000,
  acquisition_type: "bought",
  acquisition_date: "2024-10-28",
  status: "available",
  manufacturer: "Volvo",
  year: 2022,
  capacity: 25
}

Response: 201 Created
{
  _id: "507f1f77bcf86cd799439012",
  company_id: {...},
  vehicle_type: "Truck",
  plate_no: "ABC123",
  acquisition_cost: 500000,
  acquisition_type: "bought",
  acquisition_date: "2024-10-28",
  status: "available",
  created_at: "2024-10-28T10:00:00Z",

  // NEWLY CREATED PAYMENT RECORD:
  auto_payment_id: "507f1f77bcf86cd799439013"
}

Side Effect:
- Payment record automatically created:
  {
    payment_type: 'vehicle-acquisition',
    payer: Company,
    payee: 'Supplier',
    amount: 500000,
    vehicle_id: vehicle._id,
    status: 'completed'
  }
```

### 2. Load Creation - ACCEPT DYNAMIC PRICING
```javascript
POST /api/loads

Request Body:
{
  vehicle_id: "507f1f77bcf86cd799439012",
  from_location: "Mumbai",
  to_location: "Delhi",
  load_description: "Electronics",

  // NEW: Rental pricing is now per-load
  rental_price_per_day: 2500,
  rental_type: "per_day",
  distance_km: null,

  start_date: "2024-10-28T09:00:00Z",
  end_date: "2024-10-30T18:00:00Z"
}

Response: 201 Created
{
  _id: "507f1f77bcf86cd799439014",
  vehicle_id: {...},
  from_location: "Mumbai",
  to_location: "Delhi",

  rental_price_per_day: 2500,
  rental_type: "per_day",
  start_date: "2024-10-28T09:00:00Z",
  end_date: "2024-10-30T18:00:00Z",

  // AUTO-CALCULATED:
  days_rented: 2,
  rental_amount: 5000,      // 2 × 2500
  actual_rental_cost: 5000,

  status: "pending"
}
```

### 3. Load Completion - AUTO-CREATE PAYMENT
```javascript
PUT /api/loads/:id/complete

Request Body:
{
  status: "completed"
}

Response: 200 OK
{
  _id: "507f1f77bcf86cd799439014",
  // ... load data ...
  status: "completed",

  // NEWLY CREATED PAYMENT RECORD:
  auto_payment_id: "507f1f77bcf86cd799439015"
}

Side Effect:
- Payment record automatically created:
  {
    payment_type: 'driver-rental',
    payer: Driver,
    payee: Company,
    amount: 5000,
    vehicle_id: load.vehicle_id,
    load_id: load._id,
    status: 'completed'
  }

- Vehicle status updated: 'rented' → 'available'
```

---

## Implementation Checklist

### Backend Database Schema
- [ ] Update Vehicle model (remove driver_rental_price, driver_rental_type)
- [ ] Update Load model (add rental_price_per_day, rental_type; rename rent_amount → rental_amount)
- [ ] Update Payment model (already done in 1.0)
- [ ] Update Company model (add phone_country_code, phone_number)
- [ ] Update Driver model (add phone_country_code, phone_number)

### Backend Controllers
- [ ] Update vehicleController.createVehicle() to auto-generate acquisition payment
- [ ] Update loadController.createLoad() to accept rental_price_per_day
- [ ] Create loadController.completeLoad() to auto-generate rental payment
- [ ] Update vehicleController to handle phone with country code
- [ ] Update driverController to handle phone with country code

### Backend Routes
- [ ] Add PUT /api/loads/:id/complete endpoint

### Frontend Pages
- [ ] Simplify Vehicle form (remove rental pricing fields)
- [ ] Update Load form to show dynamic rental pricing after vehicle selection
- [ ] Add country code dropdown to Company form
- [ ] Add country code dropdown to Driver form
- [ ] Update Payment page to show auto-generated payments (read-only with edit status)
- [ ] Add "Complete Load" button/action in Loads page

### Frontend Components
- [ ] Create DynamicVehicleSelect component (shows vehicle with rental pricing options)
- [ ] Update PhoneInput component to support country code selection
- [ ] Create PaymentAuto component to show auto-generated vs manual payments

---

## Benefits of Update 2.0

✅ **Automatic Payment Tracking** - No manual entry needed, reduces errors
✅ **Flexible Pricing** - Same vehicle can have different prices per job
✅ **Simplified Onboarding** - Vehicle form is cleaner and faster
✅ **Better UX** - Payments appear automatically, less admin overhead
✅ **International Support** - Country code separated for global usage
✅ **Audit Trail** - Every payment auto-generated with timestamp
✅ **Clear Financial Records** - Acquisition vs Rental payments always tracked

---

## Summary of Breaking Changes

| Item | Old (1.0) | New (2.0) | Impact |
|------|-----------|-----------|--------|
| Vehicle.rent_price | ✓ | ✗ | REMOVED - Use Load-level pricing |
| Vehicle.driver_rental_type | ✓ | ✗ | REMOVED - Use Load-level pricing |
| Load.rent_amount | ✓ | Renamed to rental_amount | Backward compatible rename |
| Load.rental_price_per_day | ✗ | ✓ | NEW - Per-load pricing |
| Payment auto-creation | Manual | Auto | Payments created automatically |
| Phone storage | Single field | country_code + phone_number | Enhanced format |

---

**This completes UPDATE 2.0 specification!**
