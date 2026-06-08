import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Check, Loader, Clock, AlertTriangle, Upload, RotateCcw,X } from 'lucide-react';
import { ESGCapItem } from './CAPTable';

interface StatusBadgeProps {
  status: ESGCapItem['status'];
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'upcoming':
      return (
        <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200">
          <Clock className="h-3 w-3 mr-1" /> Upcoming
        </Badge>
      );
    case 'due in this month':
      return (
        <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">
          <AlertTriangle className="h-3 w-3 mr-1" /> Due in this Month
        </Badge>
      );
    case 'overdue':
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
          <X className="h-3 w-3 mr-1" /> Overdue
        </Badge>
      );
    case 'submitted':
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
          <Upload className="h-3 w-3 mr-1" /> Submitted
        </Badge>
      );
    case 'request to re-submit':
      return (
        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
          <RotateCcw className="h-3 w-3 mr-1" /> Request to Re-submit
        </Badge>
      );
    default:
      return null;
  }
};