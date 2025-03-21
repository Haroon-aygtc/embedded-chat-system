export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

export interface LoginResponse {
  message: string;
  user: User;
  token: string;
}

export interface LogoutResponse {
  message: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface UpdateProfileRequest {
  name?: string;
  avatar?: string;
}

export interface UpdateProfileResponse {
  message: string;
  user: User;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
}

export interface DeleteAccountResponse {
  message: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface VerifyEmailResponse {
  message: string;
}

export interface ResendVerificationEmailRequest {
  email: string;
}

export interface ResendVerificationEmailResponse {
  message: string;
}

export interface VerifyEmailResponse {
  message: string;
}

