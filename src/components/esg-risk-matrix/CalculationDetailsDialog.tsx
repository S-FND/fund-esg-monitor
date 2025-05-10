
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Info } from "lucide-react";

interface CalculationDetailsDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  title: string;
  calculation?: string;
  reference?: string;
}

export function CalculationDetailsDialog({
  open,
  setOpen,
  title,
  calculation,
  reference,
}: CalculationDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription>
            Details of how this value was calculated
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 p-1">
            {calculation ? (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Calculation Method:</h3>
                <div className="rounded-md bg-muted p-3 text-sm whitespace-pre-wrap">
                  {calculation}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No calculation details available.</p>
            )}

            {reference && (
              <div className="space-y-2 pt-2 border-t">
                <h3 className="text-sm font-medium">Historical Data Reference:</h3>
                <div className="rounded-md bg-muted p-3 text-sm whitespace-pre-wrap">
                  {reference}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
