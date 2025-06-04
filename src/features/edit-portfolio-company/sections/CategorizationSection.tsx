
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryQuestionsTable } from "@/components/categorization/CategoryQuestionsTable";
import { CategoryScoringSidebar } from "@/components/categorization/CategoryScoringSidebar";
import { ManageCategoryQuestions } from "@/components/categorization/ManageCategoryQuestions";
import { useCategorization } from "@/hooks/useCategorization";
import { getCategory, getSectionTitle } from "@/data/categorizationQuestions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface CategorizationSectionProps {
  companyId: string;
}

export function CategorizationSection({ companyId }: CategorizationSectionProps) {
  const { toast } = useToast();
  const {
    questions={},
    responses,
    activeTab,
    sectionScores,
    totalScore,
    setActiveTab,
    handleResponseChange,
    handleObservationsChange,
    handleQuestionUpdate
  } = useCategorization(companyId);

  const handleSaveResponses = async () => {
    // In a real app, this would save to the backend
    console.log("Saving categorization responses for company", companyId, responses);
    try {
      let questionResponse = []
      Object.keys(questions).map((q, index) => {
        // let response=responses[q]
        questionResponse.push({
          srNumber: index,
          questionName: q,
          categoryTotalScore: 0,
          responses: questions[q].map((ques) => {
            return { ...ques, selectedResponse: responses[q][ques.id]?.response, score: responses[q][ques.id]?.score, observations: responses[q][ques.id]?.observations }
          })
        })
      })

      let preliminaryCategorisation = {}
      Object.keys(sectionScores).forEach((section) => {
        preliminaryCategorisation[section] = getCategory(sectionScores[section])
      })
      let payloadObj = {
        companyInfoId: companyId,
        grandTotal: totalScore,
        categories: questionResponse,
        preliminaryCategorisation: preliminaryCategorisation
      }
      const res = await fetch(`http://localhost:3002` + `/investor/categorisation`, {
        method: "POST",
        body: JSON.stringify({ ...payloadObj }),
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
      }
    } catch (error) {

    }
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
