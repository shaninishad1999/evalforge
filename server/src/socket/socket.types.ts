import {
  Server,
  Socket,
} from "socket.io";

// ============================================================
// SOCKET USER
// ============================================================

export interface SocketUser {
  userId: string;

  role:
    | "SUPER_ADMIN"
    | "ADMIN"
    | "CLIENT"
    | "PROJECT_MANAGER"
    | "REVIEWER"
    | "CONTRIBUTOR";
}

// ============================================================
// AUTHENTICATED SOCKET
// ============================================================

export interface AuthenticatedSocket
  extends Socket {
  user?: SocketUser;
}

// ============================================================
// SOCKET SERVER
// ============================================================

export type EvalForgeSocketServer =
  Server;