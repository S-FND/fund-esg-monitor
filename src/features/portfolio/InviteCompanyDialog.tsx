
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";

interface InviteCompanyDialogProps {
  onInvite: (email: string) => void;
}

export function InviteCompanyDialog({ onInvite }: InviteCompanyDialogProps) {
  const [email, setEmail] = useState("");

  const handleSend = async () => {
    // /investor/fund/company/invite
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}` + `/investor/fund/company/invite`, {
        method: "POST",
        body:JSON.stringify({email:email}),
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!res.ok) {
        // toast.error("Invalid credentials");
        // setIsLoading(false);
        return;
      }
      else {
        const jsondata = await res.json();
        console.log('jsondata', jsondata)
      }
    } catch (error) {
      console.error("Api call:", error);
      // toast.error("API Call failed. Please try again.");
    } finally {
      // setIsLoading(false);
    }
    onInvite(email);
    setEmail("");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UserPlus className="h-4 w-4" />
          <span>Invite Company</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a Company</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Founder/CEO Email</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
            />
          </div>
          <Button className="w-full" onClick={handleSend} disabled={!email}>
            Send Invitation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
