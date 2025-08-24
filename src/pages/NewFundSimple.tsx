import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PageNavigation } from "@/components/PageNavigation";
import { FundCompaniesField } from "@/components/NewFund/FundCompaniesField";
import { FundTeamMembersField } from "@/components/NewFund/FundTeamMembersField";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Company {
  id: string;
  name: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  designation: string;
}

export default function NewFund() {
  const [formData, setFormData] = useState({
    name: "",
    size: "",
    currency: "USD",
    sectors: [] as string[],
    stage: "",
    inclusionTerms: [] as string[],
    exclusionTerms: [] as string[]
  });

  const [companies, setCompanies] = useState<Company[]>([]);
  const [availableTeamMembers, setAvailableTeamMembers] = useState<TeamMember[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<Company[]>([]);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<TeamMember[]>([]);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load mock data
  useEffect(() => {
    // Mock companies data
    const mockCompanies: Company[] = [
      { id: '1', name: 'TechCorp Solutions' },
      { id: '2', name: 'Green Energy Ltd' },
      { id: '3', name: 'Healthcare Innovations' },
      { id: '4', name: 'FinTech Startup' },
      { id: '5', name: 'AI Analytics Inc' }
    ];
    setCompanies(mockCompanies);

    // Mock team members data
    const mockTeamMembers: TeamMember[] = [
      { id: '1', name: 'John Smith', email: 'john@example.com', designation: 'Investment Manager' },
      { id: '2', name: 'Sarah Johnson', email: 'sarah@example.com', designation: 'Senior Analyst' },
      { id: '3', name: 'Mike Chen', email: 'mike@example.com', designation: 'Research Associate' },
      { id: '4', name: 'Emily Davis', email: 'emily@example.com', designation: 'Portfolio Manager' }
    ];
    setAvailableTeamMembers(mockTeamMembers);
  }, []);

  const availableSectors = [
    "Technology",
    "Healthcare", 
    "Financial Services",
    "Energy",
    "Consumer Goods",
    "Real Estate",
    "Manufacturing",
    "Telecommunications"
  ];

  const fundingStages = [
    "Seed",
    "Series A",
    "Series B", 
    "Series C",
    "Growth",
    "Pre-IPO"
  ];

  const availableTerms = [
    "ESG Compliance",
    "Carbon Neutral",
    "Diversity & Inclusion",
    "Renewable Energy Focus",
    "Social Impact",
    "Sustainable Practices",
    "No Fossil Fuels",
    "No Weapons/Defense",
    "No Tobacco",
    "No Gambling"
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSectorToggle = (sector: string) => {
    setFormData(prev => ({
      ...prev,
      sectors: prev.sectors.includes(sector)
        ? prev.sectors.filter(s => s !== sector)
        : [...prev.sectors, sector]
    }));
  };

  const handleInclusionTermToggle = (term: string) => {
    setFormData(prev => ({
      ...prev,
      inclusionTerms: prev.inclusionTerms.includes(term)
        ? prev.inclusionTerms.filter(t => t !== term)
        : [...prev.inclusionTerms, term]
    }));
  };

  const handleExclusionTermToggle = (term: string) => {
    setFormData(prev => ({
      ...prev,
      exclusionTerms: prev.exclusionTerms.includes(term)
        ? prev.exclusionTerms.filter(t => t !== term)
        : [...prev.exclusionTerms, term]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting fund data:", formData);
    console.log("Selected companies:", selectedCompanies);
    console.log("Selected team members:", selectedTeamMembers);
    
    try {
      // Get current user's profile to determine tenant_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to create a fund.",
          variant: "destructive",
        });
        return;
      }

      // Get user's profile to get tenant_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.tenant_id) {
        toast({
          title: "Error",
          description: "Unable to determine your organization. Please contact support.",
          variant: "destructive",
        });
        return;
      }

      // Insert fund into database
      const { data: fund, error: fundError } = await supabase
        .from('funds')
        .insert({
          name: formData.name,
          size: formData.size,
          currency: formData.currency,
          stage: formData.stage,
          sectors: formData.sectors,
          inclusion_terms: formData.inclusionTerms,
          exclusion_terms: formData.exclusionTerms,
          tenant_id: profile.tenant_id,
          created_by: user.id
        })
        .select()
        .single();

      if (fundError) {
        throw fundError;
      }
      
      toast({
        title: "Fund Created Successfully",
        description: `${formData.name} has been created and saved to the database.`,
      });
      
      // Navigate back to funds page
      navigate('/funds');
    } catch (error) {
      console.error('Error creating fund:', error);
      toast({
        title: "Error",
        description: "Failed to create fund. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <PageNavigation className="mb-6" />
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Fund</h1>
        <p className="text-muted-foreground">Set up a new investment fund with companies and team members</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Fund Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Fund Information</CardTitle>
            <CardDescription>Basic details about the fund</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Fund Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Green Tech Fund I"
                  required
                />
              </div>
              <div>
                <Label htmlFor="size">Fund Size *</Label>
                <Input
                  id="size"
                  name="size"
                  value={formData.size}
                  onChange={handleInputChange}
                  placeholder="e.g., $100M"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(value) => handleSelectChange('currency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="JPY">JPY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="stage">Investment Stage</Label>
                <Select value={formData.stage} onValueChange={(value) => handleSelectChange('stage', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {fundingStages.map(stage => (
                      <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sectors */}
        <Card>
          <CardHeader>
            <CardTitle>Target Sectors</CardTitle>
            <CardDescription>Select the sectors this fund will focus on</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableSectors.map(sector => (
                <div key={sector} className="flex items-center space-x-2">
                  <Checkbox
                    id={`sector-${sector}`}
                    checked={formData.sectors.includes(sector)}
                    onCheckedChange={() => handleSectorToggle(sector)}
                  />
                  <Label htmlFor={`sector-${sector}`} className="text-sm">{sector}</Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ESG Terms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Inclusion Terms</CardTitle>
              <CardDescription>ESG criteria that investments must meet</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {availableTerms.slice(0, 6).map(term => (
                  <div key={term} className="flex items-center space-x-2">
                    <Checkbox
                      id={`inclusion-${term}`}
                      checked={formData.inclusionTerms.includes(term)}
                      onCheckedChange={() => handleInclusionTermToggle(term)}
                    />
                    <Label htmlFor={`inclusion-${term}`} className="text-sm">{term}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exclusion Terms</CardTitle>
              <CardDescription>Industries or practices to avoid</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {availableTerms.slice(6).map(term => (
                  <div key={term} className="flex items-center space-x-2">
                    <Checkbox
                      id={`exclusion-${term}`}
                      checked={formData.exclusionTerms.includes(term)}
                      onCheckedChange={() => handleExclusionTermToggle(term)}
                    />
                    <Label htmlFor={`exclusion-${term}`} className="text-sm">{term}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Companies */}
        <FundCompaniesField
          companies={companies}
          selectedCompanies={selectedCompanies}
          onSelectionChange={setSelectedCompanies}
        />

        {/* Team Members */}
        <FundTeamMembersField
          teamMembers={availableTeamMembers}
          selectedTeamMembers={selectedTeamMembers}
          onSelectionChange={setSelectedTeamMembers}
        />

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => navigate('/funds')}>
            Cancel
          </Button>
          <Button type="submit">
            Create Fund
          </Button>
        </div>
      </form>
    </div>
  );
}