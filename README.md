# Vehicle Rental Management System

A comprehensive full-stack application for managing vehicle rentals with automatic payment tracking, driver assignments, and financial reporting.

**Current Version:** 2.0
**Stack:** MERN (MongoDB, Express.js, React, Node.js)

---

## 📋 Documentation

### Core Documentation

- **[UPDATE 2.0](./server/docs/UPDATE_2.0.md)** - Latest business flow with auto-payment creation and dynamic pricing
- **[UPDATE 1.0 (BUSINESS_FLOW_UPDATE)](./server/docs/BUSINESS_FLOW_UPDATE.md)** - Initial dual-payment system design
- **[Requirements](./server/docs/REQUIREMENTS.md)** - System requirements and entities
- **[Development Tasks](./server/docs/DEVELOPMENT_TASKS.md)** - Implementation checklist

### Technical Documentation

- **[API Documentation](./server/docs/API_DOCUMENTATION.md)** - Complete API endpoint reference
- **[Backend README](./server/README.md)** - Backend setup and configuration
- **[Frontend README](./client/README.md)** - Frontend setup and features

---

## 🎯 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and port (default: 5003)
npm run dev
```

Backend runs on: `http://localhost:5003`

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

---

## 🔑 Key Features

### Version 2.0 Features

✅ **Automatic Payment Creation**
- Vehicle acquisition payment created when vehicle is added
- Driver rental payment created when load is completed
- No manual payment entry needed

✅ **Dynamic Rental Pricing**
- Rental pricing determined per-job, not per-vehicle
- Same vehicle can have different prices for different rentals
- Pricing flexible: per day, per job, or per km

✅ **Simplified Vehicle Onboarding**
- Vehicle form only asks for acquisition details
- No driver rental pricing at vehicle creation
- Cleaner, faster onboarding process

✅ **Phone Number with Country Code**
- Separate `country_code` and `phone_number` fields
- Support for international phone numbers
- Better formatting and validation

### Core Features (All Versions)

✅ **Vehicle Management**
- Add, edit, delete vehicles
- Track acquisition cost and type
- Manage vehicle status (available, rented, maintenance)

✅ **Driver Management**
- Register drivers with license details
- Track driver status (active, inactive, suspended)
- Manage driver contact information

✅ **Company Management**
- Register multiple companies
- Track company information and contact details

✅ **Rental Request Management**
- Create loads/rental requests
- Assign drivers to loads
- Auto-calculate rental costs and days

✅ **Automatic Payment Tracking**
- Vehicle acquisition payments (company → supplier)
- Driver rental payments (driver → company)
- Payment status tracking (pending, completed, failed, refunded)

✅ **Financial Reports**
- Vehicle profitability analysis
- Company cashflow reports
- Driver payment history

---

## 📊 Business Flow

### Two Payment Types Per Vehicle

**Payment Type 1: Vehicle Acquisition** (Created at vehicle addition)
```
Company → Supplier
Amount: What company paid to acquire vehicle
Status: Tracks company's investment
```

**Payment Type 2: Driver Rental** (Created at load completion)
```
Driver → Company
Amount: What driver pays company for using vehicle
Status: Tracks rental revenue
```

### Complete Workflow

```
1. Admin adds vehicle (Acquisition cost + details)
   ↓
2. System auto-creates acquisition payment
   ↓
3. Admin creates rental request (Select vehicle + set rental price)
   ↓
4. Admin assigns driver to load
   ↓
5. Driver completes rental job
   ↓
6. System auto-creates rental payment
   ↓
7. Vehicle becomes available again
```

---

## 🗄️ Database Models

### Vehicle
- Company reference
- Vehicle type, plate number, status
- Acquisition cost, type, and date
- Manufacturer, year, capacity

### Load (Rental Request)
- Vehicle and driver references
- From/to locations, load description
- Rental pricing (per day/job/km)
- Auto-calculated: days rented, rental amount
- Status tracking

### Payment
- Payer and payee information
- Amount and balance
- Payment type and status
- Vehicle and load references
- Auto-generated timestamps

### Company & Driver
- Contact information
- Phone with country code separation
- Status tracking
- Unique identifiers (plate number for vehicles, license for drivers)

---

## 🔄 Version History

### Version 2.0 (Current)
- ✅ Auto-generate vehicle acquisition payment
- ✅ Auto-generate driver rental payment on load completion
- ✅ Simplified vehicle form (no driver rental pricing)
- ✅ Dynamic rental pricing per load
- ✅ Country code separation for phone numbers
- 🔄 Implementation in progress

### Version 1.0
- ✅ Dual-payment system architecture
- ✅ Backend models and controllers
- ✅ Frontend pages and components
- ✅ Toast notifications (replaced alerts)
- ✅ CORS configuration (port 5003)
- ✅ Modal UI enhancements

---

## 🚀 Current Implementation Status

### Version 2.0 - TODO

**Backend Updates Needed:**
- [ ] Vehicle model (remove driver_rental_price/type)
- [ ] Load model (add rental_price_per_day)
- [ ] Company model (add phone_country_code, phone_number)
- [ ] Driver model (add phone_country_code, phone_number)
- [ ] Vehicle controller (auto-create acquisition payment)
- [ ] Load controller (complete load endpoint + auto-create rental payment)
- [ ] Payment service (auto-generation logic)

**Frontend Updates Needed:**
- [ ] Simplify Vehicle form
- [ ] Update Load form with dynamic pricing
- [ ] Add country code selector to Company form
- [ ] Add country code selector to Driver form
- [ ] Update Payment page for read-only display
- [ ] Add "Complete Load" action

---

## 📁 Project Structure

```
Vehicle-Rental/
├── server/
│   ├── models/
│   │   ├── Company.js
│   │   ├── Vehicle.js
│   │   ├── Driver.js
│   │   ├── Load.js
│   │   └── Payment.js
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   ├── docs/
│   │   ├── UPDATE_2.0.md        (Latest)
│   │   ├── BUSINESS_FLOW_UPDATE.md
│   │   ├── API_DOCUMENTATION.md
│   │   └── ...
│   └── server.js
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Vehicles.jsx
│   │   │   ├── Loads.jsx
│   │   │   ├── Payments.jsx
│   │   │   └── ...
│   │   ├── components/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
└── README.md (this file)
```

---

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express.js
- MongoDB + Mongoose
- REST API

**Frontend:**
- React 18
- React Router v7
- Tailwind CSS
- Axios
- Sonner (Toast notifications)

---

## 📞 Support & Documentation

For detailed information, refer to:
1. **New Features:** See [UPDATE_2.0.md](./server/docs/UPDATE_2.0.md)
2. **Architecture:** See [BUSINESS_FLOW_UPDATE.md](./server/docs/BUSINESS_FLOW_UPDATE.md)
3. **API Endpoints:** See [API_DOCUMENTATION.md](./server/docs/API_DOCUMENTATION.md)
4. **Setup Help:** See [Backend README](./server/README.md) or [Frontend README](./client/README.md)

---

## 🔐 Notes

- All prices are in local currency (defaults to ₹ in examples)
- Phone numbers stored separately from country codes for flexibility
- Payment records are auto-generated and immutable (can update status only)
- Vehicle status automatically updates with load assignment/completion

---

**Last Updated:** October 28, 2024
**Version:** 2.0
