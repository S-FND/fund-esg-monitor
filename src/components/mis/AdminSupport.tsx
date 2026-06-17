 import { useState, useMemo, useEffect } from 'react';
 import { DashboardLayout } from '@/components/layout/DashboardLayout';
 import { PageHeader } from '@/components/layout/PageHeader';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Button } from '@/components/ui/button';
 import { Textarea } from '@/components/ui/textarea';
 import { Badge } from '@/components/ui/badge';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from '@/components/ui/table';
 import { useAuth } from '@/contexts/AuthContext';
 import { useSupportTickets, SupportTicket } from '@/hooks/useSupportTickets';
 import { TicketStatus } from '@/types/esg';
 import { mockCompanies } from '@/data/mockData';
 import { 
   MessageSquare, 
   Send, 
   Clock, 
   CheckCircle2, 
   Mail,
   Phone,
   Loader2,
   HelpCircle,
   FileQuestion,
   Building2,
 } from 'lucide-react';
 import { format } from 'date-fns';
 
 // Admin-specific feature tabs
 const ADMIN_FEATURE_TABS = [
   { key: '_general', label: 'General / Platform Issue' },
   { key: 'dashboard', label: 'Dashboard' },
   { key: 'portfolio', label: 'Portfolio' },
   { key: 'featureManagement', label: 'Feature Management' },
   { key: 'settings', label: 'Settings' },
 ];
 
 const AdminSupport = () => {
   const { user } = useAuth();
   const adminId = user?.id || 'admin-1';
   const { tickets, loading, submitting, createTicket } = useSupportTickets(adminId);
 
   // Form State
   const [selectedCompany, setSelectedCompany] = useState('');
   const [selectedTab, setSelectedTab] = useState('');
   const [subject, setSubject] = useState('');
   const [description, setDescription] = useState('');
   const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
   const [contactEmail, setContactEmail] = useState(user?.email || '');
   const [contactPhone, setContactPhone] = useState('');
   const [showSuccess, setShowSuccess] = useState(false);
 
   // Get sorted company list
   const sortedCompanies = useMemo(() => {
     return [...mockCompanies].sort((a, b) => (a.brand || a.name).localeCompare(b.brand || b.name));
   }, []);
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!subject.trim() || !description.trim() || !contactEmail.trim()) return;
 
     const selectedCompanyData = mockCompanies.find(c => c.id === selectedCompany);
     const featureLabel = ADMIN_FEATURE_TABS.find(f => f.key === selectedTab)?.label || selectedTab;
 
     const success = await createTicket({
       company_id: adminId,
       company_name: selectedCompanyData ? (selectedCompanyData.brand || selectedCompanyData.name) : 'Fireside Admin',
       submitted_by: user?.name || 'Fireside Admin',
       ticket_type: 'query',
       subject: subject.trim(),
       description: description.trim(),
       priority,
       feature_tab: featureLabel,
       kpi_reference: selectedCompanyData ? `Portfolio: ${selectedCompanyData.brand || selectedCompanyData.name}` : undefined,
       contact_email: contactEmail.trim(),
       contact_phone: contactPhone.trim() || undefined,
     });
 
     if (success) {
       setSubject('');
       setDescription('');
       setSelectedTab('');
       setSelectedCompany('');
       setPriority('medium');
       setContactPhone('');
       setShowSuccess(true);
       setTimeout(() => setShowSuccess(false), 5000);
     }
   };
 
   const getStatusBadge = (status: TicketStatus) => {
     switch (status) {
       case 'open':
         return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" /> Open</Badge>;
       case 'work_in_progress':
         return <Badge className="gap-1 bg-amber-500"><Loader2 className="w-3 h-3 animate-spin" /> Work In Progress</Badge>;
       case 'in_review':
         return <Badge className="gap-1 bg-blue-500"><FileQuestion className="w-3 h-3" /> In Review</Badge>;
       case 'resolved':
         return <Badge className="gap-1 bg-green-600"><CheckCircle2 className="w-3 h-3" /> Resolved</Badge>;
       case 'closed':
         return <Badge variant="outline" className="gap-1"><CheckCircle2 className="w-3 h-3" /> Closed</Badge>;
       default:
         return <Badge variant="secondary">{status}</Badge>;
     }
   };
 
   const getPriorityBadge = (priority: SupportTicket['priority']) => {
     switch (priority) {
       case 'high':
         return <Badge variant="destructive" className="text-[10px]">High</Badge>;
       case 'medium':
         return <Badge variant="secondary" className="text-[10px]">Medium</Badge>;
       case 'low':
         return <Badge variant="outline" className="text-[10px]">Low</Badge>;
       default:
         return null;
     }
   };
 
   return (
     <DashboardLayout>
       <PageHeader
         title="Help & Support"
         subtitle="Report challenges or ask questions about the ESG Portal"
       />
 
       <Tabs defaultValue="new-request" className="space-y-6">
         <TabsList>
           <TabsTrigger value="new-request" className="gap-2">
             <HelpCircle className="w-4 h-4" />
             Report an Issue
           </TabsTrigger>
           <TabsTrigger value="my-tickets" className="gap-2">
             <MessageSquare className="w-4 h-4" />
             My Tickets ({tickets.length})
           </TabsTrigger>
           <TabsTrigger value="contact" className="gap-2">
             <Mail className="w-4 h-4" />
             Contact Support
           </TabsTrigger>
         </TabsList>
 
         {/* New Request Tab */}
         <TabsContent value="new-request" className="space-y-6">
           {showSuccess && (
             <Card className="border-green-200 bg-green-50">
               <CardContent className="flex items-center gap-3 py-4">
                 <CheckCircle2 className="w-6 h-6 text-green-600" />
                 <div>
                   <p className="font-medium text-green-800">Issue Submitted Successfully!</p>
                   <p className="text-sm text-green-600">Our support team will review your issue and get back to you.</p>
                 </div>
               </CardContent>
             </Card>
           )}
 
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2 text-lg">
                 <HelpCircle className="w-5 h-5 text-primary" />
                 Report a Challenge or Issue
               </CardTitle>
               <CardDescription>
                 Tell us about any difficulties you're facing with the ESG Portal. We'll help you resolve them.
               </CardDescription>
             </CardHeader>
             <CardContent>
               <form onSubmit={handleSubmit} className="space-y-6">
                 {/* Location Selectors */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="portfolio-company">
                       <Building2 className="w-4 h-4 inline mr-1" />
                       Portfolio Company (Optional)
                     </Label>
                     <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                       <SelectTrigger>
                         <SelectValue placeholder="Select a portfolio company" />
                       </SelectTrigger>
                       <SelectContent>
                         {selectedCompany && (
                           <SelectItem value="__clear__" className="text-muted-foreground italic">
                             Clear selection
                           </SelectItem>
                         )}
                         {sortedCompanies.map(company => (
                           <SelectItem key={company.id} value={company.id}>
                             {company.brand || company.name}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                     <p className="text-xs text-muted-foreground">
                       Select the portfolio company this issue relates to (if applicable)
                     </p>
                   </div>
 
                   <div className="space-y-2">
                     <Label htmlFor="feature-tab">Feature / Page</Label>
                     <Select 
                       value={selectedTab} 
                       onValueChange={(v) => setSelectedTab(v === '__clear__' ? '' : v)}
                     >
                       <SelectTrigger>
                         <SelectValue placeholder="Select a feature or page" />
                       </SelectTrigger>
                       <SelectContent>
                         {selectedTab && (
                           <SelectItem value="__clear__" className="text-muted-foreground italic">
                             Clear selection
                           </SelectItem>
                         )}
                         {ADMIN_FEATURE_TABS.map(f => (
                           <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                 </div>
 
                 {/* Subject and Description */}
                 <div className="space-y-4">
                   <div className="space-y-2">
                     <Label htmlFor="subject">Subject *</Label>
                     <Input
                       id="subject"
                       placeholder="Brief description of your issue"
                       value={subject}
                       onChange={(e) => setSubject(e.target.value)}
                       required
                       maxLength={100}
                     />
                   </div>
 
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label htmlFor="priority">Priority</Label>
                       <Select value={priority} onValueChange={(v) => setPriority(v as 'low' | 'medium' | 'high')}>
                         <SelectTrigger>
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="low">Low - Can wait</SelectItem>
                           <SelectItem value="medium">Medium - Need help soon</SelectItem>
                           <SelectItem value="high">High - Blocking my work</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                   </div>
 
                   <div className="space-y-2">
                     <Label htmlFor="description">Describe your issue *</Label>
                     <Textarea
                       id="description"
                       placeholder="Please describe the challenge you're facing in detail. Include any error messages or steps that led to the issue."
                       value={description}
                       onChange={(e) => setDescription(e.target.value)}
                       required
                       className="min-h-[120px]"
                       maxLength={2000}
                     />
                     <p className="text-xs text-muted-foreground text-right">
                       {description.length}/2000 characters
                     </p>
                   </div>
                 </div>
 
                 {/* Contact Information */}
                 <div className="border-t pt-4">
                   <h4 className="font-medium mb-3 flex items-center gap-2">
                     <Mail className="w-4 h-4" />
                     Contact Information
                   </h4>
                   <p className="text-sm text-muted-foreground mb-4">
                     We'll reach out to you on the provided email or phone number.
                   </p>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label htmlFor="contact-email">Email Address *</Label>
                       <Input
                         id="contact-email"
                         type="email"
                         placeholder="your.email@firesideventures.com"
                         value={contactEmail}
                         onChange={(e) => setContactEmail(e.target.value)}
                         required
                       />
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="contact-phone">Phone Number (Optional)</Label>
                       <Input
                         id="contact-phone"
                         type="tel"
                         placeholder="+91 98765 43210"
                         value={contactPhone}
                         onChange={(e) => setContactPhone(e.target.value)}
                       />
                     </div>
                   </div>
                 </div>
 
                 <Button 
                   type="submit" 
                   disabled={submitting || !subject.trim() || !description.trim() || !contactEmail.trim()} 
                   className="w-full"
                 >
                   {submitting ? (
                     <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                   ) : (
                     <><Send className="w-4 h-4 mr-2" /> Submit Issue</>
                   )}
                 </Button>
               </form>
             </CardContent>
           </Card>
         </TabsContent>
 
         {/* My Tickets Tab */}
         <TabsContent value="my-tickets">
           <Card>
             <CardHeader>
               <CardTitle>Your Support Tickets</CardTitle>
               <CardDescription>
                 Track the status of your submitted issues and queries
               </CardDescription>
             </CardHeader>
             <CardContent>
               {loading ? (
                 <div className="flex items-center justify-center py-8">
                   <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                 </div>
               ) : tickets.length === 0 ? (
                 <div className="text-center py-8 text-muted-foreground">
                   <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                   <p>No tickets submitted yet</p>
                   <p className="text-sm">Your support requests will appear here</p>
                 </div>
               ) : (
                 <div className="overflow-x-auto">
                   <Table>
                     <TableHeader>
                       <TableRow>
                         <TableHead>Subject</TableHead>
                         <TableHead>Portfolio</TableHead>
                         <TableHead>Feature</TableHead>
                         <TableHead>Priority</TableHead>
                         <TableHead>Status</TableHead>
                         <TableHead>Submitted</TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {tickets.map((ticket) => (
                         <TableRow key={ticket.id}>
                           <TableCell className="font-medium max-w-[200px]">
                             <div className="truncate">{ticket.subject}</div>
                           </TableCell>
                           <TableCell className="text-sm text-muted-foreground">
                             {ticket.kpi_reference?.replace('Portfolio: ', '') || '-'}
                           </TableCell>
                           <TableCell className="text-sm text-muted-foreground">
                             {ticket.feature_tab || '-'}
                           </TableCell>
                           <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                           <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                           <TableCell className="text-sm text-muted-foreground">
                             {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                           </TableCell>
                         </TableRow>
                       ))}
                     </TableBody>
                   </Table>
                 </div>
               )}
             </CardContent>
           </Card>
         </TabsContent>
 
         {/* Contact Tab */}
         <TabsContent value="contact">
           <Card>
             <CardHeader>
               <CardTitle>Contact Support Team</CardTitle>
               <CardDescription>
                 Reach out to our support team for urgent matters
               </CardDescription>
             </CardHeader>
              <CardContent className="space-y-6">
                {/* Fireside Investor ESG Team */}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-3">Fireside Investor ESG Team</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                      <Mail className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Ramya</p>
                        <a href="mailto:ramya@firesideventures.com" className="text-sm text-primary hover:underline">
                          ramya@firesideventures.com
                        </a>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                          <a href="tel:+919740499399" className="text-sm text-muted-foreground hover:underline">
                            +91 97404 99399
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                      <Mail className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Tarak</p>
                        <a href="mailto:tarak@firesideventures.com" className="text-sm text-primary hover:underline">
                          tarak@firesideventures.com
                        </a>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                          <a href="tel:+918450950960" className="text-sm text-muted-foreground hover:underline">
                            +91 84509 50960
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fandoro Support */}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-3">Fandoro Support</h4>
                  <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                    <Mail className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Suman Kumar</p>
                      <a href="mailto:suman@fandoro.com" className="text-sm text-primary hover:underline">
                        suman@fandoro.com
                      </a>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                        <a href="tel:+917781913314" className="text-sm text-muted-foreground hover:underline">
                          +91 77819 13314
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
           </Card>
         </TabsContent>
       </Tabs>
     </DashboardLayout>
   );
 };
 
 export default AdminSupport;