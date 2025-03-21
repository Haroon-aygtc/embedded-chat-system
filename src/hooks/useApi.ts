import { useState, useCallback } from "react";
import api from "@/services/axiosConfig";

interface ApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

interface ApiHook<T, P> extends ApiState<T> {
  execute: (params?: P) => Promise<T | null>;
  reset: () => void;
}

function useApi<T = any, P = any>(
  endpoint: string,
  method: "get" | "post" | "put" | "delete" = "get",
  initialData: T | null = null,
): ApiHook<T, P> {
  const [state, setState] = useState<ApiState<T>>({
    data: initialData,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(
    async (params?: P): Promise<T | null> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        let response;

        switch (method) {
          case "get":
            response = await api.get<T>(endpoint, { params });
            break;
          case "post":
            response = await api.post<T>(endpoint, params);
            break;
          case "put":
            response = await api.put<T>(endpoint, params);
            break;
          case "delete":
            response = await api.delete<T>(endpoint, { data: params });
            break;
          default:
            throw new Error(`Unsupported method: ${method}`);
        }

        setState({
          data: response.data,
          isLoading: false,
          error: null,
        });

        return response.data;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred";
        const apiError = new Error(errorMessage);

        setState({
          data: null,
          isLoading: false,
          error: apiError,
        });

        console.error(
          `API Error (${method.toUpperCase()} ${endpoint}):`,
          error,
        );
        return null;
      }
    },
    [endpoint, method],
  );

  const reset = useCallback(() => {
    setState({
      data: initialData,
      isLoading: false,
      error: null,
    });
  }, [initialData]);

  return {
    ...state,
    execute,
    reset,
  };
}

export default useApi;
