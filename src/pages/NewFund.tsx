
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FundCompaniesField, Company } from "@/components/NewFund/FundCompaniesField";
import { FundTeamMembersField, TeamMember } from "@/components/NewFund/FundTeamMembersField";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const sectors = [
  "Agritech", 
  "ClimateTech", 
  "FinTech", 
  "HealthTech", 
  "EdTech", 
  "Logistics", 
  "DeepTech", 
  "SpaceTech", 
  "Quick Commerce", 
  "Ecomm", 
  "Robotics", 
  "Others"
];

const investmentStages = [
  "Pre Seed",
  "Seed",
  "Pre Series A",
  "Series A",
  "Series B and above",
  "Pre-IPO",
  "IPO"
];

const currencies = ["USD", "EUR", "GBP", "INR", "SGD"];

const defaultInclusionTerms = [
  "Quality Education", 
  "Sustainable Development", 
  "SDGs", 
  "Planet Positive", 
  "Healthcare", 
  "Upskilling"
];

const defaultExclusionTerms = [
  "Cyborg", 
  "Mining", 
  "Alcohol", 
  "Arms", 
  "Weapons", 
  "Politics"
];

// Sample data for companies and team members
// Will be used as fallback if Supabase query fails
const sampleCompanies = [
  { id: "1", name: "EcoTech Solutions" },
  { id: "2", name: "HealthAI" },
  { id: "3", name: "EdFinance" },
  { id: "4", name: "GreenEnergy Corp" },
  { id: "5", name: "FarmTech Innovations" },
];

const sampleTeamMembers = [
  { id: "1", name: "Jane Smith", designation: "Investment Manager" },
  { id: "2", name: "John Doe", designation: "Risk Analyst" },
  { id: "3", name: "Alice Brown", designation: "ESG Specialist" },
  { id: "4", name: "Bob Johnson", designation: "Financial Advisor" },
];

export default function NewFund() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    size: "",
    currency: "USD",
    sectors: [] as string[],
    stage: "",
    inclusionTerms: [...defaultInclusionTerms],
    exclusionTerms: [...defaultExclusionTerms],
    customInclusionTerm: "",
    customExclusionTerm: ""
  });
  
  const [companies, setCompanies] = useState<Company[]>(sampleCompanies);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(sampleTeamMembers);
  const [selectedCompanies, setSelectedCompanies] = useState<Company[]>([]);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<TeamMember[]>([]);
  
  // Fetch real data from Supabase
  useEffect(() => {
    async function fetchData() {
      try {
        // Check if portfolio_companies table exists and fetch companies
        try {
          // Try to fetch from portfolio_companies table
          const { data: companiesData, error: companiesError } = await supabase
            .from('portfolio_companies')
            .select('*') as { data: any[] | null, error: any };
          
          if (companiesError) {
            console.error('Error fetching companies:', companiesError);
            // Try with alternate table name "companies" if available
            const { data: altCompaniesData, error: altCompaniesError } = await supabase
              .from('companies')
              .select('*') as { data: any[] | null, error: any };
            
            if (altCompaniesError) {
              console.error('Error fetching from alternate companies table:', altCompaniesError);
            } else if (altCompaniesData && Array.isArray(altCompaniesData) && altCompaniesData.length > 0) {
              // Safely check if each item has necessary properties before converting
              const validCompanies = altCompaniesData.filter(c => 
                c && typeof c === 'object' && 'id' in c && 'name' in c
              );
              
              if (validCompanies.length > 0) {
                const typedCompanies: Company[] = validCompanies.map(c => ({
                  id: String(c.id),
                  name: String(c.name)
                }));
                setCompanies(typedCompanies);
              }
            }
          } else if (companiesData && Array.isArray(companiesData) && companiesData.length > 0) {
            // Safely check if each item has necessary properties before converting
            const validCompanies = companiesData.filter(c => 
              c && typeof c === 'object' && 'id' in c && 'name' in c
            );
            
            if (validCompanies.length > 0) {
              const typedCompanies: Company[] = validCompanies.map(c => ({
                id: String(c.id),
                name: String(c.name)
              }));
              setCompanies(typedCompanies);
            }
          }
        } catch (companyError) {
          console.error('Error fetching companies:', companyError);
          // Fallback to sample companies (already set as default)
        }
        
        // Fetch team members
        try {
          const { data: teamData, error: teamError } = await supabase
            .from('team_members')
            .select('*') as { data: any[] | null, error: any };
          
          if (teamError) {
            console.error('Error fetching team members:', teamError);
          } else if (teamData && Array.isArray(teamData)) {
            // Ensure proper type conversion and validate the data
            const validTeamMembers = teamData.filter(t => 
              t && typeof t === 'object' && 'id' in t && 'name' in t
            );
            
            if (validTeamMembers.length > 0) {
              const typedTeamMembers: TeamMember[] = validTeamMembers.map(t => ({
                id: String(t.id),
                name: String(t.name),
                designation: t.designation ? String(t.designation) : ''
              }));
              setTeamMembers(typedTeamMembers);
            }
          }
        } catch (teamError) {
          console.error('Error fetching team members:', teamError);
          // Fallback to sample team members (already set as default)
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error("Failed to load companies or team members");
      }
    }
    
    fetchData();
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSectorToggle = (sector: string) => {
    setFormData(prev => {
      const sectors = [...prev.sectors];
      if (sectors.includes(sector)) {
        return { ...prev, sectors: sectors.filter(s => s !== sector) };
      } else {
        return { ...prev, sectors: [...sectors, sector] };
      }
    });
  };
  
  const handleTermToggle = (term: string, type: 'inclusionTerms' | 'exclusionTerms') => {
    setFormData(prev => {
      const terms = [...prev[type]];
      if (terms.includes(term)) {
        return { ...prev, [type]: terms.filter(t => t !== term) };
      } else {
        return { ...prev, [type]: [...terms, term] };
      }
    });
  };
  
  const addCustomTerm = (type: 'inclusionTerms' | 'exclusionTerms') => {
    const customField = type === 'inclusionTerms' ? 'customInclusionTerm' : 'customExclusionTerm';
    const customValue = formData[customField];
    
    if (customValue.trim()) {
      setFormData(prev => ({
        ...prev,
        [type]: [...prev[type], customValue.trim()],
        [customField]: ""
      }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting fund data:", formData);
    console.log("Selected companies:", selectedCompanies);
    console.log("Selected team members:", selectedTeamMembers);
    
    try {
      // Insert fund data
      const { data: fundData, error: fundError } = await supabase
        .from('funds')
        .insert({
          name: formData.name,
          size: formData.size,
          currency: formData.currency,
          sectors: formData.sectors,
          stage: formData.stage,
          inclusion_terms: formData.inclusionTerms,
          exclusion_terms: formData.exclusionTerms
        })
        .select('id')
        .single();
      
      if (fundError) throw fundError;
      
      if (fundData?.id) {
        const fundId = fundData.id;
        
        // Insert company associations
        if (selectedCompanies.length > 0) {
          const companyAssociations = selectedCompanies.map(company => ({
            fund_id: fundId,
            company_id: company.id
          }));
          
          try {
            // Try multiple approaches to save fund-company relationships
            let companySaveSuccess = false;
            
            // Option 1: Try using an RPC function if available
            try {
              const { error } = await (supabase as any)
                .rpc('save_fund_companies', { 
                  fund_id_param: fundId,
                  company_ids: selectedCompanies.map(c => c.id)
                });
              
              if (!error) {
                companySaveSuccess = true;
                console.log("Successfully saved fund companies using RPC");
              }
            } catch (rpcError) {
              console.error("RPC method not available, trying direct insert", rpcError);
            }

            // Option 2: If RPC failed, try direct inserts to possible tables
            if (!companySaveSuccess) {
              // List of possible table names for fund-company relationships
              const possibleTables = ['fund_companies', 'portfolio_fund_companies', 'fund_portfolio_companies', 'fund_company'];
              
              for (const tableName of possibleTables) {
                if (companySaveSuccess) break;
                
                try {
                  // Use type assertion to bypass type checking for the dynamic table name
                  const { error } = await (supabase.from(tableName as any) as any)
                    .insert(companyAssociations);
                  
                  if (!error) {
                    companySaveSuccess = true;
                    console.log(`Successfully saved fund companies to ${tableName}`);
                    break;
                  }
                } catch (insertError) {
                  console.error(`Failed to insert into ${tableName}:`, insertError);
                }
              }
            }

            // Option 3: As a last resort, try using a raw SQL query (supabase doesn't support this directly in client)
            if (!companySaveSuccess) {
              // We can't use raw SQL with the client, so we'll just log a warning
              console.error("Could not save company associations to any table");
              toast.error("Warning: Could not associate companies with fund");
            }
            
          } catch (companyAssocError) {
            console.error("Error associating companies with fund:", companyAssocError);
            toast.error("Failed to associate companies with fund");
          }
        }
        
        // Insert team member associations
        if (selectedTeamMembers.length > 0) {
          const teamAssociations = selectedTeamMembers.map(member => ({
            fund_id: fundId,
            team_member_id: member.id
          }));
          
          try {
            // Use type assertion to bypass TypeScript's strict table checking
            const { error: teamError } = await (supabase.from('team_member_funds') as any)
              .insert(teamAssociations);
            
            if (teamError) {
              console.error("Error associating team members:", teamError);
              toast.error("Failed to associate team members with fund");
            }
          } catch (teamAssocError) {
            console.error("Error associating team members with fund:", teamAssocError);
            toast.error("Failed to associate team members with fund");
          }
        }

        toast.success("Fund created successfully");
        navigate("/funds");
      }
    } catch (error) {
      console.error("Error saving fund data:", error);
      toast.error("Error creating fund");
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Create New Fund</h1>
      </div>
      
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Fund Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Fund Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  placeholder="Enter fund name" 
                  required 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="size">Fund Size</Label>
                  <Input 
                    id="size" 
                    name="size" 
                    value={formData.size} 
                    onChange={handleInputChange} 
                    placeholder="Enter fund size" 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select 
                    value={formData.currency} 
                    onValueChange={(value) => handleSelectChange("currency", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map(currency => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Sector Focus</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {sectors.sort().map(sector => (
                  <div key={sector} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`sector-${sector}`} 
                      checked={formData.sectors.includes(sector)}
                      onCheckedChange={() => handleSectorToggle(sector)}
                    />
                    <Label htmlFor={`sector-${sector}`} className="text-sm font-normal">
                      {sector}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="stage">Stage of Investment</Label>
              <Select 
                value={formData.stage} 
                onValueChange={(value) => handleSelectChange("stage", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select investment stage" />
                </SelectTrigger>
                <SelectContent>
                  {investmentStages.map(stage => (
                    <SelectItem key={stage} value={stage}>
                      {stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Fund Companies Field */}
            <FundCompaniesField 
              companies={companies}
              selectedCompanies={selectedCompanies}
              setSelectedCompanies={setSelectedCompanies}
            />
            
            {/* Fund Team Members Field */}
            <FundTeamMembersField 
              teamMembers={teamMembers}
              selectedTeamMembers={selectedTeamMembers}
              setSelectedTeamMembers={setSelectedTeamMembers}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Inclusion Terms</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Select terms that align with your fund's investment criteria.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {defaultInclusionTerms.map(term => (
                      <div key={term} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`inclusion-${term}`} 
                          checked={formData.inclusionTerms.includes(term)}
                          onCheckedChange={() => handleTermToggle(term, 'inclusionTerms')}
                        />
                        <Label htmlFor={`inclusion-${term}`} className="text-sm font-normal">
                          {term}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Input 
                    value={formData.customInclusionTerm}
                    onChange={e => setFormData(prev => ({ ...prev, customInclusionTerm: e.target.value }))}
                    placeholder="Add custom inclusion term"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => addCustomTerm('inclusionTerms')}
                  >
                    Add
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>Exclusion Terms</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Select terms that your fund explicitly avoids.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {defaultExclusionTerms.map(term => (
                      <div key={term} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`exclusion-${term}`} 
                          checked={formData.exclusionTerms.includes(term)}
                          onCheckedChange={() => handleTermToggle(term, 'exclusionTerms')}
                        />
                        <Label htmlFor={`exclusion-${term}`} className="text-sm font-normal">
                          {term}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Input 
                    value={formData.customExclusionTerm}
                    onChange={e => setFormData(prev => ({ ...prev, customExclusionTerm: e.target.value }))}
                    placeholder="Add custom exclusion term"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => addCustomTerm('exclusionTerms')}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end mt-6 space-x-2">
          <Button variant="outline" type="button" onClick={() => navigate("/funds")}>
            Cancel
          </Button>
          <Button type="submit">Create Fund</Button>
        </div>
      </form>
    </div>
  );
}
