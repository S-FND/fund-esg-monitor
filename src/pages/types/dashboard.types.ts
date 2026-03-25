// src/pages/types/dashboard.types.ts
export interface DashboardData {
  dashboardEnvironment?: EnvironmentData;
  dashboardGovernance?: GovernanceData;
  dashboardSocial?: SocialData;
  dashboardOtherData?: OtherData;
  percentage_of_board?: BoardMeetingData[];
}

export interface Fund {
  _id: string;
  name: string;
  size?: number;
  currency?: string;
  sectorFocus?: string;
  stageOfInvestment?: string;
  inclusion?: string[];
  exclusion?: string[];
  dashboardTopics?: string[]; // Add this field
  companies?: Array<{
    company_id: string;
    company_name?: string;
    investmentAmount?: number;
    equityPercentage?: number;
  }>;
}
export interface EnvironmentData {
  energy?: {
    pie?: {
      labels?: string[];
      data?: number[];
    };
    bar?: {
      labels?: string[];
      datasets?: Array<{
        label: string;
        data: number[];
      }>;
    };
  };
  water_withdrawl?: {
    pie?: {
      labels?: string[];
      data?: number[];
    };
  };
  water_discharge?: {
    pie?: {
      labels?: string[];
      data?: number[];
    };
  };
  waste_management?: {
    pie?: {
      labels?: string[];
      data?: number[];
    };
  };
  waste_recovery?: {
    xAxisLabels?: string[];
    yAxisLabels?: string[];
    data?: number[][];
  };
  gh_gas_emission?: {
    pie?: {
      labels?: string[];
      data?: number[];
    };
  };
  air_emission?: {
    pie?: {
      labels?: string[];
      data?: number[];
    };
  };
  disposal_method?: {
    xAxisLabels?: string[];
    yAxisLabels?: string[];
    data?: number[][];
  };
}

export interface GovernanceData {
  board_members_gender?: {
    pie?: {
      labels?: string[];
      data?: number[];
    };
  };
  board_pay_parity?: {
    pie?: {
      labels?: string[];
      data?: number[];
    };
  };
  esg_skilled?: {
    pie?: {
      labels?: string[];
      data?: number[];
    };
  };
  details_of_complaints?: {
    pie?: {
      labels?: string[];
      data?: number[];
    };
  };
  disciplinary_action?: {
    pie?: {
      labels?: string[];
      data?: number[];
    };
  };
  political_contributions?: {
    pie?: {
      labels?: string[];
      data?: number[];
    };
  };
  litigation_risks?: {
    pie?: {
      labels?: string[];
      data?: number[];
    };
  };
  the_ratio_of_independent?: {
    pie?: {
      labels?: string[];
      data?: number[];
    };
  };
}

export interface SocialData {
  key_persons?: {
    pie?: {
      labels?: string[];
      data?: number[];
    };
  };
  rnd_percentage?: {
    pie?: {
      labels?: string[];
      data?: number[];
    };
  };
  gross_wages?: {
    pie?: {
      labels?: string[];
      data?: number[];
    };
  };
  wellbeing_measures?: {
    pie?: {
      labels?: string[];
      data?: number[];
    };
  };
  supply_partner?: {
    pie?: {
      labels?: string[];
      data?: number[];
    };
  };
  greivances?: {
    mbar?: {
      xAxis?: string[];
      series?: Array<{
        name: string;
        data: number[];
      }>;
    };
  };
  safety_incidents?: {
    mbar?: {
      xAxis?: string[];
      series?: Array<{
        name: string;
        data: number[];
      }>;
    };
  };
  turnover_rate?: {
    mbar?: {
      xAxis?: string[];
      series?: Array<{
        name: string;
        data: number[];
      }>;
    };
  };
  employee_diversity?: any;
  workers_diversity?: any;
  differently_abled?: any;
  workers_differently_abled?: any;
  minimum_wages?: any;
  workers_minimum_wages?: any;
  life_coverage?: any;
  workers_life_coverage?: any;
  accident_insurance?: any;
  workers_accident_insurance?: any;
}

export interface OtherData {
  dashboardRiskData?: {
    environment?: Array<{ value: string; count?: number }>;
    social?: Array<{ value: string; count?: number }>;
    governance?: Array<{ value: string; count?: number }>;
  };
  dashboardNonComplianceData?: Array<{
    area: string;
    description: string;
    count?: number;
  }>;
  dashboardEsgMeterData?: {
    environment?: { percentage: number; num?: number[]; deno?: number[] };
    social?: { percentage: number; num?: number[]; deno?: number[] };
    governance?: { percentage: number; num?: number[]; deno?: number[] };
  };
  dashboardSDGStratgyData?: Array<{
    goal?: string;
    what_goal?: string;
    what_target?: string;
    what_text?: string | null;
    what_img?: string;
    who?: string;
    abc_goal?: string | null;
    abc_goal_description?: string;
    impact_thesis?: string;
    baseline_metric?: string;
    target_metric?: string;
    current_status?: string;
    count?: number;
  }>;
}

export interface BoardMeetingData {
  _id: string;
  date_of_meeting: string;
  attendance: number;
  createdAt?: string;
  updatedAt?: string;
}
