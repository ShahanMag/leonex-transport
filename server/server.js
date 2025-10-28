const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config();
const connectDB = require("./config/database");
const errorHandler = require("./middleware/errorHandler");

// Import routes
const companyRoutes = require("./routes/companies");
const vehicleRoutes = require("./routes/vehicles");
const driverRoutes = require("./routes/drivers");
const loadRoutes = require("./routes/loads");
const paymentRoutes = require("./routes/payments");
const reportRoutes = require("./routes/reports");

// Initialize Express app
const app = express();

// Connect to database
connectDB();

// ===== CRITICAL: CORS MUST BE FIRST =====
app.use((req, res, next) => {
  // Allow requests from any origin
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  console.log(`[CORS] ${req.method} ${req.path}`);

  // Handle preflight requests (OPTIONS)
  if (req.method === "OPTIONS") {
    console.log(`[CORS] Preflight request handled for ${req.path}`);
    return res.status(200).send();
  }

  next();
});

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Server is running" });
});

// API Routes
app.use("/api/companies", companyRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/loads", loadRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reports", reportRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Start server
const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`Server is running on port ${PORT}`);
  console.log(`API Base URL: http://localhost:${PORT}/api`);
  console.log(`Health Check: http://localhost:${PORT}/api/health`);
  console.log(`========================================\n`);
});

module.exports = app;
