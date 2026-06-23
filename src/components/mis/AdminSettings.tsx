import { useState, useEffect, useRef } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { supabase } from '@/integrations/supabase/client';
import { User, Mail, Building2, Shield, Save, RotateCcw, CalendarIcon, Clock, BookOpen, Upload, FileText, Trash2, Award, LockIcon } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { EDIT_RIGHTS_PAUSED } from '@/lib/companyAccessControl';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const AdminSettings = () => {
  const { user } = useAuth();

  const {
    getDataCollectionDueDate,
    setDataCollectionDueDate,
    getPublishedPeriod,
    getPublishedAt,
    getPublishedBy,
    publishPeriod,
    loading: settingsLoading,
    saving: settingsSaving,
  } = useAdminSettings();
  
  const [name, setName] = useState(user?.name || 'Fireside Admin');
  const [email, setEmail] = useState(user?.email || 'admin@fireside.vc');
  const [organization, setOrganization] = useState('Fireside Ventures');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Due date state
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [dueDateOpen, setDueDateOpen] = useState(false);
  
  // Load due date from settings
  useEffect(() => {
    const storedDate = getDataCollectionDueDate();
    if (storedDate) {
      setDueDate(storedDate);
    }
  }, [settingsLoading]);

  const initialValues = {
    name: user?.name || 'Fireside Admin',
    email: user?.email || 'admin@fireside.vc',
    organization: 'Fireside Ventures',
  };

  const handleChange = (field: 'name' | 'email' | 'organization', value: string) => {
    if (field === 'name') setName(value);
    if (field === 'email') setEmail(value);
    if (field === 'organization') setOrganization(value);
    
    const newValues = {
      name: field === 'name' ? value : name,
      email: field === 'email' ? value : email,
      organization: field === 'organization' ? value : organization,
    };
    
    setHasChanges(
      newValues.name !== initialValues.name ||
      newValues.email !== initialValues.email ||
      newValues.organization !== initialValues.organization
    );
  };

  const handleSave = async () => {
    if (EDIT_RIGHTS_PAUSED) {
      toast.error('Editing is paused for all users until further notice.');
      return;
    }
    setSaving(true);
    // Simulate save - in a real app this would update the database
    await new Promise(resolve => setTimeout(resolve, 500));
    setSaving(false);
    setHasChanges(false);
    toast.success('Profile updated successfully');
  };

  const handleDiscard = () => {
    setName(initialValues.name);
    setEmail(initialValues.email);
    setOrganization(initialValues.organization);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage your account and preferences"
      />

      <div className="space-y-6 max-w-2xl">
        
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Your account details and role information
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDiscard}
                    disabled={saving}
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Discard
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                >
                  <Save className="w-4 h-4 mr-1" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
            {hasChanges && (
              <p className="text-sm text-amber-600 mt-2">You have unsaved changes</p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => handleChange('name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <Input 
                    id="email" 
                    type="email"
                    value={email} 
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <Input id="role" value="Fireside Admin" disabled />
                </div>
                <p className="text-xs text-muted-foreground">Role cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <Input 
                    id="organization" 
                    value={organization} 
                    onChange={(e) => handleChange('organization', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Collection Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Data Collection Settings
            </CardTitle>
            <CardDescription>
              Configure due dates and deadlines for company data submissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Data Collection Due Date</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Set the deadline by which all portfolio companies must submit their KPI data
              </p>
              <div className="flex items-center gap-3">
                <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[280px] justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : "Select due date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={(date) => {
                        setDueDate(date);
                        setDueDateOpen(false);
                      }}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
                <Button
                  onClick={async () => {
                    await setDataCollectionDueDate(dueDate || null);
                  }}
                  disabled={settingsSaving}
                  size="sm"
                >
                  <Save className="w-4 h-4 mr-1" />
                  {settingsSaving ? 'Saving...' : 'Save'}
                </Button>
                {dueDate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      setDueDate(undefined);
                      await setDataCollectionDueDate(null);
                    }}
                    disabled={settingsSaving}
                  >
                    Clear
                  </Button>
                )}
              </div>
              {dueDate && (
                <p className="text-sm text-muted-foreground mt-2">
                  Companies will see this deadline on their dashboard
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <PublishScoresCard
          currentPeriod={getPublishedPeriod()}
          publishedAt={getPublishedAt()}
          publishedBy={getPublishedBy()}
          loading={settingsLoading}
          saving={settingsSaving}
          onPublish={(y, q) => publishPeriod(y, q, user?.name || 'Fireside Admin')}
        />
        {/* Founder's Guide Management */}
        <FoundersGuideCard />
      </div>
    </div>
    </div>
  );
};

interface PublishScoresCardProps {
  currentPeriod: { year: number; quarter: string };
  publishedAt: Date | null;
  publishedBy: string | null;
  loading: boolean;
  saving: boolean;
  onPublish: (year: number, quarter: string) => Promise<boolean>;
}

const PublishScoresCard = ({ currentPeriod, publishedAt, publishedBy, loading, saving, onPublish }: PublishScoresCardProps) => {
  const [year, setYear] = useState<string>(String(currentPeriod.year));
  const [quarter, setQuarter] = useState<string>(currentPeriod.quarter);

  useEffect(() => {
    setYear(String(currentPeriod.year));
    setQuarter(currentPeriod.quarter);
  }, [currentPeriod.year, currentPeriod.quarter]);

  const handlePublish = async () => {
    if (EDIT_RIGHTS_PAUSED) {
      toast.error('Editing is paused for all users until further notice.');
      return;
    }
    const ok = await onPublish(parseInt(year, 10), quarter);
    if (ok) {
      toast.success(`Published ${quarter} ${year} scores to all company dashboards`);
    }
  };

  const isSame = parseInt(year, 10) === currentPeriod.year && quarter === currentPeriod.quarter;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5" />
          Recalibrate & Publish ESG Scores
        </CardTitle>
        <CardDescription>
          Sets the reporting period whose ESG grades, percentile cards, rankings and
          recommendations are shown on every company dashboard. Use this after a
          quarter's submission window closes and scores are recalibrated.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-md border bg-muted/30">
          <LockIcon className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              Currently published: {currentPeriod.quarter} {currentPeriod.year}
            </p>
            <p className="text-xs text-muted-foreground">
              {publishedAt ? `Published ${format(publishedAt, 'PPP p')}` : 'Default snapshot (never explicitly published)'}
              {publishedBy ? ` by ${publishedBy}` : ''}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 max-w-md">
          <div className="space-y-1">
            <Label className="text-xs">Year</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Quarter</Label>
            <Select value={quarter} onValueChange={setQuarter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Q1">Q1 (JFM)</SelectItem>
                <SelectItem value="Q2">Q2 (AMJ)</SelectItem>
                <SelectItem value="Q3">Q3 (JAS)</SelectItem>
                <SelectItem value="Q4">Q4 (OND)</SelectItem>
                <SelectItem value="FY">FY (Annual)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={loading || saving || isSame}>
              <Award className="w-4 h-4 mr-2" />
              {isSame ? 'Already published' : `Publish ${quarter} ${year} scores`}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Publish {quarter} {year} ESG scores?</AlertDialogTitle>
              <AlertDialogDescription>
                Every company dashboard will immediately switch to showing scores,
                grades, percentile cards, rankings and recommendations computed from{' '}
                <strong>{quarter} {year}</strong> data. The locked-period banner on
                company dashboards will update to reference this period.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handlePublish}>Publish</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

const FoundersGuideCard = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [currentFile, setCurrentFile] = useState<{ name: string; updated_at: string } | null>(null);
  const [loadingFile, setLoadingFile] = useState(true);

  const fetchCurrentFile = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('founder-guide')
        .list('', { limit: 1, sortBy: { column: 'updated_at', order: 'desc' } });
      if (!error && data && data.length > 0) {
        setCurrentFile({ name: data[0].name, updated_at: data[0].updated_at });
      } else {
        setCurrentFile(null);
      }
    } catch {
      setCurrentFile(null);
    } finally {
      setLoadingFile(false);
    }
  };

  useEffect(() => { fetchCurrentFile(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (EDIT_RIGHTS_PAUSED) {
      toast.error('Editing is paused for all users until further notice.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File size must be under 20MB');
      return;
    }

    setUploading(true);
    try {
      // Remove old files first
      const { data: existing } = await supabase.storage.from('founder-guide').list('');
      if (existing && existing.length > 0) {
        await supabase.storage.from('founder-guide').remove(existing.map(f => f.name));
      }

      const fileName = `Fireside_ESG_Platform_Founders_Guide.pdf`;
      const { error } = await supabase.storage
        .from('founder-guide')
        .upload(fileName, file, { upsert: true, contentType: 'application/pdf' });

      if (error) throw error;
      toast.success("Founder's Guide updated successfully");
      await fetchCurrentFile();
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const publicUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/founder-guide/Fireside_ESG_Platform_Founders_Guide.pdf`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Founder's Guide
        </CardTitle>
        <CardDescription>
          Upload or replace the Founder's Guide PDF that portfolio companies can download
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loadingFile ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : currentFile ? (
          <div className="flex items-center gap-3 p-3 rounded-md border bg-muted/30">
            <FileText className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentFile.name}</p>
              <p className="text-xs text-muted-foreground">
                Last updated: {format(new Date(currentFile.updated_at), 'PPP p')}
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                Preview
              </a>
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No guide uploaded yet</p>
        )}

        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Uploading...' : currentFile ? 'Replace Guide' : 'Upload Guide'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminSettings;