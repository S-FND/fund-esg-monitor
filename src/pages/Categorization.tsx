import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft } from "lucide-react";
import { ManageCategoryQuestions } from "@/components/categorization/ManageCategoryQuestions";

// Categorization questions by section
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
      question: "Does the company have a formal ESG management system in place?",
      scoringCriteria: "Yes- 0, Partial- 1, No- 2",
      guidance: "Include information on existing ESG management practices"
    },
    {
      id: "2.2",
      question: "Has the company conducted ESG risk assessment?",
      scoringCriteria: "Yes- 0, No- 2",
      guidance: "Include details of any risk assessments conducted"
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
  "esg": ["Yes", "Partial", "No"],
  "social": ["Yes", "Partial", "No"],
  "environmental": ["Yes, comprehensive", "Partial", "No"],
  "impact": ["Yes, with metrics", "Yes, qualitative", "No"]
};

export default function Categorization() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState(categorizationQuestions);
  
  // Initialize responses with default values
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
  
  const handleResponseChange = (section: string, questionId: string, value: string) => {
    const options = responseOptions[section as keyof typeof responseOptions];
    const index = options.indexOf(value);
    const scoreMap = [0, 1, 3]; // Default scoring pattern
    
    let score = scoreMap[index];
    
    // Special case for question 1.9
    if (questionId === "1.9") {
      if (value === "Yes") score = 0;
      else if (value === "No, but willing to have") score = 1;
      else score = 3;
    }
    
    setResponses(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [questionId]: {
          ...prev[section][questionId],
          response: value,
          score: score
        }
      }
    }));
  };
  
  const handleObservationsChange = (section: string, questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [questionId]: {
          ...prev[section][questionId],
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
    
    // Update responses to include any new questions
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

  // Calculate section scores
  const sectionScores = Object.keys(categorizationQuestions).reduce<Record<string, number>>((acc, section) => {
    const sectionQuestions = categorizationQuestions[section as keyof typeof categorizationQuestions];
    const total = sectionQuestions.reduce((sum, question) => {
      return sum + (responses[section][question.id]?.score || 0);
    }, 0);
    acc[section] = total;
    return acc;
  }, {});
  
  // Calculate total score
  const totalScore = Object.values(sectionScores).reduce((sum, score) => sum + score, 0);
  
  // Determine company category based on total score
  const getCategory = (score: number) => {
    if (score >= 25) return "A - High Risk";
    if (score >= 15) return "B - Medium Risk";
    return "C - Low Risk";
  };
  
  const category = getCategory(totalScore);
  
  // Function to get section title
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
        <div className="w-64 space-y-2">
          <h3 className="font-medium">Sections</h3>
          <div className="space-y-1">
            {Object.keys(categorizationQuestions).map((section) => (
              <div 
                key={section} 
                className={`flex justify-between items-center rounded-md px-3 py-2 text-sm cursor-pointer ${
                  activeTab === section ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
                onClick={() => setActiveTab(section)}
              >
                <span>{getSectionTitle(section)}</span>
                <span className="font-medium">{sectionScores[section]}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-8 p-4 bg-muted rounded-md">
            <h3 className="font-medium mb-2">Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Score:</span>
                <span className="font-bold">{totalScore}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Category:</span>
                <span className={`font-bold px-2 py-1 rounded ${
                  category.startsWith("A") 
                    ? "bg-red-100 text-red-800" 
                    : category.startsWith("B")
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                }`}>
                  {category}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between">
                <span>{getSectionTitle(activeTab)}</span>
                <span>Score: {sectionScores[activeTab]}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">S. No.</TableHead>
                    <TableHead className="w-[300px]">Question</TableHead>
                    <TableHead className="w-[150px]">Response</TableHead>
                    <TableHead className="w-[80px]">Score</TableHead>
                    <TableHead className="w-[150px]">Scoring Criteria</TableHead>
                    <TableHead className="w-[200px]">Specific Observations</TableHead>
                    <TableHead>Guidance for ESDD Report</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categorizationQuestions[activeTab as keyof typeof categorizationQuestions].map((question) => (
                    <TableRow key={question.id}>
                      <TableCell>{question.id}</TableCell>
                      <TableCell>{question.question}</TableCell>
                      <TableCell>
                        <Select 
                          value={responses[activeTab]?.[question.id]?.response} 
                          onValueChange={(value) => handleResponseChange(activeTab, question.id, value)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {responseOptions[activeTab as keyof typeof responseOptions].map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{responses[activeTab]?.[question.id]?.score}</TableCell>
                      <TableCell>{question.scoringCriteria}</TableCell>
                      <TableCell>
                        <Textarea 
                          value={responses[activeTab]?.[question.id]?.observations} 
                          onChange={(e) => handleObservationsChange(activeTab, question.id, e.target.value)}
                          placeholder="Add observations"
                          className="min-h-[60px]"
                        />
                      </TableCell>
                      <TableCell>{question.guidance}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
