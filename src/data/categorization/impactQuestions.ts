
import { CategoryQuestion } from "@/types/categorization";

export const impactQuestions: CategoryQuestion[] = [
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
];
