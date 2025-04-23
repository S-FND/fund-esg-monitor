
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

interface NoCompaniesFoundProps {
  clearFilters: () => void;
}

export function NoCompaniesFound({ clearFilters }: NoCompaniesFoundProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-3 mb-4">
        <Mail className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium">No companies found</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        No companies match your filter criteria.
      </p>
      <Button variant="outline" onClick={clearFilters}>
        Clear Filters
      </Button>
    </div>
  )
}
