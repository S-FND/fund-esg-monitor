
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { usePortfolio } from "@/contexts/PortfolioContext";
import { ManageCategoryQuestions } from "@/components/categorization/ManageCategoryQuestions";
import { CategoryScoringSidebar } from "@/components/categorization/CategoryScoringSidebar";
import { CategoryQuestionsTable } from "@/components/categorization/CategoryQuestionsTable";
import { ObjectiveCard } from "@/components/categorization/ObjectiveCard";
import { useCategorization } from "@/hooks/useCategorization";
import { getSectionTitle, getCategory } from "@/data/categorizationQuestions";


export default function Categorization() {
  const navigate = useNavigate();
  const { tempCompanyData, addCompany } = usePortfolio();
  
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
  const canManageQuestions = true; // Allow all users to manage questions without auth
  
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
        <Button onClick={() => {
          if (tempCompanyData) {
            // Create complete company object
            const newCompany = {
              name: tempCompanyData.companyName,
              type: tempCompanyData.companyType || "Private Ltd",
              sector: tempCompanyData.sector || "Others",
              fundId: parseInt(tempCompanyData.fundId) || 1,
              fundName: "New Fund", // You might want to fetch this based on fundId
              ceo: tempCompanyData.founder,
              investmentDate: tempCompanyData.investmentDate || new Date().toISOString().split('T')[0],
              stage: tempCompanyData.investmentStage || "Seed",
              shareholding: parseFloat(tempCompanyData.shareholding) || 0,
              employees: {
                founders: { 
                  male: parseInt(tempCompanyData.employeesFoundersMale) || 0, 
                  female: parseInt(tempCompanyData.employeesFoundersFemale) || 0, 
                  others: parseInt(tempCompanyData.employeesFoundersOthers) || 0 
                },
                others: { 
                  male: parseInt(tempCompanyData.employeesOtherMale) || 0, 
                  female: parseInt(tempCompanyData.employeesOtherFemale) || 0, 
                  others: parseInt(tempCompanyData.employeesOtherOthers) || 0 
                }
              },
              workers: {
                direct: { 
                  male: parseInt(tempCompanyData.workersDirectMale) || 0, 
                  female: parseInt(tempCompanyData.workersDirectFemale) || 0, 
                  others: parseInt(tempCompanyData.workersDirectOthers) || 0 
                },
                indirect: { 
                  male: parseInt(tempCompanyData.workersIndirectMale) || 0, 
                  female: parseInt(tempCompanyData.workersIndirectFemale) || 0, 
                  others: parseInt(tempCompanyData.workersIndirectOthers) || 0 
                }
              },
              esgCategory: category,
              esgScore: Math.round(totalScore * 10), // Convert to score out of 100
              boardObserverId: "5" // Default board observer
            };
            
            addCompany(newCompany);
          }
          navigate("/portfolio");
        }}>
          Complete and Save
        </Button>
      </div>
    </div>
  );
}
