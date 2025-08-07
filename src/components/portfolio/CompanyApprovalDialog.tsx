import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, UserCheck, Building2 } from 'lucide-react';
import { usePortfolio, PortfolioCompany } from '@/contexts/PortfolioContext';

// Mock data for funds and board observers
const funds = [
  { id: 1, name: "Green Tech Fund I" },
  { id: 2, name: "Sustainable Growth Fund" },
  { id: 3, name: "Impact Ventures" },
];

const boardObservers = [
  { id: "5", name: "Robert Taylor", designation: "Board Observer" },
  { id: "6", name: "Jennifer Davis", designation: "BO (Board Observer)" },
  { id: "7", name: "Michael Johnson", designation: "Senior Board Observer" },
  { id: "8", name: "Sarah Wilson", designation: "Board Observer" },
];

interface CompanyApprovalDialogProps {
  company: PortfolioCompany;
}

export function CompanyApprovalDialog({ company }: CompanyApprovalDialogProps) {
  const { approveCompany } = usePortfolio();
  const [open, setOpen] = useState(false);
  const [selectedFundId, setSelectedFundId] = useState<string>('');
  const [selectedBoardObserverId, setSelectedBoardObserverId] = useState<string>('');

  const handleApprove = () => {
    if (selectedFundId && selectedBoardObserverId) {
      const selectedFund = funds.find(f => f.id.toString() === selectedFundId);
      
      approveCompany(company.id, {
        fundId: parseInt(selectedFundId),
        fundName: selectedFund?.name || '',
        boardObserverId: selectedBoardObserverId
      });
      
      setOpen(false);
      setSelectedFundId('');
      setSelectedBoardObserverId('');
    }
  };

  const selectedFund = funds.find(f => f.id.toString() === selectedFundId);
  const selectedBO = boardObservers.find(bo => bo.id === selectedBoardObserverId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
          <CheckCircle className="h-4 w-4 mr-2" />
          Assign & Approve
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Fund & Board Observer</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card className="bg-gray-50 dark:bg-gray-900">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{company.name}</h3>
                  <p className="text-muted-foreground">{company.sector} • {company.stage}</p>
                  <p className="text-sm text-muted-foreground mt-1">CEO: {company.ceo}</p>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                  ESG Score: {company.esgScore}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fund-select" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Assign to Fund
              </Label>
              <Select value={selectedFundId} onValueChange={setSelectedFundId}>
                <SelectTrigger id="fund-select">
                  <SelectValue placeholder="Select a fund" />
                </SelectTrigger>
                <SelectContent>
                  {funds.map(fund => (
                    <SelectItem key={fund.id} value={fund.id.toString()}>
                      {fund.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bo-select" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Assign Board Observer
              </Label>
              <Select value={selectedBoardObserverId} onValueChange={setSelectedBoardObserverId}>
                <SelectTrigger id="bo-select">
                  <SelectValue placeholder="Select board observer" />
                </SelectTrigger>
                <SelectContent>
                  {boardObservers.map(bo => (
                    <SelectItem key={bo.id} value={bo.id}>
                      <div className="flex flex-col items-start">
                        <span>{bo.name}</span>
                        <span className="text-xs text-muted-foreground">{bo.designation}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedFundId && selectedBoardObserverId && (
            <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CardContent className="pt-4">
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Assignment Summary</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Fund:</span> {selectedFund?.name}</p>
                  <p><span className="font-medium">Board Observer:</span> {selectedBO?.name} ({selectedBO?.designation})</p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleApprove}
              disabled={!selectedFundId || !selectedBoardObserverId}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve & Add to Portfolio
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}