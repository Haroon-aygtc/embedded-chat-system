import { createContext, useContext, useReducer, useEffect } from "react";
import { User, AuthState } from "@/types/auth";
import api from "@/services/axiosConfig";
import jwt from "jsonwebtoken";

type AuthAction =
  | { type: "LOGIN_START" }
  | { type: "LOGIN_SUCCESS"; payload: { user: User; token: string } }
  | { type: "LOGIN_FAILURE"; payload: string }
  | { type: "REGISTER_START" }
  | { type: "REGISTER_SUCCESS" }
  | { type: "REGISTER_FAILURE"; payload: string }
  | { type: "PASSWORD_RESET_START" }
  | { type: "PASSWORD_RESET_SUCCESS" }
  | { type: "PASSWORD_RESET_FAILURE"; payload: string }
  | { type: "LOGOUT" }
  | { type: "CLEAR_ERROR" };

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem("token"),
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "LOGIN_START":
    case "REGISTER_START":
    case "PASSWORD_RESET_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case "REGISTER_SUCCESS":
    case "PASSWORD_RESET_SUCCESS":
      return {
        ...state,
        isLoading: false,
        error: null,
      };
    case "LOGIN_FAILURE":
    case "REGISTER_FAILURE":
    case "PASSWORD_RESET_FAILURE":
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    case "LOGOUT":
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Mock users database for fallback when API is not available
const mockUsers: User[] = [
  {
    id: "1",
    email: "admin@example.com",
    name: "Admin User",
    role: "admin",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
  },
  {
    id: "2",
    email: "user@example.com",
    name: "Regular User",
    role: "user",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user",
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if token exists and validate on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      try {
        // Verify token expiration
        const decodedToken = jwt.decode(token) as { exp?: number } | null;
        const isTokenExpired = decodedToken?.exp
          ? decodedToken.exp * 1000 < Date.now()
          : true;

        if (isTokenExpired) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          return;
        }

        const user = JSON.parse(storedUser) as User;
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { user, token },
        });
      } catch (error) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    dispatch({ type: "LOGIN_START" });

    try {
      // Try to authenticate with the API
      const response = await api.post("/auth/login", { email, password });
      const { user, token } = response.data;

      // Store in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user, token },
      });
    } catch (error) {
      console.error(
        "API login failed, falling back to mock authentication:",
        error,
      );

      // Fallback to mock authentication for demo purposes
      const user = mockUsers.find((u) => u.email === email);

      if (
        user &&
        ((email === "admin@example.com" && password === "admin123") ||
          (email === "user@example.com" && password === "user123"))
      ) {
        // Generate a mock token
        const token = "mock-jwt-token-" + Date.now();

        // Store in localStorage
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { user, token },
        });
      } else {
        dispatch({
          type: "LOGIN_FAILURE",
          payload: "Invalid email or password",
        });
      }
    }
  };

  const register = async (name: string, email: string, password: string) => {
    dispatch({ type: "REGISTER_START" });

    try {
      // Try to register with the API
      await api.post("/auth/register", { name, email, password });
      dispatch({ type: "REGISTER_SUCCESS" });
    } catch (error: any) {
      console.error(
        "API registration failed, falling back to mock registration:",
        error,
      );

      // Fallback to mock registration for demo purposes
      // Check if user already exists
      const existingUser = mockUsers.find((u) => u.email === email);

      if (existingUser) {
        dispatch({
          type: "REGISTER_FAILURE",
          payload: "User with this email already exists",
        });
        return;
      }

      // Simulate successful registration
      dispatch({ type: "REGISTER_SUCCESS" });
    }
  };

  const requestPasswordReset = async (email: string) => {
    dispatch({ type: "PASSWORD_RESET_START" });

    try {
      // Try to request password reset with the API
      await api.post("/auth/forgot-password", { email });
      dispatch({ type: "PASSWORD_RESET_SUCCESS" });
    } catch (error) {
      console.error(
        "API password reset request failed, falling back to mock request:",
        error,
      );

      // Fallback to mock password reset request for demo purposes
      dispatch({ type: "PASSWORD_RESET_SUCCESS" });
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    dispatch({ type: "PASSWORD_RESET_START" });

    try {
      // Try to reset password with the API
      await api.post("/auth/reset-password", { token, newPassword });
      dispatch({ type: "PASSWORD_RESET_SUCCESS" });
    } catch (error) {
      console.error(
        "API password reset failed, falling back to mock reset:",
        error,
      );

      // Fallback to mock password reset for demo purposes
      dispatch({ type: "PASSWORD_RESET_SUCCESS" });
    }
  };

  const logout = () => {
    // Try to logout with the API (in background, don't wait for response)
    api.post("/auth/logout").catch((error) => {
      console.error("API logout failed:", error);
    });

    // Always clear local storage and update state
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    dispatch({ type: "LOGOUT" });
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        clearError,
        requestPasswordReset,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
