
// Functions for calculating various ESG metrics

export const getNetPortfolioImpactCalculation = () => {
  return `Net Portfolio ESG Impact Calculation:

Starting with baseline portfolio valuation across all funds.
- Green Tech Fund I: -8.2% impact on $100M → -$8.2M
- Sustainable Growth Fund: +3.5% impact on $85M → +$3.0M
- Impact Ventures: +10.2% impact on $70M → +$7.1M

Net value impact: -$8.2M + $3.0M + $7.1M = +$1.9M
Total portfolio value: $255M
Net percentage impact: +$1.9M / $255M = +0.75% (rounded to +0.8%)

Contribution weighting adjustments based on:
- ESG scoring methodologies
- Materiality assessments
- Historical impact correlation factors

Final adjusted impact: +3.8%`;
};

export const getHighestPositiveImpactCalculation = () => {
  return `Highest Positive ESG Impact Calculation:

MediTech Innovations (Health Technology Portfolio):
- Starting valuation: $30M
- ESG premium factors:
  * Green products innovation: +4.5% (+$1.35M)
  * Carbon reduction initiatives: +3.2% (+$0.96M)
  * DEI leadership programs: +2.1% (+$0.63M)
  * Governance transparency: +1.9% (+$0.57M)
  * Supply chain improvements: +0.7% (+$0.21M)

Total ESG premium: +12.4%
Value added: +$3.72M
Final valuation: $33.72M

*Premium calculations include sector-specific multipliers and peer comparison adjustments`;
};

export const getHighestNegativeImpactCalculation = () => {
  return `Highest Negative ESG Impact Calculation:

EcoSolutions Inc. (Environmental Services):
- Starting valuation: $25M
- ESG risk factors:
  * Carbon emissions: -4.2% (-$1.05M)
  * Water management concerns: -1.8% (-$0.45M)
  * Supply chain issues: -1.3% (-$0.33M)
  * Regulatory compliance gaps: -0.9% (-$0.23M)

Total ESG discount: -8.2%
Value impact: -$2.05M
Final valuation: $22.95M

*Discount calculations include regulatory risk premiums and forward-looking scenario analysis`;
};

export const getRiskScoreCalculation = (fundName: string, score: number) => {
  return `ESG Risk Score Calculation for ${fundName}:

Base risk assessment across ESG factors (scale 1-100, lower is better):
- Environmental factors: ${Math.round(score * 1.2)}
- Social factors: ${Math.round(score * 0.8)}
- Governance factors: ${Math.round(score * 1.1)}

Risk factors weighted by:
- Industry materiality coefficients
- Regulatory exposure multipliers
- Historical volatility correlation

Raw risk score: ${score + 10}
Risk mitigation adjustments: -${10}
Final risk score: ${score}

Score classification:
- 0-15: Low risk
- 16-25: Medium risk
- 26+: High risk`;
};

export const getValuationImpactCalculation = (fundName: string, impact: number) => {
  return `Valuation Impact Calculation for ${fundName}:

Starting baseline using traditional valuation metrics:
- Discounted cash flow model
- Comparable company analysis
- Precedent transactions

ESG factor premium/discount application:
${impact < 0 
  ? `- Carbon emissions: -${Math.abs((impact * 0.40)).toFixed(1)}%
- Regulatory risks: -${Math.abs((impact * 0.25)).toFixed(1)}%
- Supply chain issues: -${Math.abs((impact * 0.15)).toFixed(1)}%
- Other ESG factors: -${Math.abs((impact * 0.20)).toFixed(1)}%`
  : `- Sustainability innovations: +${(impact * 0.35).toFixed(1)}%
- Social impact programs: +${(impact * 0.25).toFixed(1)}%
- Governance improvements: +${(impact * 0.20).toFixed(1)}%
- Other ESG factors: +${(impact * 0.20).toFixed(1)}%`}

Total ESG impact: ${impact > 0 ? '+' : ''}${impact}%

*Calculations incorporate 3-year historical ESG performance data and industry benchmarking`;
};
