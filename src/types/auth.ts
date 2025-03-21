import { Session, User as SupabaseUser } from "@supabase/supabase-js";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user" | "moderator";
  avatar?: string;
  metadata?: Record<string, any>;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmation {
  token: string;
  newPassword: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  session?: Session;
}

export interface SupabaseAuthResponse {
  user: SupabaseUser | null;
  session: Session | null;
  error?: Error | null;
}

export interface MFASetupResponse {
  qrCode: string;
  secret: string;
}

export interface MFAVerifyRequest {
  token: string;
  userId: string;
}

export interface JWTPayload {
  sub: string; // user id
  email: string;
  role: string;
  iat: number; // issued at
  exp: number; // expiration
}
