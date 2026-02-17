const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

// Load environment variables FIRST
const envResult = dotenv.config({ path: path.resolve(__dirname, ".env") });

if (envResult.error) {
  console.warn("⚠️  Warning: .env file not found or has errors");
  console.warn("Creating .env file with default values...");
}

// Verify critical environment variables
if (!process.env.MONGO_URI) {
  console.error("❌ ERROR: MONGO_URI is not set in environment variables");
  console.error("Please create a .env file in the backend directory with:");
  console.error("MONGO_URI=mongodb://localhost:27017/mealvista");
  console.error("\nFor MongoDB Atlas, use:");
  console.error(
    "MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/mealvista",
  );
  process.exit(1);
}

// Check for AI Recipe Engine URL
if (!process.env.AI_RECIPE_ENGINE_URL) {
  console.warn(
    "⚠️  Warning: AI_RECIPE_ENGINE_URL not set, using default: http://localhost:8000",
  );
  process.env.AI_RECIPE_ENGINE_URL = "http://localhost:8000";
}

const connectDB = require("./src/config/db");
const loadRoutes = require("./src/routes");
const cron = require("node-cron");

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

const corsOptions = {
  origin: "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Dynamic route loading from src/features
loadRoutes(app);

app.get("/", (req, res) => {
  res.json({
    message: "MealVista API is running",
    timestamp: new Date().toISOString(),
    mongodb: "connected",
    aiRecipeEngine: process.env.AI_RECIPE_ENGINE_URL || "http://localhost:8000",
  });
});

// Test endpoint for connection verification
app.get("/api/test", (req, res) => {
  res.json({
    message: "Backend is working!",
    timestamp: new Date().toISOString(),
    status: "success",
  });
});

const PORT = process.env.PORT || 5000;

// Get network IP address for display
const os = require("os");
const networkInterfaces = os.networkInterfaces();
let networkIP = "localhost";

// Find the first non-internal IPv4 address
for (const interfaceName in networkInterfaces) {
  const addresses = networkInterfaces[interfaceName];
  for (const address of addresses) {
    if (address.family === "IPv4" && !address.internal) {
      networkIP = address.address;
      break;
    }
  }
  if (networkIP !== "localhost") break;
}

app.listen(PORT, "0.0.0.0", () => {
  console.log("");
  console.log("✅ Server running successfully!");
  console.log(`🌐 Local:   http://localhost:${PORT}`);
  console.log(`🌐 Network: http://${networkIP}:${PORT}`);
  console.log(`📡 Test:   http://localhost:${PORT}/api/test`);
  console.log(
    `🤖 AI Engine: ${process.env.AI_RECIPE_ENGINE_URL || "http://localhost:8000"}`,
  );
  console.log("");
  console.log(`📱 Frontend should connect to: http://${networkIP}:${PORT}`);
  console.log("");

  // Recommendation cache refresh every 12 hours (0 */12 * * *)
  cron.schedule("0 */12 * * *", async () => {
    try {
      const { refreshAllUsersRecommendations } = require("./src/services/recommendationService");
      await refreshAllUsersRecommendations();
    } catch (err) {
      console.error("Recommendation cron error:", err.message);
    }
  });
  console.log("📋 Recommendation refresh cron: every 12 hours");
});
