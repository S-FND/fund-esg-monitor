
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { Fund } from "./useTeamAddForm";

export function TeamAddFundsField({
  funds,
  selectedFunds,
  setSelectedFunds,
  submitting,
}: {
  funds: Fund[];
  selectedFunds: string[];
  setSelectedFunds: (ids: string[]) => void;
  submitting: boolean;
}) {
  return (
    <div>
      <Label>Assign to Funds</Label>
      <Select
        onValueChange={(value) =>
          setSelectedFunds(
            selectedFunds.includes(value)
              ? selectedFunds.filter((id) => id !== value)
              : [...selectedFunds, value]
          )
        }
        value={selectedFunds[selectedFunds.length - 1]}
        disabled={submitting}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select funds" />
        </SelectTrigger>
        <SelectContent>
          {funds.map((fund) => (
            <SelectItem key={fund.id} value={fund.id}>
              {fund.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="text-xs text-muted-foreground mt-1">
        {selectedFunds.length > 0
          ? `${selectedFunds.length} fund(s) selected`
          : "No funds selected"}
      </div>
    </div>
  );
}
