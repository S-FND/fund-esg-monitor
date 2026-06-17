import { useMemo } from 'react';
import { usePortfolioRankings } from '@/hooks/usePortfolioRankings';

interface PeerComparisonData {
  completenessPercentile: number;
  consistencyPercentile: number;
  timelinessPercentile: number;
  isLoading: boolean;
}

/**
 * Delegates to usePortfolioRankings to guarantee identical percentiles
 * on both Admin and Company dashboards.
 */
export const usePeerComparison = (
  companyId: string,
  _quarter: string = 'Q4',
  year: number = 2025
): PeerComparisonData => {
  const { rankings, isLoading } = usePortfolioRankings(year, _quarter);

  const percentiles = useMemo(() => {
    const match = rankings.find(r => r.companyId === companyId);
    if (!match) {
      return {
        completenessPercentile: 50,
        consistencyPercentile: 50,
        timelinessPercentile: 50,
      };
    }
    return {
      completenessPercentile: match.completenessPercentile,
      consistencyPercentile: match.consistencyPercentile,
      timelinessPercentile: match.timelinessPercentile,
    };
  }, [rankings, companyId]);

  return {
    ...percentiles,
    isLoading,
  };
};
