// types/dashboard.types.ts
export interface DashboardData {
    dashboardEnvironment?: EnvironmentData;
    dashboardSocial?: SocialData;
    dashboardGovernance?: GovernanceData;
    dashboardOtherData?: OtherData;
    percentage_of_board?: BoardMeetingData[];
  }
  
  export interface EnvironmentData {
    energy?: ChartData;
    waste_management?: ChartData;
    water_withdrawl?: ChartData;
    water_discharge?: ChartData;
    gh_gas_emission?: ChartData;
    air_emission?: ChartData;
    waste_recovery?: MultiSeriesChartData;
    disposal_method?: MultiSeriesChartData;
  }
  
  export interface SocialData {
    employee_diversity?: BarChartData;
    workers_diversity?: BarChartData;
    differently_abled?: BarChartData;
    workers_differently_abled?: BarChartData;
    minimum_wages?: BarChartData;
    workers_minimum_wages?: BarChartData;
    life_coverage?: BarChartData;
    workers_life_coverage?: BarChartData;
    accident_insurance?: BarChartData;
    workers_accident_insurance?: BarChartData;
    greivances?: BarChartData;
    safety_incidents?: BarChartData;
    turnover_rate?: BarChartData;
    rnd_percentage?: ChartData;
    supply_partner?: ChartData;
    gross_wages?: ChartData;
    key_persons?: ChartData;
    wellbeing_measures?: ChartData;
  }
  
  export interface GovernanceData {
    board_members_gender?: ChartData;
    board_pay_parity?: ChartData;
    esg_skilled?: ChartData;
    details_of_complaints?: ChartData;
    disciplinary_action?: ChartData;
    percentage_of_board?: ChartData;
    political_contributions?: ChartData;
    litigation_risks?: ChartData;
    the_ratio_of_independent?: ChartData;
  }
  
  export interface ChartData {
    labels: string[];
    data: number[];
  }
  
  export interface MultiSeriesChartData {
    xAxisLabels: string[];
    yAxisLabels: string[];
    data: number[][];
  }
  
  export interface BarChartData {
    xAxis: string[];
    series: Array<{ name: string; data: number[] }>;
  }
  
  export interface OtherData {
    dashboardRiskData?: RiskData;
    dashboardNonComplianceData?: NonComplianceData[];
    dashboardSDGStratgyData?: SDGStrategyData[];
    dashboardEsgMeterData?: ESG_MeterData;
  }
  
  export interface RiskData {
    environmental?: Array<{ value: string }>;
    social?: Array<{ value: string }>;
    governance?: Array<{ value: string }>;
  }
  
  export interface NonComplianceData {
    area: string;
    description: string;
  }
  
  export interface SDGStrategyData {
    what_goal: string;
    what_target: string;
    what_text: string;
    what_img: string;
    who: string;
    abc_goal: string;
    abc_goal_description: string;
    impact_thesis: string;
    baseline_metric: string;
    target_metric: string;
    current_status: string;
    goal?: string;
  }
  
  export interface ESG_MeterData {
    environment?: { percentage: number };
    social?: { percentage: number };
    governance?: { percentage: number };
  }
  
  export interface BoardMeetingData {
    _id: string;
    date_of_meeting: string;
    attendance: number;
  }

  export interface DashboardParams {
    type: string;
    fy: string;
    userId: string;
    month?: number;
    fundId?: string;
    companyId?: string;
  }