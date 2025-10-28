# Vehicle Rental System - Backend Server

## Overview
This is the backend API server for the Vehicle Rental Management System built with Express.js and MongoDB.

## Technology Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Port**: 5000 (default)

## Project Structure
```
server/
├── config/
│   └── database.js          # Database connection configuration
├── controllers/             # Business logic for each entity
│   ├── companyController.js
│   ├── vehicleController.js
│   ├── driverController.js
│   ├── loadController.js
│   ├── paymentController.js
│   └── reportController.js
├── models/                  # Mongoose schemas
│   ├── Company.js
│   ├── Vehicle.js
│   ├── Driver.js
│   ├── Load.js
│   └── Payment.js
├── routes/                  # API route definitions
│   ├── companies.js
│   ├── vehicles.js
│   ├── drivers.js
│   ├── loads.js
│   ├── payments.js
│   └── reports.js
├── middleware/              # Custom middleware
│   └── errorHandler.js
├── utils/                   # Utility functions
│   └── helpers.js
├── docs/                    # Documentation
│   ├── REQUIREMENTS.md
│   ├── DEVELOPMENT_TASKS.md
│   └── API_DOCUMENTATION.md
├── server.js               # Main entry point
├── .env                    # Environment variables
└── package.json
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas connection string)

### Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Edit `.env` file with your settings:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/vehicle-rental
   NODE_ENV=development
   ```

3. **Ensure MongoDB is running:**
   - Local: `mongod` command
   - Atlas: Use your connection string in .env

## Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000`

## Health Check
Test if the server is running:
```bash
curl http://localhost:5000/api/health
```

## API Endpoints Overview

### Core Resources
- **Companies**: `/api/companies` - Manage rental companies
- **Vehicles**: `/api/vehicles` - Manage vehicles inventory
- **Drivers**: `/api/drivers` - Manage driver registrations
- **Loads**: `/api/loads` - Manage rental/load requests
- **Payments**: `/api/payments` - Track financial transactions

### Reports
- **Balance Report**: `/api/reports/balance`
- **Payment History**: `/api/reports/payment-history`
- **Vehicle Utilization**: `/api/reports/vehicle-utilization`
- **Driver Performance**: `/api/reports/driver-performance`

## Detailed Documentation
- See [API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md) for complete API reference
- See [REQUIREMENTS.md](./docs/REQUIREMENTS.md) for system requirements
- See [DEVELOPMENT_TASKS.md](./docs/DEVELOPMENT_TASKS.md) for development progress

## Data Models

### Company
```javascript
{
  name: String (required),
  contact: String (required),
  address: String (required),
  email: String,
  phone: String,
  timestamps
}
```

### Vehicle
```javascript
{
  company_id: ObjectId (required),
  vehicle_type: String (required),
  plate_no: String (required, unique),
  rent_price: Number (required),
  status: String (enum: ['available', 'rented', 'maintenance']),
  manufacturer: String,
  year: Number,
  capacity: Number,
  timestamps
}
```

### Driver
```javascript
{
  name: String (required),
  contact: String (required),
  license_no: String (required, unique),
  status: String (enum: ['active', 'inactive', 'suspended']),
  email: String,
  phone: String,
  address: String,
  timestamps
}
```

### Load (Rental Request)
```javascript
{
  vehicle_id: ObjectId (required),
  driver_id: ObjectId,
  from_location: String (required),
  to_location: String (required),
  load_description: String,
  rent_amount: Number (required),
  status: String (enum: ['pending', 'assigned', 'in-transit', 'completed', 'cancelled']),
  start_date: Date,
  end_date: Date,
  timestamps
}
```

### Payment
```javascript
{
  payer: String (required),
  payer_id: ObjectId,
  payee: String,
  payee_id: ObjectId,
  amount: Number (required),
  date: Date,
  type: String (enum: ['rental', 'driver-commission', 'company-payment', 'other']),
  balance: Number,
  description: String,
  load_id: ObjectId,
  timestamps
}
```

## Features Implemented

### Database & Models
- ✅ Company model and schema
- ✅ Vehicle model and schema
- ✅ Driver model and schema
- ✅ Load/Rental Request model and schema
- ✅ Payment model and schema

### API Endpoints
- ✅ Company Management (CRUD)
- ✅ Vehicle Management (CRUD)
- ✅ Driver Management (CRUD)
- ✅ Load/Rental Request Management (CRUD + Assign Driver)
- ✅ Payment Management (CRUD)
- ✅ Reporting (4 different reports)

### Middleware & Utilities
- ✅ Error handling middleware
- ✅ CORS configuration
- ✅ Helper utility functions
- ✅ Request validation

## Future Enhancements
- [ ] Authentication & Authorization (JWT)
- [ ] Input validation middleware
- [ ] Rate limiting
- [ ] Logging system
- [ ] Unit & integration tests
- [ ] API versioning
- [ ] Pagination support
- [ ] Search & filtering capabilities

## Notes
- Validations are kept minimal as per requirements; updates will be added in future iterations
- All relationships use MongoDB ObjectId references
- Timestamps (createdAt, updatedAt) are automatically managed by Mongoose

## License
ISC
