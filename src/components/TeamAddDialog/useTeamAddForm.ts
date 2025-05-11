
// Makes sure submission uses all fields - Name, Email, Designation, Mobile Number
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [designation, setDesignation] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName("");
    setEmail("");
    setDesignation("");
    setMobileNumber("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Insert team member
      const { data: memberData, error: memberError } = await supabase
        .from("team_members")
        .insert({
          name,
          email,
          fund_admin_id: (await supabase.auth.getUser()).data.user?.id,
          designation,
          mobile_number: mobileNumber,
        })
        .select("id")
        .single();

      if (memberError) throw memberError;

      onAdd({
        name,
        email,
        designation,
        mobileNumber,
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
    submitting,
    handleSubmit,
    designation,
    setDesignation,
    mobileNumber,
    setMobileNumber,
  };
}
