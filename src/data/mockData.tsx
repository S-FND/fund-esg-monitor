import { BarChart, LineChart, PieChart } from "lucide-react";

// ESG KPIs
export const esgKPIs = [
  { id: 1, category: "Environment", name: "Carbon Footprint", unit: "tCO2e", target: 5000, current: 6200, progress: 82 },
  { id: 2, category: "Environment", name: "Water Usage", unit: "kL", target: 20000, current: 18500, progress: 92 },
  { id: 3, category: "Environment", name: "Renewable Energy", unit: "%", target: 50, current: 32, progress: 64 },
  { id: 4, category: "Social", name: "Gender Diversity", unit: "%", target: 45, current: 38, progress: 84 },
  { id: 5, category: "Social", name: "Training Hours", unit: "hrs/employee", target: 40, current: 28, progress: 70 },
  { id: 6, category: "Governance", name: "Compliance Score", unit: "%", target: 100, current: 92, progress: 92 },
];

// SDG Goals
export const sdgGoals = [
  { id: 7, name: "No Poverty", number: 1, progress: 45 },
  { id: 8, name: "Zero Hunger", number: 2, progress: 38 },
  { id: 9, name: "Good Health and Well-being", number: 3, progress: 67 },
  { id: 10, name: "Quality Education", number: 4, progress: 82 },
  { id: 11, name: "Gender Equality", number: 5, progress: 73 },
  { id: 13, name: "Climate Action", number: 13, progress: 61 },
  { id: 14, name: "Life Below Water", number: 14, progress: 54 },
];

// GHG Emissions Data
export const emissionsByLocation = [
  { name: "Mumbai HQ", scope1: 1200, scope2: 3400, scope3: 5800 },
  { name: "Delhi Branch", scope1: 800, scope2: 2200, scope3: 3600 },
  { name: "Bangalore Tech", scope1: 300, scope2: 1800, scope3: 2400 },
  { name: "Chennai Ops", scope1: 500, scope2: 1400, scope3: 1900 },
];

export const emissionsYearly = [
  { year: 2018, emissions: 14800 },
  { year: 2019, emissions: 15600 },
  { year: 2020, emissions: 12400 },
  { year: 2021, emissions: 13200 },
  { year: 2022, emissions: 12800 },
  { year: 2023, emissions: 11200 },
];

// Learning Management System
export const trainingModules = [
  { id: 1, title: "ESG Fundamentals", duration: "2 hours", completion: 84, category: "ESG" },
  { id: 2, title: "Carbon Accounting Principles", duration: "3 hours", completion: 67, category: "GHG" },
  { id: 3, title: "Workplace Safety Essentials", duration: "1.5 hours", completion: 92, category: "EHS" },
  { id: 4, title: "BRSR Reporting Requirements", duration: "2.5 hours", completion: 58, category: "Reporting" },
  { id: 5, title: "Chemical Handling Safety", duration: "1 hour", completion: 76, category: "EHS" },
  { id: 6, title: "Sustainable Supply Chain", duration: "2 hours", completion: 45, category: "ESG" },
];

// Compliance Items
export const complianceItems = [
  { id: 1, name: "BRSR Submission", deadline: "2024-06-30", status: "On Track", category: "Reporting" },
  { id: 2, name: "Annual EHS Audit", deadline: "2024-05-15", status: "At Risk", category: "EHS" },
  { id: 3, name: "Companies Act Section 134", deadline: "2024-07-31", status: "On Track", category: "Legal" },
  { id: 4, name: "EPR Documentation", deadline: "2024-04-30", status: "Completed", category: "Environmental" },
  { id: 5, name: "Labour Law Compliance", deadline: "2024-03-31", status: "Completed", category: "Labor" },
];

// Navigation Items
export const mainNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { name: "ESG Management", href: "/esg", icon: "BarChart3" },
  { id: "GHG Accounting", href: "/ghg", icon: "LineChart" },
  { name: "Compliance", href: "/compliance", icon: "ClipboardCheck" },
  { name: "LMS", href: "/lms", icon: "GraduationCap" },
  { name: "EHS Trainings", href: "/ehs-trainings", icon: "Calendar" },
];

// Vendor Navigation Items
export const vendorNavItems = [
  { name: "Dashboard", href: "/vendor/dashboard", icon: "LayoutDashboard" },
  { name: "Available Trainings", href: "/vendor/trainings", icon: "Calendar" },
  { name: "My Bids", href: "/vendor/bids", icon: "FileText" },
  { name: "Profile", href: "/vendor/profile", icon: "User" },
];

// Dashboard Analytics Cards
export interface AnalyticsCard {
  title: string;
  value: string | number;
  change: number;
  icon: React.FC;
  description: string;
  color: string;
}

export const analyticsCards = [
  { 
    title: "ESG Score", 
    value: "78/100", 
    change: 5.2, 
    icon: BarChart, 
    description: "Overall ESG performance", 
    color: "bg-green-50 text-green-700" 
  },
  { 
    title: "Carbon Footprint", 
    value: "11,200 tCO2e", 
    change: -8.4, 
    icon: LineChart, 
    description: "Annual emissions", 
    color: "bg-blue-50 text-blue-700" 
  },
  { 
    title: "Compliance Rate", 
    value: "92%", 
    change: 2.1, 
    icon: PieChart, 
    description: "Regulatory adherence", 
    color: "bg-amber-50 text-amber-700" 
  },
];

// Personal GHG Calculator Parameters
export const personalGHGParams = [
  { id: "commute", label: "Daily Commute", options: [
    { value: "public", label: "Public Transport", co2Factor: 0.05 },
    { value: "car_petrol", label: "Car (Petrol)", co2Factor: 0.2 },
    { value: "car_diesel", label: "Car (Diesel)", co2Factor: 0.18 },
    { value: "two_wheeler", label: "Two Wheeler", co2Factor: 0.09 },
    { value: "walking", label: "Walking/Cycling", co2Factor: 0 },
  ]},
  { id: "electricity", label: "Monthly Electricity", unit: "kWh" },
  { id: "flights", label: "Flights per Year", unit: "trips" },
  { id: "diet", label: "Dietary Preference", options: [
    { value: "meat_daily", label: "Meat Daily", co2Factor: 3.3 },
    { value: "meat_weekly", label: "Meat Weekly", co2Factor: 2.5 },
    { value: "vegetarian", label: "Vegetarian", co2Factor: 1.7 },
    { value: "vegan", label: "Vegan", co2Factor: 1.5 },
  ]},
];

interface Attendee {
  name: string;
  email: string;
}

export interface EHSTraining {
  id: string;
  name: string;
  description: string;
  clientCompany: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  attendees: Attendee[];
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  trainingType: 'online' | 'offline';
  trainerName?: string;
  assignedVendorId?: string;
  bidOpen?: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  email: string;
  companyName: string;
  phone: string;
  address: string;
  specialties: string[];
  verified: boolean;
}

export interface TrainingBid {
  id: string;
  trainingId: string;
  vendorId: string;
  vendorName: string;
  contentFee: number;
  trainingFee: number;
  travelFee: number;
  totalFee: number;
  submittedDate: string;
  status: 'pending' | 'accepted' | 'rejected';
  trainerResumes: {
    trainerId: string;
    name: string;
    fileUrl: string;
  }[];
}

const vendors: Vendor[] = [
  {
    id: 'vendor-1',
    name: 'John Clark',
    email: 'vendor1@example.com',
    companyName: 'SafetyFirst Training Ltd.',
    phone: '+1-555-111-2233',
    address: '123 Training Ave, Safety City',
    specialties: ['Chemical Handling', 'Fire Safety', 'Emergency Response'],
    verified: true
  },
  {
    id: 'vendor-2',
    name: 'Sarah Johnson',
    email: 'vendor2@example.com',
    companyName: 'EHS Excellence Corp',
    phone: '+1-555-444-5566',
    address: '456 Compliance Road, Quality Town',
    specialties: ['Workplace Safety', 'Environmental Compliance', 'Risk Assessment'],
    verified: true
  }
];

const trainingBids: TrainingBid[] = [
  {
    id: 'bid-1',
    trainingId: '2',
    vendorId: 'vendor-1',
    vendorName: 'SafetyFirst Training Ltd.',
    contentFee: 1500,
    trainingFee: 2500,
    travelFee: 800,
    totalFee: 4800,
    submittedDate: '2025-04-01',
    status: 'pending',
    trainerResumes: [
      {
        trainerId: 'trainer-1',
        name: 'Robert Smith',
        fileUrl: '/resumes/robert-smith.pdf'
      }
    ]
  }
];

const ehsTrainings: EHSTraining[] = [
  {
    id: '1',
    name: 'Workplace Safety Training',
    description: 'Comprehensive training on workplace safety protocols, including emergency procedures and hazard identification.',
    clientCompany: 'ABC Corp',
    date: '2025-04-15',
    time: '10:00 AM',
    duration: '3 hours',
    location: 'Client HQ, New York',
    status: 'scheduled',
    trainingType: 'offline',
    bidOpen: true,
    attendees: [
      { name: 'John Smith', email: 'john.smith@abccorp.com' },
      { name: 'Jane Doe', email: 'jane.doe@abccorp.com' },
      { name: 'Robert Johnson', email: 'robert.j@abccorp.com' },
    ]
  },
  {
    id: '2',
    name: 'Chemical Handling',
    description: 'Training on proper handling, storage, and disposal of hazardous chemicals in industrial settings.',
    clientCompany: 'XYZ Industries',
    date: '2025-04-22',
    time: '9:30 AM',
    duration: '4 hours',
    location: 'XYZ Manufacturing Plant',
    status: 'scheduled',
    trainingType: 'offline',
    bidOpen: true,
    attendees: [
      { name: 'Michael Brown', email: 'm.brown@xyzind.com' },
      { name: 'Sarah Wilson', email: 's.wilson@xyzind.com' },
      { name: 'David Lee', email: 'd.lee@xyzind.com' },
      { name: 'Emily Chen', email: 'e.chen@xyzind.com' },
    ]
  },
  {
    id: '3',
    name: 'Environmental Compliance',
    description: 'Overview of environmental regulations and compliance requirements for manufacturing operations.',
    clientCompany: 'GreenTech Solutions',
    date: '2025-05-05',
    time: '1:00 PM',
    duration: '2 hours',
    location: 'Virtual Session',
    status: 'scheduled',
    trainingType: 'online',
    bidOpen: true,
    attendees: [
      { name: 'Thomas Green', email: 't.green@greentech.com' },
      { name: 'Lisa Park', email: 'l.park@greentech.com' },
    ]
  },
  {
    id: '4',
    name: 'Fire Safety Training',
    description: 'Training on fire prevention, detection, and emergency response procedures.',
    clientCompany: 'Urban Development Corp',
    date: '2025-04-10',
    time: '11:00 AM',
    duration: '2.5 hours',
    location: 'Urban Development HQ',
    status: 'completed',
    trainingType: 'offline',
    assignedVendorId: 'vendor-1',
    bidOpen: false,
    attendees: [
      { name: 'Mark Taylor', email: 'm.taylor@udc.com' },
      { name: 'Anna Martin', email: 'a.martin@udc.com' },
      { name: 'Kevin White', email: 'k.white@udc.com' },
    ]
  },
  {
    id: '5',
    name: 'Machine Operator Safety',
    description: 'Training on safe operation procedures for industrial machinery and equipment.',
    clientCompany: 'Precision Manufacturing Inc',
    date: '2025-05-12',
    time: '9:00 AM',
    duration: '5 hours',
    location: 'Precision Factory, Chicago',
    status: 'scheduled',
    trainingType: 'offline',
    assignedVendorId: 'vendor-2',
    bidOpen: false,
    attendees: [
      { name: 'Confidential', email: 'employee1@precision.com' },
      { name: 'Confidential', email: 'employee2@precision.com' },
      { name: 'Confidential', email: 'employee3@precision.com' },
      { name: 'Confidential', email: 'employee4@precision.com' },
      { name: 'Confidential', email: 'employee5@precision.com' },
    ]
  },
];


export const fetchEHSTrainings = async (): Promise<EHSTraining[]> => {
  // Simulating API request delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  return ehsTrainings;
};

export const fetchEHSTrainingById = async (id: string): Promise<EHSTraining | undefined> => {
  // Simulating API request delay
  await new Promise(resolve => setTimeout(resolve, 800));
  return ehsTrainings.find(training => training.id === id);
};

export const fetchVendorProfile = async (vendorId: string): Promise<Vendor | undefined> => {
  // Simulating API request delay
  await new Promise(resolve => setTimeout(resolve, 800));
  return vendors.find(vendor => vendor.id === vendorId);
};

export const fetchTrainingBids = async (trainingId?: string, vendorId?: string): Promise<TrainingBid[]> => {
  // Simulating API request delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  let filteredBids = [...trainingBids];
  
  if (trainingId) {
    filteredBids = filteredBids.filter(bid => bid.trainingId === trainingId);
  }
  
  if (vendorId) {
    filteredBids = filteredBids.filter(bid => bid.vendorId === vendorId);
  }
  
  return filteredBids;
};

export const fetchVendorTrainings = async (vendorId: string): Promise<EHSTraining[]> => {
  // Simulating API request delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return trainings that are either:
  // 1. Open for bidding (bidOpen is true) - for all vendors
  // 2. Assigned to this specific vendor
  return ehsTrainings.filter(training => (
    (training.bidOpen === true) || (training.assignedVendorId === vendorId)
  ));
};







import { Company, KPI, KPIEntry, User, CompletionStatus, Industry, KPIIndustry, RevenueStage, CoreLevel, ESGCategory, ContactInfo } from '@/types/esg';

// Globally excluded company IDs (must match GLOBAL_EXCLUSIONS in companyExclusions.ts)
const EXCLUDED_COMPANY_IDS = new Set(['company-1', 'company-26', 'company-15', 'company-5']);

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@firesideventures.com',
    name: 'Tarak Doshi',
    role: 'admin',
  },
  {
    id: '2',
    email: 'cfo@naturaglow.com',
    name: 'Rahul Verma',
    role: 'company',
    companyId: 'company-1',
  },
  {
    id: '3',
    email: 'support@fandoro.com',
    name: 'Fandoro Admin',
    role: 'fandoro',
  },
];

// Helper to determine revenue stage based on ARR (JAS 2025)
const getRevenueStageFromARR = (arr: number | null): RevenueStage => {
  if (arr === null || arr <= 50) return '0-50';
  if (arr <= 100) return '50-100';
  if (arr <= 500) return '100-500';
  return '500+';
};

// Pre-computed static passwords for each company (ensures consistency)
const COMPANY_PASSWORDS: Record<string, string> = {
  'YOGABARS': 'YOGKp7@Fs',
  'VAHDAM': 'VAHMx3#Qa',
  'TAE': 'TAENv8$Wd',
  'TRAYA': 'TRARz5&Jc',
  'WELLBEING': 'WELBt2*Le',
  'BAKERSDZ': 'BAKHf9!Yg',
  'GYNOVEDA': 'GYNSc4@Np',
  'SUPTAILS': 'SUPVw6#Tk',
  'NATHABIT': 'NATQm1$Rb',
  'PILGRIM': 'PILXd7&Uc',
  'SLEEPCO': 'SLEJp3*Af',
  'SMYTTEN': 'SMYLk8!Sw',
  'FSLIFE': 'FSLYn5@Hc',
  'SLURRPFM': 'SLUGz2#Mv',
  'FITTERFLY': 'FITCf9$Ek',
  'FRUBON': 'FRUWt4&Jb',
  'GOODBUG': 'GOORs1*Qn',
  'RIPPLR': 'RIPPm6!Yd',
  'PLUMGOOD': 'PLUAx7@Lf',
  'ATOMBERG': 'ATODc3#Vg',
  'MCAFFEINE': 'MCAUw8$Zk',
  'SLAMIT': 'SLAOe5&Hj',
  'DRSHETH': 'DRSKn2*Mc',
  'DAMENSCH': 'DAMFg9!Ws',
  'SAMOSA': 'SAMTx4@Pr',
  'ARATA': 'ARABh1#Qs',
  'SNACKEXP': 'SNAYc6$Nn',
  'BEMINIMLS': 'BEMLm3&Rd',
  'BLUEEVRYN': 'BLUVj8*Aw',
  'TACOBELL': 'TACSk5!Ep',
  'INDIEBRND': 'INDNq7@Ct',
  'NAPPA': 'NAPZm2#Fb',
  'BOMBAE': 'BOMWr9$Gy',
  'JUICY': 'JUIPx4&Jt',
  'SNITCH': 'SNIHd1*Ks',
  'LIGHTHAUS': 'LIGEy6!Qw',
  'FLATHEAD': 'FLAAc8@Mv',
  'OATEY': 'OATTf3#Lr',
  'STASHFIN': 'STAGc5$Np',
  'SAMOSAPRTY': 'SAMBn7&Xc',
  'AUDIOVISTA': 'AUDJs2*Wd',
  'UBON': 'UBOMu9!Yk',
  'ELVER': 'ELVQh4@Sf',
  // Demo company - not a real portfolio company
  'DEMOCORP': 'DEMOpass123',
};

// Generate unique password for each company based on company code
export const generateUniquePassword = (companyCode: string, index?: number): string => {
  // Return pre-computed password if available
  if (COMPANY_PASSWORDS[companyCode]) {
    return COMPANY_PASSWORDS[companyCode];
  }
  // Fallback for new companies or password reset
  const prefix = companyCode.substring(0, 3).toUpperCase();
  const suffixes = [
    'Kp7@Fs', 'Mx3#Qa', 'Nv8$Wd', 'Rz5&Jc', 'Bt2*Le', 'Hf9!Yg', 'Sc4@Np',
    'Vw6#Tk', 'Qm1$Rb', 'Xd7&Uc', 'Jp3*Af', 'Lk8!Sw', 'Yn5@Hc', 'Gz2#Mv',
    'Cf9$Ek', 'Wt4&Jb', 'Rs1*Qn', 'Pm6!Yd', 'Ax7@Lf', 'Dc3#Vg', 'Uw8$Zk',
    'Oe5&Hj', 'Kn2*Mc', 'Fg9!Ws', 'Tx4@Pr', 'Bh1#Qs', 'Yc6$Nn', 'Lm3&Rd',
    'Vj8*Aw', 'Sk5!Ep', 'Nq7@Ct', 'Zm2#Fb', 'Wr9$Gy', 'Px4&Jt', 'Hd1*Ks',
    'Ey6!Qw', 'Ac8@Mv', 'Tf3#Lr', 'Gc5$Np', 'Bn7&Xc', 'Js2*Wd', 'Mu9!Yk',
    'Qh4@Sf'
  ];
  const idx = index ?? Math.floor(Math.random() * suffixes.length);
  return `${prefix}${suffixes[idx % suffixes.length]}`;
};

// Legacy standard password for reference
const STANDARD_PASSWORD = 'Q4MIS@FS';

// Helper to parse contact info from "Name <email>" format
const parseContact = (str: string | null | undefined): ContactInfo | undefined => {
  if (!str) return undefined;
  const match = str.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].trim(), email: match[2].trim() };
  }
  return { name: str.trim() };
};

// Map Excel Master Category to FiresideCategory
const mapMasterCategory = (category: string): Industry => {
  switch (category) {
    case 'Beauty & Personal Care':
      return 'Beauty & Personal Care';
    case 'Food & Beverage':
      return 'Food & Beverage';
    case 'HealthTech & Wellness':
      return 'Health & Wellness';
    case 'Fashion & Lifestyle':
      return 'Fashion & Lifestyle';
    case 'Consumer Durables & Home':
      return 'Home & Décor';
    case 'PetCare, Kids & Family':
      return 'Fashion & Lifestyle';
    case 'Sports, Gaming & Digital Entertainment':
      return 'Platform Enablers';
    default:
      return 'Fashion & Lifestyle';
  }
};

// Map to InternalCategory
const mapToInternalCategory = (category: string): string => {
  switch (category) {
    case 'Beauty & Personal Care':
      return 'BPC';
    case 'Food & Beverage':
      return 'F&B (incl. nutra health)';
    case 'HealthTech & Wellness':
      return 'Services (incl. Health)';
    case 'Fashion & Lifestyle':
      return 'Fashion';
    case 'Consumer Durables & Home':
      return 'Home';
    case 'PetCare, Kids & Family':
      return 'Fashion';
    case 'Sports, Gaming & Digital Entertainment':
      return 'Gaming/Platform/Others';
    default:
      return 'Fashion';
  }
};

// Parse fund from "Fund I, CAT I" format
const parseFund = (fundStr: string): { fund: 'Fund I' | 'Fund II' | 'Fund III' | 'Fund IV', category: string } => {
  const parts = fundStr.split(',').map(s => s.trim());
  let fund: 'Fund I' | 'Fund II' | 'Fund III' | 'Fund IV' = 'Fund I';
  if (parts[0].includes('II') && !parts[0].includes('III')) fund = 'Fund II';
  else if (parts[0].includes('III')) fund = 'Fund III';
  else if (parts[0].includes('IV')) fund = 'Fund IV';
  const category = parts[1] || 'CAT I';
  return { fund, category };
};

// Companies from Excel Sheet (Page 1 - Invested companies only)
const _allMockCompanies: Company[] = [
  // 1. Yoga Bars
  {
    id: 'company-1',
    companyCode: 'YOGABARS',
    name: 'Sproutlife Foods Pvt. Ltd.',
    brand: 'Yoga Bars',
    fund: 'Fund I',
    fundCategory: 'CAT I',
    firesideCategory: 'Food & Beverage',
    internalCategory: 'F&B (incl. nutra health)',
    investmentStatus: 'Invested',
    fl: 'Prayag Mohanty',
    esgConnect: parseContact('Priyal Amin <priyal@yogabars.in>'),
    founder: parseContact('Suhasini Sampath <suhasini@yogabars.in>'),
    coFounder: parseContact('Anindita Sampath <anindita@yogabars.in>'),
    coFounder2: parseContact('Aditya Anand <aditya@yogabars.in>'),
    industry: 'Food & Beverage',
    revenueStage: '0-50',
    contactEmail: 'priyal@yogabars.in',
    loginPassword: generateUniquePassword('YOGABARS', 0),
    createdAt: '2020-01-01',
  },
  {
    id: 'company-2',
    companyCode: 'VAHDAM',
    name: 'Vahdam Teas Private Limited',
    brand: 'Vahdam',
    fund: 'Fund I',
    fundCategory: 'CAT I',
    firesideCategory: 'Food & Beverage',
    internalCategory: 'F&B (incl. nutra health)',
    investmentStatus: 'Invested',
    fl: 'Swati Kulkarni',
    esgConnect: parseContact('Kalpesh Tiwari <kalpesh@vahdam.com>'),
    founder: parseContact('Bala Sarda <bala@vahdamteas.com>'),
    industry: 'Food & Beverage',
    revenueStage: '100-500',
    contactEmail: 'kalpesh@vahdam.com',
    loginPassword: generateUniquePassword('VAHDAM', 1),
    createdAt: '2020-01-01',
  },
  {
    id: 'company-3',
    companyCode: 'TAE',
    name: 'Transformative Learning Solutions Private Limited',
    brand: 'The Ayurveda Experience (TAE)',
    fund: 'Fund I',
    fundCategory: 'CAT I',
    firesideCategory: 'Beauty & Personal Care',
    internalCategory: 'BPC',
    investmentStatus: 'Invested',
    fl: 'Swati Kulkarni',
    esgConnect: parseContact('Ravi Tripathi <ravi@transformative.in>'),
    founder: parseContact('Rishabh Chopra <rishabh@transformative.in>'),
    industry: 'Beauty & Personal Care',
    revenueStage: '100-500',
    contactEmail: 'ravi@transformative.in',
    loginPassword: generateUniquePassword('TAE', 2),
    createdAt: '2020-01-01',
  },
  // 4. Traya
  {
    id: 'company-4',
    companyCode: 'TRAYA',
    name: 'Tatvartha Health Private Limited',
    brand: 'Traya',
    fund: 'Fund II',
    fundCategory: 'CAT I',
    firesideCategory: 'Health & Wellness',
    internalCategory: 'BPC + F&B (incl. nutra health) + Services',
    investmentStatus: 'Invested',
    fl: 'Nandika Pradeep',
    esgConnect: parseContact('Tejas Jobalia <tejas@traya.health>'),
    founder: parseContact('Altaf Saiyed <altaf@traya.health>'),
    coFounder: parseContact('Saloni Anand <saloni@traya.health>'),
    industry: 'Health & Wellness',
    revenueStage: '500+',
    contactEmail: 'tejas@traya.health',
    loginPassword: generateUniquePassword('TRAYA', 3),
    createdAt: '2021-01-01',
  },
  // 5. Wellbeing Nutrition
  {
    id: 'company-5',
    companyCode: 'WELLBEING',
    name: 'Nutritionalab Private Limited',
    brand: 'Wellbeing Nutrition',
    fund: 'Fund II',
    fundCategory: 'CAT I',
    firesideCategory: 'Health & Wellness',
    internalCategory: 'F&B (incl. nutra health)',
    investmentStatus: 'Invested',
    fl: 'Prayag Mohanty',
    esgConnect: parseContact('Ameya <Ameya@wellbeingnutrition.com>'),
    founder: parseContact('Avnish Ashok Chhabria <avnish@wellbeingnutrition.com>'),
    coFounder: parseContact('Saurabh Kapoor <saurabh@wellbeingnutrition.com>'),
    industry: 'Health & Wellness',
    revenueStage: '100-500',
    contactEmail: 'Ameya@wellbeingnutrition.com',
    loginPassword: generateUniquePassword('WELLBEING', 4),
    createdAt: '2021-01-01',
  },
  // 6. The Bakers Dozen (TBD)
  {
    id: 'company-6',
    companyCode: 'BAKERSDZ',
    name: 'Mimansa Industries Private Limited',
    brand: 'The Bakers Dozen (TBD)',
    fund: 'Fund II',
    fundCategory: 'CAT I',
    firesideCategory: 'Food & Beverage',
    internalCategory: 'F&B (incl. nutra health)',
    investmentStatus: 'Invested',
    fl: 'Prayag Mohanty',
    esgConnect: parseContact('Aditi Handa <aditi@thebakersdozen.in>'),
    founder: parseContact('Aditi Handa <aditi@thebakersdozen.in>'),
    coFounder: parseContact('Sneh Jain <sneh@thebakersdozen.in>'),
    industry: 'Food & Beverage',
    revenueStage: '100-500',
    contactEmail: 'aditi@thebakersdozen.in',
    loginPassword: generateUniquePassword('BAKERSDZ', 5),
    createdAt: '2021-01-01',
  },
  // 7. Gynoveda
  {
    id: 'company-7',
    companyCode: 'GYNOVEDA',
    name: 'Gynoveda Femtech Pvt. Ltd.',
    brand: 'Gynoveda',
    fund: 'Fund II',
    fundCategory: 'CAT I',
    firesideCategory: 'Health & Wellness',
    internalCategory: 'F&B (incl. nutra health)',
    investmentStatus: 'Invested',
    fl: 'Swati Kulkarni',
    esgConnect: parseContact('Ankit Shah <ankit@gynoveda.in>'),
    founder: parseContact('Rachana Gupta <rachana@gynoveda.com>'),
    coFounder: parseContact('Vishal Gupta <vishal@gynoveda.com>'),
    coFounder2: parseContact('Dr. Aarati Patil <aarati@gynoveda.in>'),
    industry: 'Health & Wellness',
    revenueStage: '100-500',
    contactEmail: 'ankit@gynoveda.in',
    loginPassword: generateUniquePassword('GYNOVEDA', 6),
    createdAt: '2021-01-01',
  },
  // 8. Supertails
  {
    id: 'company-8',
    companyCode: 'SUPTAILS',
    name: 'Petfully Yours Private Limited',
    brand: 'Supertails',
    fund: 'Fund II',
    fundCategory: 'CAT I',
    firesideCategory: 'Fashion & Lifestyle',
    internalCategory: 'Fashion',
    investmentStatus: 'Invested',
    fl: 'Prayag Mohanty',
    esgConnect: parseContact('Gaurav Singhal <gaurav.slovespets@supertails.com>'),
    founder: parseContact('Aman Tekriwal <amanlovespets@supertails.com>'),
    coFounder: parseContact('Varun Sadana <varunlovespets@supertails.com>'),
    coFounder2: parseContact('Vineet Khanna <vineetlovespets@supertails.com>'),
    industry: 'Fashion & Lifestyle',
    revenueStage: '100-500',
    contactEmail: 'gaurav.slovespets@supertails.com',
    loginPassword: generateUniquePassword('SUPTAILS', 7),
    createdAt: '2021-01-01',
  },
  // 9. Nathabit
  {
    id: 'company-9',
    companyCode: 'NATHABIT',
    name: 'Naturohabit Private Limited',
    brand: 'Nathabit',
    fund: 'Fund II',
    fundCategory: 'CAT I',
    firesideCategory: 'Beauty & Personal Care',
    internalCategory: 'BPC',
    investmentStatus: 'Invested',
    fl: 'Shuchi Pandya',
    esgConnect: parseContact('Riya Agarwal <riya.agarwal@nathabit.in>'),
    founder: parseContact('Swagatika Das <swagatika@nathabit.in>'),
    coFounder: parseContact('Gaurav Agarwal <gaurav@nathabit.in>'),
    industry: 'Beauty & Personal Care',
    revenueStage: '100-500',
    contactEmail: 'riya.agarwal@nathabit.in',
    loginPassword: generateUniquePassword('NATHABIT', 8),
    createdAt: '2021-01-01',
  },
  // 10. Pilgrim
  {
    id: 'company-10',
    companyCode: 'PILGRIM',
    name: 'Heavenly Secrets Private Limited',
    brand: 'Pilgrim',
    fund: 'Fund II',
    fundCategory: 'CAT I',
    firesideCategory: 'Beauty & Personal Care',
    internalCategory: 'BPC',
    investmentStatus: 'Invested',
    fl: 'Swati Kulkarni',
    esgConnect: parseContact('Anirudh Likhite <anirudh@discoverpilgrim.com>'),
    founder: parseContact('Anurag Kedia <anurag@discoverpilgrim.com>'),
    coFounder: parseContact('Gagandeep Makker <gagan@discoverpilgrim.com>'),
    industry: 'Beauty & Personal Care',
    revenueStage: '500+',
    contactEmail: 'anirudh@discoverpilgrim.com',
    loginPassword: generateUniquePassword('PILGRIM', 9),
    createdAt: '2021-01-01',
  },
  // 11. The Sleep Co
  {
    id: 'company-11',
    companyCode: 'SLEEPCO',
    name: 'Comfort Grid Technologies Pvt Ltd',
    brand: 'The Sleep Co',
    fund: 'Fund II',
    fundCategory: 'CAT I',
    firesideCategory: 'Home & Décor',
    internalCategory: 'Fashion',
    investmentStatus: 'Invested',
    fl: 'Swati Kulkarni',
    esgConnect: parseContact('Kanchan Jhaveri <kanchan@thesleepcompany.in>'),
    founder: parseContact('Priyanka Salot <priyanka@thesleepcompany.in>'),
    coFounder: parseContact('Harshil Salot <harshil@thesleepcompany.in>'),
    industry: 'Home & Décor',
    revenueStage: '500+',
    contactEmail: 'kanchan@thesleepcompany.in',
    loginPassword: generateUniquePassword('SLEEPCO', 10),
    createdAt: '2021-01-01',
  },
  // 12. Smytten
  {
    id: 'company-12',
    companyCode: 'SMYTTEN',
    name: 'Surfboat Solutions Private Limited',
    brand: 'Smytten',
    fund: 'Fund II',
    fundCategory: 'CAT I',
    firesideCategory: 'Beauty & Personal Care',
    internalCategory: 'BPC + Platform',
    investmentStatus: 'Invested',
    fl: 'Prayag Mohanty',
    esgConnect: parseContact('Investor Relations <investorrelations@smytten.com>'),
    founder: parseContact('Swagata Sarangi <swagat@smytten.com>'),
    coFounder: parseContact('Siddhartha Nangia <sid@smytten.com>'),
    industry: 'Platform Enablers',
    revenueStage: '100-500',
    contactEmail: 'investorrelations@smytten.com',
    loginPassword: generateUniquePassword('SMYTTEN', 11),
    createdAt: '2021-01-01',
  },
  // 13. FS Life
  {
    id: 'company-13',
    companyCode: 'FSLIFE',
    name: 'Fable Street Lifestyle Solutions Pvt. Ltd.',
    brand: 'FS Life',
    fund: 'Fund II',
    fundCategory: 'CAT I',
    firesideCategory: 'Fashion & Lifestyle',
    internalCategory: 'Fashion',
    investmentStatus: 'Invested',
    fl: 'Shuchi Pandya',
    esgConnect: parseContact('Anisha Jayarajan <anisha.jayarajan@fablestreet.com>'),
    founder: parseContact('Ayushi Gudwani <ayushi@fablestreet.com>'),
    coFounder: parseContact('Adarsh Sharma <adarsh.sharma@fablestreet.com>'),
    industry: 'Fashion & Lifestyle',
    revenueStage: '100-500',
    contactEmail: 'anisha.jayarajan@fablestreet.com',
    loginPassword: generateUniquePassword('FSLIFE', 12),
    createdAt: '2021-01-01',
  },
  // 14. Slurrp Farm
  {
    id: 'company-14',
    companyCode: 'SLURRPFM',
    name: 'Wholsum Foods Private Limited',
    brand: 'Slurrp Farm',
    fund: 'Fund II',
    fundCategory: 'CAT I',
    firesideCategory: 'Food & Beverage',
    internalCategory: 'F&B (incl. nutra health)',
    investmentStatus: 'Invested',
    fl: 'Prayag Mohanty',
    esgConnect: parseContact('Simran Singhani <simran.singhani@wholsumfoods.com>'),
    founder: parseContact('Shauravi Malik <shauravi.malik@wholsumfoods.com>'),
    coFounder: parseContact('Meghana Narayan <meghana.narayan@wholsumfoods.com>'),
    industry: 'Food & Beverage',
    revenueStage: '100-500',
    contactEmail: 'simran.singhani@wholsumfoods.com',
    loginPassword: generateUniquePassword('SLURRPFM', 13),
    createdAt: '2021-01-01',
  },
  // 15. Fitterfly
  {
    id: 'company-15',
    companyCode: 'FITTERFLY',
    name: 'Fitterfly Healthtech Pvt ltd.',
    brand: 'Fitterfly',
    fund: 'Fund II',
    fundCategory: 'CAT I',
    firesideCategory: 'Health & Wellness',
    internalCategory: 'Devices (incl. Healthcare) + Services',
    investmentStatus: 'Invested',
    fl: 'Ankur Khaitan',
    esgConnect: parseContact('Shailesh Gupta <shailesh@fitterfly.com>'),
    founder: parseContact('Arbinder Singal <arbinder@fitterfly.com>'),
    coFounder: parseContact('Shailesh Gupta <shailesh@fitterfly.com>'),
    industry: 'Health & Wellness',
    revenueStage: '0-50',
    contactEmail: 'shailesh@fitterfly.com',
    loginPassword: generateUniquePassword('FITTERFLY', 14),
    createdAt: '2021-01-01',
  },
  // 16. Frubon
  {
    id: 'company-16',
    companyCode: 'FRUBON',
    name: 'DEV MILK FOODS PRIVATE LIMITED',
    brand: 'Frubon',
    fund: 'Fund III',
    fundCategory: 'CAT II',
    firesideCategory: 'Food & Beverage',
    internalCategory: 'F&B (incl. nutra health)',
    investmentStatus: 'Invested',
    fl: 'Ankita Balotia',
    esgConnect: parseContact('Prince Agrawal <prince.agrawal@devmilkfoods.com>'),
    founder: parseContact('Rahul Verma <rahul.verma@devmilkfoods.com>'),
    coFounder: parseContact('Rohit Verma <rohit.verma@devmilkfoods.com>'),
    industry: 'Food & Beverage',
    revenueStage: '100-500',
    contactEmail: 'prince.agrawal@devmilkfoods.com',
    loginPassword: generateUniquePassword('FRUBON', 15),
    createdAt: '2022-01-01',
  },
  // 17. The Good Bug (TGB)
  {
    id: 'company-17',
    companyCode: 'GOODBUG',
    name: 'Seven Turns Private Limited',
    brand: 'The Good Bug (TGB)',
    fund: 'Fund III',
    fundCategory: 'CAT II',
    firesideCategory: 'Health & Wellness',
    internalCategory: 'F&B (incl. nutra health)',
    investmentStatus: 'Invested',
    fl: 'Ankur Khaitan',
    esgConnect: parseContact('Mahesh Tapadiya <mahesh@seventurns.in>'),
    founder: parseContact('Keshav Biyani <keshav@seventurns.in>'),
    coFounder: parseContact('Prabhu Karthikeyan <prabhu@seventurns.in>'),
    industry: 'Health & Wellness',
    revenueStage: '100-500',
    contactEmail: 'mahesh@seventurns.in',
    loginPassword: generateUniquePassword('GOODBUG', 16),
    createdAt: '2022-01-01',
  },
  // 18. Ripplr
  {
    id: 'company-18',
    companyCode: 'RIPPLR',
    name: 'Intelligent Retail Private Limited',
    brand: 'Ripplr',
    fund: 'Fund III',
    fundCategory: 'CAT II',
    firesideCategory: 'Platform Enablers',
    internalCategory: 'Gaming/Platform/Others',
    investmentStatus: 'Invested',
    fl: 'Ankur Khaitan',
    esgConnect: parseContact('Shreyans Bhansali <Shreyans@ripplr.in>'),
    founder: parseContact('Abhishek V Neheru <Abhishek@ripplr.in>'),
    coFounder: parseContact('Santosh Dabke <Santosh@ripplr.in>'),
    industry: 'Platform Enablers',
    revenueStage: '500+',
    contactEmail: 'Shreyans@ripplr.in',
    loginPassword: generateUniquePassword('RIPPLR', 17),
    createdAt: '2022-01-01',
  },
  // 19. Inito
  {
    id: 'company-19',
    companyCode: 'INITO',
    name: 'SAMPLYTICS TECHNOLOGIES PRIVATE LIMITED',
    brand: 'Inito',
    fund: 'Fund III',
    fundCategory: 'CAT II',
    firesideCategory: 'Health & Wellness',
    internalCategory: 'Devices (incl. Healthcare)',
    investmentStatus: 'Invested',
    fl: 'Ankur Khaitan',
    esgConnect: parseContact('Aayush Rai <aayush@inito.com>'),
    founder: parseContact('Aayush Rai <aayush@inito.com>'),
    coFounder: parseContact('Varun AV <varun@inito.com>'),
    industry: 'Health & Wellness',
    revenueStage: '100-500',
    contactEmail: 'aayush@inito.com',
    loginPassword: generateUniquePassword('INITO', 18),
    createdAt: '2022-01-01',
  },
  // 20. NewMe
  {
    id: 'company-20',
    companyCode: 'NEWME',
    name: 'FRAICHEUR RETAIL PRIVATE LIMITED',
    brand: 'NewMe',
    fund: 'Fund III',
    fundCategory: 'CAT II',
    firesideCategory: 'Fashion & Lifestyle',
    internalCategory: 'Fashion',
    investmentStatus: 'Invested',
    fl: 'Shuchi Pandya',
    esgConnect: parseContact('Sumit Jasoria <sj@newme.asia>'),
    founder: parseContact('Sumit Jasoria <sj@newme.asia>'),
    coFounder: parseContact('Shivam Tripathi <st@newme.asia>'),
    industry: 'Fashion & Lifestyle',
    revenueStage: '100-500',
    contactEmail: 'sj@newme.asia',
    loginPassword: generateUniquePassword('NEWME', 19),
    createdAt: '2022-01-01',
  },
  // 21. Sweet Karam Coffee (SKC)
  {
    id: 'company-21',
    companyCode: 'SKC',
    name: 'SWEET KARAM COFFEE INDIA PRIVATE LIMITED',
    brand: 'Sweet Karam Coffee (SKC)',
    fund: 'Fund III',
    fundCategory: 'CAT II',
    firesideCategory: 'Food & Beverage',
    internalCategory: 'F&B (incl. nutra health)',
    investmentStatus: 'Invested',
    fl: 'Ankita Balotia',
    esgConnect: parseContact('Srivatsan Sundararaman <srivatsan@sweetkaramcoffee.in>'),
    founder: parseContact('Nalini Parthiban <nalini@sweetkaramcoffee.in>'),
    coFounder: parseContact('Anand Bharadhwaj <anand@sweetkaramcoffee.in>'),
    coFounder2: parseContact('Srivatsan Sundararaman <srivatsan@sweetkaramcoffee.in>'),
    coFounder3: parseContact('Veera Raghavan <raghav@sweetkaramcoffee.in>'),
    industry: 'Food & Beverage',
    revenueStage: '100-500',
    contactEmail: 'srivatsan@sweetkaramcoffee.in',
    loginPassword: generateUniquePassword('SKC', 20),
    createdAt: '2022-01-01',
  },
  // 22. Happi Planet
  {
    id: 'company-22',
    companyCode: 'HAPPIPLNT',
    name: 'HAPPI PLANET ECO PRODUCTS PRIVATE LIMITED',
    brand: 'Happi Planet',
    fund: 'Fund III',
    fundCategory: 'CAT II',
    firesideCategory: 'Home & Décor',
    internalCategory: 'Home',
    investmentStatus: 'Invested',
    fl: 'Ankita Balotia',
    esgConnect: parseContact('Nimeet Dhokai <nimeet@happi-planet.com>'),
    founder: parseContact('Mayank Gupta <mayank@happi-planet.com>'),
    coFounder: parseContact('Nimeet Dhokai <nimeet@happi-planet.com>'),
    industry: 'Home & Décor',
    revenueStage: '50-100',
    contactEmail: 'nimeet@happi-planet.com',
    loginPassword: generateUniquePassword('HAPPIPLNT', 21),
    createdAt: '2022-01-01',
  },
  // 23. Amaha
  {
    id: 'company-23',
    companyCode: 'AMAHA',
    name: 'MINDCRESCENT WELLNESS VENTURES PRIVATE LIMITED',
    brand: 'Amaha',
    fund: 'Fund III',
    fundCategory: 'CAT II',
    firesideCategory: 'Health & Wellness',
    internalCategory: 'Services (incl. Health)',
    investmentStatus: 'Invested',
    fl: 'Ankur Khaitan',
    esgConnect: parseContact('Jagdish Lulla <jagdish@amahahealth.com>'),
    founder: parseContact('Amit Malik <amit@amahahealth.com>'),
    coFounder: parseContact('Neha Kirpal <neha@amahahealth.com>'),
    industry: 'Health & Wellness',
    revenueStage: '0-50',
    contactEmail: 'jagdish@amahahealth.com',
    loginPassword: generateUniquePassword('AMAHA', 22),
    createdAt: '2022-01-01',
  },
  // 24. Rozana
  {
    id: 'company-24',
    companyCode: 'ROZANA',
    name: 'Freshcartons Retail and Distribution Private Limited',
    brand: 'Rozana',
    fund: 'Fund III',
    fundCategory: 'CAT II',
    firesideCategory: 'Platform Enablers',
    internalCategory: 'Gaming/Platform/Others',
    investmentStatus: 'Invested',
    fl: 'Amit Kulkarni',
    esgConnect: parseContact('IR Rozana <ir@rozana.in>'),
    founder: parseContact('Ankur Dahiya <ankur@rozana.in>'),
    coFounder: parseContact('Adwait Vikram Singh <adwait@rozana.in>'),
    coFounder2: { name: 'Mukesh Christopher' },
    coFounder3: { name: 'Prithvi Pal Singh' },
    industry: 'Platform Enablers',
    revenueStage: '500+',
    contactEmail: 'ir@rozana.in',
    loginPassword: generateUniquePassword('ROZANA', 23),
    createdAt: '2022-01-01',
  },
  // 25. Iluvia
  {
    id: 'company-25',
    companyCode: 'ILUVIA',
    name: 'RENAURA WELLNESS PRIVATE LIMITED',
    brand: 'Iluvia',
    fund: 'Fund III',
    fundCategory: 'CAT II',
    firesideCategory: 'Beauty & Personal Care',
    internalCategory: 'BPC',
    investmentStatus: 'Invested',
    fl: 'Prayag Mohanty',
    esgConnect: parseContact('Nishant Gupta <nishant@renaura.com>'),
    founder: parseContact('Nishant Gupta <nishant@renaura.com>'),
    coFounder: parseContact('Palash Pandey <palash@renaura.com>'),
    industry: 'Beauty & Personal Care',
    revenueStage: '0-50',
    contactEmail: 'nishant@renaura.com',
    loginPassword: generateUniquePassword('ILUVIA', 24),
    createdAt: '2022-01-01',
  },
  // 26. Jetapult
  {
    id: 'company-26',
    companyCode: 'JETAPULT',
    name: 'JETAPULT PRIVATE LIMITED',
    brand: 'Jetapult',
    fund: 'Fund III',
    fundCategory: 'CAT II',
    firesideCategory: 'Platform Enablers',
    internalCategory: 'Gaming/Platform/Others',
    investmentStatus: 'Invested',
    fl: 'Shuchi Pandya',
    esgConnect: parseContact('Sharan Tulsiani <sharan.tulsiani@jetapult.me>'),
    founder: parseContact('Sharan Tulsiani <sharan.tulsiani@jetapult.me>'),
    coFounder: parseContact('Yashvardhan Baid <yashvardhan.baid@jetapult.me>'),
    coFounder2: parseContact('Mangesh Anaokar <mangesh.anaokar@jetapult.me>'),
    industry: 'Platform Enablers',
    revenueStage: '0-50',
    contactEmail: 'sharan.tulsiani@jetapult.me',
    loginPassword: generateUniquePassword('JETAPULT', 25),
    createdAt: '2022-01-01',
  },
  // 27. Moxie
  {
    id: 'company-27',
    companyCode: 'MOXIE',
    name: 'BEYOUTIFUL CONSUMER VENTURES PRIVATE LIMITED',
    brand: 'Moxie',
    fund: 'Fund III',
    fundCategory: 'CAT II',
    firesideCategory: 'Beauty & Personal Care',
    internalCategory: 'BPC',
    investmentStatus: 'Invested',
    fl: 'Prayag Mohanty',
    esgConnect: parseContact('Prabhjot Singh <prabhjot@moxiebeauty.in>'),
    founder: parseContact('Nikita Khanna <nikita@moxiebeauty.in>'),
    coFounder: parseContact('Anmol Ahlawat <anmol@moxiebeauty.in>'),
    industry: 'Beauty & Personal Care',
    revenueStage: '50-100',
    contactEmail: 'prabhjot@moxiebeauty.in',
    loginPassword: generateUniquePassword('MOXIE', 26),
    createdAt: '2022-01-01',
  },
  // 28. Tuco
  {
    id: 'company-28',
    companyCode: 'TUCO',
    name: 'UNBOTTLE PRIVATE LIMITED',
    brand: 'Tuco',
    fund: 'Fund III',
    fundCategory: 'CAT II',
    firesideCategory: 'Beauty & Personal Care',
    internalCategory: 'BPC',
    investmentStatus: 'Invested',
    fl: 'Varun Varma',
    esgConnect: parseContact('Amulya N <amulya@tucokids.com>'),
    founder: parseContact('Aishvarya Murali <aishvarya@theunbottle.com>'),
    coFounder: parseContact('Chanakya Gupta <Chanakya@unbottle.co>'),
    industry: 'Beauty & Personal Care',
    revenueStage: '0-50',
    contactEmail: 'amulya@tucokids.com',
    loginPassword: generateUniquePassword('TUCO', 27),
    createdAt: '2022-01-01',
  },
  // 29. Aukera
  {
    id: 'company-29',
    companyCode: 'AUKERA',
    name: 'AARYAK JEWELLERY PRIVATE LIMITED',
    brand: 'Aukera',
    fund: 'Fund III',
    fundCategory: 'CAT II',
    firesideCategory: 'Fashion & Lifestyle',
    internalCategory: 'Fashion',
    investmentStatus: 'Invested',
    fl: 'Shuchi Pandya',
    esgConnect: parseContact('Subhasri Chatterjee <subhasri.chatterjee@aukerajewellery.com>'),
    founder: parseContact('Elizabeth Mukhedkar (Lisa) <lm@aukerajewellery.com>'),
    coFounder: parseContact('Kumar Saurabh <ks@aukerajewellery.com>'),
    industry: 'Fashion & Lifestyle',
    revenueStage: '50-100',
    contactEmail: 'subhasri.chatterjee@aukerajewellery.com',
    loginPassword: generateUniquePassword('AUKERA', 28),
    createdAt: '2022-01-01',
  },
  // 30. The Solved Skin (TSS)
  {
    id: 'company-30',
    companyCode: 'SOLVDSKIN',
    name: 'PRYSTYN HEALTH AND BEAUTY PRIVATE LIMITED',
    brand: 'The Solved Skin (TSS)',
    fund: 'Fund III',
    fundCategory: 'CAT II',
    firesideCategory: 'Beauty & Personal Care',
    internalCategory: 'BPC',
    investmentStatus: 'Invested',
    fl: 'Aashish Mirchandani',
    esgConnect: parseContact('Manan Shah <manan.shah@thesolvedskin.com>'),
    founder: parseContact('Divanshee Jindal <Divanshee@thesolvedskin.com>'),
    coFounder: parseContact('Abhishek Gupta <abhishek@thesolvedskin.com>'),
    industry: 'Beauty & Personal Care',
    revenueStage: '0-50',
    contactEmail: 'manan.shah@thesolvedskin.com',
    loginPassword: generateUniquePassword('SOLVDSKIN', 29),
    createdAt: '2022-01-01',
  },
  // 31. Raaz App
  {
    id: 'company-31',
    companyCode: 'RAAZAPP',
    name: 'DUNNWOOD HEALTH PRIVATE LIMITED',
    brand: 'Raaz App',
    fund: 'Fund III',
    fundCategory: 'CAT II',
    firesideCategory: 'Health & Wellness',
    internalCategory: 'Devices (incl. Healthcare) + Services',
    investmentStatus: 'Invested',
    fl: 'Ankur Khaitan',
    esgConnect: parseContact('Harshit Kukreja <harshit@raaz.app>'),
    founder: parseContact('Akash Kumar <akash@raaz.app>'),
    coFounder: parseContact('Dr. Harshit Kukreja <Harshit@raaz.app>'),
    industry: 'Health & Wellness',
    revenueStage: '0-50',
    contactEmail: 'harshit@raaz.app',
    loginPassword: generateUniquePassword('RAAZAPP', 30),
    createdAt: '2022-01-01',
  },
  // 32. Beyond Appliances
  {
    id: 'company-32',
    companyCode: 'BEYONDAPP',
    name: 'Byondnxt Smart Home Private Limited',
    brand: 'Beyond Appliances',
    fund: 'Fund III',
    fundCategory: 'CAT II',
    firesideCategory: 'Home & Décor',
    internalCategory: 'Devices (incl. Healthcare)',
    investmentStatus: 'Invested',
    fl: 'Shuchi Pandya',
    esgConnect: parseContact('Guru Prasad G <Guruprasadg@beyondappliances.in>'),
    founder: parseContact('Eshwar Vikas <eshwar@mukundafoods.com>'),
    coFounder: parseContact('Rakesh Patil <rakesh@mukundafoods.com>'),
    coFounder2: parseContact('Rupali Pawar <rupali@mukundafoods.com>'),
    industry: 'Home & Décor',
    revenueStage: '0-50',
    contactEmail: 'Guruprasadg@beyondappliances.in',
    loginPassword: generateUniquePassword('BEYONDAPP', 31),
    createdAt: '2022-01-01',
  },
  // 33. Terractive
  {
    id: 'company-33',
    companyCode: 'TERRACTIV',
    name: 'RRA TECHNO PRODUCTS PRIVATE LIMITED',
    brand: 'Terractive',
    fund: 'Fund III',
    fundCategory: 'CAT II',
    firesideCategory: 'Fashion & Lifestyle',
    internalCategory: 'Fashion',
    investmentStatus: 'Invested',
    fl: 'Shuchi Pandya',
    esgConnect: parseContact('RAHEE PARITOSH AMBANI <rahee@terractive.in>'),
    founder: parseContact('RAHEE PARITOSH AMBANI <rahee@terractive.in>'),
    coFounder: parseContact('RAENA PARITOSH AMBANI Ambani <raena@terractive.in>'),
    industry: 'Fashion & Lifestyle',
    revenueStage: '0-50',
    contactEmail: 'rahee@terractive.in',
    loginPassword: generateUniquePassword('TERRACTIV', 32),
    createdAt: '2022-01-01',
  },
  // 34. Enchanté Brands
  {
    id: 'company-34',
    companyCode: 'ENCHANTE',
    name: 'Enchante Brands India Private Limited',
    brand: 'Enchanté Brands',
    fund: 'Fund III',
    fundCategory: 'CAT II',
    firesideCategory: 'Fashion & Lifestyle',
    internalCategory: 'Fashion',
    investmentStatus: 'Invested',
    fl: 'Shuchi Pandya',
    esgConnect: parseContact('Rohit Rungta <rohit@enchantebrands.com>'),
    founder: parseContact('Abhinav Pathak <abhinav@enchantebrands.com>'),
    coFounder: parseContact('Abhinav Zutshi <az@enchantebrands.com>'),
    industry: 'Fashion & Lifestyle',
    revenueStage: '0-50',
    contactEmail: 'rohit@enchantebrands.com',
    loginPassword: generateUniquePassword('ENCHANTE', 33),
    createdAt: '2022-01-01',
  },
  // 35. Sammmm Beauty
  {
    id: 'company-35',
    companyCode: 'SAMMMMBT',
    name: 'Sammmm Hbw Private Limited (SHPL)',
    brand: 'Sammmm Beauty',
    fund: 'Fund III',
    fundCategory: 'CAT II',
    firesideCategory: 'Beauty & Personal Care',
    internalCategory: 'BPC',
    investmentStatus: 'Invested',
    fl: 'Prayag Mohanty',
    esgConnect: parseContact('Mantosh Roy <manty@sammmm.com>'),
    founder: parseContact('Mantosh Roy <manty@sammmm.com>'),
    coFounder: parseContact('Rishi Seth <rishi@sammmm.com>'),
    industry: 'Beauty & Personal Care',
    revenueStage: '0-50',
    contactEmail: 'manty@sammmm.com',
    loginPassword: generateUniquePassword('SAMMMMBT', 34),
    createdAt: '2022-01-01',
  },
  // 36. UnderNeat
  {
    id: 'company-36',
    companyCode: 'UNDERNEAT',
    name: 'Underneat Clothing Private Limited',
    brand: 'UnderNeat',
    fund: 'Fund III',
    fundCategory: 'CAT II',
    firesideCategory: 'Fashion & Lifestyle',
    internalCategory: 'Fashion',
    investmentStatus: 'Invested',
    fl: 'Prayag Mohanty',
    esgConnect: parseContact('Palvi Babbar <palvi.babbar@underneat.in>'),
    founder: parseContact('Vimarsh Razdan <vimarsh.razdan@underneat.in>'),
    coFounder: parseContact('Kusha Kapila <kusha.kapila@underneat.in>'),
    industry: 'Fashion & Lifestyle',
    revenueStage: '0-50',
    contactEmail: 'palvi.babbar@underneat.in',
    loginPassword: generateUniquePassword('UNDERNEAT', 35),
    createdAt: '2022-01-01',
  },
  // 37. Troovy
  {
    id: 'company-37',
    companyCode: 'TROOVY',
    name: 'Honest Innovations For You Private Limited',
    brand: 'Troovy',
    fund: 'Fund III',
    fundCategory: 'CAT II',
    firesideCategory: 'Food & Beverage',
    internalCategory: 'F&B (incl. nutra health)',
    investmentStatus: 'Invested',
    fl: 'Ankita Balotia',
    esgConnect: parseContact('Ankit Mangal <ankit@troovyfoods.com>'),
    founder: parseContact('Mansi Baranwal <mansi@honestinnovations.co>'),
    coFounder: parseContact('Aditya Mukherjee <aditya@honestinnovations.co>'),
    industry: 'Food & Beverage',
    revenueStage: '0-50',
    contactEmail: 'ankit@troovyfoods.com',
    loginPassword: generateUniquePassword('TROOVY', 36),
    createdAt: '2022-01-01',
  },
  // 38. Aceblend
  {
    id: 'company-38',
    companyCode: 'ACEBLEND',
    name: 'Aces Intact Private Limited',
    brand: 'Aceblend',
    fund: 'Fund III',
    fundCategory: 'CAT II',
    firesideCategory: 'Food & Beverage',
    internalCategory: 'F&B (incl. nutra health)',
    investmentStatus: 'Invested',
    fl: 'Ankita Balotia',
    esgConnect: parseContact('Harsh Kumar Dugar <harsh@aceblend.com>'),
    founder: parseContact('Shivam Sunil Hingorani <shivam@aceblend.com>'),
    coFounder: parseContact('Harsh Kumar Dugar <harsh@aceblend.com>'),
    industry: 'Food & Beverage',
    revenueStage: '0-50',
    contactEmail: 'harsh@aceblend.com',
    loginPassword: generateUniquePassword('ACEBLEND', 37),
    createdAt: '2022-01-01',
  },
  // 39. Cumin Co
  {
    id: 'company-39',
    companyCode: 'CUMINCO',
    name: 'Cuminco Kitchenware Private Limited',
    brand: 'Cumin Co',
    fund: 'Fund III',
    fundCategory: 'CAT II',
    firesideCategory: 'Home & Décor',
    internalCategory: 'Home',
    investmentStatus: 'Invested',
    fl: 'Shuchi Pandya',
    esgConnect: parseContact('Abija Nambiar <abija@sagesustainability.in>'),
    founder: parseContact('Udit Lekhi <Udit@cuminco.com>'),
    coFounder: parseContact('Niharika Joshi <niharika@cuminco.com>'),
    industry: 'Home & Décor',
    revenueStage: '0-50',
    contactEmail: 'abija@sagesustainability.in',
    loginPassword: generateUniquePassword('CUMINCO', 38),
    createdAt: '2022-01-01',
  },
  // 40. Wellopia
  {
    id: 'company-40',
    companyCode: 'WELLOPIA',
    name: 'ESCA CONSUMER HEALTH PRIVATE LIMITED',
    brand: 'Wellopia',
    fund: 'Fund III',
    fundCategory: 'CAT II',
    firesideCategory: 'Health & Wellness',
    internalCategory: 'F&B (incl. nutra health)',
    investmentStatus: 'Invested',
    fl: 'Prayag Mohanty',
    esgConnect: parseContact('Sanil Bhatia <sanil@escahealth.com>'),
    founder: parseContact('Sanil Bhatia <sanil@escahealth.com>'),
    coFounder: parseContact('Vishakha Paliwal <vishakha@escahealth.com>'),
    industry: 'Health & Wellness',
    revenueStage: '0-50',
    contactEmail: 'sanil@escahealth.com',
    loginPassword: generateUniquePassword('WELLOPIA', 39),
    createdAt: '2022-01-01',
  },
  // 41. Sports for Life (SFL)
  {
    id: 'company-41',
    companyCode: 'SFL',
    name: 'Jambavan Academy Private Limited',
    brand: 'Sports for Life (SFL)',
    fund: 'Fund III',
    fundCategory: 'CAT II',
    firesideCategory: 'Platform Enablers',
    internalCategory: 'Gaming/Platform/Others',
    investmentStatus: 'Invested',
    fl: 'Varun Varma',
    esgConnect: parseContact('Parnita Banerjee <parnita@sportsforlife.in>'),
    founder: parseContact('Sourjyendu Medda <sourjyendu@sportsforlife.in>'),
    coFounder: parseContact('Armaan Tandon <armaan@sportsforlife.in>'),
    industry: 'Platform Enablers',
    revenueStage: '0-50',
    contactEmail: 'parnita@sportsforlife.in',
    loginPassword: generateUniquePassword('SFL', 40),
    createdAt: '2022-01-01',
  },
  // 42. Earthful
  {
    id: 'company-42',
    companyCode: 'EARTHFUL',
    name: 'Kenzen Ventures Private Limited',
    brand: 'Earthful',
    fund: 'Fund III',
    fundCategory: 'CAT II',
    firesideCategory: 'Health & Wellness',
    internalCategory: 'F&B (incl. nutra health)',
    investmentStatus: 'Invested',
    fl: 'Ankur Khaitan',
    esgConnect: parseContact('Revanth Desai <revanth.analytics01@earthful.me>'),
    founder: parseContact('Sai Sudha Gogineni <sudha@earthful.me>'),
    coFounder: parseContact('Veda Gogineni <veda@earthful.me>'),
    industry: 'Health & Wellness',
    revenueStage: '0-50',
    contactEmail: 'revanth.analytics01@earthful.me',
    loginPassword: generateUniquePassword('EARTHFUL', 41),
    createdAt: '2022-01-01',
  },
  // 43. Antinorm
  {
    id: 'company-43',
    companyCode: 'ANTINORM',
    name: 'Potion Pioneers Private Limited',
    brand: 'Antinorm',
    fund: 'Fund III',
    fundCategory: 'CAT II',
    firesideCategory: 'Beauty & Personal Care',
    internalCategory: 'BPC',
    investmentStatus: 'Invested',
    fl: 'Varun Varma',
    esgConnect: parseContact('Aparna Saxena <aparna@antinorm.co>'),
    founder: parseContact('Aparna Saxena <aparna@antinorm.co>'),
    industry: 'Beauty & Personal Care',
    revenueStage: '0-50',
    contactEmail: 'aparna@antinorm.co',
    loginPassword: generateUniquePassword('ANTINORM', 42),
    createdAt: '2022-01-01',
  },
  // 44. DUSQ (Innergize) — Fund IV, onboarded JFM 2026
  {
    id: 'company-44',
    companyCode: 'DUSQ',
    name: 'Innergize',
    brand: 'DUSQ',
    fund: 'Fund IV',
    fundCategory: 'CAT I',
    firesideCategory: 'Health & Wellness',
    internalCategory: 'Services (incl. Health)',
    rationale: 'Devices (incl. Healthcare) + Services — Health tracking + consultation',
    investmentStatus: 'Invested',
    fl: 'TBD',
    revenueFY2425: null,
    arrJAS2025: null,
    industry: 'Health & Wellness',
    revenueStage: '0-50',
    contactEmail: 'contact@dusq.com',
    loginPassword: generateUniquePassword('DUSQ', 43),
    createdAt: '2026-01-01',
  },
  // 45. Kisah — Fund IV, onboarded JFM 2026
  {
    id: 'company-45',
    companyCode: 'KISAH',
    name: 'Kisah',
    brand: 'Kisah',
    fund: 'Fund IV',
    fundCategory: 'CAT I',
    firesideCategory: 'Fashion & Lifestyle',
    internalCategory: 'Fashion',
    rationale: 'Fashion',
    investmentStatus: 'Invested',
    fl: 'TBD',
    revenueFY2425: null,
    arrJAS2025: null,
    industry: 'Fashion & Lifestyle',
    revenueStage: '50-100',
    contactEmail: 'contact@kisah.com',
    loginPassword: generateUniquePassword('KISAH', 44),
    createdAt: '2026-01-01',
  },
  // Demo Company - NOT a real portfolio company (for demo/testing purposes only)
  {
    id: 'company-demo',
    companyCode: 'DEMOCORP',
    name: 'Demo Corporation Pvt. Ltd.',
    brand: 'Demo Corp',
    fund: 'Fund I',
    fundCategory: 'DEMO',
    firesideCategory: 'Food & Beverage',
    internalCategory: 'F&B (incl. nutra health)',
    investmentStatus: 'Demo',
    fl: 'Demo User',
    esgConnect: parseContact('Demo User <demo@democorp.com>'),
    founder: parseContact('Demo Founder <founder@democorp.com>'),
    industry: 'Food & Beverage',
    revenueStage: '100-500',
    contactEmail: 'demo@democorp.com',
    loginPassword: 'DEMOpass123',
    createdAt: '2024-01-01',
  },
];

// Q Category mapping for each company
const Q_CATEGORY_MAP: Record<string, string> = {
  'company-3': 'Q3',   // The Ayurvedic Experience
  'company-2': 'Q3',   // Vahdam Teas
  'company-11': 'Q1',  // The Sleep Company
  'company-10': 'Q1',  // Pilgrim
  'company-4': 'Q1',   // Traya
  'company-8': 'Q1',   // Super Tails
  'company-14': 'Q',   // Slurrp Farm
  'company-9': 'Q',    // Nat Habit
  'company-13': 'Q',   // FS Life
  'company-12': 'Q3',  // Smytten
  'company-7': 'Q2',   // Gynoveda
  'company-6': 'Q3',   // The Baker's Dozen
  'company-38': 'Q',   // Ace Blend
  'company-23': 'Q',   // Amaha
  'company-29': 'Q2',  // Aukera
  'company-32': 'Q2',  // Beyond Appliances
  'company-39': 'Q',   // Cuminco
  'company-34': 'Q2',  // Enchanté Brands
  'company-16': 'Q2',  // Frubon
  'company-22': 'Q',   // Happi Planet
  'company-25': 'Q',   // Iluvia
  'company-19': 'Q2',  // Inito
  'company-27': 'Q2',  // Moxie Beauty
  'company-20': 'Q2',  // NewMe
  'company-31': 'Early', // Raaz
  'company-18': 'Q2',  // Ripplr
  'company-24': 'Q2',  // Rozana
  'company-35': 'Early', // Sammmm
  'company-21': 'Q2',  // Sweet Karam Coffee
  'company-33': 'Early', // Terractive
  'company-17': 'Q',   // The Good Bug
  'company-30': 'Early', // The Solved Skin
  'company-37': 'Q',   // Troovy
  'company-28': 'Q',   // Tuco
  'company-36': 'Q2',  // Underneat
  'company-40': 'Q',   // Wellopia
  'company-41': 'Q',   // Sports for Life
  'company-42': 'Q',   // Earthful
  'company-43': 'Q',   // Antinorm
  'company-44': 'Early', // DUSQ — Fund IV, JFM 2026 onboarding
  'company-45': 'Q',     // Kisah — Fund IV, JFM 2026 onboarding
};

// Apply Q categories and filter out excluded companies
const _companiesWithQCategory: Company[] = _allMockCompanies.map(c => ({
  ...c,
  qCategory: (Q_CATEGORY_MAP[c.id] || c.qCategory) as Company['qCategory'],
}));

// Filter out globally excluded companies from all pages
export const mockCompanies: Company[] = _companiesWithQCategory.filter(c => !EXCLUDED_COMPANY_IDS.has(c.id));

// Export mock KPIs (simplified for the current implementation)
export const mockKPIs: KPI[] = [];

// Export mock KPI entries
export const mockKPIEntries: KPIEntry[] = [];

