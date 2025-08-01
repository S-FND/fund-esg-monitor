
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

  const handleSend = () => {
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
