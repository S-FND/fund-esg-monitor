
import { CategoryQuestion } from "@/types/categorization";

export const esgQuestions: CategoryQuestion[] = [
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
];
