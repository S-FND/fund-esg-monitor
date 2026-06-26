import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Check, Loader, Clock, AlertTriangle, Upload, RotateCcw, X, Calendar } from 'lucide-react';
import { ESGCapItem } from './CAPTable';

interface StatusBadgeProps {
  status: ESGCapItem['companyStatus'];  // ✅ Changed from 'status' to 'companyStatus'
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'due-in-this-month':
      return (
        <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200 whitespace-nowrap">
          <AlertTriangle className="h-3 w-3 mr-1" /> Due in this Month
        </Badge>
      );
    case 'overdue':
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
          <X className="h-3 w-3 mr-1" /> Overdue
        </Badge>
      );
    case 'partly-submitted':
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 whitespace-nowrap">
          <Upload className="h-3 w-3 mr-1" /> Partly Submitted
        </Badge>
      );
    case 're-submit-Required':
      return (
        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 whitespace-nowrap">
          <RotateCcw className="h-3 w-3 mr-1" /> Re-submit Required
        </Badge>
      );
    case 'submitted':
      return (
        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 whitespace-nowrap">
          <Clock className="h-3 w-3 mr-1" /> Submitted
        </Badge>
      );
    case 'closed':
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
          <Check className="h-3 w-3 mr-1" /> Closed
        </Badge>
      );
    // case 'upcoming':
    //   return (
    //     <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200 whitespace-nowrap">
    //       <Calendar className="h-3 w-3 mr-1" /> Upcoming
    //     </Badge>
    //   );

      case 'upcoming':
        return (
          <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200">
            <Calendar className="h-3 w-3 mr-1" /> Upcoming
          </Badge>
        );  
    default:
      return null;
  }
};