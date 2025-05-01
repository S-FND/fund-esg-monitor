
import { CategoryQuestion, ResponsesData, SectionScores } from "@/types/categorization";

/**
 * Calculate the score for a specific question based on its response
 */
export function calculateQuestionScore(questionId: string, value: string, section: string): number {
  // Social section scoring
  if (section === "social") {
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
  }
  
  // Environmental section scoring
  if (section === "environmental") {
    switch (questionId) {
      case "4.1":
        if (value === "Shared or leased office space") return 0;
        if (value === "Own operational office facility") return 1;
        return 2; // "Own office is under construction or planned to be constructed with the use of investment proceeds"
      
      case "4.2":
        if (value === "No. Company operations does not require a R&D lab") return 0;
        if (value === "Leased space used for R&D facility") return 1;
        if (value === "Existing/operational R&D facility in own land/building") return 2;
        return 3; // "Own R&D facility under construction or planned to be constructed with the use of investment proceeds"
      
      case "4.3":
        if (value === "No. Company operations does not require warehousing") return 0;
        if (value === "Leased facility") return 1;
        if (value === "Own existing/operational facility") return 2;
        return 3; // "Own facility under construction or planned to be constructed with the use of investment proceeds"
      
      case "4.4":
        if (value === "No. Company operations does not and will not need manufacturing facilities now and in the future") return 0;
        if (value === "The company has no manufacturing activities now but may require in the future in next 4-5 years") return 1;
        if (value === "Outsourced manufaturing will be relied upon in short to medium term") return 2;
        if (value === "Leased/owned existing/operational facility") return 3;
        return 4; // "Own facility under construction or planned to be constructed with the use of investment proceeds"
      
      case "4.5":
        if (value === "The company does not require any owned or outsourced warehouses, laboratories, manufacturing facilities or transportation/logistics fleet") return 0;
        if (value === "Yes the company has Environmental and Occupational Health & Safety requirements for its 3rd party providers consistent with national and local laws and regulations") return 1;
        return 3; // "No, Environmental and Occupational Health & Safety attributes is not among the key considerations for selecting and working with 3rd party providers"
      
      case "4.6":
        if (value === "NA or no wastewater or ZLD with maximum reuse") return 0;
        if (value === "Sanitary wastewater from office into STP of self or building owner, or leading to soak pits or public sewer") return 1;
        if (value === "Any open discharge of sewage") return 2;
        if (value === "Industrial effluent to ETP") return 3;
        if (value === "Industrial effluent to CETP") return 4;
        return 5; // "Non-treated discharge of effluent"
      
      case "4.7":
        if (value === "NA or no process emission") return 0;
        if (value === "Only small vents associated with R&D") return 1;
        if (value === "Industrial Heating or cooling related stacks with pollution control systems") return 2;
        if (value === "Stacks without any pollution control system but meeting regulatory thresholds") return 3;
        if (value === "Barely meeting thresholds") return 4;
        return 5; // "Not meeting thresholds"
      
      case "4.8":
        if (value === "No") return 0;
        return 2; // "Yes"
      
      case "4.9":
        if (value === "No") return 0;
        if (value === "Complies with Indian Regulations as of date") return 1;
        if (value === "ROHS /REACH Triggered and complied") return 2;
        return 3; // "Not Complied to any regulations"
      
      case "4.10":
        if (value === "No") return 0;
        if (value === "Only e-waste or biomedical waste") return 1;
        if (value === "Only Hazardous Waste") return 2;
        if (value === "Two of the waste") return 3;
        if (value === "All three kind of waste but has authorisation") return 4;
        return 5; // "All three kind of waste and lacks authroisation"
      
      case "4.11":
        if (value === "NA" || value === "Yes EPR implemented") return 0;
        if (value === "Yes on paper to be rolled out") return 1;
        if (value === "Being worked upon") return 2;
        return 3; // "No"
      
      case "4.12":
        if (value === "No radiation or Radio waves involved") return 0;
        if (value === "Radition Equipment / radio equipment type approved by AERB/ TRAI in India") return 1;
        if (value === "Equipment Type approved in OECD or any G20 countries but not in India") return 2;
        if (value === "Equipment Type approved elsewhere") return 3;
        if (value === "Equipment not type approved by any regulators yet") return 4;
        return 5; // "Company not aware of radiation levels, Control measures and approval requirements"
      
      case "4.13":
        if (value === "Yes") return -1;
        if (value === "Likely") return 0;
        if (value === "No") return 1;
        return 2; // "Potential negative contributions to sustainability themes in current shape and form"
      
      case "4.14":
        if (value === "Yes") return 2;
        if (value === "Somewhat") return 1;
        return 0; // "No"
      
      case "4.15":
        if (value === "No") return 0;
        if (value === "Minimal and controllable") return 1;
        if (value === "Moderate with controls") return 2;
        if (value === "High") return 3;
        if (value === "Significant") return 4;
        return 5; // "Far reaching or catastrophic"
      
      case "4.16":
        if (value === "Yes as per EU-US norms") return -1;
        if (value === "Yes per local norms") return 0;
        if (value === "Partially meets local regulatory requirements") return 1;
        if (value === "No, labelling at present, being worked upon") return 2;
        return 3; // "No, Company does not know the requirements"
    }
  }
  
  // Impact section scoring
  if (section === "impact") {
    switch (questionId) {
      case "5.1":
      case "5.4":
      case "5.5":
      case "5.6":
        if (value === "Yes") return 0;
        if (value === "Somewhat") return 1;
        return 2; // "No"
      
      case "5.2":
      case "5.3":
        if (value === "Greater than 10 SDGs") return 0;
        if (value === "5-10 SDGs") return 1;
        return 2; // "Less then 5 SDGs"
    }
  }
  
  // Default scoring for policy and ESG sections
  if (section === "policy") {
    const index = ["Yes", "No, but willing to have", "No & Not willing to have"].indexOf(value);
    return index >= 0 ? [0, 1, 3][index] : 0;
  }
  
  if (section === "esg") {
    // Handle ESG-specific scoring logic
    switch (value) {
      case "Yes": return -1;
      case "Likely": return 0;
      case "No": return 1;
      case "For moderate intent and performance": return 1;
      case "Orange manufacturing Industry": return 2;
      case "Yes Adhoc": return 1;
      case "Often": return 0;
      case "Quarterly": return 1;
      case "Sometimes (including management emails)": return 0;
      case "Few times but resolved against": return 2;
      default: return 0;
    }
  }
  
  return 0; // Default score if no specific logic matches
}

/**
 * Calculate scores for an entire section
 */
export function calculateSectionScore(
  section: string, 
  questions: CategoryQuestion[], 
  responses: Record<string, { response: string; score: number; observations: string }>
): number {
  return questions.reduce((sum, question) => {
    return sum + (responses[question.id]?.score || 0);
  }, 0);
}

/**
 * Calculate scores for all sections
 */
export function calculateAllSectionScores(
  questions: Record<string, CategoryQuestion[]>, 
  responses: ResponsesData
): SectionScores {
  return Object.keys(questions).reduce<SectionScores>((acc, section) => {
    const sectionQuestions = questions[section];
    acc[section] = calculateSectionScore(section, sectionQuestions, responses[section]);
    return acc;
  }, {});
}

/**
 * Calculate the total score across all sections
 */
export function calculateTotalScore(sectionScores: SectionScores): number {
  return Object.values(sectionScores).reduce((sum, score) => sum + score, 0);
}

/**
 * Get response options for a specific section
 */
export function getSectionResponseOptions(section: string): string[] {
  switch (section) {
    case "policy":
      return ["Yes", "No, but willing to have", "No & Not willing to have"];
    case "esg":
      return [
        "Yes", "Likely", "Partial", "No", 
        "For moderate intent and performance", 
        "Orange manufacturing Industry", 
        "Yes Adhoc", "Often", 
        "Quarterly", 
        "Sometimes (including management emails)", 
        "Few times but resolved against"
      ];
    case "social":
      return [
        "No", "Yes on roll skilled workers", "Yes on contract skilled worker", 
        "Only few housekeeping/ office boys /Skilled unskilled or semiskilled workers with no written contract",
        "Yes for both contract and on roll workers", "Yes only for on roll employees only", 
        "Yes for contractn employees", "None for contract or on-roll",
        "Yes, documented fairwages", "Reportedly fair wages but no documents", 
        "Data defficient", "No, there is clear scope to improve",
        "Past media stories", "Past Litigations/ Arbitrations", "Often", 
        "Sometimes", "Not as such", "No dues related issues",
        "100% Satisfaction", "Greater then 80% Satisfaction", 
        "Less then 50% satisfaction", "Signs of more dissatisfaction", 
        "Clear signs of dissatisfaction and detachment", 
        "Yes; Few minor issues", "Clear signs but managed somehow", 
        "Consistent issues", "Unpleasant legal or other consequences in past", 
        "Pending litigations", 
        "The sector is not prone to such issues", "Acknowledgement & some action", 
        "Only Acknowledgement but no action", "No Acknowledgement", 
        "Yes", "Defined only for founders/ partners", "Not defined for anyone", 
        "Somewhat", 
        "Yes, Female lead business", "Gender as a theme/effective gender mainstreaming", 
        "Some gender elements and scope to improve", 
        "No gender elements or scope of gender elements incorporation", 
        "Only for internal or external"
      ];
    case "environmental":
      return [
        "Shared or leased office space", "Own operational office facility", 
        "Own office is under construction or planned to be constructed with the use of investment proceeds",
        "No. Company operations does not require a R&D lab", "Leased space used for R&D facility", 
        "Existing/operational R&D facility in own land/building", 
        "Own R&D facility under construction or planned to be constructed with the use of investment proceeds",
        "No. Company operations does not require warehousing", "Leased facility", 
        "Own existing/operational facility", 
        "Own facility under construction or planned to be constructed with the use of investment proceeds",
        "No. Company operations does not and will not need manufacturing facilities now and in the future", 
        "The company has no manufacturing activities now but may require in the future in next 4-5 years", 
        "Outsourced manufaturing will be relied upon in short to medium term", 
        "Leased/owned existing/operational facility", 
        "Own facility under construction or planned to be constructed with the use of investment proceeds",
        "The company does not require any owned or outsourced warehouses, laboratories, manufacturing facilities or transportation/logistics fleet", 
        "Yes the company has Environmental and Occupational Health & Safety requirements for its 3rd party providers consistent with national and local laws and regulations", 
        "No, Environmental and Occupational Health & Safety attributes is not among the key considerations for selecting and working with 3rd party providers",
        "NA or no wastewater or ZLD with maximum reuse", 
        "Sanitary wastewater from office into STP of self or building owner, or leading to soak pits or public sewer", 
        "Any open discharge of sewage", "Industrial effluent to ETP", 
        "Industrial effluent to CETP", "Non-treated discharge of effluent",
        "NA or no process emission", "Only small vents associated with R&D", 
        "Industrial Heating or cooling related stacks with pollution control systems", 
        "Stacks without any pollution control system but meeting regulatory thresholds", 
        "Barely meeting thresholds", "Not meeting thresholds",
        "No", "Yes",
        "Complies with Indian Regulations as of date", "ROHS /REACH Triggered and complied", 
        "Not Complied to any regulations",
        "Only e-waste or biomedical waste", "Only Hazardous Waste", "Two of the waste", 
        "All three kind of waste but has authorisation", "All three kind of waste and lacks authroisation",
        "NA", "Yes EPR implemented", "Yes on paper to be rolled out", "Being worked upon",
        "No radiation or Radio waves involved", "Radition Equipment / radio equipment type approved by AERB/ TRAI in India", 
        "Equipment Type approved in OECD or any G20 countries but not in India", 
        "Equipment Type approved elsewhere", "Equipment not type approved by any regulators yet", 
        "Company not aware of radiation levels, Control measures and approval requirements",
        "Potential negative contributions to sustainability themes in current shape and form",
        "Somewhat", "Minimal and controllable", "Moderate with controls", 
        "High", "Significant", "Far reaching or catastrophic",
        "Yes as per EU-US norms", "Yes per local norms", 
        "Partially meets local regulatory requirements", "No, labelling at present, being worked upon", 
        "No, Company does not know the requirements"
      ];
    case "impact":
      return [
        "Yes", "Somewhat", "No",
        "Greater than 10 SDGs", "5-10 SDGs", "Less then 5 SDGs"
      ];
    default:
      return [];
  }
}

export const responseOptions = {
  policy: ["Yes", "No, but willing to have", "No & Not willing to have"],
  esg: [
    "Yes", "Likely", "Partial", "No", 
    "For moderate intent and performance", 
    "Orange manufacturing Industry", 
    "Yes Adhoc", "Often", 
    "Quarterly", 
    "Sometimes (including management emails)", 
    "Few times but resolved against"
  ],
  social: [
    "No", "Yes on roll skilled workers", "Yes on contract skilled worker", 
    "Only few housekeeping/ office boys /Skilled unskilled or semiskilled workers with no written contract",
    "Yes for both contract and on roll workers", "Yes only for on roll employees only", 
    "Yes for contractn employees", "None for contract or on-roll",
    "Yes, documented fairwages", "Reportedly fair wages but no documents", 
    "Data defficient", "No, there is clear scope to improve",
    "No dues related issues", "Not as such", "Sometimes", "Often", 
    "Past Litigations/ Arbitrations", "Past media stories",  
    "100% Satisfaction", "Greater then 80% Satisfaction", 
    "Less then 50% satisfaction", "Signs of more dissatisfaction", 
    "Clear signs of dissatisfaction and detachment", 
    "No", "Yes; Few minor issues", "Clear signs but managed somehow", 
    "Consistent issues", "Unpleasant legal or other consequences in past", 
    "Pending litigations", 
    "The sector is not prone to such issues", "Acknowledgement & some action", 
    "Only Acknowledgement but no action", "No Acknowledgement", 
    "Yes", "Somewhat", "No",
    "Defined only for founders/ partners", "Not defined for anyone", 
    "Yes, Female lead business", "Gender as a theme/effective gender mainstreaming", 
    "Some gender elements and scope to improve", 
    "No gender elements or scope of gender elements incorporation", 
    "Only for internal or external"
  ],
  environmental: [
    "Shared or leased office space", "Own operational office facility", 
    "Own office is under construction or planned to be constructed with the use of investment proceeds",
    "No. Company operations does not require a R&D lab", "Leased space used for R&D facility", 
    "Existing/operational R&D facility in own land/building", 
    "Own R&D facility under construction or planned to be constructed with the use of investment proceeds",
    "No. Company operations does not require warehousing", "Leased facility", 
    "Own existing/operational facility", 
    "Own facility under construction or planned to be constructed with the use of investment proceeds",
    "No. Company operations does not and will not need manufacturing facilities now and in the future", 
    "The company has no manufacturing activities now but may require in the future in next 4-5 years", 
    "Outsourced manufaturing will be relied upon in short to medium term", 
    "Leased/owned existing/operational facility", 
    "Own facility under construction or planned to be constructed with the use of investment proceeds",
    "The company does not require any owned or outsourced warehouses, laboratories, manufacturing facilities or transportation/logistics fleet", 
    "Yes the company has Environmental and Occupational Health & Safety requirements for its 3rd party providers consistent with national and local laws and regulations", 
    "No, Environmental and Occupational Health & Safety attributes is not among the key considerations for selecting and working with 3rd party providers",
    "NA or no wastewater or ZLD with maximum reuse", 
    "Sanitary wastewater from office into STP of self or building owner, or leading to soak pits or public sewer", 
    "Any open discharge of sewage", "Industrial effluent to ETP", 
    "Industrial effluent to CETP", "Non-treated discharge of effluent",
    "NA or no process emission", "Only small vents associated with R&D", 
    "Industrial Heating or cooling related stacks with pollution control systems", 
    "Stacks without any pollution control system but meeting regulatory thresholds", 
    "Barely meeting thresholds", "Not meeting thresholds",
    "No", "Yes",
    "Complies with Indian Regulations as of date", "ROHS /REACH Triggered and complied", 
    "Not Complied to any regulations",
    "Only e-waste or biomedical waste", "Only Hazardous Waste", "Two of the waste", 
    "All three kind of waste but has authorisation", "All three kind of waste and lacks authroisation",
    "NA", "Yes EPR implemented", "Yes on paper to be rolled out", "Being worked upon",
    "No radiation or Radio waves involved", "Radition Equipment / radio equipment type approved by AERB/ TRAI in India", 
    "Equipment Type approved in OECD or any G20 countries but not in India", 
    "Equipment Type approved elsewhere", "Equipment not type approved by any regulators yet", 
    "Company not aware of radiation levels, Control measures and approval requirements",
    "Yes", "Likely", "No", 
    "Potential negative contributions to sustainability themes in current shape and form",
    "Somewhat", "Minimal and controllable", "Moderate with controls", 
    "High", "Significant", "Far reaching or catastrophic",
    "Yes as per EU-US norms", "Yes per local norms", 
    "Partially meets local regulatory requirements", "No, labelling at present, being worked upon", 
    "No, Company does not know the requirements"
  ],
  impact: [
    "Yes", "Somewhat", "No",
    "Greater than 10 SDGs", "5-10 SDGs", "Less then 5 SDGs"
  ]
};
