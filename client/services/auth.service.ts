import api from "@/lib/axios";
import {
  authStorage,
  type AuthResponse,
  type AuthUser,
} from "@/lib/auth";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

interface LoginData {
  user: AuthUser;
  accessToken: string;
}

interface UserData {
  user: AuthUser;
}

interface RefreshData {
  accessToken: string;
}

export const authService = {
  async register(
    payload: RegisterPayload
  ): Promise<AuthResponse<UserData>> {
    const response = await api.post(
      "/auth/register",
      payload
    );

    return response.data;
  },

  async login(
    payload: LoginPayload
  ): Promise<AuthResponse<LoginData>> {
    const response = await api.post(
      "/auth/login",
      payload
    );

    const data = response.data;

    if (data.success && data.data?.accessToken) {
      authStorage.setAccessToken(
        data.data.accessToken
      );
    }

    return data;
  },

  async getMe(): Promise<AuthResponse<UserData>> {
    const response = await api.get("/auth/me");

    return response.data;
  },

  async refreshToken(): Promise<AuthResponse<RefreshData>> {
    const response = await api.post("/auth/refresh");

    const data = response.data;

    if (data.success && data.data?.accessToken) {
      authStorage.setAccessToken(
        data.data.accessToken
      );
    }

    return data;
  },

  async logout(): Promise<AuthResponse> {
    const response = await api.post("/auth/logout");

    authStorage.clearAccessToken();

    return response.data;
  },
};