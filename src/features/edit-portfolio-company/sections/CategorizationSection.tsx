
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryQuestionsTable } from "@/components/categorization/CategoryQuestionsTable";
import { CategoryScoringSidebar } from "@/components/categorization/CategoryScoringSidebar";
import { ManageCategoryQuestions } from "@/components/categorization/ManageCategoryQuestions";
import { useCategorization } from "@/hooks/useCategorization";
import { getSectionTitle } from "@/data/categorizationQuestions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface CategorizationSectionProps {
  companyId: number;
}

export function CategorizationSection({ companyId }: CategorizationSectionProps) {
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

  const handleSaveResponses = () => {
    // In a real app, this would save to the backend
    console.log("Saving categorization responses for company", companyId, responses);
    toast({
      title: "Responses Saved", 
      description: "Categorization responses have been saved successfully."
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Categorization Questions</h2>
        <div className="flex gap-2">
          <ManageCategoryQuestions
            questions={questions}
            onQuestionUpdate={handleQuestionUpdate}
          />
          <Button onClick={handleSaveResponses}>Save Responses</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Category Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5">
                  {Object.keys(questions).map((section) => (
                    <TabsTrigger key={section} value={section}>
                      {getSectionTitle(section)}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {Object.entries(questions).map(([section, sectionQuestions]) => (
                  <TabsContent key={section} value={section} className="mt-6">
                    <CategoryQuestionsTable
                      questions={sectionQuestions}
                      responses={responses[section] || {}}
                      onResponseChange={handleResponseChange}
                      onObservationsChange={handleObservationsChange}
                      section={section}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <CategoryScoringSidebar
            sectionScores={sectionScores}
            totalScore={totalScore}
            activeSection={activeTab}
          />
        </div>
      </div>
    </div>
  );
}
