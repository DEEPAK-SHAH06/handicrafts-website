const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const migrate = require("./config/migrate");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

const clientOrigin = process.env.CLIENT_URL || "http://localhost:5173";

// Configure CORS to accept credentials (cookies) from frontend
app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

// Base health endpoints
app.get("/", (req, res) => {
  res.json({
    message: "Himalayan Sacred Arts API is running!",
  });
});

app.get("/api/health", async (req, res) => {
  try {
    const db = require("./config/db");
    await db.query("SELECT 1");

    res.json({
      server: "OK",
      database: "Connected",
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    res.status(500).json({
      server: "OK",
      database: "Disconnected",
    });
  }
});

// Mount modular routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

// 404 handler for unknown API routes
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      success: false,
      message: `API route ${req.originalUrl} not found.`,
    });
  }
  next();
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: "An internal server error occurred.",
  });
});

const PORT = process.env.PORT || 5001;

// Initialize database schema then start listening
async function startServer() {
  try {
    await migrate();
  } catch (err) {
    console.warn("Migration warning:", err.message);
  }

  app.listen(PORT, () => {
    console.log(`Handicraft API running at http://localhost:${PORT}`);
  });
}

startServer();