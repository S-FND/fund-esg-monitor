import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";
import { useAccessControl } from "@/contexts/AccessControlContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DemoModeToggle() {
  const { isDemoMode, enableDemoMode, disableDemoMode } = useAccessControl();

  return (
    <div className="flex items-center gap-2">
      {isDemoMode && (
        <Badge variant="secondary" className="text-xs">
          Demo Mode
        </Badge>
      )}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isDemoMode ? (
            <DropdownMenuItem onClick={disableDemoMode}>
              Disable Demo Mode
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={enableDemoMode}>
              Enable Demo Mode
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}