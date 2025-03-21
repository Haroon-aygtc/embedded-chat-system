import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useAdmin } from "@/context/AdminContext";

interface UseAdminDataOptions<T> {
  fetchFn: () => Promise<T>;
  initialData?: T;
  dependencies?: any[];
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  errorMessage?: string;
  successMessage?: string;
  refreshDependency?: boolean;
}

function useAdminData<T>(options: UseAdminDataOptions<T>): {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} {
  const {
    fetchFn,
    initialData,
    dependencies = [],
    onSuccess,
    onError,
    errorMessage = "Failed to load data",
    successMessage,
    refreshDependency = true,
  } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { refreshTrigger } = useAdmin();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      setData(result);
      if (onSuccess) onSuccess(result);
      if (successMessage) {
        toast({
          title: "Success",
          description: successMessage,
        });
      }
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      if (onError) onError(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, onSuccess, onError, errorMessage, successMessage, toast]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, refreshDependency ? refreshTrigger : undefined]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refresh };
}

export default useAdminData;
