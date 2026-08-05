
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Fund {
  _id: number;
  name: string;
}
interface FilterControlsProps {
  funds: Fund[];
  // sectors: string[];
  industries: string[];
  selectedFund: string;
  selectedIndustry: string;
  // selectedSector: string;
  setSelectedFund: (val: string) => void;
  // setSelectedSector: (val: string) => void;
  setSelectedIndustry: (val: string) => void;
}
export function FilterControls({
  funds,
  // sectors,
  industries,
  selectedFund,
  // selectedSector,
  selectedIndustry,
  setSelectedFund,
  // setSelectedSector,
  setSelectedIndustry,
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
              <SelectItem key={fund._id} value={fund._id.toString()}>
                {fund.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="block text-sm font-medium mb-1">Filter by Industry</Label>
        <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
          <SelectTrigger>
            <SelectValue placeholder="All Industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industry</SelectItem>
            {industries?.map(industry => (
              <SelectItem key={industry} value={industry}>
                {industry}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
