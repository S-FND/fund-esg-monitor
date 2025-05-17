
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TeamMemberHeaderProps {
  id: string;
}

export function TeamMemberHeader({ id }: TeamMemberHeaderProps) {
  const navigate = useNavigate();
  
  return (
    <div className="flex items-center mb-6">
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => navigate('/team')} 
        className="mr-2"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </Button>
      <h1 className="text-2xl font-semibold flex-1">Team Member Details</h1>
      <Button 
        onClick={() => navigate(`/team/edit/${id}`)}
        variant="outline"
        className="mr-2"
      >
        <Pencil className="h-4 w-4 mr-1" />
        Edit
      </Button>
    </div>
  );
}
