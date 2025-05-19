
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
      const res = await fetch(`https://preprod-api.fandoro.com` + `/subuser`, {
        method: "POST",
        body:JSON.stringify({employeeList:[{name,
          email,
          designation,
          mobileNumber}]}),
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!res.ok) {
        // toast.error("Invalid credentials");
        // setIsLoading(false);
        return;
      }
      else {
        const jsondata = await res.json();
        // setViewingReport(jsondata['data'][0])
        // setLoading(false)

      }

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
