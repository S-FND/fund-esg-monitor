import React, { useState, useEffect } from "react";
import { TeamAddDialog } from "@/components/TeamAddDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Pencil, Eye, UserPlus, Mail, Phone, Shield, MoreVertical, UserCheck, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

type TeamMember = {
  _id: string;
  name: string;
  email: string;
  designation?: string;
  mobileNumber?: string;
  accessRights?: string[];
  active: boolean;
};

export default function Team() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [filteredTeam, setFilteredTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingDialogOpen, setAddingDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const navigate = useNavigate();
  const { toast } = useToast();

  const getTeamList = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}` + `/subuser`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!res.ok) {
        setLoading(false);
        return;
      } else {
        const jsondata = await res.json();
        const teamData = jsondata['data'][0]['subuser'] || [];
        setTeam(teamData);
        setFilteredTeam(teamData);
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    getTeamList();
  }, []);

  useEffect(() => {
    // Filter team based on search and active filter
    let filtered = team;

    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.designation?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (activeFilter === "active") {
      filtered = filtered.filter(member => member.active);
    } else if (activeFilter === "inactive") {
      filtered = filtered.filter(member => !member.active);
    }

    setFilteredTeam(filtered);
  }, [searchTerm, activeFilter, team]);

  const handleAddTeamMember = (member: { name: string; email: string; designation: string; mobileNumber: string }) => {
    const newMember = {
      _id: Math.random().toString(36).substr(2, 9),
      ...member,
      accessRights: ["Dashboard"],
      active: false
    };
    setTeam(prev => [...prev, newMember]);
    toast({
      title: "Team member added",
      description: `${member.name} has been added to your team.`,
    });
  };

  const handleViewMember = (id: string) => {
    navigate(`/team/${id}`);
  };

  const handleEditMember = (id: string) => {
    navigate(`/team/edit/${id}`);
  };

  const getInitials = (name: string) => {
    if (!name) return "TM";
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const stats = {
    total: team.length,
    active: team.filter(m => m.active).length,
    inactive: team.filter(m => !m.active).length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Team</h1>
              <p className="text-gray-600 mt-1">Manage your team members and their access</p>
            </div>
            <Button
              onClick={() => setAddingDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </div>

          {/* Stats Cards - Colored */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Total Members Card */}
            <Card className="border-none shadow-md bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden">
              <div className="p-3 relative">
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-5 -mt-5"></div>
                <div className="absolute bottom-0 left-0 w-10 h-10 bg-white/10 rounded-full -ml-3 -mb-3"></div>
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-xs font-medium text-blue-100">Total Members</p>
                    <p className="text-xl font-bold">{stats.total}</p>
                  </div>
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <UserPlus className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </Card>

            {/* Active Members Card */}
            <Card className="border-none shadow-md bg-gradient-to-br from-green-500 to-emerald-600 text-white overflow-hidden">
              <div className="p-3 relative">
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-5 -mt-5"></div>
                <div className="absolute bottom-0 left-0 w-10 h-10 bg-white/10 rounded-full -ml-3 -mb-3"></div>
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-xs font-medium text-green-100">Active</p>
                    <p className="text-xl font-bold">{stats.active}</p>
                  </div>
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <UserCheck className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </Card>

            {/* Inactive Members Card */}
            <Card className="border-none shadow-md bg-gradient-to-br from-gray-600 to-gray-700 text-white overflow-hidden">
              <div className="p-3 relative">
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-5 -mt-5"></div>
                <div className="absolute bottom-0 left-0 w-10 h-10 bg-white/10 rounded-full -ml-3 -mb-3"></div>
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-xs font-medium text-gray-200">Inactive</p>
                    <p className="text-xl font-bold">{stats.inactive}</p>
                  </div>
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <UserX className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <Tabs defaultValue="all" className="w-full sm:w-auto" onValueChange={(v) => setActiveFilter(v as any)}>
              <TabsList className="bg-white border border-gray-200">
                <TabsTrigger value="all" className="data-[state=active]:bg-gray-100">All</TabsTrigger>
                <TabsTrigger value="active" className="data-[state=active]:bg-gray-100">Active</TabsTrigger>
                <TabsTrigger value="inactive" className="data-[state=active]:bg-gray-100">Inactive</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative w-full sm:w-64">
              <Input
                placeholder="Search by name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white border-gray-200"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Team List */}
        <div className="space-y-3">
          {loading ? (
            // Loading skeletons
            [...Array(3)].map((_, i) => (
              <Card key={i} className="border-none shadow-sm bg-white p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </div>
              </Card>
            ))
          ) : filteredTeam.length === 0 ? (
            <Card className="border-none shadow-sm bg-white p-12 text-center">
              <div className="flex flex-col items-center">
                <div className="p-3 bg-gray-100 rounded-full mb-4">
                  <UserPlus className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No members found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm ? "Try adjusting your search" : "Get started by adding your first team member"}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setAddingDialogOpen(true)} variant="outline">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            filteredTeam.map((member) => (
              <Card
                key={member._id}
                className="border-none shadow-sm bg-white hover:shadow-md transition-all duration-200"
              >
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{member.name}</h3>
                        <Badge
                          variant="secondary"
                          className={member.active
                            ? "bg-green-100 text-green-700 border-green-200 text-xs"
                            : "bg-gray-100 text-gray-700 border-gray-200 text-xs"
                          }
                        >
                          {member.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="h-3.5 w-3.5 text-gray-400" />
                          <span className="truncate" title={member.email}>{member.email}</span>
                        </div>

                        {member.designation && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span>{member.designation}</span>
                          </div>
                        )}

                        {member.mobileNumber && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="h-3.5 w-3.5 text-gray-400" />
                            <span>{member.mobileNumber}</span>
                          </div>
                        )}

                        {member.accessRights && member.accessRights.length > 0 && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Shield className="h-3.5 w-3.5 text-gray-400" />
                            <span className="truncate">
                              {member.accessRights.slice(0, 2).join(", ")}
                              {member.accessRights.length > 2 && ` +${member.accessRights.length - 2}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewMember(member._id)}
                        className="h-8 px-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditMember(member._id)}
                        className="h-8 px-2 text-gray-600 hover:text-green-600 hover:bg-green-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => handleViewMember(member._id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditMember(member._id)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <UserX className="h-4 w-4 mr-2" />
                            Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 rounded-full">
              <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-900 mb-1">About Team Management</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Admins can add team members and each new member will receive an email invite.</li>
                <li>New members are added with inactive status until they complete their registration.</li>
                <li>This is a demo. No actual invite emails will be sent.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <TeamAddDialog
        open={addingDialogOpen}
        onOpenChange={setAddingDialogOpen}
        onAdd={handleAddTeamMember}
      />
    </div>
  );
}