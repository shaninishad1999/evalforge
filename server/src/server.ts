import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";

import connectDB from "./config/db.js";

import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import clientRoutes from "./routes/client.routes.js";
import projectManagerRoutes from "./routes/projectManager.routes.js";
import reviewerRoutes from "./routes/reviewer.routes.js";
import contributorRoutes from "./routes/contributor.routes.js";

import errorHandler from "./middleware/errorHandler.js";

import {
  apiRateLimiter,
} from "./middleware/rateLimit.middleware.js";

import {
  securityHeaders,
  requestSizeProtection,
} from "./middleware/security.middleware.js";

import {
  requestLogger,
} from "./middleware/requestLogger.middleware.js";

import userRoutes from "./routes/user.routes.js";
import projectRoutes from "./routes/project.routes.js";
import qualificationRoutes from "./routes/qualification.routes.js";
import datasetRoutes from "./routes/dataset.routes.js";
import datasetItemRoutes from "./routes/datasetItem.routes.js";
import taskRoutes from "./routes/task.routes.js";
import taskSubmissionRoutes from "./routes/taskSubmission.routes.js";
import taskReviewRoutes from "./routes/taskReview.routes.js";
import earningRoutes from "./routes/earning.routes.js";
import walletRoutes from "./routes/wallet.routes.js";
import withdrawalRoutes from "./routes/withdrawal.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import auditLogRoutes from "./routes/auditLog.routes.js";

import {
  initializeSocket,
} from "./socket/socket.js";

import {
  setNotificationSocket,
} from "./services/notification.service.js";
import projectAssignmentRoutes from "./routes/projectAssignment.routes.js";
import adminUserRoutes from "./routes/adminUser.routes.js";
dotenv.config();

const app = express();

const PORT =
  process.env.PORT || 5000;

// ============================================
// Security
// ============================================

// Helmet provides standard security headers
app.use(helmet());

// Additional EvalForge security headers
app.use(securityHeaders);

// ============================================
// CORS
// ============================================

const clientUrl =
  process.env.CLIENT_URL ||
  "http://localhost:3000";

app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  })
);

// ============================================
// Request Protection
// ============================================

// Prevent excessively large HTTP requests
app.use(requestSizeProtection);

// ============================================
// Rate Limiting
// ============================================

// General API rate limiter
app.use(apiRateLimiter);

// ============================================
// Body Parsers
// ============================================

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

// ============================================
// Cookies
// ============================================

app.use(cookieParser());

// ============================================
// Logger
// ============================================

// Existing Morgan logger
app.use(morgan("dev"));

// Detailed EvalForge request logger
app.use(requestLogger);

// ============================================
// Health Check
// ============================================

app.get(
  "/api/health",
  (_req, res) => {
    res.status(200).json({
      success: true,
      message:
        "EvalForge API is running",
    });
  }
);

// ============================================
// API Routes
// ============================================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/admin",
  adminRoutes
);

app.use(
  "/api/client",
  clientRoutes
);

app.use(
  "/api/project-manager",
  projectManagerRoutes
);

app.use(
  "/api/reviewer",
  reviewerRoutes
);

app.use(
  "/api/contributor",
  contributorRoutes
);

app.use(
  "/api/users",
  userRoutes
);

app.use(
  "/api/projects",
  projectRoutes
);

app.use(
  "/api/qualifications",
  qualificationRoutes
);

app.use(
  "/api/datasets",
  datasetRoutes
);

app.use(
  "/api/dataset-items",
  datasetItemRoutes
);

app.use(
  "/api/tasks",
  taskRoutes
);

app.use(
  "/api/task-submissions",
  taskSubmissionRoutes
);

app.use(
  "/api/task-reviews",
  taskReviewRoutes
);

app.use(
  "/api/earnings",
  earningRoutes
);

app.use(
  "/api/wallets",
  walletRoutes
);

app.use(
  "/api/withdrawals",
  withdrawalRoutes
);

app.use(
  "/api/payments",
  paymentRoutes
);

app.use(
  "/api/notifications",
  notificationRoutes
);

app.use(
  "/api/audit-logs",
  auditLogRoutes
);
app.use(
  "/api/project-assignments",
  projectAssignmentRoutes
);
app.use(
  "/api/admin/users",
  adminUserRoutes
);
// ============================================
// Global Error Handler
// IMPORTANT: Must be after all routes
// ============================================

app.use(errorHandler);

// ============================================
// HTTP SERVER
// ============================================

const httpServer =
  createServer(app);

// ============================================
// SOCKET.IO
// ============================================

const io =
  new Server(
    httpServer,
    {
      cors: {
        origin: clientUrl,
        credentials: true,
      },
    }
  );

// ============================================
// INITIALIZE SOCKET
// ============================================

initializeSocket(io);

// ============================================
// CONNECT SOCKET WITH
// NOTIFICATION SERVICE
// ============================================

setNotificationSocket(io);

// ============================================
// Start Server
// ============================================

const startServer =
  async () => {
    try {
      // Connect MongoDB first
      await connectDB();

      // Start HTTP + Socket.io server
      httpServer.listen(
        PORT,
        () => {
          console.log(
            `🚀 EvalForge API running on http://localhost:${PORT}`
          );

          console.log(
            `🔌 EvalForge Socket.io running on ws://localhost:${PORT}`
          );
        }
      );
    } catch (error) {
      console.error(
        "❌ Failed to start server:",
        error
      );

      process.exit(1);
    }
  };

startServer();