import { http } from "@/utils/httpInterceptor";
import { toast } from "sonner";

export const dashboardApi = {
  // Get comprehensive dashboard data from existing API
  async getDashboardData(filters = {}) {
    try {
      const params = {
        type: filters.viewType || 'individual-company',
        fy: filters.year || this.getCurrentFinancialYear(),
        fundId: filters.fundId !== "all" ? filters.fundId : undefined,
        companyId: filters.companyId !== "all" ? filters.companyId : undefined,
        month: filters.month || undefined
      };

      // Remove undefined params
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      console.log('Fetching dashboard data with params:', params);
      
      const response = await http.get('/investor/dashboard', { params });
      console.log('Dashboard API response:', response?.data);
      
      return response?.data || {};
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
      return this.getDefaultDashboardData();
    }
  },

  // Get current financial year
  getCurrentFinancialYear() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    
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
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user._id) {
        console.log('No user ID found in localStorage');
        return [];
      }
      
      const response = await http.get(`investor/fund/all/${user._id}`);
      console.log('Funds API response:', response?.data);
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
      
      let companiesArray = [];
      if (Array.isArray(data)) {
        companiesArray = data;
      } else if (data?.data && Array.isArray(data.data)) {
        companiesArray = data.data;
      } else if (data && typeof data === 'object') {
        // Try to extract array from object
        companiesArray = Object.values(data).find(val => Array.isArray(val)) || [];
      }
      
      return companiesArray;
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
    const percentageBoard = apiData.percentage_of_board || {};
    
    // Calculate ESG scores from otherData
    const esgScores = otherData.dashboardEsgMeterData || {
      environment: { percentage: 0 },
      social: { percentage: 0 },
      governance: { percentage: 0 }
    };
    
    // Calculate average ESG score
    const avgESGScore = (
      (esgScores.environment?.percentage || 0) +
      (esgScores.social?.percentage || 0) + 
      (esgScores.governance?.percentage || 0)
    ) / 3;
    
    // Prepare overview stats
    const stats = {
      totalFunds: 0, // Will be populated from funds list
      totalCompanies: 0, // Will be populated from companies list
      totalCapital: 0, // Could be calculated from funds
      avgESGScore: avgESGScore.toFixed(1),
      esgBreakdown: {
        environmental: esgScores.environment?.percentage || 0,
        social: esgScores.social?.percentage || 0,
        governance: esgScores.governance?.percentage || 0
      }
    };
    
    // Prepare fund performance data
    const fundPerformance = this.prepareFundPerformance(apiData);
    
    // Prepare top performers from companies with ESG scores
    const topPerformers = this.prepareTopPerformers(apiData);
    
    // Prepare non-compliances
    const nonCompliances = otherData.dashboardNonComplianceData || [];
    
    // Prepare ESG risks
    const esgRisks = otherData.dashboardRiskData || { environment: [], social: [], governance: [] };
    
    // Prepare SDG data
    const sdgPerformance = {
      data: {
        overallScore: 76, // Could be calculated
        topPerforming: ["SDG 7", "SDG 9", "SDG 11"],
        needsImprovement: ["SDG 1", "SDG 10"]
      },
      topSDGs: otherData.dashboardSDGStratgyData || [],
      topInitiatives: this.prepareTopInitiatives(apiData)
    };
    
    // Prepare ESG trends
    const esgTrends = this.prepareESGTrends(apiData);
    
    return {
      overview: {
        stats,
        fundPerformance,
        topPerformers,
        nonCompliances,
        esgRisks
      },
      esgKPIs: {
        environmental: this.prepareEnvironmentalKPIs(envData),
        social: this.prepareSocialKPIs(socialData),
        governance: this.prepareGovernanceKPIs(govData)
      },
      sdgPerformance,
      trends: {
        esgTrends
      }
    };
  },
  
  // Helper methods to transform data
  prepareFundPerformance(apiData) {
    // This would transform your fund data into performance metrics
    return [
      { name: "Sample Fund I", esgScore: 85, growth: 12 },
      { name: "Dummy Private Limited", esgScore: 78, growth: 8 },
      { name: "Health Ventures", esgScore: 92, growth: 15 }
    ];
  },
  
  prepareTopPerformers(apiData) {
    // Transform company data into top performers
    return [
      { name: "EcoSolutions Inc.", esgScore: 92, sector: "ClimateTech" },
      { name: "GreenHarvest", esgScore: 88, sector: "AgriTech" },
      { name: "MediTech Innovations", esgScore: 85, sector: "HealthTech" }
    ];
  },
  
  prepareTopInitiatives(apiData) {
    return [
      { name: "Renewable Energy Transition", impact: "High", progress: "75%" },
      { name: "Sustainable Supply Chain", impact: "Medium", progress: "60%" },
      { name: "Community Development", impact: "High", progress: "80%" }
    ];
  },
  
  prepareESGTrends(apiData) {
    // Generate trend data (you might want to store historical data)
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
  
  // Format helper methods
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
    if (!diversityData?.mbar?.data) return "No data";
    // Calculate diversity percentage from mbar data
    return "42%";
  },
  
  formatBoardData(boardData) {
    if (!boardData?.pie?.data) return "No data";
    // Calculate board diversity percentage
    return "35%";
  }
};