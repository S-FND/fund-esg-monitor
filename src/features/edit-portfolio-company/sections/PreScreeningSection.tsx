
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestionsTable } from "@/components/pre-screening/QuestionsTable";
import { ManageQuestions } from "@/components/pre-screening/ManageQuestions";
import { getAction, getDecision, ScoreSummary } from "@/components/pre-screening/ScoreSummary";
import { usePreScreeningResponses } from "@/hooks/usePreScreeningResponses";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { http } from "@/utils/httpInterceptor";

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
  companyId: string;
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
  } = usePreScreeningResponses(questions, companyId);

  useEffect(() => {
    updateResponsesForQuestions(questions);
    // setQuestions(renumberedQuestions)
  }, [questions]);

  const handleQuestionUpdate = (updatedQuestions: any[]) => {
    setQuestions(updatedQuestions);
    saveQuestions(updatedQuestions)
  };

  const handleResponseChangeWrapper = (questionId: string, value: string) => {
    handleResponseChange(questionId, value, questions);
  };

  const handleSaveResponses = async () => {
    // In a real app, this would save to the backend
    console.log("Saving pre-screening responses for company", companyId, responses);
    console.log('responses', responses)
    let totalScore = getTotalScore()
    let decision = getDecision(totalScore)
    let action = getAction(decision)
    let updatedQuestionData = questions.map((q,index) => {

      return { ...q,id:`B.${index+1}`, selectedResponse: responses[q.id]?.response, score: responses[q.id]?.score, remarks: responses[q.id]?.remarks }
    })
    console.log('updatedData', updatedQuestionData)
    let postPayload = {
      companyInfoId: companyId,
      responses: updatedQuestionData,
      totalScore: totalScore,
      action: action,
      decisionOnTheInvestment: {
        withCaution: decision,
        undertakeDetailed: ''
      }
    }
    const response = await http.post(`investor/pre-screening`, postPayload)
    if (response.data) {
      console.log(`handleSaveResponses :: response.data`, response.data)
      toast({
        title: "Responses Saved",
        description: "Pre-screening responses have been saved successfully."
      });
    }


  };

  const saveQuestions = async(questions)=>{
    try {
      let postPayload={
        companyInfoId:companyId,
        questions:questions.map((q,index) => {

          return { ...q,id:`B.${index+1}` }
        }),
        type:'Prescreening'
      }
      const response=await http.post(`investor/pre-screening/questions`,postPayload)
      if(response.data){
        getQuestions();
      }
      // const res = await fetch(`${import.meta.env.VITE_API_URL}` + `/investor/pre-screening/questions`, {
      //   method: "POST",
      //   body: JSON.stringify({...postPayload}),
      //   headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      // });
      // if (!res.ok) {
      //   // toast.error("Invalid credentials");
      //   // setIsLoading(false);
      //   return;
      // }
      // else {
      //   const jsondata = await res.json();
      //   console.log('jsondata', jsondata)
      //   getQuestions()
      // }
    } catch (error) {
      
    }
    finally{

    }
  }

 

  const getQuestions = async () => {
    try {
      const response = await http.get(`investor/pre-screening/questions/${companyId}/Prescreening`)
      if (response.data) {
        console.log('response.data', response.data)
        setQuestions(response.data.data)
      }
      else {
        //handle error
      }
    } catch (error) {

    }
    finally {

    }
  }

  useEffect(() => {
    getQuestions();
  }, [])

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
