
import { CategoriesData } from "@/types/categorization";

export const categorizationQuestions: CategoriesData = {
  "policy": [
    {
      id: "1.1",
      question: "Does the company have or willing to have a policy towards environmental protection or betterment, and compliance to applicable law & regulations?",
      scoringCriteria: "Yes- 0, No but willing to have- 1, No & Not willing to have: 3",
      guidance: "Information on the policies to be included in ESDD Report template"
    },
    {
      id: "1.2",
      question: "Does the company have or willing to have a policy on occupational and/or community health and safety and compliance to applicable regulations?",
      scoringCriteria: "Yes- 0, No but willing to have- 1, No & Not willing to have: 3",
      guidance: "Information on the policies to be included in ESDD Report template"
    },
    {
      id: "1.3",
      question: "Does the company have or willing to have a Code of Conduct/Ethics and/or policies on Anti-Bribery and Corruption?",
      scoringCriteria: "Yes- 0, No but willing to have- 1, No & Not willing to have: 3",
      guidance: "Information on the policies to be included in ESDD Report template"
    },
    {
      id: "1.4",
      question: "Does the company have or willing to have human resource policy that also include emphasis on equal job opportunities? (e.g. no discrimination based on gender / ethnic group / age)?",
      scoringCriteria: "Yes- 0, No but willing to have- 1, No & Not willing to have: 3",
      guidance: "Information on the policies to be included in ESDD Report template"
    },
    {
      id: "1.5",
      question: "Does the company have or willing to have a ethical/ responsible sourcing policy for selections of suppliers and partners to review its existing and future supplier pool?",
      scoringCriteria: "Yes- 0, No but willing to have- 1, No & Not willing to have: 3",
      guidance: "Information on the policies to be included in ESDD Report template"
    },
    {
      id: "1.6",
      question: "Does the company have or willing to have an Anti-harassment / POSH policy?",
      scoringCriteria: "Yes- 0, No but willing to have- 1, No & Not willing to have: 3",
      guidance: "Information on the policies to be included in ESDD Report template"
    },
    {
      id: "1.7",
      question: "Does the company have or willing to have an information security & data management guidelines for data privacy?",
      scoringCriteria: "Yes- 0, No but willing to have- 1, No & Not willing to have: 3",
      guidance: "Information on the policies to be included in ESDD Report template"
    },
    {
      id: "1.8",
      question: "Does the company have or willing to have a policy or practice demonstrating responsibility to its customers and society at large?",
      scoringCriteria: "Yes- 0, No but willing to have- 1, No & Not willing to have: 3",
      guidance: "Information on the policies to be included in ESDD Report template"
    },
    {
      id: "1.9",
      question: "Does the company already have or most likely going to have another ESG sensitive VC fund/ angel as their investors?",
      scoringCriteria: "Yes- 0, No but willing to have- 1, No & Not willing to have: 3",
      guidance: "Information on the policies to be included in ESDD Report template - for DFI backed intermediary or DFI itself - 0, Angel / VC/ impact fund with stated ESG objectives - 1, VC fund with no ESG goals- 2 for everything else - 3"
    },
  ],
  "esg": [
    {
      id: "2.1",
      question: "Does the company have a positive ESG theme or outlook?(Some example of Positive ESG Outlook would mean : Remote Health Care Contributing to social well being and good health. Battery Management Software, e-mobility adoption & Climate Action)",
      scoringCriteria: "Yes- (-1), Likely -0, No-1",
      guidance: "Information on ESG theme or outlook to be included in ESDD Report template."
    },
    {
      id: "2.2",
      question: "Has Appendix- A : Employee Engagement Questionnaire been filled out by sample number of non-management staff ?",
      scoringCriteria: "For best ethics, work culture and potential to be leaders in ESG- 0, For moderate intent and performance- 1, For various degree of challenges, bad work culture, management resistance towards providing healthy workspace -2 to 4",
      guidance: ""
    },
    {
      id: "2.3",
      question: "With the nature of operations of this company, are there any significant E&S risks and opportunities inherent to the business and or in the supply chain? [Please note a few examples of key E&S risks and/or opportunities in the observations column]",
      scoringCriteria: "No significant Risks oppertunities - 0 For Company- 1, Supply Chain- 2, Sales/ Distribution network-3 Entire Valuechain- 4 Alternatively NoSignificant RIsk and Oppurtunities:0 Directly inhte Supply Chain or directly form the product or services ( Sales/ distribution ) 2 Indirectly from the product or operation (e..g H&S safety risk, product used for fossil fuel industry etc) 3 Can be used for purpose which might have potential E&S risk (e.g. security, privacy, cmmunity health safety )which may require detailed assessment 4",
      guidance: "Information on significant E&S risks & opportunities to be included in ESDD Report template as identified in the VC Fund ESMS."
    },
    {
      id: "2.4",
      question: "Does the company presently have manufacturing either directly or on contract ?",
      scoringCriteria: "For Direct /Contract Manufacturing :No in Response column, or for white industry -0 Green imanufacturing industry -1, Orange manufacturing Industry -2, For orange manufacturing industry, with further outsouricing of polluting operation- 4 For Red manufacturing industries- 5 *Note: Use CPCB industry classification for white, green, orange, red",
      guidance: "Information on significant E&S risks & opportunities to be included in ESDD Report template as identified in the VC Fund ESMS."
    },
    {
      id: "2.5",
      question: "If the company has manufacturing activities at present through contract, does the company have ESG requirements for its contract manufacturers and/or prior to engaging with its contract manufacturers?",
      scoringCriteria: "For Yes- 0, No: 1",
      guidance: ""
    },
    {
      id: "2.6",
      question: "If the company has no manufacturing activity now, will the company eventually engage in manufacturing activities either directly or on contract in next 4-5 years?",
      scoringCriteria: "No: 0, Yes, May be- 1. Yes, sure- 2",
      guidance: ""
    },
    {
      id: "2.7",
      question: "Does the company have at least one staff overseeing ESG?",
      scoringCriteria: "Yes dedicated- 0, yes Adhoc- 1. No- 2",
      guidance: ""
    },
    {
      id: "2.8",
      question: "Does the company management discuss ESG factors in their management meeting?",
      scoringCriteria: "Yes Always (-1) Often - 0 Sometimes: 1 ( at least one in a quarter) Rarely: 2 (once a year or for a specifc investor) No, Never: 3",
      guidance: ""
    },
    {
      id: "2.9",
      question: "What is the ESG meeting frequency?",
      scoringCriteria: "Monthly - 0 Quarterly- 1 Annualy or during a fund raise- 2 Ad hoc- 3 Only during an incident or litigation or negative press - 4",
      guidance: ""
    },
    {
      id: "2.10",
      question: "Is the ESG discussion documented?",
      scoringCriteria: "Often - (-1) Sometimes i(ncluding management e-mails) -0 Not as such- 1",
      guidance: ""
    },
    {
      id: "2.11",
      question: "Has the company or its key people been involved in litigations or significant complaints & other issues involving employees, customers, community or regulators in past 1-5 years, pertaining to ESG issues?",
      scoringCriteria: "No - 0 Few times but resolved in favour - 1 Few times but resolved against- 2 Pending litigations -5",
      guidance: "To be captured in ESDD Report template"
    }
  ],
  "social": [
    {
      id: "3.1",
      question: "Has the company hired or engaged persons apart from the founding members?",
      scoringCriteria: "No- 0, Yes on roll skilled workers- 1, Yes on contract skilled worker- 2, only few housekeeping/ office boys /Skilled unskilled or semiskilled workers with no written contract - 3",
      guidance: ""
    },
    {
      id: "3.2",
      question: "Does the company enter into transparent employment or services agreement with its workers, and are all workers covered under such contracts?",
      scoringCriteria: "Yes for both contract and on roll workers- 0, Yes only for on roll employees only- 1, Yes for contractn employees- 2, None for contract or on-roll- 3",
      guidance: "Provide key features of employment contract."
    },
    {
      id: "3.3",
      question: "Does the company pay its employees fair wages in cash or ESOPs, that is documented?",
      scoringCriteria: "Yes, documented fairwages - 0 Reportedly fair wages but no documents- 1 Data defficient - 2 No, there is clear scope to improve- 3",
      guidance: ""
    },
    {
      id: "3.4",
      question: "Does the company have legacy issues towards non-payments to consultants or vendors or service providers?",
      scoringCriteria: "Past media stories - 5 Past Litigations/ Arbitrations - 4 Often - 3 Sometimes -2 Not as such- 1 No dues related issues- 0",
      guidance: ""
    },
    {
      id: "3.5",
      question: "Are the company`s employees satisfied and or proud to be working for the company?",
      scoringCriteria: "To be based on the online employee engagement survey. 100% Satisfaction - (-1) greater then 80% Satisfaction- 0 less then 50% satisfaction- 1 Signs of more dissatisfaction- 2 Clear signs of dissatisfaction and detachment- 3",
      guidance: ""
    },
    {
      id: "3.6",
      question: "Did any of the surveyed employees or any of the discussions indicated towards bad work culture and workers burn out?",
      scoringCriteria: "No - 0 Yes; Few minor issues - 1 clear signs but managed somehow- 2 Consistent issues- 3 Unpleasant legal or other consequences in past- 4 Pending litigations -5",
      guidance: ""
    },
    {
      id: "3.7",
      question: "Does the company recognize that the nature of sector and business can hamper emotional and mental wellbeing of its workers? And take conscious efforts towards engagement on these issues for better retention and productivity?",
      scoringCriteria: "The sector is not prone to such issues- 0 Acknowledgement & some action - 1 Only Acknowledgement but no action - 2 No Acknowledgement- 3",
      guidance: ""
    },
    {
      id: "3.8",
      question: "Does the company have a ethical and just retrenchment practice or framework?",
      scoringCriteria: "Yes - 0 Defined only for founders/ partners- 1 not defined for anyone- 2",
      guidance: ""
    },
    {
      id: "3.9",
      question: "Does the company or its promoters champion themselves as equal opportunity employers (in a stated/ documented manner)?",
      scoringCriteria: "Yes- 0, Somewhat- 1, No - 2 Diversity: having a diverse mix of people in a select core groups; Inclusion: Inclusion if diverse people in decision making",
      guidance: ""
    },
    {
      id: "3.10",
      question: "Does the company demonstrate diversity & Inclusion in its core group of employees and its board?",
      scoringCriteria: "Yes- 0, Somewhat-1, No-2",
      guidance: ""
    },
    {
      id: "3.11",
      question: "Does the company have a visible gender element in its operations and business?",
      scoringCriteria: "Yes, Female lead business- (-1) gender as a theme /effective gender mainstreaming - 0 some gender elements and scope to improve- 1 No gender elements or scope of gender elements incorporation - 2",
      guidance: ""
    },
    {
      id: "3.12",
      question: "Are there any Stakeholder engagement plan (SEP)/ mechanisms (for internal and external stakeholders) in place and documented?",
      scoringCriteria: "Yes- 0, Only for internal or external-1, no - 2",
      guidance: "To be captured in ESDD Report template"
    },
    {
      id: "3.13",
      question: "Are there any grievance redressal mechanisms (GRM) (for internal and external stakeholders) in place and documented?",
      scoringCriteria: "Yes- 0, Only for internal or external-1, no - 2",
      guidance: "To be captured in ESDD Report template"
    },
    {
      id: "3.14",
      question: "Does the company have a sustainable business model, that does rely on regulatory Faultline or exploitative labor practices towards low waged gig workers? Ex: Delivery boys, Drivers, Technicians in a aggregations model, who are easily classified as independent contractors",
      scoringCriteria: "Yes- 2, Somewhat-1, No-0",
      guidance: ""
    },
    {
      id: "3.15",
      question: "Does the company label its products and services in fair and transparent manner and avoid mis-labelling championing ethical marketing and fair competition?",
      scoringCriteria: "Yes- 0, Somewhat-1, No-2",
      guidance: ""
    },
    {
      id: "3.16",
      question: "From the desktop media stakeholder analysis, does it indicare that the company has received any negative media sentiments?",
      scoringCriteria: "No- 0, Somewhat-1, yes-2",
      guidance: "To be captured in ESDD along with inputs of 3rd party IDD consultant."
    },
    {
      id: "3.17",
      question: "From the desktop media stakeholder analysis, are indication on any cases of child labor, forced labor, crushing freedom of association or collective bargaining rights of workers?",
      scoringCriteria: "No- 0, Somewhat-1, yes-2 * for Yes, detail ed external dilligence to be undertaken",
      guidance: ""
    },
    {
      id: "3.18",
      question: "From the desktop media stakeholder analysis, does the company enjoy disproportionate media coverage vis-à-vis its industry peers?",
      scoringCriteria: "No- 0, Yes- 3 (risk of over exposure, and over scruitiny, paid news etc.)",
      guidance: ""
    }
  ],
  "environmental": [
    {
      id: "4.1",
      question: "Does the company have its own office?",
      scoringCriteria: "0 - shared or leased office space 1 - own operational office facility 2 - own office is under construction or planned to be constructed with the use of investment proceeds.",
      guidance: ""
    },
    {
      id: "4.2",
      question: "Does the company have its own research/prototype building/testing laboratory or facility?",
      scoringCriteria: "0 - No. Company operations does not require a R&D lab. 1 - leased space used for R&D facility 2 - existing/operational R&D facility in own land/building 3 - own R&D facility under construction or planned to be constructed with the use of investment proceeds.",
      guidance: ""
    },
    {
      id: "4.3",
      question: "Does the company have its own warehouse?",
      scoringCriteria: "0 - No. Company operations does not require warehousing 1 - leased facility 2 - own existing/operational facility 3 - own facility under construction or planned to be constructed with the use of investment proceeds.",
      guidance: ""
    },
    {
      id: "4.4",
      question: "Does the company have a manufacturing facility?",
      scoringCriteria: "0 - No. Company operations does not and will not need manufacturing facilities now and in the future. 1 - The company has no manufacturing activities now but may require in the future in next 4-5 years? 2 - Outsourced manufaturing will be relied upon in short to medium term 3 - leased/owned existing/operational facility 4- own facility under construction or planned to be constructed with the use of investment proceeds.",
      guidance: ""
    },
    {
      id: "4.5",
      question: "Does the company have minimum requirements defined and or periodic checks conducted for environmental and occupational health and safety performance attributes of outsourced operations? Including: for warehousing, research/prototype building/testing, manufacturing or transportation/logistics (Please note key examples in the observations column)",
      scoringCriteria: "0 - The company does not require any owned or outsourced warehouses, laboratories, manufacturing facilities or transportation/logistics fleet. 1- Yes the company has Environmental and Occupational Health & Safety requirements for its 3rd party providers consistent with national and local laws and regulations 3- No, Environmental and Occupational Health & Safety attributes is not among the key considerations for selecting and working with 3rd party providers.",
      guidance: ""
    },
    {
      id: "4.6",
      question: "Does/will the activities of the business/project (including third party manufacturers, if any, and/or end-users, if known at this time) generate and discharge wastewater into the environment?",
      scoringCriteria: "for NA or no wastewater or ZLD with maximum reuse: 0 sanitary wastewater from office into STP of self or building owner , or leading to soak pits or public sewer- 1 , or any open discharge of sewage- 2 For industrial effluent to ETP- 3 industrial effluent to CETP- 4 for non-treated discharge of effluent-5",
      guidance: "The EHS aspects basis their triggers are to be captured in the ESDD report. For aspects not triggered in ESDD it is to be captured as not applicable with a rationale."
    },
    {
      id: "4.7",
      question: "Will the activities of the business(including third party manufacturers, if any, and/or end-users, if known at this time) result in/has resulted any material process related air emissions (apart from electrical back up)?",
      scoringCriteria: "For NA or no process emission: 0 only small vents associated with R&D- 1 , Industrial Heating or cooling related stacks with pollution control systems- 2 Stacks without any pollution control system but meeting regulatory thresholds- 3 , barely meeting thresholds -4, not meeting thresholds- 5",
      guidance: ""
    },
    {
      id: "4.8",
      question: "Will the the product have potential to aid or cause material addition of GHG emission to the atmoshphere by the nature of it`s end use , ex: aiding mining, metal extraction or fossil fuel industry?",
      scoringCriteria: "Yes 2, No 0",
      guidance: ""
    },
    {
      id: "4.9",
      question: "Does the business directly or indirectly use or discharge or generate waste with hazardous/toxic chemicals as per the provisions in Indian e-waste and Hazardous waste rules 2016 (as covered under EU ROHS (Restriction of Hazardous Substances Directive)/ REACH (Registration, Evaluation, Authorization and Restriction of Chemicals) or Similar Regulations, and or ROHS)?",
      scoringCriteria: "No- 0, Complies with Indian Regulations as of date- 1 ROHS /REACH Triggered and complied- 2, Not Complied to any regulations - 3",
      guidance: ""
    },
    {
      id: "4.10",
      question: "Will the routine operations of the company (whether from its premises or that of outsourced partners`) generate any hazardous waste, e-waste, plastic waste or bio-medical waste requiring authorisation from pollution board?",
      scoringCriteria: "No- 0 only e-waste or biomedical waste- 1 only Hazardous Waste- 2 two of the waste- 3 All three kind of waste but has authorisation- 4 All three kind of waste and lacks authroisation- 5",
      guidance: ""
    },
    {
      id: "4.11",
      question: "Does the company have any extended producers responsibility framework for collection and recycling of its end of life product waste? (only in case of hardware)",
      scoringCriteria: "NA- 0 Yes EPR implemented- 0 Yes on paper to be rolled out- 1 Bring worked upon- 2, No- 3",
      guidance: ""
    },
    {
      id: "4.12",
      question: "Does the company`s work involve any electromagnetic waves, radio waves, or radiations that has inherent risk to impact health and wellbeing of humans or other living beings?",
      scoringCriteria: "No radiation or Radio waves involved -0, Radition Equipment / radio equipment type approved by AERB/ TRAI in India - 1, Equipment Type approved in OECD or any G20 countries but not in India- 2 Equipment Type approved elsewhere- 3 Equipment not type approved by any regulators yet- 4 Company not aware of radiation levels, Control measures and approval requirements- 5",
      guidance: ""
    },
    {
      id: "4.13",
      question: "Does the company operations or any specific initiatives contribute to sustainability of community or planet by reducing the environmental footprint vis-à-vis similar companies?",
      scoringCriteria: "Yes- (-1), Likely -0, No-1, Potential negative contributions to sustainability themes in current shape and form- 2",
      guidance: ""
    },
    {
      id: "4.14",
      question: "Does the company`s operations involve working conditions for its workers that could cause occupational illnesses, exposure to chemicals/dangerous conditions or equipment/ extreme high or low temperature / humid environment/ high noise or vibration / radiation; ergonomic diseases, contagious diseases (e.g., COVID-19), working in confined/ cramped spaces, fire hazards, etc.?",
      scoringCriteria: "Yes- 2, Somewhat- 1, No-0",
      guidance: ""
    },
    {
      id: "4.15",
      question: "Will the project cause health and safety risks to nearby households or communities such as noise, odor, and air emissions during construction and operation, fire hazards, chemical or hazardous waste spills, etc.?",
      scoringCriteria: "No- 0, Minimal and controllable- 1, Moderate with controls- 2, high-3, Significant-4, Far reaching or catastrophic- 5",
      guidance: ""
    },
    {
      id: "4.16",
      question: "In case company is producing hardware products, does the product and its packaging have adequate environmental labelling for end of life disposal, hazardous content or associated hazards for customers?",
      scoringCriteria: "Yes as per EU-US norms (-1), Yes per local norms- 0, Partially meets local regulatory requirements- 1, No, labelling at present, being worked upon-2, No, Company does not know the requirements- 3",
      guidance: ""
    }
  ],
  "impact": [
    {
      id: "5.1",
      question: "Does the company have a inherent impact theme that positively contributes to United Nation`s sustainable development goals?",
      scoringCriteria: "Yes- 0, Somewhat- 1, No-2",
      guidance: "Information on Impact attributes to be included in ESDD Report template."
    },
    {
      id: "5.2",
      question: "Does the company and its business have positive impact on UNSDGs, that can be considered as its core contribution? (Or have potential to be impacted?)",
      scoringCriteria: "Greater than 10 SDGs - 0 5-10 SDGs - 1 Less then 5 SDGs - 2",
      guidance: ""
    },
    {
      id: "5.3",
      question: "Apart from Core SDGs, does the company and its business have positive impact on other UNSDGs, that can be considered as its ancillary contribution? (Or have potential to be impacted?)",
      scoringCriteria: "Greater than 10 SDGs - 0 5-10 SDGs - 1 Less then 5 SDGs - 2",
      guidance: ""
    },
    {
      id: "5.4",
      question: "Does the company and business contribute towards positive climate action? Ex: climate mitigation or Climate adaptation",
      scoringCriteria: "Yes- 0, Somewhat- 1, No-2",
      guidance: ""
    },
    {
      id: "5.5",
      question: "Does the company have potential to create significant number of jobs in India? If yes indicate a number for last 3 years period?",
      scoringCriteria: "Yes- 0, Somewhat- 1, No-2",
      guidance: ""
    },
    {
      id: "5.6",
      question: "Does the business contribute towards creating a market economics at a scale? Ex: large scale people connected to financial services or healthcare services though tech lead access!",
      scoringCriteria: "Yes- 0, Somewhat- 1, No-2",
      guidance: ""
    }
  ]
};

export const responseOptions = {
  "policy": ["Yes", "No, but willing to have", "No & Not willing to have"],
  "esg": [
    "Yes", "Likely", "Partial", "No", 
    "For moderate intent and performance", 
    "Orange manufacturing Industry", 
    "Yes Adhoc", "Often", 
    "Quarterly", 
    "Sometimes (including management emails)", 
    "Few times but resolved against"
  ],
  "social": [
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
  ],
  "environmental": [
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
  ],
  "impact": [
    "Yes", "Somewhat", "No",
    "Greater than 10 SDGs", "5-10 SDGs", "Less then 5 SDGs"
  ]
};

export const getSectionTitle = (section: string) => {
  switch(section) {
    case "policy": return "Policy Commitment";
    case "esg": return "ESG";
    case "social": return "Social Attributes";
    case "environmental": return "Environmental and Occupational Health & Safety Attributes";
    case "impact": return "Impact Attributes";
    default: return section;
  }
};

export const getCategory = (score: number) => {
  if (score >= 25) return "A - High Risk";
  if (score >= 15) return "B - Medium Risk";
  return "C - Low Risk";
};
