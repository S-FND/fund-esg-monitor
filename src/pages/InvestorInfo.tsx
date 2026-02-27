import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building2, 
  Mail, 
  User, 
  MapPin, 
  Target, 
  Edit, 
  BadgeIndianRupee,
  Briefcase,
  Globe,
  Shield,
  Users,
  Clock,
  CheckCircle2,
  Leaf,
  Sprout,
  Trees
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface InvestorFormData {
  investorName: string;
  companyName: string;
  email: string;
  pan: string;
  gst: string;
  esgManagerEmail: string;
  sdgGoals: string;
  sdgTargets: string;
  designation: string;
  companyAddress: string;
  esgPolicyFileName?: string;
}

// Helper component for info rows with neutral theme
const InfoRow = ({ 
  icon, 
  label, 
  value, 
  badge = null, 
  isEmail = false, 
  isAddress = false 
}: { 
  icon: React.ReactNode;
  label: string;
  value?: string;
  badge?: string | null;
  isEmail?: boolean;
  isAddress?: boolean;
}) => (
  <div className="flex items-start p-4 hover:bg-gray-50/80 transition-colors group">
    <div className="flex items-center gap-3 min-w-[140px]">
      <div className="p-1.5 rounded-lg bg-gray-100 group-hover:bg-white transition-colors">
        {icon}
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </div>
    <div className="flex-1 flex items-center gap-2">
      {isEmail ? (
        <a href={`mailto:${value}`} className="text-blue-600 hover:text-blue-800 hover:underline">
          {value || 'Not provided'}
        </a>
      ) : (
        <span className={`text-sm ${isAddress ? 'text-gray-600 leading-relaxed' : 'font-medium text-gray-900'}`}>
          {value || 'Not provided'}
        </span>
      )}
      {badge && (
        <Badge variant="secondary" className="ml-2 text-xs bg-blue-100 text-blue-700 border-blue-200">
          {badge}
        </Badge>
      )}
    </div>
  </div>
);

export default function InvestorInfo() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<InvestorFormData>();
  const [loading, setLoading] = useState(true);

  const getInvestorInfo = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/investor/general-info/`, {
        method: "GET",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${localStorage.getItem("auth_token")}` 
        },
      });
      if (!res.ok) {
        return;
      } else {
        const jsondata = await res.json();
        console.log('jsondata', jsondata);
        if (jsondata['data']) {
          let investorInfo = {
            investorName: jsondata['data']['investorName'],
            companyName: jsondata['data']['companyName'],
            email: jsondata['data']['email'],
            pan: jsondata['data']['panNumber'],
            gst: jsondata['data']['gstNumber'],
            esgManagerEmail: jsondata['data']['esgManagerEmail'],
            sdgGoals: jsondata['data']['sdgGoal'],
            sdgTargets: jsondata['data']['sdgTarget'],
            designation: jsondata['data']['designation'],
            companyAddress: jsondata['data']['address'],
          };
          setFormData(investorInfo);
        }
      }
    } catch (error) {
      console.error("Api call:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getInvestorInfo();
  }, []);

  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return "INV";
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Format SDG goals for better display
  const formatSDGGoals = (goals?: string) => {
    if (!goals) return [];
    return goals.split(',').map(goal => goal.trim());
  };

  const sdgGoalsList = formatSDGGoals(formData?.sdgGoals);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 p-4 md:p-8">
      {/* Decorative Elements - Neutral */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gray-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gray-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gray-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>
      
      <div className="max-w-7xl mx-auto space-y-6 relative">
        {/* Header Section with Neutral Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 via-emerald-600 to-teal-700 text-white p-8 shadow-2xl">
          {/* Leaf Pattern Background */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 transform rotate-12">
              <Leaf className="h-32 w-32 text-white" />
            </div>
            <div className="absolute bottom-0 right-0 transform -rotate-12">
              <Sprout className="h-32 w-32 text-white" />
            </div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Trees className="h-40 w-40 text-white" />
            </div>
          </div>
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-grid-white/[0.1] bg-[size:20px_20px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-green-900/50 to-transparent" />
          
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm border border-white/30">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                    Investor Profile
                  </h1>
                  <p className="text-green-100 mt-1 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-300 animate-pulse" />
                    {formData?.investorName || 'Loading...'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
              <Button 
                onClick={() => navigate("/investor-info/edit")}
                className="bg-white text-green-700 hover:bg-green-50 shadow-lg hover:shadow-xl transition-all duration-200 gap-2 w-full md:w-auto border-2 border-white/50"
                size="lg"
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="relative mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-green-200" />
                <div>
                  <p className="text-xs text-green-200">PAN Status</p>
                  <p className="text-sm font-semibold">Verified</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                <div>
                  <p className="text-xs text-green-200">GST Status</p>
                  <p className="text-sm font-semibold">Active</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-teal-200" />
                <div>
                  <p className="text-xs text-green-200">SDG Goals</p>
                  <p className="text-sm font-semibold">{sdgGoalsList.length} Active</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-amber-200" />
                <div>
                  <p className="text-xs text-green-200">ESG Manager</p>
                  <p className="text-sm font-semibold">Assigned</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid - All Green Removed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Company Info Card */}
          <Card className="lg:col-span-2 border-none shadow-xl bg-white overflow-hidden group hover:shadow-2xl transition-all duration-300">
            <CardHeader className="border-b border-gray-200 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-800">Company Details</span>
                </CardTitle>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    Active
                  </span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  <InfoRow 
                    icon={<User className="h-4 w-4 text-blue-600" />}
                    label="Investor Name"
                    value={formData?.investorName}
                    badge="Primary"
                  />
                  <InfoRow 
                    icon={<Building2 className="h-4 w-4 text-indigo-600" />}
                    label="Company Name"
                    value={formData?.companyName}
                  />
                  <InfoRow 
                    icon={<Mail className="h-4 w-4 text-purple-600" />}
                    label="Email Address"
                    value={formData?.email}
                    isEmail={true}
                  />
                  <InfoRow 
                    icon={<Briefcase className="h-4 w-4 text-orange-600" />}
                    label="Designation"
                    value={formData?.designation}
                  />
                  <InfoRow 
                    icon={<MapPin className="h-4 w-4 text-red-600" />}
                    label="Company Address"
                    value={formData?.companyAddress}
                    isAddress={true}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tax & Compliance Card */}
          <Card className="border-none shadow-xl bg-white overflow-hidden group hover:shadow-2xl transition-all duration-300">
            <CardHeader className="border-b border-gray-200 pb-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-xl font-semibold text-gray-800">Tax & Compliance</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-2 text-blue-700 mb-2">
                      <BadgeIndianRupee className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">PAN Number</span>
                    </div>
                    <p className="text-lg font-mono font-bold text-gray-900">{formData?.pan || 'Not Provided'}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-2 text-purple-700 mb-2">
                      <Globe className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">GST Number</span>
                    </div>
                    <p className="text-lg font-mono font-bold text-gray-900">{formData?.gst || 'Not Provided'}</p>
                  </div>

                  <Separator className="my-4 bg-gray-200" />
                  
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-2 text-orange-700 mb-2">
                      <Mail className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">ESG Manager</span>
                    </div>
                    <p className="text-base font-semibold text-gray-900 text-[11px]">{formData?.esgManagerEmail || 'Not Assigned'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SDG Goals Card - Full Width */}
          <Card className="lg:col-span-3 border-none shadow-xl bg-white overflow-hidden">
            <CardHeader className="border-b border-gray-200 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-xl font-semibold text-gray-800">SDG Goals & Targets</CardTitle>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                  <Leaf className="h-3 w-3 mr-1 inline" />
                  {sdgGoalsList.length} Goals
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-blue-600 flex items-center gap-2">
                      <span className="inline-block w-1 h-4 bg-blue-600 rounded-full" />
                      SDG Goals
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {sdgGoalsList.length > 0 ? (
                        sdgGoalsList.map((goal, index) => (
                          <Badge 
                            key={index}
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200 cursor-default hover:scale-105"
                          >
                            <Leaf className="h-3 w-3 mr-1 inline" />
                            {goal}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-gray-500 italic">No SDG goals specified</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-purple-600 flex items-center gap-2">
                      <span className="inline-block w-1 h-4 bg-purple-600 rounded-full" />
                      SDG Targets
                    </h3>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                      <p className="text-gray-700 leading-relaxed">
                        {formData?.sdgTargets || 'No specific targets defined'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer Note */}
        <div className="text-center text-sm text-gray-600 pt-4">
          <p className="flex items-center justify-center gap-2 bg-white/50 backdrop-blur-sm rounded-full py-2 px-4 w-fit mx-auto">
            <Clock className="h-4 w-4" />
            Last updated: {new Date().toLocaleDateString('en-IN', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}