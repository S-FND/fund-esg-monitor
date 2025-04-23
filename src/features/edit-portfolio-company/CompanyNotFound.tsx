
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function CompanyNotFound() {
  const navigate = useNavigate();
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-2">Company Not Found</h2>
      <Button variant="outline" onClick={() => navigate("/portfolio")}>
        Back to Portfolio
      </Button>
    </div>
  );
}
