import { useState, useEffect } from 'react';
import { Layout } from 'react-grid-layout';

const useDashboardPreferences = (storageKey: string, defaultLayout: Layout[]) => {
  const [layout, setLayout] = useState<Layout[]>(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : defaultLayout;
    } catch (error) {
      console.error('Error reading from localStorage', error);
      return defaultLayout;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(layout));
    } catch (error) {
      console.error('Error writing to localStorage', error);
    }
  }, [layout, storageKey]);

  return [layout, setLayout] as const;
};

export default useDashboardPreferences;
