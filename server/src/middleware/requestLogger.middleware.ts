import {
  NextFunction,
  Request,
  Response,
} from "express";

// ============================================================
// REQUEST LOGGER
// ============================================================

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();

  const requestId =
    req.headers["x-request-id"] ||
    `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 10)}`;

  res.setHeader(
    "X-Request-ID",
    String(requestId)
  );

  res.on("finish", () => {
    const duration =
      Date.now() - startTime;

    const logData = {
      requestId: String(requestId),
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent:
        req.headers["user-agent"] || "-",
    };

    const logMessage =
      `[HTTP] ${logData.method} ` +
      `${logData.url} ` +
      `${logData.statusCode} ` +
      `${logData.duration} ` +
      `requestId=${logData.requestId} ` +
      `ip=${logData.ip}`;

    if (res.statusCode >= 500) {
      console.error(
        `❌ ${logMessage}`,
        logData
      );

      return;
    }

    if (res.statusCode >= 400) {
      console.warn(
        `⚠️ ${logMessage}`,
        logData
      );

      return;
    }

    console.log(
      `➡️ ${logMessage}`
    );
  });

  next();
};