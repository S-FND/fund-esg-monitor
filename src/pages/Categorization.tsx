
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { ManageCategoryQuestions } from "@/components/categorization/ManageCategoryQuestions";
import { CategoryScoringSidebar } from "@/components/categorization/CategoryScoringSidebar";
import { CategoryQuestionsTable } from "@/components/categorization/CategoryQuestionsTable";
import { ObjectiveCard } from "@/components/categorization/ObjectiveCard";
import { useCategorization } from "@/hooks/useCategorization";
import { getSectionTitle, getCategory } from "@/data/categorizationQuestions";
import { responseOptions } from "@/data/categorization/responseOptions";
import { useAuth } from "@/contexts/AuthContext";

export default function Categorization() {
  const navigate = useNavigate();
  // const { userRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    questions,
    responses,
    activeTab,
    sectionScores,
    totalScore,
    setActiveTab,
    handleResponseChange,
    handleObservationsChange,
    handleQuestionUpdate
  } = useCategorization(searchParams.get('companyInfoId'));

  const category = getCategory(totalScore);
  const canManageQuestions = true
  // userRole === 'admin' || userRole === 'investor_admin' || userRole === 'investor';

  const submitCategorizationData = async () => {
    // navigate("/portfolio")
    try {
      let questionResponse=[]
    Object.keys(questions).map((q,index)=>{
      // let response=responses[q]
      questionResponse.push({
        srNumber:index,
        questionName:q,
        categoryTotalScore:0,
        responses:questions[q].map((ques)=>{
            return {...ques,selectedResponse:responses[q][ques.id]?.response,score:responses[q][ques.id]?.score,observations:responses[q][ques.id]?.observations}
          })
      })
    })
    
    let  preliminaryCategorisation={}
    Object.keys(sectionScores).forEach((section)=>{
      preliminaryCategorisation[section]=getCategory(sectionScores[section])
    })
    let payloadObj={
      companyInfoId:searchParams.get('companyInfoId'),
      grandTotal:totalScore,
      categories:questionResponse,
      preliminaryCategorisation:preliminaryCategorisation
    }
      const res = await fetch(`http://localhost:3002` + `/investor/categorisation`, {
        method: "POST",
        body: JSON.stringify({...payloadObj}),
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!res.ok) {
        // toast.error("Invalid credentials");
        // setIsLoading(false);
        return;
      }
      else {
        const jsondata = await res.json();
        console.log('jsondata', jsondata)
        // Navigate to pre-screening page
        navigate("/portfolio")
      }
    } catch (error) {
      
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categorization Checklist</h1>
          <p className="text-muted-foreground">Part C - ESG DD Questionnaire</p>
        </div>

        {canManageQuestions && (
          <ManageCategoryQuestions
            questions={questions}
            onQuestionUpdate={handleQuestionUpdate}
          />
        )}
      </div>

      <ObjectiveCard />

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
                questions={questions[activeTab as keyof typeof questions]}
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
        <Button onClick={() => submitCategorizationData()}>
          Complete and Save
        </Button>
      </div>
    </div>
  );
}
