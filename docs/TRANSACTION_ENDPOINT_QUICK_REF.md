# Unified Transaction Endpoint - Quick Reference

## Endpoint

```
POST /api/transactions/rental
```

## Minimal Example (All Required Fields)

```javascript
const payload = {
  // Existing company
  company_id: "507f1f77bcf86cd799439011",

  // Existing driver
  driver_id: "507f1f77bcf86cd799439012",

  // Vehicle info
  vehicle_type: "Truck",
  acquisition_cost: 500000,
  acquisition_date: "2024-11-01",

  // Rental info
  from_location: "Riyadh",
  to_location: "Jeddah",
  rental_price_per_day: 5000,
  start_date: "2024-11-01",
  end_date: "2024-11-05"
};
```

## With New Company Creation

```javascript
const payload = {
  // New company
  company_name: "New Transport Company",
  company_contact: "Ahmed Khan",
  company_address: "Riyadh, Saudi Arabia",
  company_email: "info@newtransport.com",
  company_phone_number: "0501234567",

  // Existing driver
  driver_id: "507f1f77bcf86cd799439012",

  // Vehicle info
  vehicle_type: "Van",
  plate_no: "RYD-1234",
  acquisition_cost: 300000,
  acquisition_date: "2024-11-01",

  // Rental info
  from_location: "Riyadh",
  to_location: "Dammam",
  rental_price_per_day: 3000,
  start_date: "2024-11-01",
  end_date: "2024-11-03"
};
```

## With New Driver Creation

```javascript
const payload = {
  // Existing company
  company_id: "507f1f77bcf86cd799439011",

  // New driver
  driver_name: "Ahmed Khan",
  driver_iqama_id: "2345678901", // Must be unique
  driver_phone_number: "0501234567",

  // Vehicle info
  vehicle_type: "Truck",
  plate_no: "ABC-5678",
  acquisition_cost: 500000,
  acquisition_date: "2024-11-01",

  // Rental info
  from_location: "Riyadh",
  to_location: "Jeddah",
  rental_price_per_day: 5000,
  start_date: "2024-11-01",
  end_date: "2024-11-05"
};
```

## With Both New Company & Driver

```javascript
const payload = {
  // New company
  company_name: "Express Transport",
  company_contact: "Ali Mohammed",
  company_address: "Jeddah, Saudi Arabia",

  // New driver
  driver_name: "Hassan Ali",
  driver_iqama_id: "3456789012",
  driver_phone_number: "0569876543",

  // Vehicle info
  vehicle_type: "Bus",
  plate_no: "JDD-9999",
  acquisition_cost: 1000000,
  acquisition_date: "2024-11-01",

  // Rental info
  from_location: "Jeddah",
  to_location: "Makkah",
  rental_price_per_day: 8000,
  start_date: "2024-11-01",
  end_date: "2024-11-10"
};
```

## Different Rental Types

### Per Day Pricing (Default)
```javascript
{
  rental_type: "per_day",
  rental_price_per_day: 5000,
  start_date: "2024-11-01",
  end_date: "2024-11-05"
  // Amount = (5 days) × 5000 = 25,000
}
```

### Per Job (Fixed Price)
```javascript
{
  rental_type: "per_job",
  rental_price_per_day: 50000, // Fixed job price
  start_date: "2024-11-01",
  end_date: "2024-11-05"
  // Amount = 50,000 (regardless of days)
}
```

### Per Kilometer
```javascript
{
  rental_type: "per_km",
  rental_price_per_day: 50, // Per KM rate
  distance_km: 500,
  start_date: "2024-11-01",
  end_date: "2024-11-05"
  // Amount = 500 km × 50 = 25,000
}
```

## Complete Field Reference

| Field | Type | Required | Example |
|-------|------|----------|---------|
| `company_id` | String | No* | "507f1f77bcf86cd799439011" |
| `company_name` | String | No* | "XYZ Transport" |
| `company_contact` | String | If new | "Ahmed Khan" |
| `company_address` | String | If new | "Riyadh, KSA" |
| `company_email` | String | No | "info@xyz.com" |
| `company_phone_country_code` | String | No | "+91" |
| `company_phone_number` | String | No | "9876543210" |
| `driver_id` | String | No* | "507f1f77bcf86cd799439012" |
| `driver_name` | String | No* | "Ahmed Khan" |
| `driver_iqama_id` | String | If new | "2345678901" |
| `driver_phone_country_code` | String | No | "+966" |
| `driver_phone_number` | String | No | "0501234567" |
| `vehicle_type` | String | Yes | "Truck" |
| `plate_no` | String | No | "RYD-1234" |
| `acquisition_cost` | Number | Yes | 500000 |
| `acquisition_date` | Date | Yes | "2024-11-01" |
| `from_location` | String | Yes | "Riyadh" |
| `to_location` | String | Yes | "Jeddah" |
| `load_description` | String | No | "Goods delivery" |
| `rental_price_per_day` | Number | Yes | 5000 |
| `rental_type` | String | No | "per_day" |
| `rental_date` | Date | No | "2024-11-01" |
| `start_date` | Date | Yes | "2024-11-01" |
| `end_date` | Date | Yes | "2024-11-05" |
| `distance_km` | Number | If per_km | 500 |

*Either company_id OR company_name required
*Either driver_id OR (driver_name + driver_iqama_id) required

## Success Response

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
      "rental_amount": 25000
    }
  }
}
```

## Error Codes

| Status | Error | Cause |
|--------|-------|-------|
| 400 | Missing required fields | vehicle_type, acquisition_cost, from_location, to_location, or rental_price_per_day not provided |
| 400 | company_id or company_name required | Neither provided |
| 400 | driver_id or driver details required | Neither provided |
| 404 | Company not found | Invalid company_id |
| 404 | Driver not found | Invalid driver_id |

---

**What Gets Created:**
1. ✅ Company (find if exists by name, or create new)
2. ✅ Driver (find if exists by iqama_id, or create new)
3. ✅ Acquisition Payment (Company → Supplier)
4. ✅ Load Record
5. ✅ Rental Payment (Driver → Company)

**All in one atomic transaction!**
