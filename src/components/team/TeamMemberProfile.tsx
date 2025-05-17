
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface TeamMemberProfileProps {
  name: string;
  designation?: string;
  email: string;
  mobileNumber?: string;
  isActive: boolean;
  onStatusChange: (status: boolean) => void;
}

export function TeamMemberProfile({
  name,
  designation,
  email,
  mobileNumber,
  isActive,
  onStatusChange,
}: TeamMemberProfileProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <h3 className="font-semibold text-lg">{name}</h3>
          <p className="text-muted-foreground">{designation}</p>
        </div>
        <div className="pt-2">
          <p className="text-sm"><span className="font-medium">Email:</span> {email}</p>
          {mobileNumber && (
            <p className="text-sm"><span className="font-medium">Mobile:</span> {mobileNumber}</p>
          )}
        </div>
        <div className="pt-4 flex items-center space-x-2">
          <Switch
            id="user-active"
            checked={isActive}
            onCheckedChange={onStatusChange}
          />
          <Label htmlFor="user-active" className="cursor-pointer">
            {isActive ? "Active" : "Inactive"}
          </Label>
          <span className={`ml-2 inline-block w-2 h-2 rounded-full ${isActive ? "bg-green-500" : "bg-gray-300"}`}></span>
        </div>
      </CardContent>
    </Card>
  );
}
