import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Eye, Filter, ArrowUpDown, Search, Grid3X3 } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function Funds() {
  const navigate = useNavigate();
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });

  const getFundList = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/investor/fund`, {
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
        console.log('funds data:', jsondata);
        setFunds(jsondata['data']);
      }
    } catch (error) {
      console.error("Api call:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getFundList();
  }, []);

  const getInitials = (name) => {
    if (!name) return "FD";
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (size) => {
    if (!size) return "₹0";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(size);
  };

  const formatIndianCurrency = (size) => {
    if (!size) return "₹0";
    if (size >= 10000000) {
      return `₹${(size / 10000000).toFixed(2)} Cr`;
    } else if (size >= 100000) {
      return `₹${(size / 100000).toFixed(2)} L`;
    } else {
      return `₹${size.toLocaleString('en-IN')}`;
    }
  };

  const filteredFunds = funds.filter(fund => 
    fund.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fund.stageOfInvestment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fund.sectorFocus?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedFunds = [...filteredFunds].sort((a, b) => {
    if (sortConfig.key === "name") {
      return sortConfig.direction === "asc" 
        ? (a.name || "").localeCompare(b.name || "")
        : (b.name || "").localeCompare(a.name || "");
    }
    if (sortConfig.key === "size") {
      return sortConfig.direction === "asc" 
        ? (a.size || 0) - (b.size || 0)
        : (b.size || 0) - (a.size || 0);
    }
    return 0;
  });

  const requestSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc",
    });
  };

  // Helper to safely split sector focus
  const getSectors = (sectorFocus) => {
    if (!sectorFocus) return [];
    return sectorFocus.split(',').map(s => s.trim()).filter(s => s);
  };

  // Get color for sector badge
  const getSectorColor = (sector) => {
    const colors = {
      'ClimateTech': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'AgriTech': 'bg-green-100 text-green-700 border-green-200',
      'FinTech': 'bg-blue-100 text-blue-700 border-blue-200',
      'HealthTech': 'bg-purple-100 text-purple-700 border-purple-200',
      'EdTech': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'CleanTech': 'bg-cyan-100 text-cyan-700 border-cyan-200',
      'BioTech': 'bg-pink-100 text-pink-700 border-pink-200',
      'AI/ML': 'bg-orange-100 text-orange-700 border-orange-200',
      'SaaS': 'bg-violet-100 text-violet-700 border-violet-200',
      'E-commerce': 'bg-rose-100 text-rose-700 border-rose-200',
    };
    return colors[sector] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gray-50/50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Funds Portfolio
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage and monitor your investment funds
          </p>
        </div>
        <Button 
          onClick={() => navigate("/funds/new")} 
          className="gap-2 shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto"
          size="default"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Fund</span>
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <Card className="border-none shadow-md">
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search funds by name, sector, or stage..."
                className="pl-9 h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 h-10">
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Filter</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>All Funds</DropdownMenuItem>
                <DropdownMenuItem>Active Funds</DropdownMenuItem>
                <DropdownMenuItem>Upcoming Funds</DropdownMenuItem>
                <DropdownMenuItem>Closed Funds</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
  <Card className="border-none shadow-md bg-gradient-to-br from-blue-500 to-blue-600 text-white">
    <CardContent className="p-2 md:p-3">
      <p className="text-[10px] md:text-xs font-medium opacity-90">Total Funds</p>
      <p className="text-base md:text-lg font-bold">{funds.length}</p>
    </CardContent>
  </Card>
  <Card className="border-none shadow-md bg-gradient-to-br from-green-500 to-green-600 text-white">
    <CardContent className="p-2 md:p-3">
      <p className="text-[10px] md:text-xs font-medium opacity-90">Active Funds</p>
      <p className="text-base md:text-lg font-bold">{funds.length}</p>
    </CardContent>
  </Card>
  <Card className="border-none shadow-md bg-gradient-to-br from-purple-500 to-purple-600 text-white">
    <CardContent className="p-2 md:p-3">
      <p className="text-[10px] md:text-xs font-medium opacity-90">Total AUM</p>
      <p className="text-sm md:text-base font-bold">
        {formatIndianCurrency(funds.reduce((acc, f) => acc + (f.size || 0), 0))}
      </p>
    </CardContent>
  </Card>
  <Card className="border-none shadow-md bg-gradient-to-br from-orange-500 to-orange-600 text-white">
    <CardContent className="p-2 md:p-3">
      <p className="text-[10px] md:text-xs font-medium opacity-90">Avg. Fund Size</p>
      <p className="text-sm md:text-base font-bold">
        {formatIndianCurrency(funds.reduce((acc, f) => acc + (f.size || 0), 0) / (funds.length || 1))}
      </p>
    </CardContent>
  </Card>
</div>

      {/* Main Table */}
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b px-4 md:px-6">
          <CardTitle className="text-lg md:text-xl font-semibold flex items-center gap-2">
            <span>Fund List</span>
            <Badge variant="secondary" className="rounded-full text-xs">
              {sortedFunds.length} funds
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/80">
                <TableRow>
                  <TableHead className="whitespace-nowrap w-[22%]">
                    <Button 
                      variant="ghost" 
                      className="p-0 font-semibold hover:bg-transparent h-auto"
                      onClick={() => requestSort("name")}
                    >
                      Fund Name
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="whitespace-nowrap w-[15%]">
                    <Button 
                      variant="ghost" 
                      className="p-0 font-semibold hover:bg-transparent h-auto"
                      onClick={() => requestSort("size")}
                    >
                      Fund Size
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="whitespace-nowrap w-[25%]">
                    <div className="flex items-center gap-1">
                      <Grid3X3 className="h-3 w-3" />
                      <span>Sector Focus</span>
                    </div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap w-[12%]">Stage</TableHead>
                  <TableHead className="whitespace-nowrap w-[15%]">Inclusion</TableHead>
                  <TableHead className="whitespace-nowrap w-[15%]">Exclusion</TableHead>
                  <TableHead className="whitespace-nowrap w-[8%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : sortedFunds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 md:py-12">
                      <div className="flex flex-col items-center gap-2">
                        <div className="rounded-full bg-gray-100 p-2 md:p-3">
                          <Search className="h-5 w-5 md:h-6 md:w-6 text-gray-400" />
                        </div>
                        <p className="text-base md:text-lg font-medium text-gray-900">No funds found</p>
                        <p className="text-xs md:text-sm text-gray-500">
                          {searchTerm ? "Try adjusting your search" : "Create your first fund to get started"}
                        </p>
                        {!searchTerm && (
                          <Button 
                            onClick={() => navigate("/funds/new")} 
                            className="mt-2 md:mt-4"
                            variant="outline"
                            size="sm"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Create New Fund
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TooltipProvider>
                    {sortedFunds.map((fund) => {
                      const sectors = getSectors(fund.sectorFocus);
                      return (
                        <TableRow 
                          key={fund._id} 
                          className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                          // onClick={() => navigate(`/funds/${fund._id}`)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7 md:h-8 md:w-8 bg-gradient-to-br from-primary/10 to-primary/30 flex-shrink-0">
                                <AvatarFallback className="text-xs">
                                  {getInitials(fund.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-sm md:text-base truncate max-w-[120px] md:max-w-[180px]" title={fund.name}>
                                {fund.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold font-mono text-sm md:text-base" title={formatCurrency(fund.size)}>
                              {formatCurrency(fund.size)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {sectors.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {sectors.map((sector, idx) => (
                                  <Tooltip key={idx}>
                                    <TooltipTrigger asChild>
                                      <Badge 
                                        variant="outline"
                                        className={`${getSectorColor(sector)} font-medium text-xs px-2 py-0.5 border cursor-help transition-all hover:scale-105`}
                                      >
                                        {sector}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs">
                                      <p>{sector}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground italic">Not specified</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal text-xs px-2 py-0.5 bg-gray-50">
                              {fund.stageOfInvestment || 'Not specified'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {fund.inclusion?.length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-w-[150px]">
                                {fund.inclusion.slice(0, 2).map((term, idx) => (
                                  <Tooltip key={idx}>
                                    <TooltipTrigger asChild>
                                      <Badge 
                                        className="bg-green-100 text-green-700 hover:bg-green-200 border-none text-xs px-2 py-0.5 cursor-help"
                                      >
                                        {term.length > 8 ? `${term.substring(0, 8)}...` : term}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs">
                                      <p>{term}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                                {fund.inclusion.length > 2 && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge variant="outline" className="text-xs px-2 py-0.5 cursor-help">
                                        +{fund.inclusion.length - 2}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs">
                                      <div className="space-y-1">
                                        {fund.inclusion.slice(2).map((term, idx) => (
                                          <p key={idx}>{term}</p>
                                        ))}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground italic">None</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {fund.exclusion?.length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-w-[150px]">
                                {fund.exclusion.slice(0, 2).map((term, idx) => (
                                  <Tooltip key={idx}>
                                    <TooltipTrigger asChild>
                                      <Badge 
                                        variant="destructive"
                                        className="bg-red-100 text-red-700 hover:bg-red-200 border-none text-xs px-2 py-0.5 cursor-help"
                                      >
                                        {term.length > 8 ? `${term.substring(0, 8)}...` : term}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs">
                                      <p>{term}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                                {fund.exclusion.length > 2 && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge variant="outline" className="text-xs px-2 py-0.5 cursor-help">
                                        +{fund.exclusion.length - 2}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs">
                                      <div className="space-y-1">
                                        {fund.exclusion.slice(2).map((term, idx) => (
                                          <p key={idx}>{term}</p>
                                        ))}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground italic">None</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 md:px-3 hover:bg-primary/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/funds/${fund._id}`);
                              }}
                            >
                              <Eye className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
                              <span className="hidden md:inline">View</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TooltipProvider>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}