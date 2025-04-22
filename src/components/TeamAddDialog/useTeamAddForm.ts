
// Makes sure submission uses all fields - Name, Email, Designation, Mobile Number, Password
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type Fund = {
  id: string;
  name: string;
};

interface UseTeamAddFormProps {
  onAdd: (member: { 
    name: string; 
    email: string; 
    fundIds: string[]; 
    designation: string;
    mobileNumber: string;
    password: string;
  }) => void;
  onClose: () => void;
}

export function useTeamAddForm({ onAdd, onClose }: UseTeamAddFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [designation, setDesignation] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [funds, setFunds] = useState<Fund[]>([]);
  const [selectedFunds, setSelectedFunds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchFunds = async () => {
      const { data, error } = await supabase.from("funds").select("*");
      if (data) setFunds(data);
      if (error) console.error("Error fetching funds:", error);
    };
    fetchFunds();
  }, []);

  const reset = () => {
    setName("");
    setEmail("");
    setDesignation("");
    setMobileNumber("");
    setPassword("");
    setSelectedFunds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Insert team member, including all new fields
      const { data: memberData, error: memberError } = await supabase
        .from("team_members")
        .insert({
          name,
          email,
          fund_admin_id: (await supabase.auth.getUser()).data.user?.id,
          designation,
          mobile_number: mobileNumber,
          // DO NOT store passwords in plaintext in production! Demo only.
          password
        })
        .select("id")
        .single();

      if (memberError) throw memberError;

      // Insert fund assignments
      const fundAssignments = selectedFunds.map((fundId) => ({
        team_member_id: memberData.id,
        fund_id: fundId,
      }));

      if (fundAssignments.length > 0) {
        const { error: assignmentError } = await supabase
          .from("team_member_funds")
          .insert(fundAssignments);

        if (assignmentError) throw assignmentError;
      }

      onAdd({
        name,
        email,
        fundIds: selectedFunds,
        designation,
        mobileNumber,
        password,
      });

      reset();
      onClose();

      toast({
        title: "Team Member Added",
        description: `${name} has been added to the team.`,
      });
    } catch (error) {
      console.error("Error adding team member:", error);
      toast({
        title: "Error",
        description: "Could not add team member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    name,
    setName,
    email,
    setEmail,
    funds,
    selectedFunds,
    setSelectedFunds,
    submitting,
    handleSubmit,
    designation,
    setDesignation,
    mobileNumber,
    setMobileNumber,
    password,
    setPassword,
  };
}
