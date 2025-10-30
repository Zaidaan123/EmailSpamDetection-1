'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { EmailForAnalysis } from '@/lib/types';

interface DashboardStateContextType {
  analyzeEmailFromInbox: EmailForAnalysis | null;
  setAnalyzeEmailFromInbox: (email: EmailForAnalysis) => void;
  clearAnalyzeEmailFromInbox: () => void;
}

const DashboardStateContext = createContext<DashboardStateContextType | undefined>(undefined);

export const DashboardStateProvider = ({ children }: { children: ReactNode }) => {
  const [analyzeEmailFromInbox, setAnalyzeEmail] = useState<EmailForAnalysis | null>(null);

  const setAnalyzeEmailFromInbox = useCallback((email: EmailForAnalysis) => {
    setAnalyzeEmail(email);
  }, []);

  const clearAnalyzeEmailFromInbox = useCallback(() => {
    setAnalyzeEmail(null);
  }, []);

  return (
    <DashboardStateContext.Provider value={{ analyzeEmailFromInbox, setAnalyzeEmailFromInbox, clearAnalyzeEmailFromInbox }}>
      {children}
    </DashboardStateContext.Provider>
  );
};

export const useDashboardState = () => {
  const context = useContext(DashboardStateContext);
  if (context === undefined) {
    throw new Error('useDashboardState must be used within a DashboardStateProvider');
  }
  return context;
};
