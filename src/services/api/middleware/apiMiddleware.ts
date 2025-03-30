/**
 * API Middleware
 *
 * This middleware layer handles authentication, validation, and standardization
 * for all API requests. It serves as the central point for all frontend-to-backend
 * communication, eliminating direct database access from the frontend.
 */

import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { env } from "@/config/env";
import logger from "@/utils/logger";

// Standard API response format
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    };
    timestamp: string;
    requestId: string;
  };
}

// Request options with additional middleware-specific options
export interface ApiRequestOptions extends AxiosRequestConfig {
  skipAuth?: boolean;
  mockResponse?: any;
  cacheDuration?: number; // in seconds
}

// Cache implementation
const cache = new Map<string, { data: any; timestamp: number }>();

// Generate a unique request ID
const generateRequestId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

// Create axios instance with base URL
const apiClient = axios.create({
  baseURL: env.API_BASE_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds
});

// Add request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem("authToken");
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request ID for tracing
    const requestId = generateRequestId();
    config.headers["X-Request-ID"] = requestId;

    return config;
  },
  (error) => Promise.reject(error),
);

// Add response interceptor for error handling and response standardization
apiClient.interceptors.response.use(
  (response) => {
    // Transform response to standard format if it's not already
    if (
      response.data &&
      typeof response.data === "object" &&
      !("success" in response.data)
    ) {
      response.data = {
        success: true,
        data: response.data,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: response.config.headers["X-Request-ID"],
        },
      };
    }
    return response;
  },
  (error: AxiosError) => {
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem("authToken");
      window.location.href = "/auth/login";
    }

    // Standardize error response
    const errorResponse: ApiResponse = {
      success: false,
      error: {
        code: error.response?.status
          ? `ERR_${error.response.status}`
          : "ERR_NETWORK",
        message: error.message || "An unexpected error occurred",
        details: error.response?.data,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId:
          (error.config?.headers?.["X-Request-ID"] as string) ||
          generateRequestId(),
      },
    };

    // Return standardized error
    return Promise.reject({
      ...error,
      response: { ...error.response, data: errorResponse },
    });
  },
);

/**
 * Make an API request with standardized handling
 */
export async function apiRequest<T = any>(
  method: string,
  url: string,
  options: ApiRequestOptions = {},
): Promise<ApiResponse<T>> {
  const {
    skipAuth = false,
    mockResponse = null,
    cacheDuration = 0,
    data,
    params,
    ...axiosOptions
  } = options;

  // Generate cache key if caching is enabled
  const cacheKey =
    cacheDuration > 0
      ? `${method}:${url}:${JSON.stringify(params)}:${JSON.stringify(data)}`
      : "";

  // Check cache first if caching is enabled
  if (cacheDuration > 0 && cache.has(cacheKey)) {
    const cachedData = cache.get(cacheKey);
    if (
      cachedData &&
      Date.now() - cachedData.timestamp < cacheDuration * 1000
    ) {
      return cachedData.data;
    }
    // Remove expired cache
    cache.delete(cacheKey);
  }

  // Use mock response if in development and mock is provided
  if (env.DEV && mockResponse) {
    const mockData: ApiResponse<T> = {
      success: true,
      data: mockResponse,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(),
      },
    };

    // Cache mock response if caching is enabled
    if (cacheDuration > 0) {
      cache.set(cacheKey, { data: mockData, timestamp: Date.now() });
    }

    return mockData;
  }

  try {
    // Make the actual API request
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.request({
      method,
      url,
      data,
      params,
      ...axiosOptions,
      headers: {
        ...axiosOptions.headers,
        // Skip auth header if specified
        ...(skipAuth ? { Authorization: undefined } : {}),
      },
    });

    // Cache successful response if caching is enabled
    if (cacheDuration > 0) {
      cache.set(cacheKey, { data: response.data, timestamp: Date.now() });
    }

    return response.data;
  } catch (error) {
    if (error.response?.data) {
      return error.response.data;
    }

    // If no standardized error response is available, create one
    const errorResponse: ApiResponse = {
      success: false,
      error: {
        code: "ERR_UNKNOWN",
        message: error.message || "An unexpected error occurred",
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(),
      },
    };

    logger.error("API Request Error", error);
    return errorResponse;
  }
}

// Convenience methods for different HTTP methods
export const api = {
  get: <T = any>(url: string, options?: ApiRequestOptions) =>
    apiRequest<T>("GET", url, options),

  post: <T = any>(url: string, data?: any, options?: ApiRequestOptions) =>
    apiRequest<T>("POST", url, { ...options, data }),

  put: <T = any>(url: string, data?: any, options?: ApiRequestOptions) =>
    apiRequest<T>("PUT", url, { ...options, data }),

  patch: <T = any>(url: string, data?: any, options?: ApiRequestOptions) =>
    apiRequest<T>("PATCH", url, { ...options, data }),

  delete: <T = any>(url: string, options?: ApiRequestOptions) =>
    apiRequest<T>("DELETE", url, options),

  // Clear the entire cache
  clearCache: () => cache.clear(),

  // Clear specific cache entry
  clearCacheFor: (method: string, url: string, params?: any, data?: any) => {
    const cacheKey = `${method}:${url}:${JSON.stringify(params)}:${JSON.stringify(data)}`;
    cache.delete(cacheKey);
  },
};

export default api;
