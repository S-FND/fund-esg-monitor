
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
      // Insert team member
      const { data: memberData, error: memberError } = await supabase
        .from("team_members")
        .insert({
          name,
          email,
          fund_admin_id: (await supabase.auth.getUser()).data.user?.id,
          designation,
          mobile_number: mobileNumber,
          // DO NOT store password in plaintext in production! This is for demonstration only.
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

      const { error: assignmentError } = await supabase
        .from("team_member_funds")
        .insert(fundAssignments);

      if (assignmentError) throw assignmentError;

      // Fetch fund names for email
      const assignedFundNames = funds
        .filter((f) => selectedFunds.includes(f.id))
        .map((f) => f.name);

      // Get admin name (optional)
      let adminName = null;
      try {
        const { data: userData } = await supabase.auth.getUser();
        adminName =
          userData?.user?.user_metadata?.name ||
          userData?.user?.email ||
          null;
      } catch {
        /* ignore */
      }

      // Send invite email via Edge Function
      const { error: sendEmailError } = await supabase.functions.invoke(
        "send-team-invite",
        {
          body: {
            name,
            email,
            adminName,
            fundNames: assignedFundNames,
          },
        }
      );

      if (sendEmailError) {
        throw sendEmailError;
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
        description: `${name} has been added to the team. Invite email sent!`,
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
