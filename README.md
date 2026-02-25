# Leonex Transport

Internal management system for EESA Transport — handles rental transactions, payments, drivers, loads, and reporting.

## Stack

- **Frontend** — React + Vite + Tailwind CSS (`/client`)
- **Backend** — Node.js + Express + MongoDB (`/server`)

## Running Locally

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone the repo
```bash
git clone <repo-url>
cd leonex-transport
```

### 2. Environment variables

Contact **mohammedshahan210@gmail.com** to get the `.env` file, then place it inside the `/server` folder.

### 3. Install & run the backend
```bash
cd server
npm install
npm run dev
```
Runs on `http://localhost:5003`

### 4. Install & run the frontend
```bash
cd client
npm install
npm run dev
```
Runs on `http://localhost:5173`

> Both must be running at the same time.
