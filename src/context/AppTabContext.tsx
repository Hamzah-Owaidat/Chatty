"use client";
import React, { createContext, useContext, useState } from "react";

type Tab = "messages" | "calls" | "statuses";

interface AppTabContextProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const AppTabContext = createContext<AppTabContextProps | undefined>(undefined);

export const AppTabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<Tab>("messages");

  return (
    <AppTabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </AppTabContext.Provider>
  );
};

export const useAppTab = () => {
  const context = useContext(AppTabContext);
  if (!context) throw new Error("useAppTab must be used within AppTabProvider");
  return context;
};
