
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { ManageCategoryQuestions } from "@/components/categorization/ManageCategoryQuestions";
import { CategoryScoringSidebar } from "@/components/categorization/CategoryScoringSidebar";
import { CategoryQuestionsTable } from "@/components/categorization/CategoryQuestionsTable";
import { ObjectiveCard } from "@/components/categorization/ObjectiveCard";
import { useCategorization } from "@/hooks/useCategorization";
import { getSectionTitle, getCategory } from "@/data/categorizationQuestions";
import { useAuth } from "@/contexts/AuthContext";

export default function Categorization() {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  
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
  } = useCategorization();
  
  const category = getCategory(totalScore);
  const canManageQuestions = userRole === 'admin' || userRole === 'investor_admin' || userRole === 'investor';
  
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
          activeSection={activeTab}
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
                onResponseChange={handleResponseChange}
                onObservationsChange={handleObservationsChange}
                section={activeTab}
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
