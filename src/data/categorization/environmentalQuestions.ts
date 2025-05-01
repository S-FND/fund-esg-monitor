
import { CategoryQuestion } from "@/types/categorization";

export const environmentalQuestions: CategoryQuestion[] = [
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
];
