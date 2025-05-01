import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronRight } from "lucide-react";
import { ManageQuestions } from "@/components/pre-screening/ManageQuestions";
import { useAuth } from "@/contexts/AuthContext";

// Initial pre-screening questions
const initialQuestions = [
  {
    id: "B.1",
    question: "Does the company and/or businesses potentially trigger any of the activity listed in FoF Exclusion List?",
    scoringCriteria: "No: 0, Yes/Maybe: 1",
    weightage: 1
  },
  {
    id: "B.2",
    question: "Does the company and/or businesses have potential to be used for military, surveillance, human profiling, infringing upon human rights & human dignity, affecting electoral process or run into future regulatory issues?",
    scoringCriteria: "No: 0, Yes/Maybe: 1",
    weightage: 1
  },
  {
    id: "B.3",
    question: "Does the company and/or businesses work in one or more the following frontier technological areas? a) Brain Computer Interfaces; b)Gene sequencing and editing; c)genetic medicines; d) quantum computing; e) drones and autonomous vehicles; f) facial recognition and biometrics; g) bio-surveillance ; h)block chain; i)Emotional AI or AI in productive analysis; j) blockchain & NFTs",
    scoringCriteria: "No: 0, Yes/Maybe: 0.33",
    weightage: 0.33
  },
  {
    id: "B.4",
    question: "Does the company and/or its businesses have the potential to involve involuntary land acquisition resulting in physical and economic displacement and livelihood systems?",
    scoringCriteria: "No: 0, Yes/Maybe: 0.33",
    weightage: 0.33
  },
  {
    id: "B.5",
    question: "Does the company and/or its businesses have the potential to impact on the identity, dignity, human rights, livelihood systems, and culture of indigenous peoples?",
    scoringCriteria: "No: 0, Yes/Maybe: 0.33",
    weightage: 0.33
  }
];

export default function PreScreening() {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [questions, setQuestions] = useState(initialQuestions);
  const [responses, setResponses] = useState<Record<string, { response: string; score: number; remarks: string }>>(() => {
    const initial: Record<string, { response: string; score: number; remarks: string }> = {};
    questions.forEach(q => {
      initial[q.id] = { response: "No", score: 0, remarks: "" };
    });
    return initial;
  });
  
  const handleResponseChange = (questionId: string, value: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    
    const newScore = value === "No" ? 0 : question.weightage;
    
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        response: value,
        score: newScore
      }
    }));
  };
  
  const handleRemarksChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        remarks: value
      }
    }));
  };
  
  const handleQuestionsUpdate = (updatedQuestions: any[]) => {
    setQuestions(updatedQuestions);
    // Update responses to include any new questions
    setResponses(prev => {
      const newResponses = { ...prev };
      updatedQuestions.forEach(q => {
        if (!newResponses[q.id]) {
          newResponses[q.id] = { response: "No", score: 0, remarks: "" };
        }
      });
      return newResponses;
    });
  };
  
  // Calculate total score
  const totalScore = Object.values(responses).reduce((sum, item) => sum + item.score, 0);
  
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
  
  const decision = getDecision(totalScore);
  
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
  
  const action = getAction(decision);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pre-Screening Gating Checklist</h1>
          <p className="text-muted-foreground">Part B</p>
        </div>
        
        {/* Display ManageQuestions component for all roles */}
        <ManageQuestions questions={questions} onQuestionUpdate={handleQuestionsUpdate} />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Objective</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Identify whether to proceed with the investment idea or not. Post responding to the Section 1 below, Go/No Go decision is arrived as an outcome.</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Section 1. Exclusion and Business Flaws Screening</span>
            <ManageQuestions questions={questions} onQuestionUpdate={handleQuestionsUpdate} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">S. No.</TableHead>
                <TableHead className="w-[300px]">Question</TableHead>
                <TableHead className="w-[150px]">Response</TableHead>
                <TableHead className="w-[100px]">Score</TableHead>
                <TableHead className="w-[150px]">Scoring Criteria</TableHead>
                <TableHead>Remarks / Comments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((question) => (
                <TableRow key={question.id}>
                  <TableCell>{question.id}</TableCell>
                  <TableCell>{question.question}</TableCell>
                  <TableCell>
                    <Select 
                      value={responses[question.id]?.response} 
                      onValueChange={(value) => handleResponseChange(question.id, value)}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="No">No</SelectItem>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="Maybe">Maybe</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{responses[question.id]?.score.toFixed(2)}</TableCell>
                  <TableCell>{question.scoringCriteria}</TableCell>
                  <TableCell>
                    <Textarea 
                      value={responses[question.id]?.remarks} 
                      onChange={(e) => handleRemarksChange(question.id, e.target.value)}
                      placeholder="Add remarks"
                      className="min-h-[60px]"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="mt-8 p-4 bg-muted rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium">Total Score:</p>
                <p className="text-2xl font-bold">{totalScore.toFixed(2)}</p>
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
        </CardContent>
      </Card>
      
      <div className="flex justify-between mt-6">
        <Button variant="outline" type="button" onClick={() => navigate(-1)}>
          Back
        </Button>
        <Button onClick={() => navigate("/portfolio/categorization")} className="gap-2">
          <span>Next: Categorization</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
