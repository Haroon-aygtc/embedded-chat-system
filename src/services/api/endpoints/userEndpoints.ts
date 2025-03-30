/**
 * User API Endpoints
 */

import { api, ApiResponse } from "../middleware/apiMiddleware";
import { User } from "@/types/auth";

export interface UserListResponse {
  users: User[];
  totalCount: number;
  totalPages: number;
}

export interface UserQueryParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  roleFilter?: string | null;
  statusFilter?: string | null;
}

export interface CreateUserData {
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  password?: string;
}

export interface UpdateUserData {
  email?: string;
  name?: string;
  role?: string;
  isActive?: boolean;
}

export const userEndpoints = {
  /**
   * Get all users with pagination and filtering
   */
  getUsers: async (
    params: UserQueryParams = {},
  ): Promise<ApiResponse<UserListResponse>> => {
    return api.get<UserListResponse>("/users", { params });
  },

  /**
   * Get user by ID
   */
  getUserById: async (id: string): Promise<ApiResponse<User>> => {
    return api.get<User>(`/users/${id}`);
  },

  /**
   * Create a new user
   */
  createUser: async (data: CreateUserData): Promise<ApiResponse<User>> => {
    return api.post<User>("/users", data);
  },

  /**
   * Update an existing user
   */
  updateUser: async (
    id: string,
    data: UpdateUserData,
  ): Promise<ApiResponse<User>> => {
    return api.put<User>(`/users/${id}`, data);
  },

  /**
   * Delete a user
   */
  deleteUser: async (id: string): Promise<ApiResponse<boolean>> => {
    return api.delete<boolean>(`/users/${id}`);
  },

  /**
   * Get user activity logs
   */
  getUserActivity: async (userId: string): Promise<ApiResponse<any[]>> => {
    return api.get<any[]>(`/users/${userId}/activity`);
  },

  /**
   * Get user sessions
   */
  getUserSessions: async (userId: string): Promise<ApiResponse<any[]>> => {
    return api.get<any[]>(`/users/${userId}/sessions`);
  },
};
