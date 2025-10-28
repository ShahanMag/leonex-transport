# Migration Guide: Version 1.0 → 2.0

## Quick Reference: What Changed

### Models Comparison

#### Vehicle Model

**Version 1.0:**
```javascript
{
  company_id: ObjectId,
  vehicle_type: String,
  plate_no: String,

  rent_price: Number,           // ❌ REMOVED
  driver_rental_type: String,   // ❌ REMOVED

  acquisition_cost: Number,
  acquisition_type: String,
  acquisition_date: Date,

  status: String,
  manufacturer: String,
  year: Number,
  capacity: Number
}
```

**Version 2.0:**
```javascript
{
  company_id: ObjectId,
  vehicle_type: String,
  plate_no: String,

  // REMOVED:
  // rent_price: Number
  // driver_rental_type: String

  acquisition_cost: Number,
  acquisition_type: String,
  acquisition_date: Date,

  status: String,
  manufacturer: String,
  year: Number,
  capacity: Number
}
```

**Changes:**
- ❌ Removed `rent_price` (driver rental pricing moved to Load level)
- ❌ Removed `driver_rental_type` (moved to Load level)
- ✅ Keeps `acquisition_cost`, `acquisition_type`, `acquisition_date`

---

#### Load/Rental Request Model

**Version 1.0:**
```javascript
{
  vehicle_id: ObjectId,
  driver_id: ObjectId,
  from_location: String,
  to_location: String,
  load_description: String,

  rental_amount: Number,        // Required from user

  start_date: Date,
  end_date: Date,
  days_rented: Number,          // Calculated
  actual_rental_cost: Number,   // Calculated
  distance_km: Number,

  status: String
}
```

**Version 2.0:**
```javascript
{
  vehicle_id: ObjectId,
  driver_id: ObjectId,
  from_location: String,
  to_location: String,
  load_description: String,

  rental_price_per_day: Number,  // ✅ NEW: Per-load pricing
  rental_type: String,           // ✅ NEW: per_day / per_job / per_km
  distance_km: Number,

  // CALCULATED (auto-generated from rental_price_per_day):
  rental_amount: Number,         // Calculated

  start_date: Date,
  end_date: Date,
  days_rented: Number,           // Calculated
  actual_rental_cost: Number,    // Calculated

  status: String
}
```

**Changes:**
- ✅ Added `rental_price_per_day` (NEW: specific to this load)
- ✅ Added `rental_type` (NEW: how pricing works)
- ✅ `rental_amount` is now calculated from `rental_price_per_day × days_rented`
- ✅ Same vehicle can have different `rental_price_per_day` per load

---

#### Company Model

**Version 1.0:**
```javascript
{
  name: String,
  address: String,
  email: String,
  phone: String,        // Single field
  // ... other fields
}
```

**Version 2.0:**
```javascript
{
  name: String,
  address: String,
  email: String,

  // ✅ NEW: Separated phone fields
  phone_country_code: String,    // e.g., "+91", "+1"
  phone_number: String,          // Just digits

  // ... other fields
}
```

**Changes:**
- ❌ Removed `phone` (single field)
- ✅ Added `phone_country_code` (country code)
- ✅ Added `phone_number` (just digits)

**Display Format:** Combine as `${phone_country_code} ${phone_number}`

---

#### Driver Model

**Version 1.0:**
```javascript
{
  name: String,
  contact: String,
  license_no: String,
  email: String,
  phone: String,        // Single field
  address: String,
  status: String,
  // ... other fields
}
```

**Version 2.0:**
```javascript
{
  name: String,
  contact: String,
  license_no: String,
  email: String,

  // ✅ NEW: Separated phone fields
  phone_country_code: String,    // e.g., "+91"
  phone_number: String,          // Just digits

  address: String,
  status: String,
  // ... other fields
}
```

**Changes:**
- ❌ Removed `phone` (single field)
- ✅ Added `phone_country_code`
- ✅ Added `phone_number`

---

### Frontend Form Changes

#### Vehicle Form

**Version 1.0:**
```
Company * ............ [Select]
Vehicle Type * ....... [Text]
Plate Number * ....... [Text]
Acquisition Cost * ... [Number]
Acquisition Type * ... [Select: Bought/Rented]
Acquisition Date * ... [Date]
Driver Rental Price * [Number]    ❌ REMOVED
Rental Type * ........ [Select]   ❌ REMOVED
Status ............... [Select]
Manufacturer ......... [Text]
Year ................. [Number]
Capacity ............. [Number]
```

**Version 2.0:**
```
Company * ............ [Select]
Vehicle Type * ....... [Text]
Plate Number * ....... [Text]
Acquisition Cost * ... [Number]
Acquisition Type * ... [Select: Bought/Rented]
Acquisition Date * ... [Date]
Status ............... [Select]
Manufacturer ......... [Text]
Year ................. [Number]
Capacity ............. [Number]

(No rental pricing fields!)
```

**Changes:**
- ❌ Removed "Driver Rental Price" field
- ❌ Removed "Rental Type" dropdown
- ✅ Cleaner, faster form (7 fields instead of 9)

---

#### Load/Rental Form

**Version 1.0:**
```
Vehicle * ............. [Select]
From Location * ....... [Text]
To Location * ......... [Text]
Load Description ...... [Textarea]
Start Date ............ [DateTime]
End Date .............. [DateTime]
Distance KM ........... [Number] (optional)
Rent Amount * ......... [Number] ❌ REQUIRED
```

**Version 2.0:**
```
Vehicle * ............. [Select]
  ↓ DYNAMIC CONTENT APPEARS AFTER VEHICLE SELECT:

  Current Vehicle: Truck ABC123
  Rental Price Per Day * [Number] ✅ NEW: From vehicle selection
  Rental Type * ........ [Select: Per Day/Per Job/Per KM] ✅ NEW
  Distance KM .......... [Number] (shows if Per KM selected) ✅ CONDITIONAL

From Location * ....... [Text]
To Location * ......... [Text]
Load Description ...... [Textarea]
Start Date ............ [DateTime]
End Date .............. [DateTime]

CALCULATED (Read-only display):
Days Rented: .......... [Auto]
Rental Amount: ........ [Auto]
```

**Changes:**
- ✅ "Rent Amount" removed from manual input
- ✅ Dynamic section appears after vehicle selection
- ✅ Set `rental_price_per_day` per-load (can be different for same vehicle)
- ✅ Auto-calculates `rental_amount` based on dates and pricing
- ✅ More flexible: same vehicle, different prices

---

#### Company Form

**Version 1.0:**
```
Name * ............... [Text]
Address .............. [Textarea]
Email ................ [Email]
Phone * .............. [Text]
```

**Version 2.0:**
```
Name * ............... [Text]
Address .............. [Textarea]
Email ................ [Email]
Phone Number * ....... (Two fields)
  Country Code * ..... [Dropdown: +91, +1, +44, etc.]
  Phone * ............ [Text: digits only]
```

**Changes:**
- ✅ Phone split into country code + digits
- ✅ Better for international numbers

---

#### Driver Form

**Version 1.0:**
```
Name * ............... [Text]
Contact Person * ..... [Text]
License Number * ..... [Text]
Email ................ [Email]
Phone ................ [Text]
Address .............. [Textarea]
Status ............... [Select]
```

**Version 2.0:**
```
Name * ............... [Text]
Contact Person * ..... [Text]
License Number * ..... [Text]
Email ................ [Email]
Phone Number * ....... (Two fields)
  Country Code ....... [Dropdown: +91, +1, +44, etc.]
  Phone .............. [Text: digits only]
Address .............. [Textarea]
Status ............... [Select]
```

**Changes:**
- ✅ Phone split into country code + digits

---

### Business Logic Changes

#### Payment Auto-Creation

**Version 1.0:**
```
Payments manually created by admin
  ↓
Admin goes to Payments page
  ↓
Fills form to record payment
  ↓
Saves payment
```

**Version 2.0:**
```
Vehicle Acquisition Payment:
  1. Admin adds vehicle
  2. System AUTOMATICALLY creates payment record
     ├── Type: vehicle-acquisition
     ├── Amount: acquisition_cost
     └── Status: completed
  3. No manual entry needed

Driver Rental Payment:
  1. Admin marks load as completed
  2. System AUTOMATICALLY creates payment record
     ├── Type: driver-rental
     ├── Amount: rental_amount
     └── Status: completed
  3. No manual entry needed
```

**Changes:**
- ✅ Payments auto-generated (no manual entry)
- ✅ Acquisition payment created at vehicle addition
- ✅ Rental payment created at load completion
- ✅ Reduces admin workload and errors

---

## Data Migration Steps

If upgrading from 1.0 to 2.0 with existing data:

### Step 1: Update Vehicle Collection
```javascript
// Remove rent_price and driver_rental_type from all vehicles
db.vehicles.updateMany(
  {},
  {
    $unset: {
      rent_price: 1,
      driver_rental_type: 1
    }
  }
)
```

### Step 2: Update Load Collection
```javascript
// Add rental_price_per_day and rental_type to all loads
// You'll need to backfill these based on your existing data
db.loads.updateMany(
  {},
  {
    $set: {
      rental_type: "per_day"
      // rental_price_per_day: need to determine from existing data
    }
  }
)
```

### Step 3: Update Company Collection
```javascript
// Migrate phone to phone_country_code + phone_number
// Example: "+91 9876543210" → {"+91", "9876543210"}
// (Manual script required based on your data format)
```

### Step 4: Update Driver Collection
```javascript
// Migrate phone to phone_country_code + phone_number
// (Manual script required based on your data format)
```

### Step 5: Create Missing Payments
```javascript
// For vehicles added in 1.0, create acquisition payments
// For completed loads in 1.0, create rental payments
// (Custom script required)
```

---

## API Endpoint Changes

### Vehicle Endpoints

**POST /api/vehicles - Request Body Changes**

Version 1.0:
```json
{
  "company_id": "...",
  "vehicle_type": "Truck",
  "plate_no": "ABC123",
  "rent_price": 2500,        ❌ REMOVED
  "driver_rental_type": "per_day",  ❌ REMOVED
  "acquisition_cost": 500000,
  "acquisition_type": "bought",
  "acquisition_date": "2024-10-28"
}
```

Version 2.0:
```json
{
  "company_id": "...",
  "vehicle_type": "Truck",
  "plate_no": "ABC123",
  "acquisition_cost": 500000,
  "acquisition_type": "bought",
  "acquisition_date": "2024-10-28"

  // No rent_price or driver_rental_type!
}
```

**Response Difference:**
- Version 2.0 includes `auto_payment_id` in response

---

### Load Endpoints

**POST /api/loads - Request Body Changes**

Version 1.0:
```json
{
  "vehicle_id": "...",
  "from_location": "Mumbai",
  "to_location": "Delhi",
  "load_description": "Electronics",
  "rent_amount": 5000,        ❌ User provides
  "start_date": "2024-10-28",
  "end_date": "2024-10-30"
}
```

Version 2.0:
```json
{
  "vehicle_id": "...",
  "from_location": "Mumbai",
  "to_location": "Delhi",
  "load_description": "Electronics",
  "rental_price_per_day": 2500,    ✅ NEW: Per-load pricing
  "rental_type": "per_day",         ✅ NEW
  "distance_km": null,
  "start_date": "2024-10-28",
  "end_date": "2024-10-30"
  // rental_amount: auto-calculated
}
```

**Response Difference:**
- Version 2.0 includes calculated `days_rented` and `rental_amount`

---

### New Endpoints in 2.0

**PUT /api/loads/:id/complete**

```javascript
Request Body:
{
  "status": "completed"
}

Response:
{
  // ... load data ...
  "status": "completed",
  "auto_payment_id": "507f1f77bcf86cd799439015"
}

Side Effects:
- Creates rental payment automatically
- Updates vehicle status to 'available'
```

---

## UI/UX Changes

### Vehicle Page

**Version 1.0:**
- Form has 9 fields (including rental pricing)
- Takes longer to add vehicle

**Version 2.0:**
- Form has 7 fields (pricing removed)
- Faster vehicle onboarding
- Cleaner form layout

---

### Load Page

**Version 1.0:**
- Admin fills all fields at once
- Must know exact rent amount

**Version 2.0:**
- Select vehicle first (triggers dynamic content)
- Set rental price per-load
- Prices can vary per job
- More flexible workflow

---

### Payment Page

**Version 1.0:**
- Manual "Record Payment" button
- Admin creates all payments
- Time-consuming

**Version 2.0:**
- Payments appear automatically
- Admin just views/manages status
- Less manual work
- Better audit trail

---

## Benefits of Version 2.0

✅ **Simpler Workflow:** Less manual data entry
✅ **Flexible Pricing:** Different prices for same vehicle per job
✅ **Auto-Tracking:** Payments created automatically
✅ **Better UX:** Forms are cleaner and faster
✅ **International:** Separated country codes for phone numbers
✅ **Audit Trail:** Auto-generated payments with timestamps
✅ **Error Reduction:** Fewer manual entries = fewer mistakes

---

## Summary Table

| Feature | 1.0 | 2.0 | Impact |
|---------|-----|-----|--------|
| Vehicle rent_price | ✓ | ✗ | Removed - Use per-load pricing |
| Load rental_price_per_day | ✗ | ✓ | New - Set per load |
| Auto vehicle payment | ✗ | ✓ | New - Created on add |
| Auto rental payment | ✗ | ✓ | New - Created on complete |
| Vehicle form fields | 9 | 7 | Simplified |
| Load form fields | 8 | Dynamic | More flexible |
| Phone fields | 1 | 2 | Separated country code |
| Manual payments | Many | None | All auto-generated |

---

**Migration Document Complete**
For detailed specs, see: `UPDATE_2.0.md`
