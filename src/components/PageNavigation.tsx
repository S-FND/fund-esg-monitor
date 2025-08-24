import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

interface PageNavigationProps {
  className?: string;
}

export function PageNavigation({ className = "" }: PageNavigationProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    // Check if there's history to go back to, otherwise go to home
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const handleHome = () => {
    navigate("/");
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleBack}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleHome}
        className="flex items-center gap-2"
      >
        <Home className="h-4 w-4" />
        Home
      </Button>
    </div>
  );
}