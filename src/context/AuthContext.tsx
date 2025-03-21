import { createContext, useContext, useReducer, useEffect } from "react";
import { User, AuthState } from "@/types/auth";

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

// Mock users database for demo purposes
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
      // In a real app, this would be an API call to authenticate
      // For demo purposes, we'll use a mock authentication
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
    } catch (error) {
      dispatch({
        type: "LOGIN_FAILURE",
        payload: "Authentication failed. Please try again.",
      });
    }
  };

  const register = async (name: string, email: string, password: string) => {
    dispatch({ type: "REGISTER_START" });

    try {
      // In a real app, this would be an API call to register a new user
      // For demo purposes, we'll simulate a successful registration

      // Check if user already exists
      const existingUser = mockUsers.find((u) => u.email === email);

      if (existingUser) {
        dispatch({
          type: "REGISTER_FAILURE",
          payload: "User with this email already exists",
        });
        return;
      }

      // In a real app, we would add the user to the database here
      // For demo, we'll just simulate a successful registration

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      dispatch({ type: "REGISTER_SUCCESS" });
    } catch (error) {
      dispatch({
        type: "REGISTER_FAILURE",
        payload: "Registration failed. Please try again.",
      });
    }
  };

  const requestPasswordReset = async (email: string) => {
    dispatch({ type: "PASSWORD_RESET_START" });

    try {
      // In a real app, this would send a password reset email
      // For demo purposes, we'll simulate a successful request

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      dispatch({ type: "PASSWORD_RESET_SUCCESS" });
    } catch (error) {
      dispatch({
        type: "PASSWORD_RESET_FAILURE",
        payload: "Failed to send password reset email. Please try again.",
      });
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    dispatch({ type: "PASSWORD_RESET_START" });

    try {
      // In a real app, this would verify the token and update the password
      // For demo purposes, we'll simulate a successful password reset

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      dispatch({ type: "PASSWORD_RESET_SUCCESS" });
    } catch (error) {
      dispatch({
        type: "PASSWORD_RESET_FAILURE",
        payload:
          "Failed to reset password. The link may be invalid or expired.",
      });
    }
  };

  const logout = () => {
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
