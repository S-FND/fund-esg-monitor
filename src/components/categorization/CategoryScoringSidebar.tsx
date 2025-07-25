
import { getSectionTitle, getCategory } from "@/data/categorizationQuestions";
import { SectionScores } from "@/types/categorization";

interface CategoryScoringProps {
  sectionScores: SectionScores;
  totalScore: number;
  activeSection: string;
}

export function CategoryScoringSidebar({ 
  sectionScores, 
  totalScore, 
  activeSection 
}: CategoryScoringProps) {
  const category = getCategory(totalScore);

  return (
    <div className="w-64 space-y-2">
      <h3 className="font-medium">Sections</h3>
      <div className="space-y-1">
        {Object.keys(sectionScores).map((section) => (
          <div 
            key={section} 
            className={`flex justify-between items-center rounded-md px-3 py-2 text-sm ${
              activeSection === section ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            <span>{getSectionTitle(section)}</span>
            <span className="font-medium">{sectionScores[section]}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-muted rounded-md">
        <h3 className="font-medium mb-2">Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Total Score:</span>
            <span className="font-bold">{totalScore}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Category:</span>
            <span className={`font-bold px-2 py-1 rounded ${
              category.startsWith("A") 
                ? "bg-red-100 text-red-800" 
                : category.startsWith("B")
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-green-100 text-green-800"
            }`}>
              {category}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
