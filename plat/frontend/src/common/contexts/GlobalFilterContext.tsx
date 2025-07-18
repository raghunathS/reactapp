import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface FilterOptions {
  Environment: string[];
  NarrowEnvironment: string[];
}

interface GlobalFilterContextType {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  availableYears: number[];
  selectedEnvironment: string;
  setSelectedEnvironment: (env: string) => void;
  availableEnvironments: string[];
  selectedNarrowEnvironment: string;
  setSelectedNarrowEnvironment: (env: string) => void;
  availableNarrowEnvironments: string[];
  loadingFilters: boolean;
}

const GlobalFilterContext = createContext<GlobalFilterContextType | undefined>(undefined);

export const GlobalFilterProvider = ({ children }: { children: ReactNode }) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [availableYears] = useState([currentYear, currentYear - 1, currentYear - 2]);

  const [selectedEnvironment, setSelectedEnvironment] = useState('All');
  const [availableEnvironments, setAvailableEnvironments] = useState<string[]>(['All']);
  const [selectedNarrowEnvironment, setSelectedNarrowEnvironment] = useState('All');
  const [availableNarrowEnvironments, setAvailableNarrowEnvironments] = useState<string[]>(['All']);
  const [loadingFilters, setLoadingFilters] = useState(true);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      setLoadingFilters(true);
      try {
        const response = await axios.get<FilterOptions>('/api/tickets-filter-options');
        setAvailableEnvironments(['All', ...response.data.Environment]);
        setAvailableNarrowEnvironments(['All', ...response.data.NarrowEnvironment]);
      } catch (error) {
        console.error('Error fetching filter options:', error);
      } finally {
        setLoadingFilters(false);
      }
    };

    fetchFilterOptions();
  }, []);

  const value = {
    selectedYear,
    setSelectedYear,
    availableYears,
    selectedEnvironment,
    setSelectedEnvironment,
    availableEnvironments,
    selectedNarrowEnvironment,
    setSelectedNarrowEnvironment,
    availableNarrowEnvironments,
    loadingFilters,
  };

  return (
    <GlobalFilterContext.Provider value={value}>
      {children}
    </GlobalFilterContext.Provider>
  );
};

export const useGlobalFilters = () => {
  const context = useContext(GlobalFilterContext);
  if (context === undefined) {
    throw new Error('useGlobalFilters must be used within a GlobalFilterProvider');
  }
  return context;
};
