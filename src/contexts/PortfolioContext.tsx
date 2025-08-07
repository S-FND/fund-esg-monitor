import React, { createContext, useContext, useState, ReactNode } from 'react';
import { portfolioCompanies as initialCompanies } from '@/features/edit-portfolio-company/portfolioCompanies';

export interface PortfolioCompany {
  id: number;
  name: string;
  type: string;
  sector: string;
  fundId: number;
  fundName: string;
  ceo: string;
  investmentDate: string;
  stage: string;
  shareholding: number;
  employees: {
    founders: { male: number; female: number; others: number };
    others: { male: number; female: number; others: number };
  };
  workers: {
    direct: { male: number; female: number; others: number };
    indirect: { male: number; female: number; others: number };
  };
  esgCategory: string;
  esgScore: number;
  boardObserverId?: string;
  isNewlyAdded?: boolean;
  dateAdded?: string;
}

interface PortfolioContextType {
  companies: PortfolioCompany[];
  newlyAddedCompanies: PortfolioCompany[];
  addCompany: (company: Omit<PortfolioCompany, 'id' | 'isNewlyAdded' | 'dateAdded'>) => void;
  approveCompany: (companyId: number, assignments: { fundId: number; fundName: string; boardObserverId: string }) => void;
  tempCompanyData: any;
  setTempCompanyData: (data: any) => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<PortfolioCompany[]>(initialCompanies);
  const [tempCompanyData, setTempCompanyData] = useState<any>(null);

  const addCompany = (companyData: Omit<PortfolioCompany, 'id' | 'isNewlyAdded' | 'dateAdded'>) => {
    const newCompany: PortfolioCompany = {
      ...companyData,
      id: Math.max(...companies.map(c => c.id)) + 1,
      isNewlyAdded: true,
      dateAdded: new Date().toISOString().split('T')[0]
    };
    
    setCompanies(prev => [...prev, newCompany]);
    setTempCompanyData(null); // Clear temp data after adding
  };

  const approveCompany = (companyId: number, assignments: { fundId: number; fundName: string; boardObserverId: string }) => {
    setCompanies(prev => 
      prev.map(company => 
        company.id === companyId
          ? {
              ...company,
              fundId: assignments.fundId,
              fundName: assignments.fundName,
              boardObserverId: assignments.boardObserverId,
              isNewlyAdded: false,
              dateAdded: undefined
            }
          : company
      )
    );
  };

  const newlyAddedCompanies = companies.filter(company => company.isNewlyAdded);

  return (
    <PortfolioContext.Provider value={{
      companies,
      newlyAddedCompanies,
      addCompany,
      approveCompany,
      tempCompanyData,
      setTempCompanyData
    }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}