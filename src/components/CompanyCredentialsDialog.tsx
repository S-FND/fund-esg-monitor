import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Download, Search, Copy, Check, Key, RotateCcw } from 'lucide-react';
import { Company } from '@/types/esg';
import * as XLSX from 'xlsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CompanyCredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companies: Company[];
  onResetPassword?: (companyId: string) => void;
}



export function CompanyCredentialsDialog({ 
  open, 
  onOpenChange, 
  companies,
  onResetPassword 
}: CompanyCredentialsDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [companyToReset, setCompanyToReset] = useState<Company | null>(null);

  const filteredCompanies = companies.filter(company =>
    company.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.companyCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportToExcel = () => {
    const exportData = companies.map(company => ({
      'Company ID (System)': company.id,
      'Brand Name': company.brand,
      'Legal Name': company.name,
      'Login ID': company.companyCode,
      'Password': company.loginPassword,
      'Fund': company.fund,
      'Industry': company.firesideCategory,
      'Contact Email': company.contactEmail,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Company Credentials');
    
    // Auto-size columns
    const colWidths = [
      { wch: 14 }, // Company ID
      { wch: 25 }, // Brand Name
      { wch: 35 }, // Legal Name
      { wch: 12 }, // Login ID
      { wch: 12 }, // Password
      { wch: 15 }, // Fund
      { wch: 25 }, // Industry
      { wch: 35 }, // Contact Email
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `Company_Credentials_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Credentials exported to Excel');
  };

  const handleResetClick = (company: Company) => {
    setCompanyToReset(company);
    setResetConfirmOpen(true);
  };

  const handleConfirmReset = () => {
    if (companyToReset && onResetPassword) {
      onResetPassword(companyToReset.id);
      toast.success(`Password reset for ${companyToReset.name}`);
    }
    setResetConfirmOpen(false);
    setCompanyToReset(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Company Login Credentials
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-4 py-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by company name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={handleExportToExcel} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export to Excel
            </Button>
          </div>

          <div className="flex-1 overflow-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company ID</TableHead>
                  <TableHead>Brand Name</TableHead>
                  <TableHead>Legal Name</TableHead>
                  <TableHead>Login ID</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                        {company.id}
                      </code>
                    </TableCell>
                    <TableCell className="font-medium">{company.brand}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{company.name}</TableCell>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                        {company.companyCode}
                      </code>
                    </TableCell>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                        {company.loginPassword}
                      </code>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopy(`${company.companyCode} / ${company.loginPassword}`, company.id)}
                          title="Copy credentials"
                        >
                          {copiedId === company.id ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                        {onResetPassword && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleResetClick(company)}
                            title="Reset password"
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <p className="text-xs text-muted-foreground mt-2">
            Showing {filteredCompanies.length} of {companies.length} companies • Each company has a unique password
          </p>

          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset the password for <strong>{companyToReset?.name}</strong> ({companyToReset?.companyCode})?
              <br /><br />
              The password will be reset to its original unique value.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReset}>
              Reset Password
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
