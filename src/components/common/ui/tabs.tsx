"use client";

import React, { createContext, useContext, useState } from "react";

type TabsContextType = {
  value: string;
  onValueChange: (value: string) => void;
};

const TabsContext = createContext<TabsContextType | undefined>(undefined);

interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  defaultValue,
  value,
  onValueChange,
  children,
  className = "",
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue);

  const current = value !== undefined ? value : internalValue;
  const handleValueChange = onValueChange || setInternalValue;

  return (
    <TabsContext.Provider
      value={{ value: current, onValueChange: handleValueChange }}
    >
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export const TabsList: React.FC<TabsListProps> = ({
  children,
  className = "",
}) => {
  return <div className={`rounded-lg p-1 ${className}`}>{children}</div>;
};

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  value,
  children,
  className = "",
}) => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("TabsTrigger must be used within Tabs");
  }

  const isActive = context.value === value;

  return (
    <button
      className={`relative px-4 py-2.5 rounded-md font-medium transition-all duration-300 ${className} 
                ${
                  isActive
                    ? "text-white bg-gradient-to-r from-blue-600/30 to-purple-600/30 shadow-md"
                    : "text-gray-400 hover:text-gray-300 hover:bg-gradient-from/20"
                }`}
      onClick={() => context.onValueChange(value)}
      data-state={isActive ? "active" : "inactive"}
    >
      {isActive && (
        <span className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-md"></span>
      )}
      <div className="flex items-center justify-center space-x-2">
        {children}
      </div>
    </button>
  );
};

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const TabsContent: React.FC<TabsContentProps> = ({
  value,
  children,
  className = "",
}) => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("TabsContent must be used within Tabs");
  }

  if (context.value !== value) {
    return null;
  }

  return (
    <div className={`transition-all duration-300 animate-fadeIn ${className}`}>
      {children}
    </div>
  );
};
