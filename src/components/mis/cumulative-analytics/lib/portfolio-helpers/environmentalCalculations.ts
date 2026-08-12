import { pct, r2 } from './helpers';
import type { CompanyAggregations } from './types';

export function environmentalDerived(a: CompanyAggregations) {
  const totalPlastic = a.virginPlasticMT + a.recycledPlasticMT;
  return {
    virginPlasticSharePct: r2(pct(a.virginPlasticMT, totalPlastic)),
    recycledContentPct: r2(pct(a.recycledPlasticMT, totalPlastic)),
    waterRecyclingPct: r2(a.wastewaterRecycledPctAvg),
    renewableEnergyPct: r2(a.renewableEnergyPctAvg),
    wasteDiversionPct: r2(a.wasteRecycledPctAvg),
  };
}
