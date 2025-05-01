
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { ManageCategoryQuestions } from "@/components/categorization/ManageCategoryQuestions";
import { CategoryScoringSidebar } from "@/components/categorization/CategoryScoringSidebar";
import { CategoryQuestionsTable } from "@/components/categorization/CategoryQuestionsTable";

const categorizationQuestions = {
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
      question: "Does the company provide equal opportunities for all employees regardless of gender, ethnicity, etc.?",
      scoringCriteria: "Yes- 0, Partial- 1, No- 3",
      guidance: "Include information on diversity and inclusion practices"
    },
    {
      id: "3.2",
      question: "Does the company have a formal grievance mechanism for employees?",
      scoringCriteria: "Yes- 0, Developing- 1, No- 2",
      guidance: "Document existing grievance mechanisms"
    }
  ],
  "environmental": [
    {
      id: "4.1",
      question: "Does the company measure and monitor its environmental impact?",
      scoringCriteria: "Yes, comprehensive- 0, Partial- 1, No- 3",
      guidance: "Include environmental metrics and monitoring systems"
    },
    {
      id: "4.2",
      question: "Does the company have waste management and disposal protocols?",
      scoringCriteria: "Yes- 0, Developing- 1, No- 2",
      guidance: "Document waste management practices"
    }
  ],
  "impact": [
    {
      id: "5.1",
      question: "Does the company track positive social or environmental impacts?",
      scoringCriteria: "Yes, with metrics- 0, Yes, qualitative- 1, No- 2",
      guidance: "Include impact measurement frameworks and results"
    },
    {
      id: "5.2",
      question: "Does the company's core business model address any sustainable development goals?",
      scoringCriteria: "Yes, explicitly- 0, Yes, indirectly- 1, No- 2",
      guidance: "Map business activities to relevant SDGs"
    }
  ]
};

const responseOptions = {
  "policy": ["Yes", "No, but willing to have", "No & Not willing to have"],
  "esg": ["Yes", "Likely", "Partial", "No", "For moderate intent and performance", "Orange manufacturing Industry", "Yes Adhoc", "Often", "Quarterly", "Sometimes (including management emails)", "Few times but resolved against"],
  "social": ["Yes", "Partial", "No"],
  "environmental": ["Yes, comprehensive", "Partial", "No"],
  "impact": ["Yes, with metrics", "Yes, qualitative", "No"]
};

const getCategory = (score: number) => {
  if (score >= 25) return "A - High Risk";
  if (score >= 15) return "B - Medium Risk";
  return "C - Low Risk";
};

export default function Categorization() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState(categorizationQuestions);
  
  const initialResponses: Record<string, Record<string, { response: string; score: number; observations: string; }>> = {};
  
  Object.entries(categorizationQuestions).forEach(([section, questions]) => {
    initialResponses[section] = {};
    questions.forEach(question => {
      initialResponses[section][question.id] = { 
        response: responseOptions[section as keyof typeof responseOptions][0], 
        score: 0,
        observations: "" 
      };
    });
  });
  
  const [responses, setResponses] = useState(initialResponses);
  const [activeTab, setActiveTab] = useState<string>("policy");
  
  const handleResponseChange = (questionId: string, value: string) => {
    const options = responseOptions[activeTab as keyof typeof responseOptions];
    const index = options.indexOf(value);
    const scoreMap = [0, 1, 3]; // Default scoring pattern
    
    let score = scoreMap[index];
    
    if (questionId === "1.9") {
      if (value === "Yes") score = 0;
      else if (value === "No, but willing to have") score = 1;
      else score = 3;
    }
    
    setResponses(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [questionId]: {
          ...prev[activeTab][questionId],
          response: value,
          score: score
        }
      }
    }));
  };
  
  const handleObservationsChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [questionId]: {
          ...prev[activeTab][questionId],
          observations: value
        }
      }
    }));
  };
  
  const handleQuestionUpdate = (section: string, updatedQuestions: any[]) => {
    setQuestions(prev => ({
      ...prev,
      [section]: updatedQuestions
    }));
    
    setResponses(prev => {
      const newResponses = { ...prev };
      if (!newResponses[section]) {
        newResponses[section] = {};
      }
      
      updatedQuestions.forEach(q => {
        if (!newResponses[section][q.id]) {
          newResponses[section][q.id] = { 
            response: responseOptions[section as keyof typeof responseOptions][0], 
            score: 0,
            observations: "" 
          };
        }
      });
      
      return newResponses;
    });
  };

  const sectionScores = Object.keys(categorizationQuestions).reduce<Record<string, number>>((acc, section) => {
    const sectionQuestions = categorizationQuestions[section as keyof typeof categorizationQuestions];
    const total = sectionQuestions.reduce((sum, question) => {
      return sum + (responses[section][question.id]?.score || 0);
    }, 0);
    acc[section] = total;
    return acc;
  }, {});
  
  const totalScore = Object.values(sectionScores).reduce((sum, score) => sum + score, 0);
  
  const category = getCategory(totalScore);
  
  const getSectionTitle = (section: string) => {
    switch(section) {
      case "policy": return "Policy Commitment";
      case "esg": return "ESG";
      case "social": return "Social Attributes";
      case "environmental": return "Environmental and Occupational Health & Safety Attributes";
      case "impact": return "Impact Attributes";
      default: return section;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categorization Checklist</h1>
          <p className="text-muted-foreground">Part C - ESG DD Questionnaire</p>
        </div>
        <ManageCategoryQuestions 
          questions={questions} 
          onQuestionUpdate={handleQuestionUpdate}
        />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Objective</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Post Go/No Go outcome from Part B, designated E&S resource to proceed with E&S categorization and ESDD questionnaire using the below tool. 
            The tool will help in assigning a preliminary categorization based on inherent E&S risks of the proposed idea / project / business / investment. 
            Scoring is assigned and to be selected from drop down - High score indicates either higher E&S risk profile or complex challenges in mitigation; 
            Low score indicates lower risk profile and simple mitigation or management of the identified risks. 
            If the results yielded are Low or Category C, ESDD Report template as provided in VC Fund ESMS shall be completed based on the information furnished from Column F of this tool by the designated E&S Resource.
          </p>
          <p className="mt-4 font-medium">
            Note: Policies covered in section 1 are mandatory as CPs to investment. If No & not willing to option is selected for one or more questions, 
            yet term sheets are issued; it is incumbent upon the Fund to push these through in the final negotiations failing which the investment should be dropped.
          </p>
          <p className="mt-2 italic">
            *For Data Deficiency or can not be determined, always select score as 1 ; and for Not applicable select score as 0
          </p>
        </CardContent>
      </Card>
      
      <div className="flex space-x-6">
        <CategoryScoringSidebar 
          sectionScores={sectionScores}
          totalScore={totalScore}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        <div className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between">
                <span>{getSectionTitle(activeTab)}</span>
                <span>Score: {sectionScores[activeTab]}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryQuestionsTable
                questions={questions[activeTab as keyof typeof categorizationQuestions]}
                responses={responses[activeTab]}
                responseOptions={responseOptions[activeTab as keyof typeof responseOptions]}
                onResponseChange={handleResponseChange}
                onObservationsChange={handleObservationsChange}
              />
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="flex justify-between mt-6">
        <Button variant="outline" type="button" onClick={() => navigate(-1)} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>
        <Button onClick={() => navigate("/portfolio")}>
          Complete and Save
        </Button>
      </div>
    </div>
  );
}
