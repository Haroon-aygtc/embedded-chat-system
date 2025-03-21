import React, { createContext, useContext, useState, ReactNode } from "react";

interface AdminContextType {
  activeSection: string;
  setActiveSection: (section: string) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const AdminContext = createContext<AdminContextType>({
  activeSection: "dashboard",
  setActiveSection: () => {},
  refreshTrigger: 0,
  triggerRefresh: () => {},
});

export const useAdmin = () => useContext(AdminContext);

interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider = ({ children }: AdminProviderProps) => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <AdminContext.Provider
      value={{
        activeSection,
        setActiveSection,
        refreshTrigger,
        triggerRefresh,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};
