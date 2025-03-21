import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContainerProps {
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  className?: string;
}

// Create a global store for toasts
type ToastStore = {
  toasts: Toast[];
  add: (toast: Omit<Toast, "id">) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const toastStore: ToastStore = {
  toasts: [],
  add: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    toastStore.toasts.push({ ...toast, id });
    // Notify subscribers
    toastSubscribers.forEach((callback) => callback([...toastStore.toasts]));
    return id;
  },
  remove: (id) => {
    toastStore.toasts = toastStore.toasts.filter((t) => t.id !== id);
    // Notify subscribers
    toastSubscribers.forEach((callback) => callback([...toastStore.toasts]));
  },
  clear: () => {
    toastStore.toasts = [];
    // Notify subscribers
    toastSubscribers.forEach((callback) => callback([]));
  },
};

type ToastSubscriber = (toasts: Toast[]) => void;
const toastSubscribers: ToastSubscriber[] = [];

// Hook to use the toast store
export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>(toastStore.toasts);

  useEffect(() => {
    const subscriber = (updatedToasts: Toast[]) => {
      setToasts([...updatedToasts]);
    };

    toastSubscribers.push(subscriber);
    return () => {
      const index = toastSubscribers.indexOf(subscriber);
      if (index > -1) {
        toastSubscribers.splice(index, 1);
      }
    };
  }, []);

  return {
    toasts,
    toast: (message: string, type: ToastType = "info", duration = 5000) => {
      return toastStore.add({ message, type, duration });
    },
    success: (message: string, duration = 5000) => {
      return toastStore.add({ message, type: "success", duration });
    },
    error: (message: string, duration = 5000) => {
      return toastStore.add({ message, type: "error", duration });
    },
    warning: (message: string, duration = 5000) => {
      return toastStore.add({ message, type: "warning", duration });
    },
    info: (message: string, duration = 5000) => {
      return toastStore.add({ message, type: "info", duration });
    },
    remove: toastStore.remove,
    clear: toastStore.clear,
  };
};

const ToastContainer: React.FC<ToastContainerProps> = ({
  position = "top-right",
  className,
}) => {
  const { toasts, remove } = useToast();

  const positionClasses = {
    "top-right": "top-0 right-0",
    "top-left": "top-0 left-0",
    "bottom-right": "bottom-0 right-0",
    "bottom-left": "bottom-0 left-0",
  };

  const getToastTypeClasses = (type: ToastType) => {
    switch (type) {
      case "success":
        return "bg-green-100 border-green-500 text-green-800";
      case "error":
        return "bg-red-100 border-red-500 text-red-800";
      case "warning":
        return "bg-yellow-100 border-yellow-500 text-yellow-800";
      case "info":
      default:
        return "bg-blue-100 border-blue-500 text-blue-800";
    }
  };

  useEffect(() => {
    // Set up auto-dismiss timers for toasts
    const timers = toasts.map((toast) => {
      if (toast.duration) {
        return setTimeout(() => {
          remove(toast.id);
        }, toast.duration);
      }
      return null;
    });

    return () => {
      timers.forEach((timer) => {
        if (timer) clearTimeout(timer);
      });
    };
  }, [toasts, remove]);

  return (
    <div
      className={cn(
        "fixed z-50 p-4 max-w-sm w-full flex flex-col gap-2",
        positionClasses[position],
        className,
      )}
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{
              opacity: 0,
              y: position.startsWith("top") ? -20 : 20,
              scale: 0.8,
            }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
            className={cn(
              "rounded-md border px-4 py-3 shadow-md relative",
              getToastTypeClasses(toast.type),
            )}
          >
            <button
              onClick={() => remove(toast.id)}
              className="absolute top-1 right-1 p-1 rounded-full hover:bg-black/5"
              aria-label="Close toast"
            >
              <X size={14} />
            </button>
            <p className="pr-5">{toast.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
