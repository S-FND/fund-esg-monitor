
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { ManageQuestions } from "@/components/pre-screening/ManageQuestions";
import { useAuth } from "@/contexts/AuthContext";
import { ObjectivesCard } from "@/components/pre-screening/ObjectivesCard";
import { QuestionsTable } from "@/components/pre-screening/QuestionsTable";
import { ScoreSummary } from "@/components/pre-screening/ScoreSummary";
import { usePreScreeningResponses } from "@/hooks/usePreScreeningResponses";

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
  const {
    responses,
    handleResponseChange,
    handleRemarksChange,
    updateResponsesForQuestions,
    getTotalScore
  } = usePreScreeningResponses(initialQuestions);
  
  const handleQuestionsUpdate = (updatedQuestions: any[]) => {
    setQuestions(updatedQuestions);
    updateResponsesForQuestions(updatedQuestions);
  };
  
  // Calculate total score
  const totalScore = getTotalScore();
  
  // Determine if user can manage questions
  const canManageQuestions = userRole === 'admin' || userRole === 'investor_admin' || userRole === 'investor';
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pre-Screening Gating Checklist</h1>
          <p className="text-muted-foreground">Part B</p>
        </div>
        
        {canManageQuestions && (
          <ManageQuestions questions={questions} onQuestionUpdate={handleQuestionsUpdate} />
        )}
      </div>
      
      <ObjectivesCard />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Section 1. Exclusion and Business Flaws Screening</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <QuestionsTable 
            questions={questions} 
            responses={responses}
            onResponseChange={(questionId, value) => 
              handleResponseChange(questionId, value, questions)
            }
            onRemarksChange={handleRemarksChange}
          />
          
          <ScoreSummary totalScore={totalScore} />
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
