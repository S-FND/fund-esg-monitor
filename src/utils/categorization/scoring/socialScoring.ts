
/**
 * Calculate the score for a social section question based on its response
 */
export function calculateSocialScore(questionId: string, value: string): number {
  switch (questionId) {
    case "3.1":
      if (value === "No") return 0;
      if (value === "Yes on roll skilled workers") return 1;
      if (value === "Yes on contract skilled worker") return 2;
      return 3; // for "Only few housekeeping/ office boys /Skilled unskilled or semiskilled workers with no written contract"
    
    case "3.2":
      if (value === "Yes for both contract and on roll workers") return 0;
      if (value === "Yes only for on roll employees only") return 1;
      if (value === "Yes for contractn employees") return 2;
      return 3; // "None for contract or on-roll"
    
    case "3.3":
      if (value === "Yes, documented fairwages") return 0;
      if (value === "Reportedly fair wages but no documents") return 1;
      if (value === "Data defficient") return 2;
      return 3; // "No, there is clear scope to improve"
    
    case "3.4":
      if (value === "Past media stories") return 5;
      if (value === "Past Litigations/ Arbitrations") return 4;
      if (value === "Often") return 3;
      if (value === "Sometimes") return 2;
      if (value === "Not as such") return 1;
      return 0; // "No dues related issues"
    
    case "3.5":
      if (value === "100% Satisfaction") return -1;
      if (value === "Greater then 80% Satisfaction") return 0;
      if (value === "Less then 50% satisfaction") return 1;
      if (value === "Signs of more dissatisfaction") return 2;
      return 3; // "Clear signs of dissatisfaction and detachment"
    
    case "3.6":
      if (value === "No") return 0;
      if (value === "Yes; Few minor issues") return 1;
      if (value === "Clear signs but managed somehow") return 2;
      if (value === "Consistent issues") return 3;
      if (value === "Unpleasant legal or other consequences in past") return 4;
      return 5; // "Pending litigations"
    
    case "3.7":
      if (value === "The sector is not prone to such issues") return 0;
      if (value === "Acknowledgement & some action") return 1;
      if (value === "Only Acknowledgement but no action") return 2;
      return 3; // "No Acknowledgement"
    
    case "3.8":
      if (value === "Yes") return 0;
      if (value === "Defined only for founders/ partners") return 1;
      return 2; // "Not defined for anyone"
    
    case "3.9":
    case "3.10":
      if (value === "Yes") return 0;
      if (value === "Somewhat") return 1;
      return 2; // "No"
    
    case "3.11":
      if (value === "Yes, Female lead business") return -1;
      if (value === "Gender as a theme/effective gender mainstreaming") return 0;
      if (value === "Some gender elements and scope to improve") return 1;
      return 2; // "No gender elements or scope of gender elements incorporation"
    
    case "3.12":
    case "3.13":
      if (value === "Yes") return 0;
      if (value === "Only for internal or external") return 1;
      return 2; // "No"
      
    case "3.14":
      if (value === "Yes") return 2;
      if (value === "Somewhat") return 1;
      return 0; // "No"
      
    case "3.15":
    case "3.16":
      if (value === "No") return 0;
      if (value === "Somewhat") return 1;
      return 2; // "Yes"
      
    case "3.17":
      if (value === "No") return 0;
      if (value === "Somewhat") return 1;
      return 2; // "Yes"
      
    case "3.18":
      if (value === "No") return 0;
      return 3; // "Yes"
  }
  
  return 0;
}
