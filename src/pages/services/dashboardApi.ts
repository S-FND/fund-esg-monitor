// services/dashboardApi.ts
import { http } from "@/utils/httpInterceptor";
import { toast } from "sonner";
import { DashboardData, EnvironmentData, GovernanceData, SocialData, OtherData } from "../types/dashboard.types";

interface DashboardFilters {
  viewType?: string;
  year?: string;
  fundId?: string;
  companyId?: string;
  month?: string;
}

interface ApiResponse {
  data?: DashboardData;
  status?: number;
  message?: string;
}

interface Fund {
  _id: string;
  name: string;
  sectorFocus?: string;
  size?: number;
  [key: string]: any;
}

interface Company {
  _id: string;
  companyId?: string;
  name?: string;
  companyName?: string;
  [key: string]: any;
}

export const dashboardApi = {
  // Get dashboard data with types
  async getDashboardData(filters: DashboardFilters = {}): Promise<DashboardData> {
    try {
      // 1. Build params exactly like the old code
      const params: Record<string, any> = {
        type: filters.viewType || 'individual-company',
        fy: filters.year || this.getCurrentFinancialYear(),
      };

      // 2. Add user ID from localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user?.isInvestor?.userId) {
          params.user = user.isInvestor.userId;
        } else if (user?._id) {
          params.user = user._id;
        }
      }

      console.log('📤 User ID from localStorage:', params.user);

      // 3. Add optional parameters
      if (filters.month) {
        params.month = parseInt(filters.month);
      }
      
      if (filters.fundId && filters.fundId !== "all") {
        params.fundId = filters.fundId;
      }
      
      if (filters.companyId && filters.companyId !== "all") {
        params.companyId = filters.companyId;
      }

      console.log('📤 Building request with params:', params);

      // 4. MANUALLY build the query string
      let queryParams = `type=${params.type}&fy=${params.fy}`;
      
      if (params.user) {
        queryParams += `&id=${params.user}`;
      }
      
      if (params.month !== undefined) {
        queryParams += `&month=${params.month}`;
      }
      
      if (params.fundId) {
        queryParams += `&fundId=${params.fundId}`;
      }
      
      if (params.companyId) {
        queryParams += `&companyId=${params.companyId}`;
      }

      const url = `investor/dashboard?${queryParams}`;
      console.log('🔗 Final Request URL:', url);

      const response = await http.get(url);
      console.log('📥 API Response:', response);

      return response?.data || {};
      
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
      return this.getDefaultDashboardData();
    }
  },

  // Get current financial year
  getCurrentFinancialYear(): string {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    
    const financialYearStart = currentMonth >= 4 ? currentYear : currentYear - 1;
    return `${financialYearStart}-${financialYearStart + 1}`;
  },

  // Get default/fallback data structure with proper type
  getDefaultDashboardData(): DashboardData {
    return {
      dashboardEnvironment: {},
      dashboardGovernance: {},
      dashboardSocial: {},
      dashboardOtherData: {},
      percentage_of_board: []
    };
  },

  // Get funds list with proper type
  async getFunds(): Promise<Fund[]> {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        console.log('No user found in localStorage');
        return [];
      }
      
      const user = JSON.parse(userStr);
      const userId = user?.isInvestor?.userId || user?._id;
      
      if (!userId) {
        console.log('No user ID found');
        return [];
      }
      
      console.log('Fetching funds for user:', userId);
      const response = await http.get(`investor/fund/all/${userId}`);
      return response?.data?.data || [];
    } catch (error) {
      console.error('Error fetching funds:', error);
      return [];
    }
  },

  // Get companies list with proper type
  async getCompanies(): Promise<Company[]> {
    try {
      const response = await http.get(`investor/companyInfo`);
      console.log('Companies API response:', response?.data);
      
      const data = response?.data?.data || response?.data;
      
      if (Array.isArray(data)) {
        return data;
      } else if (data?.data && Array.isArray(data.data)) {
        return data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching companies:', error);
      return [];
    }
  },

  // Get fund by ID with proper type
  async getFundById(fundId: string): Promise<Fund | null> {
    try {
      console.log('📊 Fetching fund details for ID:', fundId);
      const response = await http.get(`investor/fund/${fundId}`);
      console.log('📊 Fund details response:', response?.data);
      return response?.data?.data || null;
    } catch (error) {
      console.error('Error fetching fund details:', error);
      return null;
    }
  },

  // Transform API data to dashboard format with proper types
  transformDashboardData(apiData: DashboardData): any {
    if (!apiData) return {};
    
    const envData = apiData.dashboardEnvironment || {};
    const govData = apiData.dashboardGovernance || {};
    const socialData = apiData.dashboardSocial || {};
    const otherData = apiData.dashboardOtherData || {};
    const boardMeetings = apiData.percentage_of_board || [];
    
    // Calculate ESG scores from real data
    const esgScores = otherData.dashboardEsgMeterData || {
      environment: { percentage: 0 },
      social: { percentage: 0 },
      governance: { percentage: 0 }
    };
    
    const avgESGScore = (
      (esgScores.environment?.percentage || 0) +
      (esgScores.social?.percentage || 0) + 
      (esgScores.governance?.percentage || 0)
    ) / 3;
    
    const stats = {
      totalFunds: 0,
      totalCompanies: 0,
      totalCapital: 0,
      avgESGScore: avgESGScore.toFixed(1),
      esgBreakdown: {
        environmental: esgScores.environment?.percentage || 0,
        social: esgScores.social?.percentage || 0,
        governance: esgScores.governance?.percentage || 0
      }
    };
    
    return {
      overview: {
        stats,
        fundPerformance: [],
        topPerformers: [],
        nonCompliances: otherData.dashboardNonComplianceData || [],
        esgRisks: otherData.dashboardRiskData || {}
      },
      esgKPIs: {
        environmental: this.prepareEnvironmentalKPIs(envData),
        social: this.prepareSocialKPIs(socialData),
        governance: this.prepareGovernanceKPIs(govData)
      },
      sdgPerformance: {
        data: {
          sdgData: this.prepareSDGData(otherData)
        },
        topSDGs: [],
        topInitiatives: []
      },
      trends: {
        esgTrends: []
      },
      boardMeetings
    };
  },

  // Helper methods with proper types
  prepareSDGData(otherData: OtherData): any[] {
    return otherData.dashboardSDGStratgyData || [];
  },

  prepareEnvironmentalKPIs(envData: EnvironmentData): any {
    return {
      score: (envData as any)?.overallScore || 0,
      metrics: [
        { name: "Energy Consumption", value: this.formatEnergyData(envData.energy) },
        { name: "Water Usage", value: this.formatWaterData(envData.water_withdrawl) },
        { name: "Waste Management", value: this.formatWasteData(envData.waste_management) },
        { name: "GHG Emissions", value: this.formatGHGData(envData.gh_gas_emission) }
      ]
    };
  },

  prepareSocialKPIs(socialData: SocialData): any {
    return {
      score: (socialData as any)?.overallScore || 0,
      metrics: [
        { name: "Employee Diversity", value: this.formatDiversityData(socialData.employee_diversity) },
        { name: "Training Hours", value: "0 hrs" },
        { name: "Employee Satisfaction", value: "0/5" }
      ]
    };
  },

  prepareGovernanceKPIs(govData: GovernanceData): any {
    return {
      score: (govData as any)?.overallScore || 0,
      metrics: [
        { name: "Board Diversity", value: this.formatBoardData(govData.board_members_gender) },
        { name: "Ethics Training", value: "0%" },
        { name: "Audit Compliance", value: "0%" }
      ]
    };
  },

  // Formatter methods with proper types
  formatEnergyData(energyData: any): string {
    if (!energyData?.pie?.data) return "No data";
    const total = energyData.pie.data.reduce((a: number, b: number) => a + b, 0);
    const renewable = energyData.pie.data[0] || 0;
    const percentage = total > 0 ? ((renewable / total) * 100).toFixed(1) : 0;
    return `${percentage}% renewable`;
  },

  formatWaterData(waterData: any): string {
    if (!waterData?.pie?.data) return "No data";
    const total = waterData.pie.data.reduce((a: number, b: number) => a + b, 0);
    return `${total.toLocaleString()} m³`;
  },

  formatWasteData(wasteData: any): string {
    if (!wasteData?.pie?.data) return "No data";
    const total = wasteData.pie.data.reduce((a: number, b: number) => a + b, 0);
    return `${total.toLocaleString()} tons`;
  },

  formatGHGData(ghgData: any): string {
    if (!ghgData?.pie?.data) return "No data";
    const scope1 = ghgData.pie.data[0] || 0;
    const scope2 = ghgData.pie.data[1] || 0;
    return `Scope 1: ${scope1}, Scope 2: ${scope2}`;
  },

  formatDiversityData(diversityData: any): string {
    if (!diversityData?.mbar?.data) return "No data";
    return "Data available";
  },

  formatBoardData(boardData: any): string {
    if (!boardData?.pie?.data) return "No data";
    return "Data available";
  }
};