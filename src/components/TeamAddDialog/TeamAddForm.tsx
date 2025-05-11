
import { TeamAddUserFields } from "./TeamAddUserFields";

export function TeamAddForm({
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
}: {
  name: string;
  setName: (name: string) => void;
  email: string;
  setEmail: (email: string) => void;
  submitting: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  designation: string;
  setDesignation: (designation: string) => void;
  mobileNumber: string;
  setMobileNumber: (number: string) => void;
}) {
  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <TeamAddUserFields
        name={name}
        email={email}
        setName={setName}
        setEmail={setEmail}
        submitting={submitting}
        designation={designation}
        setDesignation={setDesignation}
        mobileNumber={mobileNumber}
        setMobileNumber={setMobileNumber}
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
