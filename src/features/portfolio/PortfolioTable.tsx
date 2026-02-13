import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  Target,
  User,
  Eye,
  Trash2, // Changed from LogOut
  Undo
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

function getStageColor(stage: string) {
  switch (stage) {
    case "Seed": return "bg-purple-100 text-purple-800 border-purple-200";
    case "Pre Series A": return "bg-blue-100 text-blue-800 border-blue-200";
    case "Series A": return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "Series B": return "bg-indigo-200 text-indigo-900 border-indigo-300";
    case "Growth": return "bg-teal-100 text-teal-800 border-teal-200";
    default: return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

interface Company {
  _id: string;
  companyName: string;
  sector: string;
  companytype: string;
  founder: string;
  opportunityStatus: string;
  fundCompany: { fundName: string }[];
  user?: {
    _id: string;
    name?: string;
    email?: string;
    isDeleted?: boolean;
    active?: boolean;
    softDelete?: boolean;
  };
  companyId?: string;
}

interface PortfolioTableProps {
  companies: Company[];
  onViewDetails?: (companyId: string) => void;
  onSoftDelete: (companyId: string, shouldDelete: boolean) => Promise<void>; // Changed
  viewMode: "active" | "deleted";
  loading?: boolean; // Added
  onFilterChange?: (filter: "all" | "active" | "deleted") => void; // Added
  currentFilter?: "all" | "active" | "deleted"; // Added
}

export function PortfolioTable({
  companies,
  onViewDetails,
  onSoftDelete, // Changed
  viewMode,
  loading = false // Added
}: PortfolioTableProps) {
  const navigate = useNavigate();
  const [showExitModal, setShowExitModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<{ id: string; company: Company } | null>(null);
  const handleViewDetails = (companyId: string) => {
    if (onViewDetails) {
      onViewDetails(companyId);
    } else {
      navigate(`/portfolio/${companyId}`);
    }
  };

  const isDeleted = (company: Company) => {
    return company?.user?.isDeleted === true ||
      company?.user?.active === false ||
      company?.user?.softDelete === true;
  };

  const handleDeleteRestoreClick = async (companyId: string, company: Company) => {
    const deleted = isDeleted(company);
    const userIdToSend = company.user?._id;

    if (!userIdToSend) {
      console.error('No user ID found for company:', company);
      return;
    }

    await onSoftDelete(userIdToSend, !deleted);
  };

  return (
    <>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="font-semibold text-gray-700 w-12 text-center">No.</TableHead>
              <TableHead className="font-semibold text-gray-700">Company</TableHead>
              <TableHead className="font-semibold text-gray-700">Sector</TableHead>
              <TableHead className="font-semibold text-gray-700">Stage</TableHead>
              <TableHead className="font-semibold text-gray-700">Founder/CEO</TableHead>
              <TableHead className="font-semibold text-gray-700">Status</TableHead>
              <TableHead className="font-semibold text-gray-700 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company, index) => {
              const deleted = isDeleted(company);

              return (
                <TableRow
                  key={company._id}
                  className={`hover:bg-gray-50/80 transition-colors cursor-pointer ${deleted ? 'bg-gray-50/50' : ''}`}
                // onClick={() => handleViewDetails(company._id)}
                >
                  <TableCell className="text-center font-medium text-gray-500">
                    {index + 1}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-md flex items-center justify-center text-white font-semibold text-xs ${deleted ? 'bg-gray-400' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                        }`}>
                        {company.companyName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{company.companyName}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {company.companytype}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className={deleted ? 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-blue-50 text-blue-700 border-blue-200'}>
                      {company.sector}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Badge className={deleted ? 'bg-gray-100 text-gray-600 border-gray-200' : getStageColor(company.opportunityStatus)}>
                      <Target className="h-3 w-3 mr-1" />
                      {company.opportunityStatus}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">{company.founder}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${deleted ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${deleted ? 'bg-gray-500' : 'bg-green-500'
                        }`} />
                      {deleted ? 'Deleted' : 'Active'}
                    </span>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(company._id);
                        }}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {deleted ? (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRestoreClick(company._id, company);
                          }}
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700 h-8 w-8 p-0"
                        >
                          <Undo className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!company.user?._id) {
                              console.error('No user ID found for company:', company.companyName);
                              return;
                            }
                            setSelectedCompany({ id: company._id, company });
                            setShowExitModal(true);
                          }}
                          disabled={loading || !company.user?._id}
                          className={`h-8 w-8 p-0 ${!company.user?._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}

            {companies.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-96 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                      <Building2 className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {viewMode === 'active' ? 'No active companies found' : 'No deleted companies found'}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      {viewMode === 'active'
                        ? 'Get started by adding your first portfolio company.'
                        : 'Companies you exit will appear here.'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Exit Confirmation Modal */}
      <AlertDialog open={showExitModal} onOpenChange={setShowExitModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to exit this company?</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive {selectedCompany?.company.companyName} from your portfolio.
              You can restore it later from the archived section.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedCompany(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (selectedCompany) {
                  await handleDeleteRestoreClick(selectedCompany.id, selectedCompany.company);
                  setShowExitModal(false);
                  setSelectedCompany(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Exit Company
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}