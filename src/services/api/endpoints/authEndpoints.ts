/**
 * Authentication API Endpoints
 */

import { api, ApiResponse } from "../middleware/apiMiddleware";
import { User } from "@/types/auth";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: string;
}

export const authEndpoints = {
  /**
   * Login with email and password
   */
  login: async (
    credentials: LoginCredentials,
  ): Promise<ApiResponse<AuthResponse>> => {
    return api.post<AuthResponse>("/auth/login", credentials);
  },

  /**
   * Register a new user
   */
  register: async (data: RegisterData): Promise<ApiResponse<AuthResponse>> => {
    return api.post<AuthResponse>("/auth/register", data);
  },

  /**
   * Logout the current user
   */
  logout: async (): Promise<ApiResponse<void>> => {
    return api.post<void>("/auth/logout");
  },

  /**
   * Get the current authenticated user
   */
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    return api.get<User>("/auth/me");
  },

  /**
   * Request a password reset
   */
  requestPasswordReset: async (email: string): Promise<ApiResponse<void>> => {
    return api.post<void>("/auth/forgot-password", { email });
  },

  /**
   * Reset password with token
   */
  resetPassword: async (
    token: string,
    password: string,
  ): Promise<ApiResponse<void>> => {
    return api.post<void>("/auth/reset-password", { token, password });
  },

  /**
   * Verify email with token
   */
  verifyEmail: async (token: string): Promise<ApiResponse<void>> => {
    return api.post<void>("/auth/verify-email", { token });
  },
};
