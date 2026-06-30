/**
 * Shared registry mapping insight metric keys to their component input columns.
 * Used by both FeatureAnalyticsView (to populate initial data) and
 * AnalyticsDetail (to re-populate on data rebuild).
 */

export const CIRCULAR_ECONOMY_FASHION_HEADERS = ['Recyclable Materials %', 'Recyclable Packaging %', 'Fresh Water Consumed %', 'Water Recycled %'];

export interface CompanyKPIs {
  kpis: Record<string, string | undefined>;
  industry?: string;
  insights?: Record<string, any>;
  hasEnvironmentFeature?: boolean;
}

export interface RatioColumnConfig {
  headers: string[];
  getValues: (c: CompanyKPIs) => Record<string, string>;
}

const r2 = (v: number): number => Math.round(v * 100) / 100;

export const RATIO_COMPONENT_COLUMNS: Record<string, RatioColumnConfig> = {
  genderDiversityRatio: {
    headers: ['Male Employees', 'Female Employees'],
    getValues: (c) => {
      const maleKeys = ['employees_wc_male_fulltime', 'employees_wc_male_contractual', 'employees_wc_male_parttime', 'employees_bc_male_fulltime', 'employees_bc_male_contractual', 'employees_bc_male_parttime'];
      const femaleKeys = ['employees_wc_female_fulltime', 'employees_wc_female_contractual', 'employees_wc_female_parttime', 'employees_bc_female_fulltime', 'employees_bc_female_contractual', 'employees_bc_female_parttime'];
      const male = maleKeys.reduce((s, k) => s + (parseFloat(c.kpis[k] || '0') || 0), 0);
      const female = femaleKeys.reduce((s, k) => s + (parseFloat(c.kpis[k] || '0') || 0), 0);
      return { 'Male Employees': String(Math.round(male)), 'Female Employees': String(Math.round(female)) };
    },
  },
  genderPayParityIndex: {
    headers: ['Female Wages', 'Female Count', 'Male Wages', 'Male Count'],
    getValues: (c) => {
      const pn = (k: string) => parseFloat(c.kpis[k] || '0') || 0;
      const femaleWages = pn('employees_wc_wages_female') + pn('employees_bc_wages_female');
      const femaleCount = pn('employees_wc_female_fulltime') + pn('employees_wc_female_contractual') + pn('employees_wc_female_parttime') + pn('employees_bc_female_fulltime') + pn('employees_bc_female_contractual') + pn('employees_bc_female_parttime');
      const maleWages = pn('employees_wc_wages_male') + pn('employees_bc_wages_male');
      const maleCount = pn('employees_wc_male_fulltime') + pn('employees_wc_male_contractual') + pn('employees_wc_male_parttime') + pn('employees_bc_male_fulltime') + pn('employees_bc_male_contractual') + pn('employees_bc_male_parttime');
      return { 'Female Wages': String(Math.round(femaleWages * 100) / 100), 'Female Count': String(Math.round(femaleCount)), 'Male Wages': String(Math.round(maleWages * 100) / 100), 'Male Count': String(Math.round(maleCount)) };
    },
  },
  wcToBcRatio: {
    headers: ['White Collar Total', 'Blue Collar Total'],
    getValues: (c) => {
      const p = (k: string) => parseFloat(c.kpis[k] || '0') || 0;
      const wc = p('employees_wc_male_fulltime') + p('employees_wc_male_contractual') + p('employees_wc_male_parttime') + p('employees_wc_female_fulltime') + p('employees_wc_female_contractual') + p('employees_wc_female_parttime');
      const bc = p('employees_bc_male_fulltime') + p('employees_bc_male_contractual') + p('employees_bc_male_parttime') + p('employees_bc_female_fulltime') + p('employees_bc_female_contractual') + p('employees_bc_female_parttime');
      return { 'White Collar Total': String(Math.round(wc)), 'Blue Collar Total': String(Math.round(bc)) };
    },
  },
  womenInLeadershipPct: {
    headers: ['Female C-Level', 'Total C-Level'],
    getValues: (c) => ({
      'Female C-Level': String(parseFloat(c.kpis['leadership_clevel_female'] || '0') || 0),
      'Total C-Level': String(parseFloat(c.kpis['leadership_clevel_total'] || '0') || 0),
    }),
  },
  womenInBoardPct: {
    headers: ['Female Board Members', 'Total Board Members'],
    getValues: (c) => ({
      'Female Board Members': String(parseFloat(c.kpis['leadership_board_female'] || '0') || 0),
      'Total Board Members': String(parseFloat(c.kpis['leadership_board_total'] || '0') || 0),
    }),
  },
  cxoPayRatio: {
    headers: ['Avg CXO Comp per CXO (INR Cr)', 'Avg WC Employee Comp (INR Cr)'],
    getValues: (c) => {
      const p = (k: string) => parseFloat(c.kpis[k] || '0') || 0;
      const totalCxoComp = p('leadership_avg_cxo_compensation');
      const totalExecs = p('leadership_clevel_total');
      const avgPerCxo = totalExecs > 0 ? totalCxoComp / totalExecs : 0;
      const wcEmployment = p('employees_wc_male_fulltime') + p('employees_wc_male_contractual') + p('employees_wc_male_parttime') + p('employees_wc_female_fulltime') + p('employees_wc_female_contractual') + p('employees_wc_female_parttime');
      const wcGrossWages = p('employees_wc_wages_male') + p('employees_wc_wages_female');
      const avgEmployeeComp = wcEmployment > 0 ? wcGrossWages / wcEmployment : 0;
      return { 'Avg CXO Comp per CXO (INR Cr)': String(r2(avgPerCxo)), 'Avg WC Employee Comp (INR Cr)': String(r2(avgEmployeeComp)) };
    },
  },
  pwdInclusionRate: {
    headers: ['PwD %'],
    getValues: (c) => ({ 'PwD %': String(parseFloat(c.kpis['employees_pwd_percentage'] || '0') || 0) }),
  },
  jobsPerCrRevenue: {
    headers: ['Total Employees', 'Net Revenue (₹ Cr)'],
    getValues: (c) => {
      const p = (k: string) => parseFloat(c.kpis[k] || '0') || 0;
      const totalEmp = ['employees_wc_male_fulltime', 'employees_wc_male_contractual', 'employees_wc_male_parttime', 'employees_wc_female_fulltime', 'employees_wc_female_contractual', 'employees_wc_female_parttime', 'employees_bc_male_fulltime', 'employees_bc_male_contractual', 'employees_bc_male_parttime', 'employees_bc_female_fulltime', 'employees_bc_female_contractual', 'employees_bc_female_parttime'].reduce((s, k) => s + p(k), 0);
      return { 'Total Employees': String(Math.round(totalEmp)), 'Net Revenue (₹ Cr)': String(p('net_revenue')) };
    },
  },
  virginPlasticPct: {
    headers: ['Primary Plastic Virgin (MT)', 'Secondary Plastic Virgin (MT)', 'Total Plastic (MT)'],
    getValues: (c) => {
      const p = (k: string) => parseFloat(c.kpis[k] || '0') || 0;
      const priVirgin = p('food_pkg_basic_primary_breakup_primary_plastic_virgin') + p('fashion_primary_pkg_plastic_recyclable_mt') + p('fashion_primary_pkg_plastic_non_recyclable_mt');
      const secVirgin = p('food_pkg_detailed_secondary_breakup_secondary_plastic_virgin') + p('fashion_secondary_pkg_plastic_recyclable_mt') + p('fashion_secondary_pkg_plastic_non_recyclable_mt');
      const totalPlastic = priVirgin + p('food_pkg_basic_primary_breakup_primary_plastic_recycled') + secVirgin + p('food_pkg_detailed_secondary_breakup_secondary_plastic_recycled');
      return { 'Primary Plastic Virgin (MT)': String(r2(priVirgin)), 'Secondary Plastic Virgin (MT)': String(r2(secVirgin)), 'Total Plastic (MT)': String(r2(totalPlastic)) };
    },
  },
  recycledContentRatio: {
    headers: ['Primary Plastic Recycled (MT)', 'Secondary Plastic Recycled (MT)', 'Total Plastic (MT)'],
    getValues: (c) => {
      const p = (k: string) => parseFloat(c.kpis[k] || '0') || 0;
      const pv = p('food_pkg_basic_primary_breakup_primary_plastic_virgin') + p('fashion_primary_pkg_plastic_recyclable_mt') + p('fashion_primary_pkg_plastic_non_recyclable_mt');
      const pr = p('food_pkg_basic_primary_breakup_primary_plastic_recycled');
      const sv = p('food_pkg_detailed_secondary_breakup_secondary_plastic_virgin') + p('fashion_secondary_pkg_plastic_recyclable_mt') + p('fashion_secondary_pkg_plastic_non_recyclable_mt');
      const sr = p('food_pkg_detailed_secondary_breakup_secondary_plastic_recycled');
      return { 'Primary Plastic Recycled (MT)': String(r2(pr)), 'Secondary Plastic Recycled (MT)': String(r2(sr)), 'Total Plastic (MT)': String(r2(pv + pr + sv + sr)) };
    },
  },
  mtPlasticPerCrRevenue: {
    headers: ['Total Plastic (MT)', 'Net Revenue (₹ Cr)'],
    getValues: (c) => {
      const p = (k: string) => parseFloat(c.kpis[k] || '0') || 0;
      const totalPlastic = p('food_pkg_basic_primary_breakup_primary_plastic_virgin') + p('food_pkg_basic_primary_breakup_primary_plastic_recycled') + p('food_pkg_detailed_secondary_breakup_secondary_plastic_virgin') + p('food_pkg_detailed_secondary_breakup_secondary_plastic_recycled') + p('fashion_primary_pkg_plastic_recyclable_mt') + p('fashion_primary_pkg_plastic_non_recyclable_mt') + p('fashion_secondary_pkg_plastic_recyclable_mt') + p('fashion_secondary_pkg_plastic_non_recyclable_mt') + p('fashion_warehouse_pkg_plastic_recyclable_mt') + p('fashion_warehouse_pkg_plastic_non_recyclable_mt');
      return { 'Total Plastic (MT)': String(r2(totalPlastic)), 'Net Revenue (₹ Cr)': String(p('net_revenue')) };
    },
  },
  mtPackagingPer1000Customers: {
    headers: ['Total Packaging (MT)', 'Total Customers'],
    getValues: (c) => ({
      'Total Packaging (MT)': String(parseFloat(c.kpis['food_pkg_basic_total_total_material_used'] || '0') || 0),
      'Total Customers': String(parseFloat(c.kpis['total_customers_served'] || '0') || 0),
    }),
  },
  eprComplianceRate: {
    headers: ['EPR Compliance (%)', 'Status'],
    getValues: (c) => {
      const pct = parseFloat(c.kpis['food_pkg_basic_compliance_epr_compliance_pct'] || '0') || 0;
      return {
        'EPR Compliance (%)': String(pct),
        'Status': pct > 0 ? 'Compliant' : 'Not Compliant',
      };
    },
  },
  eprComplianceGap: {
    headers: ['EPR Targets (MT)', 'Packaging Recycled (MT)'],
    getValues: (c) => ({
      'EPR Targets (MT)': String(parseFloat(c.kpis['food_pkg_basic_compliance_epr_targets_cpcb'] || '0') || 0),
      'Packaging Recycled (MT)': String(parseFloat(c.kpis['food_pkg_basic_total_total_material_recycled'] || '0') || 0),
    }),
  },
  virginPlasticVsNonPlasticPrimary: {
    headers: ['Primary Plastic Virgin (MT)', 'Primary Total (MT)'],
    getValues: (c) => ({
      'Primary Plastic Virgin (MT)': String(parseFloat(c.kpis['food_pkg_basic_primary_breakup_primary_plastic_virgin'] || '0') || 0),
      'Primary Total (MT)': String(parseFloat(c.kpis['food_pkg_basic_primary_primary_total_material'] || '0') || 0),
    }),
  },
  virginPlasticVsNonPlasticSecondary: {
    headers: ['Secondary Plastic Virgin (MT)', 'Secondary Total (MT)'],
    getValues: (c) => ({
      'Secondary Plastic Virgin (MT)': String(parseFloat(c.kpis['food_pkg_detailed_secondary_breakup_secondary_plastic_virgin'] || '0') || 0),
      'Secondary Total (MT)': String(parseFloat(c.kpis['food_pkg_detailed_secondary_secondary_total_material'] || '0') || 0),
    }),
  },
  recyclableVsNonRecyclablePrimary: {
    headers: ['Recyclable (%)', 'Primary Total (MT)'],
    getValues: (c) => {
      const pn = (v: string | undefined) => { const n = parseFloat(v || '0'); return isNaN(n) ? 0 : n; };
      // Food: use direct mono-materials field
      const foodMono = pn(c.kpis['food_pkg_basic_primary_recyclability_primary_mono_materials']);
      if (foodMono > 0) {
        return {
          'Recyclable (%)': String(foodMono),
          'Primary Total (MT)': String(pn(c.kpis['food_pkg_basic_primary_primary_total_material'])),
        };
      }
      // Fashion: derive recyclable % from material breakup
      const fashPriTotal = pn(c.kpis['fashion_primary_pkg_cardboard_mt']) + pn(c.kpis['fashion_primary_pkg_paper_mt']) +
        pn(c.kpis['fashion_primary_pkg_plastic_recyclable_mt']) + pn(c.kpis['fashion_primary_pkg_plastic_non_recyclable_mt']) +
        pn(c.kpis['fashion_primary_pkg_fabric_mt']) + pn(c.kpis['fashion_primary_pkg_other_mt']);
      if (fashPriTotal > 0) {
        const recyclable = pn(c.kpis['fashion_primary_pkg_plastic_recyclable_mt']) + pn(c.kpis['fashion_primary_pkg_cardboard_mt']) +
          pn(c.kpis['fashion_primary_pkg_paper_mt']) + pn(c.kpis['fashion_primary_pkg_fabric_mt']);
        return {
          'Recyclable (%)': String(Math.round((recyclable / fashPriTotal) * 100 * 100) / 100),
          'Primary Total (MT)': String(Math.round(fashPriTotal * 100) / 100),
        };
      }
      return { 'Recyclable (%)': '0', 'Primary Total (MT)': '0' };
    },
  },
  voluntaryPlasticNeutralityRate: {
    headers: ['Voluntary Plastic Neutrality (%)', 'Status'],
    getValues: (c) => {
      const pct = parseFloat(c.kpis['food_pkg_basic_compliance_voluntary_plastic_neutrality'] || '0') || 0;
      return {
        'Voluntary Plastic Neutrality (%)': String(pct),
        'Status': pct > 0 ? 'Active' : 'Not Active',
      };
    },
  },
  plasticReductionPct: {
    headers: ['Q1 Virgin Plastic (MT)', 'Q4 Virgin Plastic (MT)', 'Q1 Plastic Intensity', 'Q4 Plastic Intensity'],
    getValues: () => ({ 'Q1 Virgin Plastic (MT)': '-', 'Q4 Virgin Plastic (MT)': '-', 'Q1 Plastic Intensity': '-', 'Q4 Plastic Intensity': '-' }),
  },
  supplyChainSustainabilityScore: {
    headers: ['Supplier CoC (In Place)', 'Supplier CoC (Training)', 'DEI Vendor %', 'Gender Ratio %', 'Women Leadership %', 'Pay Parity Index'],
    getValues: (c) => {
      const supplierCocInPlace = (c.kpis['policy_supplier_code_of_conduct_in_place'] || '').toLowerCase();
      const cocInPlaceVal = (supplierCocInPlace === 'yes' || supplierCocInPlace === 'true' || supplierCocInPlace === '1') ? 'Yes' : 'No';
      const supplierCocTraining = (c.kpis['policy_supplier_code_of_conduct_training'] || '').toLowerCase();
      const cocTrainingVal = (supplierCocTraining === 'yes' || supplierCocTraining === 'true' || supplierCocTraining === '1') ? 'Yes' : 'No';
      const vendorCats = ['input_materials', 'manufacturing', 'packaging', 'logistics_warehousing', 'stores_clinics'];
      let deiCount = 0, totalCount = 0;
      vendorCats.forEach(cat => {
        const numV = c.kpis[`vendor_mis_${cat}_num_vendors`];
        if (numV && numV.trim() && numV !== '0' && numV.toLowerCase() !== 'n/a') {
          totalCount++;
          const deiRaw = c.kpis[`vendor_mis_${cat}_dei_factors`];
          if (deiRaw) { try { const parsed = JSON.parse(deiRaw); if (Array.isArray(parsed) && parsed.length > 0) deiCount++; } catch { if (deiRaw.trim()) deiCount++; } }
        }
      });
      const deiPct = totalCount > 0 ? r2((deiCount / totalCount) * 100) : 0;
      const p = (k: string) => parseFloat(c.kpis[k] || '0') || 0;
      const maleKeys = ['employees_wc_male_fulltime', 'employees_wc_male_contractual', 'employees_wc_male_parttime', 'employees_bc_male_fulltime', 'employees_bc_male_contractual', 'employees_bc_male_parttime'];
      const femaleKeys = ['employees_wc_female_fulltime', 'employees_wc_female_contractual', 'employees_wc_female_parttime', 'employees_bc_female_fulltime', 'employees_bc_female_contractual', 'employees_bc_female_parttime'];
      const male = maleKeys.reduce((s, k) => s + p(k), 0);
      const female = femaleKeys.reduce((s, k) => s + p(k), 0);
      const totalEmp = male + female;
      const genderRatio = totalEmp > 0 ? r2((female / totalEmp) * 100) : 0;
      const womenLead = p('leadership_clevel_total') > 0 ? r2((p('leadership_clevel_female') / p('leadership_clevel_total')) * 100) : 0;
      const totalFemaleWages = p('employees_wc_wages_female') + p('employees_bc_wages_female');
      const totalMaleWages = p('employees_wc_wages_male') + p('employees_bc_wages_male');
      const payParity = (totalFemaleWages > 0 && female > 0 && totalMaleWages > 0 && male > 0)
        ? r2(Math.min(100, ((totalFemaleWages / female) / (totalMaleWages / male)) * 100))
        : 0;
      return { 'Supplier CoC (In Place)': cocInPlaceVal, 'Supplier CoC (Training)': cocTrainingVal, 'DEI Vendor %': String(deiPct), 'Gender Ratio %': String(genderRatio), 'Women Leadership %': String(womenLead), 'Pay Parity Index': String(payParity) };
    },
  },
  socialScore: {
    headers: ['Supplier CoC (In Place) 10%', 'Supplier CoC (Training) 10%', 'DEI Vendor % 10%', 'Gender Ratio 25%', 'Women Leadership 25%', 'Pay Parity 20%'],
    getValues: (c) => {
      // Use pre-computed percentile values if available (from applySocialScorePercentileNormalization)
      const sp = (c.insights as any)?._socialPercentiles;
      if (sp) {
        return {
          'Supplier CoC (In Place) 10%': sp.hasSourcing ? String(sp.cocInPlace) : 'N/A',
          'Supplier CoC (Training) 10%': sp.hasSourcing ? String(sp.cocTraining) : 'N/A',
          'DEI Vendor % 10%': sp.hasSourcing ? String(r2(sp.deiPctile)) : 'N/A',
          'Gender Ratio 25%': String(r2(sp.genderRatioPctile)),
          'Women Leadership 25%': String(r2(sp.womenLeadPctile)),
          'Pay Parity 20%': String(r2(sp.payParityPctile)),
        };
      }
      // Fallback: raw calculation (used when percentile normalization hasn't been applied)
      const p = (k: string) => parseFloat(c.kpis[k] || '0') || 0;
      const isY = (v: string | undefined) => { const s = (v || '').toLowerCase().trim(); return s === 'yes' || s === 'y' || s === 'true' || s === '1'; };
      const cocInPlace = isY(c.kpis['policy_supplier_code_of_conduct_in_place']) ? 100 : 0;
      const cocTraining = isY(c.kpis['policy_supplier_code_of_conduct_training']) ? 100 : 0;
      const vendorCats = ['input_materials', 'manufacturing', 'packaging', 'logistics_warehousing', 'stores_clinics'];
      let deiCount = 0, totalCount = 0;
      vendorCats.forEach(cat => {
        const numV = c.kpis[`vendor_mis_${cat}_num_vendors`];
        if (numV && numV.trim() && numV !== '0' && numV.toLowerCase() !== 'n/a') {
          totalCount++;
          const deiRaw = c.kpis[`vendor_mis_${cat}_dei_factors`];
          if (deiRaw) { try { const parsed = JSON.parse(deiRaw); if (Array.isArray(parsed) && parsed.length > 0) deiCount++; } catch { if (deiRaw.trim()) deiCount++; } }
        }
      });
      const deiPct = totalCount > 0 ? r2((deiCount / totalCount) * 100) : 0;
      const maleKeys = ['employees_wc_male_fulltime', 'employees_wc_male_contractual', 'employees_wc_male_parttime', 'employees_bc_male_fulltime', 'employees_bc_male_contractual', 'employees_bc_male_parttime'];
      const femaleKeys = ['employees_wc_female_fulltime', 'employees_wc_female_contractual', 'employees_wc_female_parttime', 'employees_bc_female_fulltime', 'employees_bc_female_contractual', 'employees_bc_female_parttime'];
      const male = maleKeys.reduce((s, k) => s + p(k), 0);
      const female = femaleKeys.reduce((s, k) => s + p(k), 0);
      const totalEmp = male + female;
      const genderRatio = totalEmp > 0 ? r2((female / totalEmp) * 100) : 0;
      const womenLead = p('leadership_clevel_total') > 0 ? r2((p('leadership_clevel_female') / p('leadership_clevel_total')) * 100) : 0;
      const totalFemaleWages = p('employees_wc_wages_female') + p('employees_bc_wages_female');
      const totalMaleWages = p('employees_wc_wages_male') + p('employees_bc_wages_male');
      const payParity = (totalFemaleWages > 0 && female > 0 && totalMaleWages > 0 && male > 0)
        ? r2(Math.min(100, ((totalFemaleWages / female) / (totalMaleWages / male)) * 100))
        : 0;
      return { 'Supplier CoC (In Place) 10%': String(cocInPlace), 'Supplier CoC (Training) 10%': String(cocTraining), 'DEI Vendor % 10%': String(deiPct), 'Gender Ratio 25%': String(genderRatio), 'Women Leadership 25%': String(womenLead), 'Pay Parity 20%': String(payParity) };
    },
  },
  msmeSupplierDependencyRatio: {
    headers: ['MSME Supplier %'],
    getValues: (c) => ({ 'MSME Supplier %': String(parseFloat(c.kpis['msme_supplier_percentage'] || '0') || 0) }),
  },
  supplyChainLocalizationIndex: {
    headers: ['Avg International Vendor %'],
    getValues: (c) => {
      const p = (k: string) => parseFloat(c.kpis[k] || '0') || 0;
      const vendorCats = ['input_materials', 'manufacturing', 'packaging', 'logistics_warehousing', 'stores_clinics'];
      const intlVals = vendorCats.map(cat => p(`vendor_mis_${cat}_pct_international`)).filter(v => v > 0);
      const avgIntl = intlVals.length > 0 ? intlVals.reduce((s, v) => s + v, 0) / intlVals.length : 0;
      return { 'Avg International Vendor %': String(r2(avgIntl)) };
    },
  },
  deiCompliantVendorPct: {
    headers: ['DEI Vendor Categories', 'Total Vendor Categories'],
    getValues: (c) => {
      const vendorCats = ['input_materials', 'manufacturing', 'packaging', 'logistics_warehousing', 'stores_clinics'];
      let deiCount = 0, totalCount = 0;
      vendorCats.forEach(cat => {
        const numV = c.kpis[`vendor_mis_${cat}_num_vendors`];
        if (numV && numV.trim() && numV !== '0' && numV.toLowerCase() !== 'n/a') {
          totalCount++;
          const deiRaw = c.kpis[`vendor_mis_${cat}_dei_factors`];
          if (deiRaw) { try { const p = JSON.parse(deiRaw); if (Array.isArray(p) && p.length > 0) deiCount++; } catch { if (deiRaw.trim()) deiCount++; } }
        }
      });
      return { 'DEI Vendor Categories': String(deiCount), 'Total Vendor Categories': String(totalCount) };
    },
  },
  smallVsLargeVendorMix: {
    headers: ['Small-Scale Vendors', 'Large-Scale Vendors'],
    getValues: (c) => {
      const vendorCats = ['input_materials', 'manufacturing', 'packaging', 'logistics_warehousing', 'stores_clinics'];
      let small = 0, large = 0;
      vendorCats.forEach(cat => {
        const size = c.kpis[`vendor_mis_${cat}_size`] || '';
        if (size === 'sme' || size === 'micro' || size === 'informal') small++;
        else if (size === 'mnc_large') large++;
      });
      return { 'Small-Scale Vendors': String(small), 'Large-Scale Vendors': String(large) };
    },
  },
  syntheticVsNaturalFiberRatio: {
    headers: ['Synthetic (MT)', 'Natural (MT)'],
    getValues: (c) => {
      const p = (k: string) => parseFloat(c.kpis[k] || '0') || 0;
      const syn = p('fashion_material_polyester_mt') + p('fashion_material_nylon_mt') + p('fashion_material_elastane_mt');
      const nat = p('fashion_material_cotton_mt') + p('fashion_material_wool_mt') + p('fashion_material_silk_mt') + p('fashion_material_linen_mt');
      return { 'Synthetic (MT)': String(r2(syn)), 'Natural (MT)': String(r2(nat)) };
    },
  },
  textileWasteRateMfg: {
    headers: ['Textile Waste Mfg (MT)', 'Total Materials (MT)'],
    getValues: (c) => ({
      'Textile Waste Mfg (MT)': String(parseFloat(c.kpis['fashion_textile_waste_manufacturing_mt'] || '0') || 0),
      'Total Materials (MT)': String(parseFloat(c.kpis['fashion_total_materials_mt'] || '0') || 0),
    }),
  },
  postMfgWasteRate: {
    headers: ['Post-Mfg Waste (MT)', 'Total Materials (MT)'],
    getValues: (c) => ({
      'Post-Mfg Waste (MT)': String(parseFloat(c.kpis['fashion_post_manufacturing_waste_mt'] || '0') || 0),
      'Total Materials (MT)': String(parseFloat(c.kpis['fashion_total_materials_mt'] || '0') || 0),
    }),
  },
  monoMaterialRecyclablePct: {
    headers: ['Recyclable Materials (%)'],
    getValues: (c) => ({
      'Recyclable Materials (%)': String(parseFloat(c.kpis['fashion_recyclable_materials_pct'] || '0') || 0),
    }),
  },
  packagingPlasticIntensityFashion: {
    headers: ['Pkg Plastic Total (MT)', 'Total Materials (MT)'],
    getValues: (c) => {
      const p = (k: string) => parseFloat(c.kpis[k] || '0') || 0;
      const plastic = p('fashion_primary_pkg_plastic_recyclable_mt') + p('fashion_primary_pkg_plastic_non_recyclable_mt') + p('fashion_secondary_pkg_plastic_recyclable_mt') + p('fashion_secondary_pkg_plastic_non_recyclable_mt');
      return { 'Pkg Plastic Total (MT)': String(r2(plastic)), 'Total Materials (MT)': String(p('fashion_total_materials_mt')) };
    },
  },
  recycledPlasticAdoptionFashion: {
    headers: ['Recyclable Plastic (MT)', 'Total Plastic (MT)'],
    getValues: (c) => {
      const p = (k: string) => parseFloat(c.kpis[k] || '0') || 0;
      const recyclable = p('fashion_primary_pkg_plastic_recyclable_mt') + p('fashion_secondary_pkg_plastic_recyclable_mt');
      const total = recyclable + p('fashion_primary_pkg_plastic_non_recyclable_mt') + p('fashion_secondary_pkg_plastic_non_recyclable_mt');
      return { 'Recyclable Plastic (MT)': String(r2(recyclable)), 'Total Plastic (MT)': String(r2(total)) };
    },
  },
  paperToPlasticRatioFashion: {
    headers: ['Paper (MT)', 'Plastic (MT)'],
    getValues: (c) => {
      const p = (k: string) => parseFloat(c.kpis[k] || '0') || 0;
      const paper = p('fashion_primary_pkg_paper_mt') + p('fashion_secondary_pkg_paper_mt');
      const plastic = p('fashion_primary_pkg_plastic_recyclable_mt') + p('fashion_primary_pkg_plastic_non_recyclable_mt') + p('fashion_secondary_pkg_plastic_recyclable_mt') + p('fashion_secondary_pkg_plastic_non_recyclable_mt');
      return { 'Paper (MT)': String(r2(paper)), 'Plastic (MT)': String(r2(plastic)) };
    },
  },
  caseResolutionRate: {
    headers: ['Total Incidents', 'Open Cases'],
    getValues: (c) => {
      const incidentTypes = ['posh', 'supplier_vendor', 'customer_grievance', 'employee_grievance', 'environmental', 'health_safety', 'security_data_privacy', 'negative_media', 'anti_bribery_corruption', 'other_regulatory'];
      let total = 0, open = 0;
      incidentTypes.forEach(t => { total += parseFloat(c.kpis[`incident_${t}_cases`] || '0') || 0; open += parseFloat(c.kpis[`incident_${t}_open_cases`] || '0') || 0; });
      return { 'Total Incidents': String(total), 'Open Cases': String(open) };
    },
  },
  highImpactIncidentRatio: {
    headers: ['High Impact Incidents', 'Total Incidents'],
    getValues: (c) => {
      const incidentTypes = ['posh', 'supplier_vendor', 'customer_grievance', 'employee_grievance', 'environmental', 'health_safety', 'security_data_privacy', 'negative_media', 'anti_bribery_corruption', 'other_regulatory'];
      let total = 0, high = 0;
      incidentTypes.forEach(t => { total += parseFloat(c.kpis[`incident_${t}_cases`] || '0') || 0; if ((c.kpis[`incident_${t}_impact`] || '').toLowerCase() === 'high') high += parseFloat(c.kpis[`incident_${t}_cases`] || '0') || 0; });
      return { 'High Impact Incidents': String(high), 'Total Incidents': String(total) };
    },
  },
  poshCaseIntensity: {
    headers: ['PoSH Cases', 'Total Employees'],
    getValues: (c) => {
      const p = (k: string) => parseFloat(c.kpis[k] || '0') || 0;
      const totalEmp = ['employees_wc_male_fulltime', 'employees_wc_male_contractual', 'employees_wc_male_parttime', 'employees_wc_female_fulltime', 'employees_wc_female_contractual', 'employees_wc_female_parttime', 'employees_bc_male_fulltime', 'employees_bc_male_contractual', 'employees_bc_male_parttime', 'employees_bc_female_fulltime', 'employees_bc_female_contractual', 'employees_bc_female_parttime'].reduce((s, k) => s + p(k), 0);
      return { 'PoSH Cases': String(p('incident_posh_cases')), 'Total Employees': String(Math.round(totalEmp)) };
    },
  },
  totalIncidentCount: {
    headers: ['Total Incidents'],
    getValues: (c) => {
      const incidentTypes = ['theft', 'fraud', 'corruption', 'data_breach', 'posh', 'child_labor', 'discrimination', 'env_safety', 'workplace_accident'];
      const total = incidentTypes.reduce((s, t) => s + (parseFloat(c.kpis[`incident_${t}_cases`] || '0') || 0), 0);
      return { 'Total Incidents': String(total) };
    },
  },
  healthcareAccessScale: {
    headers: ['Consultations/Screenings', 'Products/Services Offered'],
    getValues: (c) => ({
      'Consultations/Screenings': String(parseFloat(c.kpis['healthcare_consultations_screenings'] || '0') || 0),
      'Products/Services Offered': String(parseFloat(c.kpis['healthcare_products_services'] || '0') || 0),
    }),
  },
  policyAdoptionRate: {
    headers: ['Policies In Place', 'Total Policies'],
    getValues: (c) => {
      const policies = ['posh', 'code_of_conduct', 'supplier_code_of_conduct', 'health_and_safety', 'dei', 'hr', 'human_rights', 'esg', 'environment', 'grievance_internal', 'grievance_external', 'data_protection'];
      const isY = (v: string | undefined) => { const s = (v || '').toLowerCase().trim(); return s === 'yes' || s === 'y' || s === 'true' || s === '1'; };
      let inPlace = 0; policies.forEach(p => { if (isY(c.kpis[`policy_${p}_in_place`])) inPlace++; });
      return { 'Policies In Place': String(inPlace), 'Total Policies': String(policies.length) };
    },
  },
  trainingCoverageRate: {
    headers: ['Policies With Training', 'Total Policies'],
    getValues: (c) => {
      const policies = ['posh', 'code_of_conduct', 'supplier_code_of_conduct', 'health_and_safety', 'dei', 'hr', 'human_rights', 'esg', 'environment', 'grievance_internal', 'grievance_external', 'data_protection'];
      const isY = (v: string | undefined) => { const s = (v || '').toLowerCase().trim(); return s === 'yes' || s === 'y' || s === 'true' || s === '1'; };
      let withTraining = 0; policies.forEach(p => { if (isY(c.kpis[`policy_${p}_training`])) withTraining++; });
      return { 'Policies With Training': String(withTraining), 'Total Policies': String(policies.length) };
    },
  },
  waterRecyclingRate: {
    headers: ['Total Water Consumed (KL)', 'Avg Wastewater Recycled (%)'],
    getValues: (c) => {
      const p = (k: string) => parseFloat(c.kpis[k] || '0') || 0;
      const facilities = ['office', 'stores_coco', 'warehouses', 'manufacturing', 'dark_stores', 'distribution'];
      let totalConsumed = 0, totalRecycledPct = 0, count = 0;
      facilities.forEach(f => {
        const consumed = p(`water_detailed_${f}_water_consumed`);
        const recycled = p(`water_detailed_${f}_wastewater_recycled_pct`);
        if (consumed > 0) { totalConsumed += consumed; totalRecycledPct += recycled; count++; }
      });
      return { 'Total Water Consumed (KL)': String(r2(totalConsumed)), 'Avg Wastewater Recycled (%)': String(count > 0 ? r2(totalRecycledPct / count) : 0) };
    },
  },
  totalWaterConsumption: {
    headers: ['Total Water Consumed (KL)'],
    getValues: (c) => {
      const p = (k: string) => parseFloat(c.kpis[k] || '0') || 0;
      const facilities = ['office', 'stores_coco', 'warehouses', 'manufacturing', 'dark_stores', 'distribution'];
      let total = 0;
      facilities.forEach(f => { total += p(`water_detailed_${f}_water_consumed`); });
      return { 'Total Water Consumed (KL)': String(r2(total)) };
    },
  },
  totalEnergyConsumption: {
    headers: ['Total Energy Consumed (kWh)'],
    getValues: (c) => {
      const p = (k: string) => parseFloat(c.kpis[k] || '0') || 0;
      const facilities = ['office', 'stores_coco', 'warehouses', 'manufacturing', 'data_center', 'retail', 'distribution'];
      let total = 0;
      facilities.forEach(f => { total += p(`energy_detailed_${f}_energy_consumed`); });
      return { 'Total Energy Consumed (kWh)': String(r2(total)) };
    },
  },
  renewableEnergyMix: {
    headers: ['Total Energy Consumed (kWh)', 'Avg Renewable (%)'],
    getValues: (c) => {
      const p = (k: string) => parseFloat(c.kpis[k] || '0') || 0;
      const facilities = ['office', 'stores_coco', 'warehouses', 'manufacturing', 'data_center', 'retail', 'distribution'];
      let totalConsumed = 0, totalRenewPct = 0, count = 0;
      facilities.forEach(f => {
        const consumed = p(`energy_detailed_${f}_energy_consumed`);
        const renew = p(`energy_detailed_${f}_renewable_pct`);
        if (consumed > 0) { totalConsumed += consumed; totalRenewPct += renew; count++; }
      });
      return { 'Total Energy Consumed (kWh)': String(r2(totalConsumed)), 'Avg Renewable (%)': String(count > 0 ? r2(totalRenewPct / count) : 0) };
    },
  },
  wasteDiversionRate: {
    headers: ['Total Waste Generated (MT)', 'Avg Waste Recycled (%)'],
    getValues: (c) => {
      const p = (k: string) => parseFloat(c.kpis[k] || '0') || 0;
      const facilities = ['office', 'stores_coco', 'warehouses', 'manufacturing', 'dark_stores', 'distribution'];
      let totalGenerated = 0, totalRecycledPct = 0, count = 0;
      facilities.forEach(f => {
        const generated = p(`waste_detailed_${f}_waste_generated`);
        const recycled = p(`waste_detailed_${f}_waste_recycled_pct`);
        if (generated > 0) { totalGenerated += generated; totalRecycledPct += recycled; count++; }
      });
      return { 'Total Waste Generated (MT)': String(r2(totalGenerated)), 'Avg Waste Recycled (%)': String(count > 0 ? r2(totalRecycledPct / count) : 0) };
    },
  },
  totalWasteGeneratedInsight: {
    headers: ['Total Waste Generated (MT)'],
    getValues: (c) => {
      const p = (k: string) => parseFloat(c.kpis[k] || '0') || 0;
      const facilities = ['office', 'stores_coco', 'warehouses', 'manufacturing', 'dark_stores', 'distribution'];
      let total = 0;
      facilities.forEach(f => { total += p(`waste_detailed_${f}_waste_generated`); });
      return { 'Total Waste Generated (MT)': String(r2(total)) };
    },
  },
  csrSpendRatio: {
    headers: ['CSR Amount Spent (₹)', 'Net Revenue (₹ Cr)'],
    getValues: (c) => ({
      'CSR Amount Spent (₹)': String(parseFloat(c.kpis['csr_amount_spent'] || '0') || 0),
      'Net Revenue (₹ Cr)': String(parseFloat(c.kpis['net_revenue'] || '0') || 0),
    }),
  },
  eprComplianceGapFashion: {
    headers: ['EPR Target (%)', 'Actual Compliance (%)'],
    getValues: (c) => ({
      'EPR Target (%)': String(parseFloat(c.kpis['fashion_epr_target'] || '0') || 0),
      'Actual Compliance (%)': String(parseFloat(c.kpis['fashion_epr_compliance_pct'] || '0') || 0),
    }),
  },
  esgCompositeScore: {
    headers: ['E Score (35%)', 'S Score (25%)', 'G Score (40%)'],
    getValues: (c) => {
      // Use pre-computed insight values when available (ensures consistency with stat cards)
      if (c.insights) {
        const hasNoEnvFeature = c.hasEnvironmentFeature === false;
        const eSub = r2(c.insights.circularEconomyIndex ?? 0);
        const sSub = r2(c.insights.socialScore ?? 0);
        const gSub = r2(c.insights.governanceScore ?? 0);
        if (hasNoEnvFeature) {
          // Show N/A for E Score and adjusted weights for S & G only when feature is not activated
          return { 'E Score (35%)': 'N/A', 'S Score (25%)': String(sSub), 'G Score (40%)': String(gSub) };
        }
        return { 'E Score (35%)': String(eSub), 'S Score (25%)': String(sSub), 'G Score (40%)': String(gSub) };
      }

      // Fallback: compute from raw KPIs via other ratio configs
      const hasNoEnvFeatureFallback = c.hasEnvironmentFeature === false;
      const envComponents = RATIO_COMPONENT_COLUMNS.circularEconomyIndex.getValues(c);
      const extractNum = (s: string) => { const m = s.match(/:?\s*([\d.]+)$/); return m ? parseFloat(m[1]) || 0 : 0; };
      const isFashion = c.industry === 'Fashion & Lifestyle';
      let eSub: number;
      if (isFashion) {
        const c1 = extractNum(envComponents['Component 1']);
        const c2 = extractNum(envComponents['Component 2']);
        const c3 = extractNum(envComponents['Component 3']);
        const c4 = extractNum(envComponents['Component 4']);
        eSub = r2(Math.min(100, Math.min(100, c1) * 0.40 + Math.min(100, c2) * 0.40 + Math.min(100, c3) * 0.10 + Math.min(100, c4) * 0.10));
      } else {
        const c1 = extractNum(envComponents['Component 1']);
        const c2 = extractNum(envComponents['Component 2']);
        const c3 = extractNum(envComponents['Component 3']);
        const c4 = extractNum(envComponents['Component 4']);
        const c5 = extractNum(envComponents['Component 5']);
        const c6 = extractNum(envComponents['Component 6']);
        eSub = r2(Math.min(100, Math.min(100, c1) * 0.20 + Math.min(100, c2) * 0.30 + Math.min(100, c3) * 0.20 + Math.min(100, c4) * 0.10 + Math.min(100, c5) * 0.10 + Math.min(100, c6) * 0.10));
      }

      const eScoreDisplay = hasNoEnvFeatureFallback ? 'N/A' : String(eSub);

      const socialComponents = RATIO_COMPONENT_COLUMNS.socialScore.getValues(c);
      // If percentile normalization has been applied, use the pre-computed social score directly
      if ((c.insights as any)?._socialPercentiles) {
        const govComps = RATIO_COMPONENT_COLUMNS.governanceScore.getValues(c);
        return { 'E Score (35%)': eScoreDisplay, 'S Score (25%)': String(r2(c.insights.socialScore)), 'G Score (40%)': String(r2(parseFloat(govComps['Governance Score'] || '0') || 0)) };
      }
      const cocInPlace = parseFloat(socialComponents['Supplier CoC (In Place) 10%'] || '0') || 0;
      const cocTraining = parseFloat(socialComponents['Supplier CoC (Training) 10%'] || '0') || 0;
      const deiVendorPct = parseFloat(socialComponents['DEI Vendor % 10%'] || '0') || 0;
      const genderDiv = parseFloat(socialComponents['Gender Ratio 25%'] || '0') || 0;
      const womenLead = parseFloat(socialComponents['Women Leadership 25%'] || '0') || 0;
      const payParity = parseFloat(socialComponents['Pay Parity 20%'] || '0') || 0;
      const sSub = r2(Math.min(100,
        Math.min(100, cocInPlace) * 0.10 +
        Math.min(100, cocTraining) * 0.10 +
        Math.min(100, deiVendorPct) * 0.10 +
        Math.min(100, genderDiv) * 0.25 +
        Math.min(100, womenLead) * 0.25 +
        Math.min(100, payParity) * 0.20
      ));

      const govComponents = RATIO_COMPONENT_COLUMNS.governanceScore.getValues(c);
      const gSub = parseFloat(govComponents['Governance Score'] || '0') || 0;

      return { 'E Score (35%)': eScoreDisplay, 'S Score (25%)': String(sSub), 'G Score (40%)': String(r2(gSub)) };
    },
  },
  circularEconomyIndex: {
    headers: ['Virgin Plastic Reduction %', 'Plastic Intensity Score', 'Material Recycled %', 'EPR/VPN %', 'P&S Recycled/Pkg %', 'Recyclable %'],
    getValues: (c) => {
      const p = (k: string) => parseFloat(c.kpis[k] || '0') || 0;
      const r2v = (v: number) => Math.round(v * 100) / 100;
      const isFashion = c.industry === 'Fashion & Lifestyle';

      if (isFashion) {
        const recyclableMaterialsPct = p('fashion_recyclable_materials_pct');
        const priRecyclable = p('fashion_primary_pkg_cardboard_pct') + p('fashion_primary_pkg_paper_pct') + p('fashion_primary_pkg_fabric_pct');
        const secRecyclable = p('fashion_secondary_pkg_cardboard_pct') + p('fashion_secondary_pkg_paper_pct') + p('fashion_secondary_pkg_fabric_pct');
        const pkgRecyclablePct = r2v((priRecyclable + secRecyclable) / 2);
        const facilities = ['office', 'stores_coco', 'warehouses', 'manufacturing', 'dark_stores', 'distribution'];
        let freshWaterPct = 0, fwCnt = 0; facilities.forEach(f => { const consumed = p(`water_detailed_${f}_water_consumed`); if (consumed > 0) { freshWaterPct += p(`water_detailed_${f}_fresh_water_pct`); fwCnt++; } });
        const avgFreshWaterPct = fwCnt > 0 ? r2v(freshWaterPct / fwCnt) : 0;
        let waterRPct = 0, wCnt = 0; facilities.forEach(f => { const consumed = p(`water_detailed_${f}_water_consumed`); if (consumed > 0) { waterRPct += p(`water_detailed_${f}_wastewater_recycled_pct`); wCnt++; } });
        const avgWaterRecycled = wCnt > 0 ? r2v(waterRPct / wCnt) : 0;
        return {
          'Recyclable Materials %': String(recyclableMaterialsPct),
          'Recyclable Packaging %': String(pkgRecyclablePct),
          'Fresh Water Consumed %': String(avgFreshWaterPct),
          'Water Recycled %': String(avgWaterRecycled),
        };
      }

      const totalPkg = p('food_pkg_basic_total_total_material_used');
      const totalPkgRecycled = p('food_pkg_basic_total_total_material_recycled');
      const priPlasticVirgin = p('food_pkg_basic_primary_breakup_primary_plastic_virgin');
      const priPlasticRecycled = p('food_pkg_basic_primary_breakup_primary_plastic_recycled');
      const secPlasticVirgin = p('food_pkg_detailed_secondary_breakup_secondary_plastic_virgin');
      const secPlasticRecycled = p('food_pkg_detailed_secondary_breakup_secondary_plastic_recycled');
      const totalPlastic = priPlasticVirgin + priPlasticRecycled + secPlasticVirgin + secPlasticRecycled;
      const totalRecycledPlastic = priPlasticRecycled + secPlasticRecycled;
      // Use pre-computed cross-quarter virgin reduction if available (consistent with envScorePercentile & Packaging insight)
      const virginReduction = (c.insights as any)?._rawVirginReduction !== undefined
        ? r2v((c.insights as any)._rawVirginReduction)
        : (totalPlastic > 0 ? r2v((totalRecycledPlastic / totalPlastic) * 100) : 0);
      const revenue = p('net_revenue');
      const plasticIntensity = revenue > 0 ? totalPlastic / revenue : 0;
      // Only award a high intensity score if plastic-specific breakup fields were actually submitted
      const plasticKeys = [
        'food_pkg_basic_primary_breakup_primary_plastic_virgin',
        'food_pkg_basic_primary_breakup_primary_plastic_recycled',
        'food_pkg_detailed_secondary_breakup_secondary_plastic_virgin',
        'food_pkg_detailed_secondary_breakup_secondary_plastic_recycled',
      ];
      const anyPlasticSubmitted = plasticKeys.some(key => c.kpis[key] !== undefined && c.kpis[key] !== '');
      const intensityScore = anyPlasticSubmitted
        ? r2v(Math.max(0, 100 * (1 - Math.min(1, plasticIntensity))))
        : 0;
      const materialRecycled = totalPkg > 0 ? r2v((totalPkgRecycled / totalPkg) * 100) : 0;
      const eprPct = Math.min(100, p('food_pkg_basic_compliance_epr_compliance_pct'));
      const vpnPct = Math.min(100, p('food_pkg_basic_compliance_voluntary_plastic_neutrality'));
      const eprVpn = r2v(Math.max(eprPct, vpnPct));
      const priNonPlastic = p('food_pkg_basic_primary_breakup_primary_paper_recycled') + p('food_pkg_basic_primary_breakup_primary_metal') + p('food_pkg_basic_primary_breakup_primary_glass') + p('food_pkg_basic_primary_breakup_primary_plant_based');
      const secNonPlastic = p('food_pkg_detailed_secondary_breakup_secondary_paper_recycled') + p('food_pkg_detailed_secondary_breakup_secondary_metal') + p('food_pkg_detailed_secondary_breakup_secondary_glass') + p('food_pkg_detailed_secondary_breakup_secondary_plant_based');
      const allRecycledPct = totalPkg > 0 ? r2v(((totalRecycledPlastic + priNonPlastic + secNonPlastic) / totalPkg) * 100) : 0;
      const recyclablePct = p('food_pkg_basic_primary_recyclability_primary_mono_materials');
      return {
        'Virgin Plastic Reduction %': String(virginReduction),
        'Plastic Intensity Score': String(intensityScore),
        'Material Recycled %': String(materialRecycled),
        'EPR/VPN %': String(eprVpn),
        'P&S Recycled/Pkg %': String(allRecycledPct),
        'Recyclable %': String(recyclablePct),
      };
    },
  },
  deiCompositeScore: {
    headers: ['Supplier CoC (In Place) 10%', 'Supplier CoC (Training) 10%', 'DEI Vendor % 10%', 'Gender Ratio 25%', 'Women Leadership 25%', 'Pay Parity 20%'],
    getValues: (c) => {
      // Use pre-computed percentile values if available
      const sp = (c.insights as any)?._socialPercentiles;
      if (sp) {
        return {
          'Supplier CoC (In Place) 10%': sp.hasSourcing ? String(sp.cocInPlace) : 'N/A',
          'Supplier CoC (Training) 10%': sp.hasSourcing ? String(sp.cocTraining) : 'N/A',
          'DEI Vendor % 10%': sp.hasSourcing ? String(r2(sp.deiPctile)) : 'N/A',
          'Gender Ratio 25%': String(r2(sp.genderRatioPctile)),
          'Women Leadership 25%': String(r2(sp.womenLeadPctile)),
          'Pay Parity 20%': String(r2(sp.payParityPctile)),
        };
      }
      const p = (k: string) => parseFloat(c.kpis[k] || '0') || 0;
      const isY = (v: string | undefined) => { const s = (v || '').toLowerCase().trim(); return s === 'yes' || s === 'y' || s === 'true' || s === '1'; };
      const cocInPlace = isY(c.kpis['policy_supplier_code_of_conduct_in_place']) ? 100 : 0;
      const cocTraining = isY(c.kpis['policy_supplier_code_of_conduct_training']) ? 100 : 0;
      const vendorCats = ['input_materials', 'manufacturing', 'packaging', 'logistics_warehousing', 'stores_clinics'];
      let deiCount = 0, totalCount = 0;
      vendorCats.forEach(cat => { const numV = c.kpis[`vendor_mis_${cat}_num_vendors`]; if (numV && numV.trim() && numV !== '0' && numV.toLowerCase() !== 'n/a') { totalCount++; const deiRaw = c.kpis[`vendor_mis_${cat}_dei_factors`]; if (deiRaw) { try { const parsed = JSON.parse(deiRaw); if (Array.isArray(parsed) && parsed.length > 0) deiCount++; } catch { if (deiRaw.trim()) deiCount++; } } } });
      const deiPct = totalCount > 0 ? r2((deiCount / totalCount) * 100) : 0;
      const maleKeys = ['employees_wc_male_fulltime', 'employees_wc_male_contractual', 'employees_wc_male_parttime', 'employees_bc_male_fulltime', 'employees_bc_male_contractual', 'employees_bc_male_parttime'];
      const femaleKeys = ['employees_wc_female_fulltime', 'employees_wc_female_contractual', 'employees_wc_female_parttime', 'employees_bc_female_fulltime', 'employees_bc_female_contractual', 'employees_bc_female_parttime'];
      const male = maleKeys.reduce((s, k) => s + p(k), 0);
      const female = femaleKeys.reduce((s, k) => s + p(k), 0);
      const totalEmp = male + female;
      const genderDiv = totalEmp > 0 ? r2((female / totalEmp) * 100) : 0;
      const womenLead = p('leadership_clevel_total') > 0 ? r2((p('leadership_clevel_female') / p('leadership_clevel_total')) * 100) : 0;
      const totalFemaleWages = p('employees_wc_wages_female') + p('employees_bc_wages_female');
      const totalMaleWages = p('employees_wc_wages_male') + p('employees_bc_wages_male');
      const payParity = (totalFemaleWages > 0 && female > 0 && totalMaleWages > 0 && male > 0)
        ? r2(Math.min(100, ((totalFemaleWages / female) / (totalMaleWages / male)) * 100)) : 0;
      return { 'Supplier CoC (In Place) 10%': String(cocInPlace), 'Supplier CoC (Training) 10%': String(cocTraining), 'DEI Vendor % 10%': String(deiPct), 'Gender Ratio 25%': String(genderDiv), 'Women Leadership 25%': String(womenLead), 'Pay Parity 20%': String(payParity) };
    },
  },
  governanceScore: {
    headers: ['Policy Adoption %', 'Training Coverage %', 'High Impact Unresolved %', 'Governance Score'],
    getValues: (c) => {
      const isY = (v: string | undefined) => { const s = (v || '').toLowerCase().trim(); return s === 'yes' || s === 'y' || s === 'true' || s === '1'; };
      const policies = ['posh', 'code_of_conduct', 'supplier_code_of_conduct', 'health_and_safety', 'dei', 'hr', 'human_rights', 'esg', 'environment', 'grievance_internal', 'grievance_external', 'data_protection'];
      let inPlace = 0, withTraining = 0;
      policies.forEach(pol => { if (isY(c.kpis[`policy_${pol}_in_place`])) inPlace++; if (isY(c.kpis[`policy_${pol}_training`])) withTraining++; });
      const policyAdopt = r2((inPlace / policies.length) * 100);
      const trainingCov = r2((withTraining / policies.length) * 100);
      const p = (k: string) => parseFloat(c.kpis[k] || '0') || 0;
      const incidentTypes = ['posh', 'supplier_vendor', 'customer_grievance', 'employee_grievance', 'environmental', 'health_safety', 'security_data_privacy', 'negative_media', 'anti_bribery_corruption', 'other_regulatory'];
      let totalInc = 0, highImpactCount = 0;
      incidentTypes.forEach(t => { totalInc += p(`incident_${t}_cases`); const impact = (c.kpis[`incident_${t}_impact`] || '').toLowerCase(); if (impact === 'high') highImpactCount += p(`incident_${t}_cases`); });
      const highImpactUnresolvedPct = totalInc > 0 ? r2((highImpactCount / totalInc) * 100) : 0;
      const gScore = r2(policyAdopt * 0.40 + trainingCov * 0.40 + Math.max(0, 100 - highImpactUnresolvedPct) * 0.20);
      return { 'Policy Adoption %': String(policyAdopt), 'Training Coverage %': String(trainingCov), 'High Impact Unresolved %': String(highImpactUnresolvedPct), 'Governance Score': String(gScore) };
    },
  },
};
