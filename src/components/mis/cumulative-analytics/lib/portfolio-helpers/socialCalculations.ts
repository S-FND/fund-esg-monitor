import { pct, r2 } from './helpers';
import type { CompanyAggregations } from './types';

export function socialDerived(a: CompanyAggregations) {
  return {
    genderDiversityPct: r2(pct(a.femaleEmployees, a.totalEmployees)),
    womenInLeadershipPct: r2(pct(a.cLevelFemale, a.cLevelTotal)),
    womenOnBoardPct: r2(pct(a.boardFemale, a.boardTotal)),
  };
}
