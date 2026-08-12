/**
 * Local type mirrors for the panels bundled with the cumulative-analytics
 * feature. Kept here so the folder does not have to reference the shared
 * `@/hooks/useAnalyticsDashboardData` or `@/hooks/usePortfolioRankings`
 * modules directly. If those shared shapes change, update these mirrors.
 */

export interface AggregationMetrics {
  netRevenue: number;
  revenueTier2Plus: number;
  totalCustomersServed: number;
  uniqueFemaleCustomersPct: number;
  msmeSupplierPct: number;
  totalWcEmployees: number;
  totalWcWages: number;
  totalBcEmployees: number;
  totalBcWages: number;
  totalEmployment: number;
  totalGrossWages: number;
  pwdPct: number;
  attritionRate: number;
  cLevelFemale: number;
  boardFemale: number;
  avgCxoCompensation: number;
  avgEmployeeCompensation: number;
  totalPackagingMT: number;
  totalPackagingRecycledMT: number;
  eprTargetsMT: number;
  primaryTotalMT: number;
  primaryRecyclablePct: number;
  secondaryTotalMT: number;
  secondaryRecyclablePct: number;
  fashionTotalMaterials: number;
  fashionSustainablePct: number;
  fashionRecyclablePct: number;
  fashionNonRecyclablePct: number;
  fashionPlasticPrimaryRecyclable: number;
  fashionPlasticPrimaryNonRecyclable: number;
  fashionPlasticSecondaryRecyclable: number;
  fashionPlasticSecondaryNonRecyclable: number;
  healthcareConsultations: number;
  healthcareProductsOffered: number;
  csrSpendAmount: number;
  voluntaryPlasticNeutralityPct: number;
  fashionSyntheticMT: number;
  fashionNaturalMT: number;
  fashionTextileWasteMfgMT: number;
  fashionPostMfgWasteMT: number;
  fashionPkgPlasticTotalMT: number;
  fashionPkgRecycledPlasticMT: number;
  fashionPkgPaperMT: number;
  totalWaterConsumed: number;
  avgWastewaterRecycledPct: number;
  avgFreshWaterPct: number;
  fashionRecyclablePackagingPct: number;
  totalEnergyConsumed: number;
  avgRenewableEnergyPct: number;
  totalWasteGenerated: number;
  avgWasteRecycledPct: number;
  wcMale: number;
  wcFemale: number;
  wcWagesMale: number;
  wcWagesFemale: number;
  bcMale: number;
  bcFemale: number;
  bcWagesMale: number;
  bcWagesFemale: number;
  cLevelTotal: number;
  boardTotal: number;
  boardIndependent: number;
  primaryPlasticVirgin: number;
  primaryPlasticRecycled: number;
  primaryNonPlastic: number;
  secondaryPlasticVirgin: number;
  secondaryPlasticRecycled: number;
  secondaryNonPlastic: number;
  totalIncidents: number;
  totalOpenCases: number;
  highImpactIncidents: number;
  poshCases: number;
  policiesInPlace: number;
  policiesWithTraining: number;
  totalPolicies: number;
  avgInternationalVendorPct: number;
  vendorCategoriesWithDEI: number;
  totalVendorCategories: number;
  smallScaleVendors: number;
  largeScaleVendors: number;
  envPolicyInPlace: number;
  supplierCocInPlace: number;
  supplierCocTraining: number;
}

export interface InsightMetrics {
  genderDiversityRatio: number;
  genderPayParityIndex: number;
  wcToBcRatio: number;
  womenInLeadershipPct: number;
  womenInBoardPct: number;
  cxoPayRatio: number;
  pwdInclusionRate: number;
  jobsPerCrRevenue: number;
  virginPlasticPct: number;
  recycledContentRatio: number;
  plasticIntensityPerCrRevenue: number;
  eprComplianceRate: number;
  eprComplianceGap: number;
  mtPlasticPerCrRevenue: number;
  mtPackagingPer1000Customers: number;
  caseResolutionRate: number;
  highImpactIncidentRatio: number;
  poshCaseIntensity: number;
  policyAdoptionRate: number;
  trainingCoverageRate: number;
  waterRecyclingRate: number;
  renewableEnergyMix: number;
  wasteDiversionRate: number;
  circularEconomyIndex: number;
  deiCompositeScore: number;
  esgCompositeScore: number;
  supplyChainSustainabilityScore: number;
  socialScore: number;
  governanceScore: number;
  msmeSupplierDependencyRatio: number;
  supplyChainLocalizationIndex: number;
  deiCompliantVendorPct: number;
  smallVsLargeVendorMix: number;
  virginPlasticVsNonPlasticPrimary: number;
  virginPlasticVsNonPlasticSecondary: number;
  recyclableVsNonRecyclablePrimary: number;
  voluntaryPlasticNeutralityRate: number;
  syntheticVsNaturalFiberRatio: number;
  textileWasteRateMfg: number;
  postMfgWasteRate: number;
  monoMaterialRecyclablePct: number;
  packagingPlasticIntensityFashion: number;
  recycledPlasticAdoptionFashion: number;
  paperToPlasticRatioFashion: number;
  totalIncidentCount: number;
  healthcareAccessScale: number;
  totalWaterConsumption: number;
  totalEnergyConsumption: number;
  totalWasteGeneratedInsight: number;
  csrSpendRatio: number;
  plasticReductionPct: number;
  eprComplianceGapFashion: number;
  _hasNoEnvData?: boolean;
}

export interface CompanyRawMetrics {
  companyId: string;
  companyName: string;
  brand: string;
  industry: string;
  fund: string;
  revenueStage: string;
  kpis: Record<string, string>;
  aggregation: AggregationMetrics;
  insights: InsightMetrics;
  usesFashionPackaging?: boolean;
  hasEnvironmentFeature?: boolean;
}

export interface ESGCompleteness {
  E: number;
  S: number;
  G: number;
  overall: number;
}

export interface CompanyRanking {
  companyId: string;
  companyName: string;
  brand: string;
  industry: string;
  completionPct: number;
  consistencyPct: number;
  timelinessScore: number;
  completenessPercentile: number;
  consistencyPercentile: number;
  timelinessPercentile: number;
  esgCompleteness: ESGCompleteness;
}
