
// Makes sure submission uses all fields - Name, Email, Designation, Mobile Number
import { useTeamAddDatabase } from "./useTeamAddDatabase";

interface UseTeamAddFormProps {
  onAdd: (member: { 
    name: string; 
    email: string; 
    designation: string;
    mobileNumber: string;
  }) => void;
  onClose: () => void;
}

export function useTeamAddForm({ onAdd, onClose }: UseTeamAddFormProps) {
  return useTeamAddDatabase({ onAdd, onClose });
}
