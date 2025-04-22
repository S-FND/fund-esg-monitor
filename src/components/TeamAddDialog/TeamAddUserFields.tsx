
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TeamAddUserFields({
  name,
  email,
  setName,
  setEmail,
  submitting,
}: {
  name: string;
  email: string;
  setName: (name: string) => void;
  setEmail: (email: string) => void;
  submitting: boolean;
}) {
  return (
    <>
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          required
          disabled={submitting}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          disabled={submitting}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
    </>
  );
}
