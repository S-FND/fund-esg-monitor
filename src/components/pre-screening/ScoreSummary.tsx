
interface ScoreSummaryProps {
  totalScore: number;
  maxScore?: number;
}

// Determine Go/No-Go decision
export const getDecision = (score: number) => {
  if (score >= 1) {
    return "No-Go";
  } else if (score >= 0.66) {
    return "Caution - Detailed ESDD Required";
  } else {
    return "Go";
  }
};

// Determine action based on decision
export const getAction = (decision: string) => {
  if (decision === "No-Go") {
    return "Decline the investment opportunity due to high ESG risks";
  } else if (decision === "Caution - Detailed ESDD Required") {
    return "Proceed with detailed ESG due diligence to identify and mitigate risks";
  } else {
    return "Proceed with investment process";
  }
};

export function ScoreSummary({ totalScore,maxScore }: ScoreSummaryProps) {
  // Determine Go/No-Go decision
  const getDecision = (score: number) => {
    if (score >= 1) {
      return "No-Go";
    } else if (score >= 0.66) {
      return "Caution - Detailed ESDD Required";
    } else {
      return "Go";
    }
  };
  
  // Determine action based on decision
  const getAction = (decision: string) => {
    if (decision === "No-Go") {
      return "Decline the investment opportunity due to high ESG risks";
    } else if (decision === "Caution - Detailed ESDD Required") {
      return "Proceed with detailed ESG due diligence to identify and mitigate risks";
    } else {
      return "Proceed with investment process";
    }
  };
  
  const decision = getDecision(totalScore);
  const action = getAction(decision);

  return (
    <div className="mt-8 p-4 bg-muted rounded-md">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <p className="text-sm font-medium">Total Score:</p>
          <p className="text-2xl font-bold">{totalScore.toFixed(2)}</p>
          {maxScore && (
            <p className="text-sm text-muted-foreground">Max: {maxScore.toFixed(2)}</p>
          )}
        </div>
        
        <div>
          <p className="text-sm font-medium">Decision on investment:</p>
          <p className={`text-2xl font-bold ${
            decision === "Go" 
              ? "text-green-600" 
              : decision === "No-Go" 
                ? "text-red-600" 
                : "text-amber-600"
          }`}>
            {decision}
          </p>
        </div>
        
        <div>
          <p className="text-sm font-medium">Action:</p>
          <p className="text-sm">{action}</p>
        </div>
      </div>
    </div>
  );
}
