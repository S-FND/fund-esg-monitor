import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Copy, Check, Building2, Mail, Key } from 'lucide-react';
import { Industry, RevenueStage } from '@/types/esg';

interface AddCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompanyAdded?: (company: {
    name: string;
    industry: Industry;
    revenueStage: RevenueStage;
    contactEmail: string;
    loginEmail: string;
    password: string;
  }) => void;
}

const industries: Industry[] = [
  'Beauty & Personal Care',
  'Fashion & Lifestyle',
  'Health & Wellness',
  'Food & Beverage',
  'Home & Décor',
  'Platform Enablers',
];

const revenueStages: RevenueStage[] = ['0-50', '50-100', '100-500', '500+'];

// Standard password for all companies
const STANDARD_PASSWORD = 'Q4MIS@FS';

const generateCompanyCode = (): string => {
  // Generate a temporary code - in production this would be from the server
  const timestamp = Date.now().toString().slice(-4);
  return `FS${timestamp}`;
};

export function AddCompanyDialog({ open, onOpenChange, onCompanyAdded }: AddCompanyDialogProps) {
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState<Industry | ''>('');
  const [revenueStage, setRevenueStage] = useState<RevenueStage | ''>('');
  const [contactEmail, setContactEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [copiedField, setCopiedField] = useState<'email' | 'password' | null>(null);

  const handleCopy = async (value: string, field: 'email' | 'password') => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    toast.success(`${field === 'email' ? 'Login ID' : 'Password'} copied!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async () => {
    if (!companyName.trim() || !industry || !revenueStage || !contactEmail.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);

    // Generate credentials
    const companyCode = generateCompanyCode();
    const password = STANDARD_PASSWORD;

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));

    setCreatedCredentials({ email: companyCode, password });
    
    onCompanyAdded?.({
      name: companyName,
      industry: industry as Industry,
      revenueStage: revenueStage as RevenueStage,
      contactEmail,
      loginEmail: companyCode,
      password,
    });

    setIsSubmitting(false);
    toast.success('Company created successfully!');
  };

  const handleClose = () => {
    setCompanyName('');
    setIndustry('');
    setRevenueStage('');
    setContactEmail('');
    setCreatedCredentials(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {createdCredentials ? 'Company Created!' : 'Add New Company'}
          </DialogTitle>
        </DialogHeader>

        {!createdCredentials ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                placeholder="Enter company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry *</Label>
              <Select value={industry} onValueChange={(val) => setIndustry(val as Industry)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((ind) => (
                    <SelectItem key={ind} value={ind}>
                      {ind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="revenueStage">Revenue Stage (INR Cr) *</Label>
              <Select value={revenueStage} onValueChange={(val) => setRevenueStage(val as RevenueStage)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select revenue stage" />
                </SelectTrigger>
                <SelectContent>
                  {revenueStages.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email *</Label>
              <Input
                id="contactEmail"
                type="email"
                placeholder="company@example.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Share these login credentials with <span className="font-medium text-foreground">{companyName}</span>:
            </p>
            
            <div className="space-y-3 bg-muted/50 p-4 rounded-lg border">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Company ID
                </Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-background px-3 py-2 rounded text-sm font-mono">
                    {createdCredentials.email}
                  </code>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleCopy(createdCredentials.email, 'email')}
                  >
                    {copiedField === 'email' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Key className="h-3 w-3" /> Password
                </Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-background px-3 py-2 rounded text-sm font-mono">
                    {createdCredentials.password}
                  </code>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleCopy(createdCredentials.password, 'password')}
                  >
                    {copiedField === 'password' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              ⚠️ Make sure to copy these credentials before closing. The password cannot be retrieved later.
            </p>
          </div>
        )}

        <DialogFooter>
          {!createdCredentials ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Company'}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
