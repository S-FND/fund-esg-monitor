import { toNum } from './helpers';
import type { CompanyAggregations } from './types';

const EMP_WC_M = ['employees_wc_male_fulltime', 'employees_wc_male_contractual', 'employees_wc_male_parttime'];
const EMP_WC_F = ['employees_wc_female_fulltime', 'employees_wc_female_contractual', 'employees_wc_female_parttime'];
const EMP_BC_M = ['employees_bc_male_fulltime', 'employees_bc_male_contractual', 'employees_bc_male_parttime'];
const EMP_BC_F = ['employees_bc_female_fulltime', 'employees_bc_female_contractual', 'employees_bc_female_parttime'];

const sumKeys = (k: Record<string, string>, keys: string[]) => keys.reduce((s, key) => s + toNum(k[key]), 0);

const FACILITIES = ['office', 'stores_coco', 'warehouses', 'manufacturing', 'dark_stores', 'distribution'];
// Energy uses a broader facility list on the Admin Dashboard.
const ENERGY_FACILITIES = [...FACILITIES, 'data_center', 'retail'];

/** Match Admin Dashboard: skip _na facilities, skip 0-consumption, only average positive rates. */
function facilityAvgPct(
  k: Record<string, string>,
  facilities: string[],
  consumeKey: (f: string) => string,
  pctKey: (f: string) => string,
  naKey: (f: string) => string,
): number {
  let sum = 0, cnt = 0;
  for (const f of facilities) {
    const na = (k[naKey(f)] ?? '').toString().toLowerCase();
    if (na === 'yes' || na === 'true' || na === '1') continue;
    const consumed = toNum(k[consumeKey(f)]);
    if (consumed <= 0) continue;
    const p = toNum(k[pctKey(f)]);
    if (p <= 0) continue; // only positive rates enter the average
    sum += p;
    cnt++;
  }
  return cnt > 0 ? Math.min(100, sum / cnt) : 0;
}

function facilitySum(k: Record<string, string>, facilities: string[], keyFn: (f: string) => string): number {
  return facilities.reduce((s, f) => s + toNum(k[keyFn(f)]), 0);
}

/** Fixed 12-policy list matches Admin Dashboard's POLICIES constant. */
const POLICIES_TOTAL = 12;

export function buildAggregations(k: Record<string, string>): CompanyAggregations {
  const wcM = sumKeys(k, EMP_WC_M);
  const wcF = sumKeys(k, EMP_WC_F);
  const bcM = sumKeys(k, EMP_BC_M);
  const bcF = sumKeys(k, EMP_BC_F);

  const priVirgin = toNum(k['food_pkg_basic_primary_breakup_primary_plastic_virgin']);
  const priRecycled = toNum(k['food_pkg_basic_primary_breakup_primary_plastic_recycled']);
  const secVirgin = toNum(k['food_pkg_detailed_secondary_breakup_secondary_plastic_virgin']);
  const secRecycled = toNum(k['food_pkg_detailed_secondary_breakup_secondary_plastic_recycled']);

  const totalWater = facilitySum(k, FACILITIES, f => `water_detailed_${f}_water_consumed`);
  const totalEnergy = facilitySum(k, ENERGY_FACILITIES, f => `energy_detailed_${f}_energy_consumed`);
  const totalWaste = facilitySum(k, FACILITIES, f => `waste_detailed_${f}_waste_generated`);

  const wastewaterAvg = facilityAvgPct(
    k, FACILITIES,
    f => `water_detailed_${f}_water_consumed`,
    f => `water_detailed_${f}_wastewater_recycled_pct`,
    f => `water_detailed_${f}_na`,
  );
  const renewableAvg = facilityAvgPct(
    k, ENERGY_FACILITIES,
    f => `energy_detailed_${f}_energy_consumed`,
    f => `energy_detailed_${f}_renewable_pct`,
    f => `energy_detailed_${f}_na`,
  );
  const wasteRecycledAvg = facilityAvgPct(
    k, FACILITIES,
    f => `waste_detailed_${f}_waste_generated`,
    f => `waste_detailed_${f}_waste_recycled_pct`,
    f => `waste_detailed_${f}_na`,
  );

  // Incidents & policies (heuristic — count keys with matching prefixes)
  let incidentsTotal = 0, incidentsHigh = 0, incidentsUnresolvedHigh = 0;
  for (const key of Object.keys(k)) {
    if (key.startsWith('incident_') && key.endsWith('_count')) incidentsTotal += toNum(k[key]);
    if (key.startsWith('incident_') && key.endsWith('_high_impact_count')) incidentsHigh += toNum(k[key]);
    if (key.startsWith('incident_') && key.endsWith('_high_impact_unresolved')) incidentsUnresolvedHigh += toNum(k[key]);
  }

  // Fixed 12-policy denominator (mirrors Admin Dashboard's POLICIES constant).
  const policiesTotal = POLICIES_TOTAL;
  let policiesInPlace = 0, policiesWithTraining = 0;
  for (const key of Object.keys(k)) {
    if (key.startsWith('policy_') && key.endsWith('_in_place')) {
      const s = (k[key] || '').toLowerCase();
      if (s === 'yes' || s === 'true' || s === '1') policiesInPlace++;
    }
    if (key.startsWith('policy_') && key.endsWith('_training')) {
      const s = (k[key] || '').toLowerCase();
      if (s === 'yes' || s === 'true' || s === '1') policiesWithTraining++;
    }
  }

  return {
    netRevenue: toNum(k['net_revenue']),
    totalEmployees: wcM + wcF + bcM + bcF,
    femaleEmployees: wcF + bcF,
    maleEmployees: wcM + bcM,
    wcEmployees: wcM + wcF,
    bcEmployees: bcM + bcF,
    cLevelTotal: toNum(k['leadership_clevel_total']),
    cLevelFemale: toNum(k['leadership_clevel_female']),
    boardTotal: toNum(k['leadership_board_total']),
    boardFemale: toNum(k['leadership_board_female']),
    totalPackagingMT: toNum(k['food_pkg_basic_total_total_material_used']),
    virginPlasticMT: priVirgin + secVirgin,
    recycledPlasticMT: priRecycled + secRecycled,
    totalWaterKL: totalWater,
    wastewaterRecycledPctAvg: wastewaterAvg,
    totalEnergyKWh: totalEnergy,
    renewableEnergyPctAvg: renewableAvg,
    totalWasteMT: totalWaste,
    wasteRecycledPctAvg: wasteRecycledAvg,
    incidentsTotal,
    incidentsHighImpact: incidentsHigh,
    incidentsUnresolvedHigh,
    policiesTotal,
    policiesInPlace,
    policiesWithTraining,
    csrSpendINR: toNum(k['csr_amount_spent']),
  };
}
