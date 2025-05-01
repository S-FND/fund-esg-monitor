
/**
 * Calculate the score for an environmental section question based on its response
 */
export function calculateEnvironmentalScore(questionId: string, value: string): number {
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
  
  return 0;
}
