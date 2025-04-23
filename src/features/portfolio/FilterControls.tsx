
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Fund {
  id: number;
  name: string;
}
interface FilterControlsProps {
  funds: Fund[];
  sectors: string[];
  selectedFund: string;
  selectedSector: string;
  setSelectedFund: (val: string) => void;
  setSelectedSector: (val: string) => void;
}
export function FilterControls({
  funds,
  sectors,
  selectedFund,
  selectedSector,
  setSelectedFund,
  setSelectedSector,
}: FilterControlsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label className="block text-sm font-medium mb-1">Filter by Fund</Label>
        <Select value={selectedFund} onValueChange={setSelectedFund}>
          <SelectTrigger>
            <SelectValue placeholder="All Funds" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Funds</SelectItem>
            {funds.map(fund => (
              <SelectItem key={fund.id} value={fund.id.toString()}>
                {fund.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="block text-sm font-medium mb-1">Filter by Sector</Label>
        <Select value={selectedSector} onValueChange={setSelectedSector}>
          <SelectTrigger>
            <SelectValue placeholder="All Sectors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sectors</SelectItem>
            {sectors.map(sector => (
              <SelectItem key={sector} value={sector}>
                {sector}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
