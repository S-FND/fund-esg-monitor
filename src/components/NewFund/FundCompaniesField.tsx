
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

export interface Company {
  id: string; // Changed from number to string
  name: string;
}

interface FundCompaniesFieldProps {
  companies: Company[];
  selectedCompanies: Company[];
  onSelectionChange: (companies: Company[]) => void;
}

export function FundCompaniesField({ companies, selectedCompanies, onSelectionChange }: FundCompaniesFieldProps) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  
  const availableCompanies = companies.filter(
    company => !selectedCompanies.some(selected => selected.id === company.id)
  );

  const handleAddCompany = () => {
    if (!selectedCompanyId) return;
    
    const companyToAdd = companies.find(c => c.id === selectedCompanyId);
    if (companyToAdd && !selectedCompanies.some(c => c.id === companyToAdd.id)) {
      onSelectionChange([...selectedCompanies, companyToAdd]);
      setSelectedCompanyId("");
    }
  };

  const handleRemoveCompany = (companyId: string) => {
    onSelectionChange(selectedCompanies.filter(c => c.id !== companyId));
  };

  return (
    <div className="space-y-4">
      <Label>Associated Companies</Label>
      <div className="flex space-x-2">
        <Select 
          value={selectedCompanyId} 
          onValueChange={setSelectedCompanyId}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a company" />
          </SelectTrigger>
          <SelectContent>
            {availableCompanies.length > 0 ? (
              availableCompanies.map(company => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="none" disabled>No companies available</SelectItem>
            )}
          </SelectContent>
        </Select>
        <Button 
          type="button" 
          onClick={handleAddCompany}
          disabled={!selectedCompanyId}
        >
          Add Company
        </Button>
      </div>

      {selectedCompanies.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
          {selectedCompanies.map(company => (
            <Card key={company.id} className="p-2 flex items-center justify-between">
              <span className="text-sm font-medium">{company.name}</span>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => handleRemoveCompany(company.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
