
import { TeamAddUserFields } from "./TeamAddUserFields";
import { TeamAddFundsField } from "./TeamAddFundsField";

export function TeamAddForm({
  name,
  setName,
  email,
  setEmail,
  funds,
  selectedFunds,
  setSelectedFunds,
  submitting,
  handleSubmit,
}: {
  name: string;
  setName: (name: string) => void;
  email: string;
  setEmail: (email: string) => void;
  funds: { id: string; name: string }[];
  selectedFunds: string[];
  setSelectedFunds: (ids: string[]) => void;
  submitting: boolean;
  handleSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <TeamAddUserFields
        name={name}
        email={email}
        setName={setName}
        setEmail={setEmail}
        submitting={submitting}
      />
      <TeamAddFundsField
        funds={funds}
        selectedFunds={selectedFunds}
        setSelectedFunds={setSelectedFunds}
        submitting={submitting}
      />
      <div className="flex justify-end">
        <button
          type="submit"
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? "Adding..." : "Add Team Member"}
        </button>
      </div>
    </form>
  );
}
