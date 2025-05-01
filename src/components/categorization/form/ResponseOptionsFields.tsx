
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CategorySection } from "@/types/categorization";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { responseOptions } from "@/data/categorization/responseOptions";

interface ResponseOptionsFieldsProps {
  selectedSection: CategorySection;
  responsesList: { response: string; score: number }[];
  addResponse: (response: string, score: number) => void;
  removeResponse: (index: number) => void;
}

export function ResponseOptionsFields({
  selectedSection,
  responsesList,
  addResponse,
  removeResponse
}: ResponseOptionsFieldsProps) {
  const [selectedResponse, setSelectedResponse] = useState<string>("");
  const [selectedScore, setSelectedScore] = useState<string>("0");
  
  // Get section-specific response options
  const availableResponses = responseOptions[selectedSection] || [];

  const handleAddResponse = () => {
    if (selectedResponse) {
      addResponse(selectedResponse, parseFloat(selectedScore) || 0);
      setSelectedResponse("");
      setSelectedScore("0");
    }
  };

  return (
    <div className="border p-4 rounded-md">
      <h3 className="font-medium mb-3">Response Options and Scores</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Select possible responses and assign scores for each
      </p>
      
      <div className="space-y-2 mb-4">
        {responsesList.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-grow p-2 border rounded bg-muted/30">
              <span className="font-medium mr-2">{item.response}:</span>
              <span>{item.score} points</span>
            </div>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              onClick={() => removeResponse(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {responsesList.length === 0 && (
          <p className="text-sm text-muted-foreground italic">No responses added yet</p>
        )}
      </div>
      
      <div className="flex items-end gap-2">
        <div className="flex-grow space-y-2">
          <label className="text-sm font-medium">Response</label>
          <Select 
            value={selectedResponse}
            onValueChange={setSelectedResponse}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select response option" />
            </SelectTrigger>
            <SelectContent>
              {availableResponses.map(response => (
                <SelectItem key={response} value={response}>
                  {response}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-24 space-y-2">
          <label className="text-sm font-medium">Score</label>
          <Input
            type="number"
            step="0.5"
            value={selectedScore}
            onChange={(e) => setSelectedScore(e.target.value)}
          />
        </div>
        
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleAddResponse}
          disabled={!selectedResponse}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
