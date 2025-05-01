
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ObjectiveCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Objective</CardTitle>
      </CardHeader>
      <CardContent>
        <p>
          Post Go/No Go outcome from Part B, designated E&S resource to proceed with E&S categorization and ESDD questionnaire using the below tool. 
          The tool will help in assigning a preliminary categorization based on inherent E&S risks of the proposed idea / project / business / investment. 
          Scoring is assigned and to be selected from drop down - High score indicates either higher E&S risk profile or complex challenges in mitigation; 
          Low score indicates lower risk profile and simple mitigation or management of the identified risks. 
          If the results yielded are Low or Category C, ESDD Report template as provided in VC Fund ESMS shall be completed based on the information furnished from Column F of this tool by the designated E&S Resource.
        </p>
        <p className="mt-4 font-medium">
          Note: Policies covered in section 1 are mandatory as CPs to investment. If No & not willing to option is selected for one or more questions, 
          yet term sheets are issued; it is incumbent upon the Fund to push these through in the final negotiations failing which the investment should be dropped.
        </p>
        <p className="mt-2 italic">
          *For Data Deficiency or can not be determined, always select score as 1 ; and for Not applicable select score as 0
        </p>
      </CardContent>
    </Card>
  );
}
