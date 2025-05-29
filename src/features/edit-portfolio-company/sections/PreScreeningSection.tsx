
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestionsTable } from "@/components/pre-screening/QuestionsTable";
import { ManageQuestions } from "@/components/pre-screening/ManageQuestions";
import { ScoreSummary } from "@/components/pre-screening/ScoreSummary";
import { usePreScreeningResponses } from "@/hooks/usePreScreeningResponses";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Default pre-screening questions
const defaultQuestions = [
  {
    id: "B.1",
    question: "Does the company have documented policies on environmental protection?",
    scoringCriteria: "No: 0, Yes/Maybe: 1",
    weightage: 0.5
  },
  {
    id: "B.2", 
    question: "Does the company follow labor law compliance standards?",
    scoringCriteria: "No: 0, Yes/Maybe: 1",
    weightage: 0.5
  },
  {
    id: "B.3",
    question: "Does the company have diversity and inclusion policies?",
    scoringCriteria: "No: 0, Yes/Maybe: 1", 
    weightage: 0.3
  }
];

interface PreScreeningSectionProps {
  companyId: number;
}

export function PreScreeningSection({ companyId }: PreScreeningSectionProps) {
  const [questions, setQuestions] = useState(defaultQuestions);
  const { toast } = useToast();
  
  const {
    responses,
    handleResponseChange,
    handleRemarksChange,
    updateResponsesForQuestions,
    getTotalScore
  } = usePreScreeningResponses(questions);

  useEffect(() => {
    updateResponsesForQuestions(questions);
  }, [questions, updateResponsesForQuestions]);

  const handleQuestionUpdate = (updatedQuestions: any[]) => {
    setQuestions(updatedQuestions);
  };

  const handleResponseChangeWrapper = (questionId: string, value: string) => {
    handleResponseChange(questionId, value, questions);
  };

  const handleSaveResponses = () => {
    // In a real app, this would save to the backend
    console.log("Saving pre-screening responses for company", companyId, responses);
    toast({
      title: "Responses Saved",
      description: "Pre-screening responses have been saved successfully."
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Pre-Screening Questions</h2>
        <div className="flex gap-2">
          <ManageQuestions 
            questions={questions} 
            onQuestionUpdate={handleQuestionUpdate}
          />
          <Button onClick={handleSaveResponses}>Save Responses</Button>
        </div>
      </div>

      <ScoreSummary 
        totalScore={getTotalScore()}
        maxScore={questions.reduce((sum, q) => sum + q.weightage, 0)}
      />

      <Card>
        <CardHeader>
          <CardTitle>Questions & Responses</CardTitle>
        </CardHeader>
        <CardContent>
          <QuestionsTable
            questions={questions}
            responses={responses}
            onResponseChange={handleResponseChangeWrapper}
            onRemarksChange={handleRemarksChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}
