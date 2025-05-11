
// Providing UI for Name, Email, Designation, and Mobile Number fields in the add user form

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TeamAddUserFields({
  name,
  email,
  setName,
  setEmail,
  submitting,
  designation,
  setDesignation,
  mobileNumber,
  setMobileNumber,
}: {
  name: string;
  email: string;
  setName: (name: string) => void;
  setEmail: (email: string) => void;
  submitting: boolean;
  designation: string;
  setDesignation: (designation: string) => void;
  mobileNumber: string;
  setMobileNumber: (number: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="team-name">Name</Label>
        <Input
          id="team-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={submitting}
          required
        />
      </div>
      <div>
        <Label htmlFor="team-email">Email</Label>
        <Input
          id="team-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={submitting}
          required
        />
      </div>
      <div>
        <Label htmlFor="team-designation">Designation</Label>
        <Input
          id="team-designation"
          type="text"
          value={designation}
          onChange={e => setDesignation(e.target.value)}
          disabled={submitting}
          required
        />
      </div>
      <div>
        <Label htmlFor="team-mobile">Mobile Number</Label>
        <Input
          id="team-mobile"
          type="tel"
          value={mobileNumber}
          onChange={e => setMobileNumber(e.target.value)}
          disabled={submitting}
          required
        />
      </div>
    </div>
  );
}
