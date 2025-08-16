import React, { useState, createContext, useContext } from 'react';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}
interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}
interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const Tabs: React.FC<TabsProps> = ({ defaultValue = 'output', value, onValueChange, children, className = '' }) => {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultValue);
  const activeTab = value !== undefined ? value : internalActiveTab;
  
  const setActiveTab = (newValue: string) => {
    if (value === undefined) {
      setInternalActiveTab(newValue);
    }
    onValueChange?.(newValue);
  };
  
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<TabsListProps> = ({ className = '', children, ...props }) => {
  return (
    <div className={`flex border-b border-border ${className}`} {...props}>
      {children}
    </div>
  );
};

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, className = '', children, ...props }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');
  
  const { activeTab, setActiveTab } = context;
  const isActive = activeTab === value;
  
  return (
    <button
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        isActive 
          ? 'border-primary text-primary' 
          : 'border-transparent text-muted-foreground hover:text-foreground'
      } ${className}`}
      onClick={() => setActiveTab(value)}
      {...props}
    >
      {children}
    </button>
  );
};

export const TabsContent: React.FC<TabsContentProps> = ({ value, className = '', children, ...props }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');
  
  const { activeTab } = context;
  
  if (activeTab !== value) return null;
  
  return (
    <div className={`mt-4 ${className}`} {...props}>
      {children}
    </div>
  );
};