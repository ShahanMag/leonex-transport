const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
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
const transactionRoutes = require("./routes/transactionRoutes");
const dashboardRoutes = require("./routes/dashboard");
const userRoutes = require("./routes/users");
const receiptRoutes = require("./routes/receipts");

// Initialize Express app
const app = express();

// Connect to database
connectDB();

// Initialize default users
const userController = require("./controllers/userController");
userController.initializeDefaultUsers();

// ===== CRITICAL: CORS MUST BE FIRST =====
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "https://leonix-transport.netlify.app",
        "http://localhost:5173",
        "http://localhost:3000",
      ];

      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Temporarily allow all for debugging
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.status(200).json({ message: "Server is running" });
});

// API Routes
app.use("/api/companies", companyRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/loads", loadRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);
app.use("/api/receipts", receiptRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((_req, res) => {
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
