import {
  Server,
  Socket,
} from "socket.io";

import jwt from "jsonwebtoken";

import {
  AuthenticatedSocket,
} from "./socket.types.js";

// ============================================================
// JWT PAYLOAD
// ============================================================

interface SocketJwtPayload {
  userId: string;

  role:
    | "SUPER_ADMIN"
    | "ADMIN"
    | "CLIENT"
    | "PROJECT_MANAGER"
    | "REVIEWER"
    | "CONTRIBUTOR";

  iat?: number;

  exp?: number;
}

// ============================================================
// SOCKET AUTH SECRET
// ============================================================

const getAccessSecret =
  (): string => {
    const secret =
      process.env.JWT_ACCESS_SECRET;

    if (!secret) {
      throw new Error(
        "JWT_ACCESS_SECRET is not defined"
      );
    }

    return secret;
  };

// ============================================================
// SOCKET AUTHENTICATION
// ============================================================

const authenticateSocket =
  (
    socket: Socket,
    next: (
      error?: Error
    ) => void
  ) => {
    try {
      const authToken =
        socket.handshake.auth
          ?.token;

      const authorization =
        socket.handshake.headers
          .authorization;

      let token:
        | string
        | undefined;

      // --------------------------------------------------------
      // TOKEN FROM SOCKET AUTH
      // --------------------------------------------------------

      if (
        typeof authToken ===
        "string" &&
        authToken.trim()
      ) {
        token =
          authToken.replace(
            /^Bearer\s+/i,
            ""
          );
      }

      // --------------------------------------------------------
      // TOKEN FROM AUTHORIZATION HEADER
      // --------------------------------------------------------

      if (
        !token &&
        typeof authorization ===
          "string" &&
        authorization.startsWith(
          "Bearer "
        )
      ) {
        token =
          authorization.substring(
            7
          );
      }

      if (!token) {
        return next(
          new Error(
            "Authentication required"
          )
        );
      }

      const decoded =
        jwt.verify(
          token,
          getAccessSecret()
        ) as SocketJwtPayload;

      if (
        !decoded.userId ||
        !decoded.role
      ) {
        return next(
          new Error(
            "Invalid access token"
          )
        );
      }

      const authenticatedSocket =
        socket as AuthenticatedSocket;

      authenticatedSocket.user = {
        userId:
          decoded.userId,

        role:
          decoded.role,
      };

      next();
    } catch {
      return next(
        new Error(
          "Invalid or expired access token"
        )
      );
    }
  };

// ============================================================
// SOCKET INITIALIZATION
// ============================================================

export const initializeSocket =
  (
    io: Server
  ) => {
    // --------------------------------------------------------
    // SOCKET AUTHENTICATION
    // --------------------------------------------------------

    io.use(
      authenticateSocket
    );

    // --------------------------------------------------------
    // CONNECTION
    // --------------------------------------------------------

    io.on(
      "connection",
      (
        socket: Socket
      ) => {
        const authenticatedSocket =
          socket as AuthenticatedSocket;

        const user =
          authenticatedSocket.user;

        if (!user) {
          socket.disconnect(
            true
          );

          return;
        }

        // ------------------------------------------------------
        // USER ROOM
        // ------------------------------------------------------

        const userRoom =
          `user:${user.userId}`;

        socket.join(
          userRoom
        );

        // ------------------------------------------------------
        // ROLE ROOM
        // ------------------------------------------------------

        const roleRoom =
          `role:${user.role}`;

        socket.join(
          roleRoom
        );

        // ------------------------------------------------------
        // CONNECTION EVENT
        // ------------------------------------------------------

        socket.emit(
          "socket:connected",
          {
            success: true,

            message:
              "Socket connected successfully",

            data: {
              userId:
                user.userId,

              role:
                user.role,
            },
          }
        );

        // ------------------------------------------------------
        // CLIENT PING
        // ------------------------------------------------------

        socket.on(
          "ping",
          () => {
            socket.emit(
              "pong",
              {
                timestamp:
                  new Date().toISOString(),
              }
            );
          }
        );

        // ------------------------------------------------------
        // DISCONNECT
        // ------------------------------------------------------

        socket.on(
          "disconnect",
          (
            reason
          ) => {
            console.log(
              `Socket disconnected: ${socket.id} | User: ${user.userId} | Reason: ${reason}`
            );
          }
        );

        console.log(
          `Socket connected: ${socket.id} | User: ${user.userId} | Role: ${user.role}`
        );
      }
    );

    return io;
  };

// ============================================================
// EMIT TO USER
// ============================================================

export const emitToUser =
  (
    io: Server,
    userId: string,
    event: string,
    data: unknown
  ) => {
    io.to(
      `user:${userId}`
    ).emit(
      event,
      data
    );
  };

// ============================================================
// EMIT TO ROLE
// ============================================================

export const emitToRole =
  (
    io: Server,
    role: string,
    event: string,
    data: unknown
  ) => {
    io.to(
      `role:${role}`
    ).emit(
      event,
      data
    );
  };

// ============================================================
// EMIT TO USERS
// ============================================================

export const emitToUsers =
  (
    io: Server,
    userIds: string[],
    event: string,
    data: unknown
  ) => {
    for (const userId of userIds) {
      io.to(
        `user:${userId}`
      ).emit(
        event,
        data
      );
    }
  };