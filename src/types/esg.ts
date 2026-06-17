export type UserRole = 'admin' | 'company' | 'fandoro';

export type ESGCategory = 'E' | 'S' | 'G';

export type CoreLevel = 1 | 2;

export type RevenueStage = '0-50' | '50-100' | '100-500' | '500+';

// Industry type for company users (Fireside Category - Column D)
export type Industry = 
  | 'Beauty & Personal Care'
  | 'Fashion & Lifestyle'
  | 'Health & Wellness'
  | 'Food & Beverage'
  | 'Home & Décor'
  | 'Platform Enablers';

// KPI Industry type - used for KPI applicability (Internal Category - Column E)
export type KPIIndustry = 
  | 'F&B'
  | 'Beauty & Personal Care'
  | 'Fashion'
  | 'Devices'
  | 'Home'
  | 'Services'
  | 'Gaming/Platform/Others'
  | 'Offline Stores';

// Internal Category type for admin view (Column E - full list)
export type InternalCategory = 
  | 'BPC'
  | 'Devices (incl. Healthcare)'
  | 'F&B (incl. nutra health)'
  | 'Fashion'
  | 'Home'
  | 'Services (incl. Health)'
  | 'Gaming/Platform/Others'
  | 'BPC + F&B (incl. nutra health) + Services'
  | 'BPC + Platform'
  | 'Devices (incl. Healthcare) + Services'
  | 'Gaming/Platform/Others + Services';

export type Fund = 'Fund I' | 'Fund II' | 'Fund III' | 'Fund IV';

export type QCategory = 'Q' | 'Q1' | 'Q2' | 'Q3' | 'Early';

export type FiresideCategory = 
  | 'Beauty & Personal Care'
  | 'Fashion & Lifestyle'
  | 'Health & Wellness'
  | 'Food & Beverage'
  | 'Home & Décor'
  | 'Platform Enablers';

// Feature module types for KPI categorization
export type FeatureModule = 
  | 'environmental'
  | 'social'
  
  | 'governance'
  | 'marketing'
  | 'packaging'
  | 'packagingBasic'
  | 'packagingDetailed'
  | 'packagingTertiary'
  | 'primarySecondaryPackaging'
  | 'waterDetailed'
  | 'energyDetailed'
  | 'wasteDetailed'
  | 'incidentLog'
  | 'policies'
  
  | 'grievances'
  | 'certifications'
  | 'sourcingFulfillment'
  | 'operations'
  | 'governancePolicies'
  | 'sri';

// Helper function to map Fireside Category (Industry) to KPIIndustry values for filtering
// Each company's Fireside Category maps to one or more Internal Categories for KPI applicability
export const mapIndustryToKPIIndustries = (industry: Industry): KPIIndustry[] => {
  switch (industry) {
    case 'Beauty & Personal Care':
      return ['Beauty & Personal Care'];
    case 'Fashion & Lifestyle':
      return ['Fashion', 'Devices'];
    case 'Health & Wellness':
      return ['F&B', 'Services', 'Devices'];
    case 'Food & Beverage':
      return ['F&B'];
    case 'Home & Décor':
      return ['Home', 'Devices'];
    case 'Platform Enablers':
      return ['Gaming/Platform/Others', 'Services'];
    default:
      return [];
  }
};

export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface KPI {
  id: string;
  name: string;
  esg: ESGCategory;
  category: string;
  subCategory: string;
  metricType: string;
  period: 'Quarterly' | 'Annual';
  definition: string;
  frequency: string;
  revenueStages: RevenueStage[];
  industries: KPIIndustry[];
  coreLevel: CoreLevel;
  createdAt: string;
  quarter: string;
  year: number;
  // New fields for company-specific KPIs
  targetCompanies?: string[];
  featureModule?: FeatureModule;
}

// Contact info for founders
export interface ContactInfo {
  name: string;
  email?: string;
}

export interface Company {
  id: string;
  companyCode: string;      // LOGIN ID (Max 9-character Abbreviation)
  name: string;             // Legal company name (shown in profile)
  brand: string;            // Brand name (shown as display name post login)
  fund: Fund;
  fundCategory: string;     // CAT I, CAT II, etc.
  firesideCategory: FiresideCategory;
  internalCategory: InternalCategory;
  investmentStatus: string; // Invested, Exited, DD Ongoing, etc.
  fl?: string;              // Fireside Lead
  esgConnect?: ContactInfo;
  founder?: ContactInfo;
  coFounder?: ContactInfo;
  coFounder2?: ContactInfo;
  coFounder3?: ContactInfo;
  rationale?: string;
  revenueFY2425?: number | null;
  arrJAS2025?: number | null;
  industry: Industry;
  revenueStage: RevenueStage;
  logo?: string;
  contactEmail: string;
  loginPassword: string;
  createdAt: string;
  qCategory?: QCategory;
}

export interface KPIEntry {
  id: string;
  companyId: string;
  kpiId: string;
  value: string | number | boolean;
  quarter: string;
  year: number;
  previousValue?: string | number | boolean;
  submittedAt?: string;
  hasDeviation?: boolean;
}

export interface CompletionStatus {
  total: number;
  filled: number;
  core1Total: number;
  core1Filled: number;
  percentage: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId?: string;
}

// Support ticket status types
export type TicketStatus = 'open' | 'work_in_progress' | 'in_review' | 'resolved' | 'closed';
