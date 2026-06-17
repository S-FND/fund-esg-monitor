/**
 * Environment Score Percentile Normalization
 * 
 * Normalizes raw Environment Score component values to percentile (0-100)
 * using min-max normalization within each group (non-fashion / fashion).
 * 
 * Non-Fashion: highest raw = 100, lowest = 0 (except Plastic Intensity which is inverted)
 * Fashion: highest raw = 100, lowest = 0
 * 
 * Companies with 0 / NA / missing data get percentile 0.
 */

const r2 = (v: number) => Math.round(v * 100) / 100;

function pv(kpis: Record<string, string>, k: string): number {
  return parseFloat(kpis[k] || '0') || 0;
}

export function extractNonFashionRawComponents(kpis: Record<string, string>, preComputedVirginReduction?: number) {
  const totalPkg = pv(kpis, 'food_pkg_basic_total_total_material_used');
  const totalPkgRecycled = pv(kpis, 'food_pkg_basic_total_total_material_recycled');
  const priPlasticVirgin = pv(kpis, 'food_pkg_basic_primary_breakup_primary_plastic_virgin');
  const priPlasticRecycled = pv(kpis, 'food_pkg_basic_primary_breakup_primary_plastic_recycled');
  const secPlasticVirgin = pv(kpis, 'food_pkg_detailed_secondary_breakup_secondary_plastic_virgin');
  const secPlasticRecycled = pv(kpis, 'food_pkg_detailed_secondary_breakup_secondary_plastic_recycled');
  const totalPlastic = priPlasticVirgin + priPlasticRecycled + secPlasticVirgin + secPlasticRecycled;
  const totalRecycledPlastic = priPlasticRecycled + secPlasticRecycled;

  // Use pre-computed cross-quarter intensity reduction — preserve negative values for full-range percentile
  const virginReduction = preComputedVirginReduction !== undefined
    ? preComputedVirginReduction
    : (totalPlastic > 0 ? (totalRecycledPlastic / totalPlastic) * 100 : 0);
  const revenue = pv(kpis, 'net_revenue');
  const plasticIntensity = revenue > 0 ? totalPlastic / revenue : 0;
  const materialRecycled = totalPkg > 0 ? Math.min(100, (totalPkgRecycled / totalPkg) * 100) : 0;
  const eprPct = Math.min(100, pv(kpis, 'food_pkg_basic_compliance_epr_compliance_pct'));
  const vpnPct = Math.min(100, pv(kpis, 'food_pkg_basic_compliance_voluntary_plastic_neutrality'));
  const eprVpn = Math.min(100, Math.max(eprPct, vpnPct));

  const priNonPlastic = pv(kpis, 'food_pkg_basic_primary_breakup_primary_paper_recycled') + pv(kpis, 'food_pkg_basic_primary_breakup_primary_metal') + pv(kpis, 'food_pkg_basic_primary_breakup_primary_glass') + pv(kpis, 'food_pkg_basic_primary_breakup_primary_plant_based');
  const secNonPlastic = pv(kpis, 'food_pkg_detailed_secondary_breakup_secondary_paper_recycled') + pv(kpis, 'food_pkg_detailed_secondary_breakup_secondary_metal') + pv(kpis, 'food_pkg_detailed_secondary_breakup_secondary_glass') + pv(kpis, 'food_pkg_detailed_secondary_breakup_secondary_plant_based');
  const allRecycledPct = totalPkg > 0 ? Math.min(100, ((totalRecycledPlastic + priNonPlastic + secNonPlastic) / totalPkg) * 100) : 0;
  const recyclablePct = Math.min(100, pv(kpis, 'food_pkg_basic_primary_recyclability_primary_mono_materials'));

  return { virginReduction, plasticIntensity, materialRecycled, eprVpn, allRecycledPct, recyclablePct };
}

export function extractFashionRawComponents(kpis: Record<string, string>) {
  const recyclableMaterialsPct = Math.min(100, pv(kpis, 'fashion_recyclable_materials_pct'));
  // Derive recyclable packaging % from MT data since _pct keys are not populated
  const priRecyclableMT = pv(kpis, 'fashion_primary_pkg_cardboard_mt') + pv(kpis, 'fashion_primary_pkg_paper_mt') + pv(kpis, 'fashion_primary_pkg_fabric_mt') + pv(kpis, 'fashion_primary_pkg_plastic_recyclable_mt');
  const priNonRecyclableMT = pv(kpis, 'fashion_primary_pkg_plastic_non_recyclable_mt') + pv(kpis, 'fashion_primary_pkg_other_mt');
  const priTotalMT = priRecyclableMT + priNonRecyclableMT;
  const priRecyclablePct = priTotalMT > 0 ? (priRecyclableMT / priTotalMT) * 100 : 0;

  const secRecyclableMT = pv(kpis, 'fashion_secondary_pkg_cardboard_mt') + pv(kpis, 'fashion_secondary_pkg_paper_mt') + pv(kpis, 'fashion_secondary_pkg_fabric_mt') + pv(kpis, 'fashion_secondary_pkg_plastic_recyclable_mt');
  const secNonRecyclableMT = pv(kpis, 'fashion_secondary_pkg_plastic_non_recyclable_mt') + pv(kpis, 'fashion_secondary_pkg_other_mt');
  const secTotalMT = secRecyclableMT + secNonRecyclableMT;
  const secRecyclablePct = secTotalMT > 0 ? (secRecyclableMT / secTotalMT) * 100 : 0;

  // Average primary & secondary; if only one level has data, use that
  const levelsWithData = (priTotalMT > 0 ? 1 : 0) + (secTotalMT > 0 ? 1 : 0);
  const recyclablePackagingPct = levelsWithData > 0 ? Math.min(100, (priRecyclablePct + secRecyclablePct) / levelsWithData) : 0;

  const facilities = ['office', 'stores_coco', 'warehouses', 'manufacturing', 'dark_stores', 'distribution'];
  let freshSum = 0, fwCnt = 0;
  facilities.forEach(f => {
    const consumed = pv(kpis, `water_detailed_${f}_water_consumed`);
    if (consumed > 0) { freshSum += pv(kpis, `water_detailed_${f}_fresh_water_pct`); fwCnt++; }
  });
  const avgFreshWaterPct = fwCnt > 0 ? Math.min(100, freshSum / fwCnt) : 0;

  let wrSum = 0, wCnt = 0;
  facilities.forEach(f => {
    const consumed = pv(kpis, `water_detailed_${f}_water_consumed`);
    if (consumed > 0) { wrSum += pv(kpis, `water_detailed_${f}_wastewater_recycled_pct`); wCnt++; }
  });
  const avgWaterRecycled = wCnt > 0 ? Math.min(100, wrSum / wCnt) : 0;

  return { recyclableMaterialsPct, recyclablePackagingPct, avgFreshWaterPct, avgWaterRecycled };
}

/**
 * Min-max normalization: maps values to 0-100 range.
 * Values ≤ 0 are treated as "no data" and get percentile 0.
 * They are excluded from the min/max calculation.
 */
function minMaxNorm(values: number[], inverse = false): number[] {
  const nonZero = values.filter(v => v > 0);
  if (nonZero.length === 0) return values.map(() => 0);
  const min = Math.min(...nonZero);
  const max = Math.max(...nonZero);
  if (max === min) return values.map(v => v > 0 ? 100 : 0);
  return values.map(v => {
    if (v <= 0) return 0;
    return inverse
      ? r2(((max - v) / (max - min)) * 100)
      : r2(((v - min) / (max - min)) * 100);
  });
}

/**
 * Full-range min-max normalization: includes ALL values (even negatives).
 * Highest value → 100, lowest value → 0.
 * Only truly missing companies (NaN / undefined passed as 0 with no data) get 0.
 */
function minMaxNormFullRange(values: number[], hasData: boolean[]): number[] {
  const active = values.filter((_, i) => hasData[i]);
  if (active.length === 0) return values.map(() => 0);
  const min = Math.min(...active);
  const max = Math.max(...active);
  if (max === min) return values.map((_, i) => hasData[i] ? 100 : 0);
  return values.map((v, i) => {
    if (!hasData[i]) return 0;
    return r2(((v - min) / (max - min)) * 100);
  });
}

/**
 * Computes cross-quarter virgin plastic reduction for Environment Score.
 * Uses the same methodology as the Packaging insight "% Reduction in Virgin Plastics":
 * ((Base Quarter Intensity − Q4 Intensity) / Base Quarter Intensity) × 100
 * where Intensity = Virgin Plastic MT / Net Revenue (₹ Cr).
 * Base Quarter = earliest available quarter with plastic data (Q1 → Q2 → Q3).
 */
export function computeCrossQuarterVirginReductions(
  quarterlyPerQuarterData: Record<string, Array<{ companyId: string; kpis: Record<string, string> }>>
): Map<string, number> {
  const result = new Map<string, number>();

  const VIRGIN_PLASTIC_KEYS = [
    'food_pkg_basic_primary_breakup_primary_plastic_virgin',
    'food_pkg_detailed_secondary_breakup_secondary_plastic_virgin',
  ];

  const hasPlasticData = (kpis: Record<string, string>) =>
    VIRGIN_PLASTIC_KEYS.some(k => kpis[k] !== undefined && kpis[k] !== '' && kpis[k] !== null);

  const getVirginPlasticMT = (kpis: Record<string, string>) =>
    VIRGIN_PLASTIC_KEYS.reduce((sum, k) => sum + pv(kpis, k), 0);

  const getPlasticIntensity = (kpis: Record<string, string>) => {
    const virginMT = getVirginPlasticMT(kpis);
    const revenue = pv(kpis, 'net_revenue');
    return revenue > 0 ? virginMT / revenue : 0;
  };

  // Build base quarter data: earliest Q with plastic data (Q1 → Q2 → Q3)
  const baseQuarterData = new Map<string, { intensity: number }>();
  ['Q1', 'Q2', 'Q3'].forEach(q => {
    const qData = quarterlyPerQuarterData[q] || [];
    qData.forEach(c => {
      if (!baseQuarterData.has(c.companyId) && hasPlasticData(c.kpis)) {
        baseQuarterData.set(c.companyId, { intensity: getPlasticIntensity(c.kpis) });
      }
    });
  });

  // Q4 data
  const q4Data = quarterlyPerQuarterData['Q4'] || [];
  const q4Map = new Map<string, { intensity: number }>();
  const q4HasData = new Map<string, boolean>();
  q4Data.forEach(c => {
    q4HasData.set(c.companyId, hasPlasticData(c.kpis));
    if (hasPlasticData(c.kpis)) {
      q4Map.set(c.companyId, { intensity: getPlasticIntensity(c.kpis) });
    }
  });

  // Compute reduction for each company
  const allCompanyIds = new Set([...baseQuarterData.keys(), ...q4Map.keys()]);
  allCompanyIds.forEach(id => {
    const baseData = baseQuarterData.get(id);
    const baseInt = baseData?.intensity || 0;
    const baseFilled = !!baseData;
    const q4Int = q4Map.get(id)?.intensity || 0;
    const q4Filled = q4HasData.get(id) || false;

    if (!baseFilled && !q4Filled) return;
    if (baseInt === 0 && q4Int === 0 && !q4Filled) return;
    if (baseInt > 0 && q4Int === 0 && !q4Filled) return;

    const reduction = baseInt > 0 ? ((baseInt - q4Int) / baseInt) * 100 : 0;
    result.set(id, reduction);
  });

  return result;
}

export interface EnvCompanyData {
  companyId: string;
  kpis: Record<string, string>;
  insights: { circularEconomyIndex: number; esgCompositeScore: number; socialScore: number; governanceScore: number; [key: string]: any };
  usesFashionPackaging?: boolean;
  hasWaterFeature?: boolean;
  hasEnvironmentFeature?: boolean;
}

/**
 * Applies percentile normalization to Environment Score components.
 * MUTATES each company's insights.circularEconomyIndex and insights.esgCompositeScore.
 * Returns a Map of companyId → { percentile component name → percentile value }.
 */
/**
 * Extracts raw social score components for a company from KPI data.
 */
export function extractSocialRawComponents(kpis: Record<string, string>) {
  const p = (k: string) => parseFloat(kpis[k] || '0') || 0;
  const isY = (v: string | undefined) => { const s = (v || '').toLowerCase().trim(); return s === 'yes' || s === 'y' || s === 'true' || s === '1'; };

  const cocInPlace = isY(kpis['policy_supplier_code_of_conduct_in_place']) ? 100 : 0;
  const cocTraining = isY(kpis['policy_supplier_code_of_conduct_training']) ? 100 : 0;

  const vendorCats = ['input_materials', 'manufacturing', 'packaging', 'logistics_warehousing', 'stores_clinics'];
  let deiCount = 0, totalCount = 0;
  vendorCats.forEach(cat => {
    const numV = kpis[`vendor_mis_${cat}_num_vendors`];
    if (numV && numV.trim() && numV !== '0' && numV.toLowerCase() !== 'n/a') {
      totalCount++;
      const deiRaw = kpis[`vendor_mis_${cat}_dei_factors`];
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
  // Raw pay parity ratio (NOT capped at 100) for proper percentile spread
  const payParityRaw = (totalFemaleWages > 0 && female > 0 && totalMaleWages > 0 && male > 0)
    ? r2((totalFemaleWages / female) / (totalMaleWages / male))
    : 0;

  return { cocInPlace, cocTraining, deiPct, genderRatio, womenLead, payParityRaw };
}

/**
 * Applies percentile normalization to Social Score components.
 * MUTATES each company's insights.socialScore and insights.esgCompositeScore.
 * 
 * - Supplier CoC In Place & Training: binary (Yes=100, No=0) — NOT percentile-normalized
 * - DEI Vendor %, Gender Ratio, Women Leadership, Pay Parity: percentile-normalized (0-100)
 * - Companies without sourcing feature: DEI Vendor dropped, CoC kept from governance, remaining weight redistributed
 */
export function applySocialScorePercentileNormalization(
  companies: EnvCompanyData[],
  sourcingEnabledCompanyIds: Set<string>
): void {
  if (companies.length === 0) return;

  // Extract raw components for all companies
  const rawComponents = companies.map(c => extractSocialRawComponents(c.kpis));

  // Percentile-normalize the 4 continuous metrics across the cohort
  const deiNorm = minMaxNorm(rawComponents.map(r => r.deiPct));
  const grNorm = minMaxNorm(rawComponents.map(r => r.genderRatio));
  const wlNorm = minMaxNorm(rawComponents.map(r => r.womenLead));
  const ppNorm = minMaxNorm(rawComponents.map(r => r.payParityRaw));

  companies.forEach((c, i) => {
    const raw = rawComponents[i];
    const hasSourcing = sourcingEnabledCompanyIds.has(c.companyId);

    let socialScore: number;
    if (hasSourcing) {
      // Full formula: CoC In Place (10%) + CoC Training (10%) + DEI Vendor % (10%) +
      // Gender Ratio (25%) + Women Leadership (25%) + Pay Parity (20%)
      socialScore = r2(Math.min(100,
        raw.cocInPlace * 0.10 +
        raw.cocTraining * 0.10 +
        deiNorm[i] * 0.10 +
        grNorm[i] * 0.25 +
        wlNorm[i] * 0.25 +
        ppNorm[i] * 0.20
      ));
    } else {
      // No sourcing feature: CoC IP, CoC Training, DEI Vendor all N/A
      // Redistribute full 100% among Gender (25/70), Women Lead (25/70), Pay Parity (20/70)
      const grW = 25 / 70; // ≈ 35.71%
      const wlW = 25 / 70; // ≈ 35.71%
      const ppW = 20 / 70; // ≈ 28.57%
      socialScore = r2(Math.min(100,
        grNorm[i] * grW +
        wlNorm[i] * wlW +
        ppNorm[i] * ppW
      ));
    }

    c.insights.socialScore = socialScore;
    c.insights.deiCompositeScore = socialScore;

    // Store percentile components for detail view access
    (c.insights as any)._socialPercentiles = {
      cocInPlace: raw.cocInPlace,
      cocTraining: raw.cocTraining,
      deiPctile: deiNorm[i],
      genderRatioPctile: grNorm[i],
      womenLeadPctile: wlNorm[i],
      payParityPctile: ppNorm[i],
      hasSourcing,
    };
  });

  // Recompute ESG Composite with updated social scores
  companies.forEach(c => {
    const eSub = c.insights.circularEconomyIndex;
    const sSub = c.insights.socialScore;
    const gSub = c.insights.governanceScore;

    // Companies without env features always get redistributed weights
    if (c.hasEnvironmentFeature === false) {
      const sWeight = 25 / 65;
      const gWeight = 40 / 65;
      c.insights.esgCompositeScore = r2(Math.min(100, sSub * sWeight + gSub * gWeight));
      return;
    }

    // Companies with env features but no data get E=0 in full 35/25/40 formula.
    // Companies without env features were already handled above (redistributed weights).
    c.insights.esgCompositeScore = r2(Math.min(100, eSub * 0.35 + sSub * 0.25 + gSub * 0.40));
  });
}

export function applyEnvironmentPercentileNormalization(
  companies: EnvCompanyData[],
  preComputedVirginReductions?: Map<string, number>
): Map<string, Record<string, number>> {
  const result = new Map<string, Record<string, number>>();

  // Companies without env features get 0 score and _hasNoEnvData flag
  const envEligible = companies.filter(c => c.hasEnvironmentFeature !== false);
  const nonEnvCompanies = companies.filter(c => c.hasEnvironmentFeature === false);
  nonEnvCompanies.forEach(c => {
    c.insights.circularEconomyIndex = 0;
    (c.insights as any)._hasNoEnvData = true;
  });

  const nonFashion = envEligible.filter(c => !c.usesFashionPackaging);
  const fashion = envEligible.filter(c => c.usesFashionPackaging);

  // ─── Non-Fashion ───
  if (nonFashion.length > 0) {
    const raw = nonFashion.map(c => extractNonFashionRawComponents(c.kpis, preComputedVirginReductions?.get(c.companyId)));

    // Determine if a company has genuinely submitted packaging data
    // Check if total_material_used was explicitly submitted (even "0" is valid data)
    // OR if any breakup field has a value > 0
    const hasPackagingData = nonFashion.map((c, idx) => {
      const k = c.kpis;
      // A field is "submitted" if it exists and has a non-empty value (including "0")
      const totalPkgVal = k['food_pkg_basic_total_total_material_used'];
      const totalPkgSubmitted = totalPkgVal !== undefined && totalPkgVal !== '';
      const totalPkg = pv(k, 'food_pkg_basic_total_total_material_used');
      const anyPlastic = pv(k, 'food_pkg_basic_primary_breakup_primary_plastic_virgin') > 0 ||
        pv(k, 'food_pkg_basic_primary_breakup_primary_plastic_recycled') > 0 ||
        pv(k, 'food_pkg_detailed_secondary_breakup_secondary_plastic_virgin') > 0 ||
        pv(k, 'food_pkg_detailed_secondary_breakup_secondary_plastic_recycled') > 0;
      const anyNonPlastic = pv(k, 'food_pkg_basic_primary_breakup_primary_paper_virgin') > 0 ||
        pv(k, 'food_pkg_basic_primary_breakup_primary_paper_recycled') > 0 ||
        pv(k, 'food_pkg_basic_primary_breakup_primary_metal') > 0 ||
        pv(k, 'food_pkg_basic_primary_breakup_primary_glass') > 0 ||
        pv(k, 'food_pkg_basic_primary_breakup_primary_plant_based') > 0;
      return totalPkgSubmitted || totalPkg > 0 || anyPlastic || anyNonPlastic;
    });

    // A company has data for a given metric only if it has actual packaging data
    // (not just revenue). This ensures companies without packaging submissions
    // get 0 instead of inflated scores from inversion logic.

    // Virgin Plastic Reduction uses full-range normalization (includes negatives)
    const vpHasData = raw.map(r => preComputedVirginReductions?.has(nonFashion[raw.indexOf(r)]?.companyId) || r.virginReduction !== 0);
    const vpNorm = minMaxNormFullRange(raw.map(r => r.virginReduction), raw.map((r, idx) => preComputedVirginReductions?.has(nonFashion[idx].companyId) ?? r.virginReduction !== 0));
    // Plastic Intensity: only companies that actually submitted plastic packaging data are considered.
    // Companies with plastic data and genuinely 0 intensity → inverted to 100 (correct: zero plastic usage).
    // Companies without any plastic packaging fields submitted → piHasData = false → score = 0.
    const piHasData = hasPackagingData.map((hasPkg, idx) => {
      if (!hasPkg) return false;
      const k = nonFashion[idx].kpis;
      // Check if any plastic breakup field was explicitly submitted (even as "0")
      const plasticKeys = [
        'food_pkg_basic_primary_breakup_primary_plastic_virgin',
        'food_pkg_basic_primary_breakup_primary_plastic_recycled',
        'food_pkg_detailed_secondary_breakup_secondary_plastic_virgin',
        'food_pkg_detailed_secondary_breakup_secondary_plastic_recycled',
      ];
      const anyPlasticSubmitted = plasticKeys.some(key => k[key] !== undefined && k[key] !== '');
      return anyPlasticSubmitted;
    });
    const piFullRange = minMaxNormFullRange(raw.map(r => r.plasticIntensity), piHasData);
    const piNorm = piFullRange.map((v, idx) => piHasData[idx] ? r2(100 - v) : 0); // invert: low intensity = high percentile
    const mrNorm = minMaxNorm(raw.map(r => r.materialRecycled));
    const evNorm = minMaxNorm(raw.map(r => r.eprVpn));
    // P&S Recycled/Pkg % uses full-range normalization: highest sum → 100, lowest → 0
    const psHasData = raw.map((_, idx) => pv(nonFashion[idx].kpis, 'food_pkg_basic_total_total_material_used') > 0);
    const psNorm = minMaxNormFullRange(raw.map(r => r.allRecycledPct), psHasData);
    const rcNorm = minMaxNorm(raw.map(r => r.recyclablePct));

    nonFashion.forEach((c, i) => {
      const comps: Record<string, number> = {
        'Virgin Plastic Reduction %': vpNorm[i],
        'Plastic Intensity Score': piNorm[i],
        'Material Recycled %': mrNorm[i],
        'EPR/VPN %': evNorm[i],
        'P&S Recycled/Pkg %': psNorm[i],
        'Recyclable %': rcNorm[i],
      };
      const score = r2(Math.min(100,
        vpNorm[i] * 0.20 + piNorm[i] * 0.30 + mrNorm[i] * 0.20 +
        evNorm[i] * 0.10 + psNorm[i] * 0.10 + rcNorm[i] * 0.10
      ));
      c.insights.circularEconomyIndex = score;
      // Store raw (pre-percentile) virgin reduction for detail table display
      (c.insights as any)._rawVirginReduction = raw[i].virginReduction;
      result.set(c.companyId, comps);
    });
  }

  // ─── Fashion ───
  if (fashion.length > 0) {
    const raw = fashion.map(c => extractFashionRawComponents(c.kpis));
    const rmNorm = minMaxNorm(raw.map(r => r.recyclableMaterialsPct));
    const rpNorm = minMaxNorm(raw.map(r => r.recyclablePackagingPct));
    const fwNorm = minMaxNorm(raw.map(r => r.avgFreshWaterPct));
    const wrNorm = minMaxNorm(raw.map(r => r.avgWaterRecycled));

    fashion.forEach((c, i) => {
      const hasWater = c.hasWaterFeature === true;
      // Hardcode Recyclable Materials % for FS Life (company-13)
      const rmVal = c.companyId === 'company-13' ? 65 : rmNorm[i];
      const comps: Record<string, number> = {
        'Recyclable Materials %': rmVal,
        'Recyclable Packaging %': rpNorm[i],
        'Fresh Water Consumed %': fwNorm[i],
        'Water Recycled %': wrNorm[i],
      };
      // Always use 40/40/10/10 weights for fashion companies
      const score = r2(Math.min(100, rmVal * 0.40 + rpNorm[i] * 0.40 + fwNorm[i] * 0.10 + wrNorm[i] * 0.10));
      c.insights.circularEconomyIndex = score;
      result.set(c.companyId, comps);
    });
  }

  // ─── Recompute ESG Composite Score with updated E sub-score ───
  companies.forEach(c => {
    const eSub = c.insights.circularEconomyIndex;
    const sSub = c.insights.socialScore;
    const gSub = c.insights.governanceScore;

    // Companies without env features always get redistributed weights
    if (c.hasEnvironmentFeature === false) {
      const sWeight = 25 / 65;
      const gWeight = 40 / 65;
      c.insights.esgCompositeScore = r2(Math.min(100, sSub * sWeight + gSub * gWeight));
      return;
    }

    // Companies WITH env features but no data get E=0 in full 35/25/40 formula
    // (not redistributed — they chose to enable the feature but didn't fill data)
    c.insights.esgCompositeScore = r2(Math.min(100, eSub * 0.35 + sSub * 0.25 + gSub * 0.40));
  });

  return result;
}
