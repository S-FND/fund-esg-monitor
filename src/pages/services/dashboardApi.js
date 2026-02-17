// services/dashboardApi.ts
import { http } from "@/utils/httpInterceptor";
import { toast } from "sonner";

export const dashboardApi = {
  // Get dashboard data - following the exact pattern from old code
  async getDashboardData(filters = {}) {
    try {
      // 1. Build params exactly like the old code
      const params = {
        type: filters.viewType || 'individual-company',
        fy: filters.year || this.getCurrentFinancialYear(),
      };

      // 2. Add user ID from localStorage (like old code's 'user' param) - THIS IS CRITICAL
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        // In your old code, you used isCompany?.isInvestor?.userId
        if (user?.isInvestor?.userId) {
          params.user = user.isInvestor.userId;
        } else if (user?._id) {
          params.user = user._id;
        }
      }

      console.log('📤 User ID from localStorage:', params.user);

      // 3. Add optional parameters
      if (filters.month) {
        params.month = parseInt(filters.month); // Convert to number like old code
      }
      
      if (filters.fundId && filters.fundId !== "all") {
        params.fundId = filters.fundId;
      }
      
      if (filters.companyId && filters.companyId !== "all") {
        params.companyId = filters.companyId;
      }

      console.log('📤 Building request with params:', params);

      // 4. MANUALLY build the query string (LIKE YOUR OLD CODE)
      let queryParams = `type=${params.type}&fy=${params.fy}`;
      
      // Add user parameter (CRITICAL - your old code had this)
      if (params.user) {
        queryParams += `&id=${params.user}`;
      }
      
      // Add month if present (convert to number like old code)
      if (params.month !== undefined) {
        queryParams += `&month=${params.month}`;
      }
      
      // Add fund if present
      if (params.fundId) {
        queryParams += `&fundId=${params.fundId}`;
      }
      
      // Add company if present
      if (params.companyId) {
        queryParams += `&companyId=${params.companyId}`;
      }

      // 5. Construct the full URL
      const url = `investor/dashboard?${queryParams}`;
      console.log('🔗 Final Request URL:', url);

      // 6. Make the API call
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
  getCurrentFinancialYear() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    
    // Indian financial year: April to March
    const financialYearStart = currentMonth >= 4 ? currentYear : currentYear - 1;
    return `${financialYearStart}-${financialYearStart + 1}`;
  },

  // Get default/fallback data structure
  getDefaultDashboardData() {
    return {
      dashboardEnvironment: {},
      dashboardGovernance: {},
      dashboardSocial: {},
      dashboardOtherData: {},
      percentage_of_board: {}
    };
  },

  // Get funds list
  async getFunds() {
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

  // Get companies list
  async getCompanies() {
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

  // Transform API data to dashboard format
  transformDashboardData(apiData) {
    if (!apiData) return {};
    
    const envData = apiData.dashboardEnvironment || {};
    const govData = apiData.dashboardGovernance || {};
    const socialData = apiData.dashboardSocial || {};
    const otherData = apiData.dashboardOtherData || {};
    
    // Calculate ESG scores
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
        fundPerformance: this.prepareFundPerformance(apiData),
        topPerformers: this.prepareTopPerformers(apiData),
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
          overallScore: 76,
          topPerforming: ["SDG 7", "SDG 9", "SDG 11"],
          needsImprovement: ["SDG 1", "SDG 10"],
          sdgData: this.prepareSDGData(otherData)
        },
        topSDGs: this.prepareTopSDGs(otherData),
        topInitiatives: this.prepareTopInitiatives(apiData)
      },
      trends: {
        esgTrends: this.prepareESGTrends(apiData)
      }
    };
  },
  
  // Helper methods (keep your existing helper methods)
  prepareFundPerformance(apiData) {
    return [
      { name: "Sample Fund I", environmental: 85, social: 75, governance: 80 },
      { name: "Dummy Private Limited", environmental: 78, social: 82, governance: 75 },
      { name: "Health Ventures", environmental: 92, social: 88, governance: 90 }
    ];
  },
  
  prepareTopPerformers(apiData) {
    return [
      { name: "EcoSolutions Inc.", esgScore: 92, sector: "ClimateTech" },
      { name: "GreenHarvest", esgScore: 88, sector: "AgriTech" },
      { name: "MediTech Innovations", esgScore: 85, sector: "HealthTech" }
    ];
  },
  
  prepareTopSDGs(otherData) {
    const sdgStratgyData = otherData.dashboardSDGStratgyData || [];
    const sdgCounts = {};
    
    sdgStratgyData.forEach(item => {
      const sdgNumber = this.extractSDGNumber(item.what_goal || item.goal);
      if (sdgNumber) {
        sdgCounts[sdgNumber] = (sdgCounts[sdgNumber] || 0) + 1;
      }
    });
    
    return Object.entries(sdgCounts).map(([sdgNumber, companies]) => ({
      sdgNumber: parseInt(sdgNumber),
      companies: companies,
      totalCompanies: 7
    })).sort((a, b) => b.companies - a.companies).slice(0, 3);
  },
  
  extractSDGNumber(text) {
    if (!text) return null;
    const match = text.match(/SDG\s*(\d+)/i);
    return match ? parseInt(match[1]) : null;
  },
  
  prepareSDGData(otherData) {
    const sdgStratgyData = otherData.dashboardSDGStratgyData || [];
    const sdgMap = new Map();
    
    sdgStratgyData.forEach(item => {
      const sdgNumber = this.extractSDGNumber(item.what_goal || item.goal);
      if (sdgNumber && !sdgMap.has(sdgNumber)) {
        sdgMap.set(sdgNumber, {
          sdgNumber,
          progress: Math.floor(Math.random() * 40) + 50
        });
      }
    });
    
    return Array.from(sdgMap.values()).slice(0, 5);
  },
  
  prepareTopInitiatives(apiData) {
    return [
      {
        id: 1,
        title: "Renewable Energy Transition",
        progress: 75,
        companies: ["EcoSolutions Inc.", "GreenHarvest"],
        sdgNumber: 7
      },
      {
        id: 2,
        title: "Sustainable Supply Chain",
        progress: 60,
        companies: ["MediTech Innovations", "FinSecure"],
        sdgNumber: 12
      },
      {
        id: 3,
        title: "Community Development",
        progress: 80,
        companies: ["EduForward"],
        sdgNumber: 1
      }
    ];
  },
  
  prepareESGTrends(apiData) {
    return [
      { year: "2021-2022", environmental: 65, social: 60, governance: 70, overall: 65 },
      { year: "2022-2023", environmental: 70, social: 68, governance: 75, overall: 71 },
      { year: "2023-2024", environmental: 75, social: 73, governance: 80, overall: 76 },
      { year: "2024-2025", environmental: 82, social: 78, governance: 85, overall: 82 },
      { year: "2025-2026", environmental: 88, social: 85, governance: 90, overall: 88 }
    ];
  },
  
  prepareEnvironmentalKPIs(envData) {
    return {
      score: 85,
      metrics: [
        { name: "Energy Consumption", value: this.formatEnergyData(envData.energy) },
        { name: "Water Usage", value: this.formatWaterData(envData.water_withdrawl) },
        { name: "Waste Management", value: this.formatWasteData(envData.waste_management) },
        { name: "GHG Emissions", value: this.formatGHGData(envData.gh_gas_emission) }
      ]
    };
  },
  
  prepareSocialKPIs(socialData) {
    return {
      score: 78,
      metrics: [
        { name: "Employee Diversity", value: this.formatDiversityData(socialData.employee_diversity) },
        { name: "Training Hours", value: "25 hrs/emp" },
        { name: "Employee Satisfaction", value: "4.2/5" }
      ]
    };
  },
  
  prepareGovernanceKPIs(govData) {
    return {
      score: 82,
      metrics: [
        { name: "Board Diversity", value: this.formatBoardData(govData.board_members_gender) },
        { name: "Ethics Training", value: "100%" },
        { name: "Audit Compliance", value: "95%" }
      ]
    };
  },
  
  formatEnergyData(energyData) {
    if (!energyData?.pie?.data) return "No data";
    const total = energyData.pie.data.reduce((a, b) => a + b, 0);
    const renewable = energyData.pie.data[0] || 0;
    const percentage = total > 0 ? ((renewable / total) * 100).toFixed(1) : 0;
    return `${percentage}% renewable`;
  },
  
  formatWaterData(waterData) {
    if (!waterData?.pie?.data) return "No data";
    const total = waterData.pie.data.reduce((a, b) => a + b, 0);
    return `${total.toLocaleString()} m³`;
  },
  
  formatWasteData(wasteData) {
    if (!wasteData?.pie?.data) return "No data";
    const total = wasteData.pie.data.reduce((a, b) => a + b, 0);
    return `${total.toLocaleString()} tons`;
  },
  
  formatGHGData(ghgData) {
    if (!ghgData?.pie?.data) return "No data";
    const scope1 = ghgData.pie.data[0] || 0;
    const scope2 = ghgData.pie.data[1] || 0;
    return `Scope 1: ${scope1}, Scope 2: ${scope2}`;
  },
  
  formatDiversityData(diversityData) {
    return "42%";
  },
  
  formatBoardData(boardData) {
    return "35%";
  }
};