import React, { createContext, useState, useContext, ReactNode } from 'react';

interface YearFilterContextType {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  availableYears: number[];
}

const YearFilterContext = createContext<YearFilterContextType | undefined>(undefined);

export const YearFilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  // Generate a list of the last 4 years
  const availableYears = Array.from({ length: 4 }, (_, i) => currentYear - i);

  return (
    <YearFilterContext.Provider value={{ selectedYear, setSelectedYear, availableYears }}>
      {children}
    </YearFilterContext.Provider>
  );
};

export const useYearFilter = () => {
  const context = useContext(YearFilterContext);
  if (context === undefined) {
    throw new Error('useYearFilter must be used within a YearFilterProvider');
  }
  return context;
};
