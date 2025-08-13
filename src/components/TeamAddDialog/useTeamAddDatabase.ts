import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UseTeamAddDatabaseProps {
  onAdd: (member: { 
    name: string; 
    email: string; 
    designation: string;
    mobileNumber: string;
  }) => void;
  onClose: () => void;
}

export function useTeamAddDatabase({ onAdd, onClose }: UseTeamAddDatabaseProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [designation, setDesignation] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

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
      // Get current user's profile to determine tenant_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Fallback to local handling for non-authenticated users
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
          description: `${name} has been added to the team locally.`,
        });
        return;
      }

      // Get user's profile to get tenant_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.tenant_id) {
        // Fallback to local handling if no tenant
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
          description: `${name} has been added to the team locally.`,
        });
        return;
      }

      // Save to database
      const { error } = await supabase
        .from('team_members')
        .insert({
          full_name: name,
          email: email,
          designation: designation,
          mobile_number: mobileNumber,
          tenant_id: profile.tenant_id,
          invited_by: user.id,
          role: 'team_member_readonly' // Default role
        });

      if (error) {
        throw error;
      }

      // Call the original onAdd for UI updates
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
        description: `${name} has been added to the team and saved to database.`,
      });

    } catch (error) {
      console.error("Error adding team member:", error);
      // Fallback to local handling on error
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
        description: `${name} has been added locally. Database save failed.`,
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