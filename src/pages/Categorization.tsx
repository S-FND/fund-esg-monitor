
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
  
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
        <Button onClick={async () => {
          try {
            // Save ESG responses to database if company ID exists
            if (tempCompanyData?.companyId) {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                // Get user's profile to get tenant_id
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('tenant_id')
                  .eq('user_id', user.id)
                  .single();

                if (profile?.tenant_id) {
                  // Save each ESG response
                  const esgResponsesData = [];
                  for (const [section, sectionResponses] of Object.entries(responses)) {
                    for (const [questionId, response] of Object.entries(sectionResponses)) {
                      esgResponsesData.push({
                        company_id: tempCompanyData.companyId,
                        tenant_id: profile.tenant_id,
                        question_id: questionId,
                        category: section,
                        response_value: response.response,
                        score: response.score,
                        created_by: user.id
                      });
                    }
                  }

                  if (esgResponsesData.length > 0) {
                    const { error } = await supabase
                      .from('esg_responses')
                      .insert(esgResponsesData);

                    if (error) throw error;
                  }

                  // Update company with ESG score
                  const { error: updateError } = await supabase
                    .from('portfolio_companies')
                    .update({
                      esg_score: Math.round(totalScore * 10) / 10 // Convert to decimal score
                    })
                    .eq('id', tempCompanyData.companyId);

                  if (updateError) throw updateError;

                  toast({
                    title: "ESG Assessment Saved",
                    description: "ESG categorization data has been successfully saved.",
                  });
                }
              }
            }

            // For backward compatibility, still add to context
            if (tempCompanyData) {
              const newCompany = {
                name: tempCompanyData.companyName,
                type: tempCompanyData.companyType || "Private Ltd",
                sector: tempCompanyData.sector || "Others",
                fundId: parseInt(tempCompanyData.fundId) || 1,
                fundName: "New Fund",
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
                esgScore: Math.round(totalScore * 10),
                boardObserverId: "5"
              };
              
              addCompany(newCompany);
            }
            
            navigate("/portfolio");
          } catch (error) {
            console.error('Error saving ESG data:', error);
            toast({
              title: "Error",
              description: "Failed to save ESG data. Data saved locally.",
              variant: "destructive",
            });
            
            // Fallback to local storage
            if (tempCompanyData) {
              const newCompany = {
                name: tempCompanyData.companyName,
                type: tempCompanyData.companyType || "Private Ltd",
                sector: tempCompanyData.sector || "Others",
                fundId: parseInt(tempCompanyData.fundId) || 1,
                fundName: "New Fund",
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
                esgScore: Math.round(totalScore * 10),
                boardObserverId: "5"
              };
              
              addCompany(newCompany);
            }
            navigate("/portfolio");
          }
        }}>
          Complete and Save
        </Button>
      </div>
    </div>
  );
}
