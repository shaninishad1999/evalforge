import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import clientRoutes from "./routes/client.routes.js";
import projectManagerRoutes from "./routes/projectManager.routes.js";
import reviewerRoutes from "./routes/reviewer.routes.js";
import contributorRoutes from "./routes/contributor.routes.js";
import errorHandler from "./middleware/errorHandler.js";
import userRoutes from "./routes/user.routes.js";
import projectRoutes from "./routes/project.routes.js";
dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// ============================================
// Security
// ============================================

app.use(helmet());

// ============================================
// CORS
// ============================================

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// ============================================
// Body Parsers
// ============================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// Cookies
// ============================================

app.use(cookieParser());

// ============================================
// Logger
// ============================================

app.use(morgan("dev"));

// ============================================
// Health Check
// ============================================

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "EvalForge API is running",
  });
});

// ============================================
// API Routes
// ============================================

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/client", clientRoutes);
app.use("/api/project-manager",projectManagerRoutes);
app.use("/api/reviewer", reviewerRoutes);
app.use("/api/contributor", contributorRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
// ============================================
// Global Error Handler
// IMPORTANT: Must be after all routes
// ============================================

app.use(errorHandler);

// ============================================
// Start Server
// ============================================

const startServer = async () => {
  try {
    // Connect MongoDB first
    await connectDB();

    // Start Express server
    app.listen(PORT, () => {
      console.log(
        `🚀 EvalForge API running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();