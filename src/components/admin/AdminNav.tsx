
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

export function AdminNav() {
  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" asChild>
        <Link to="/admin/risks" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          <span>Manage ESG Risks</span>
        </Link>
      </Button>
      <Button variant="ghost" asChild>
        <Link to="/admin/non-compliances" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          <span>Manage Non-Compliances</span>
        </Link>
      </Button>
    </div>
  );
}
