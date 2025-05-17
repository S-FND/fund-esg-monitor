
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface AccessLevel {
  value: string;
  label: string;
}

interface ModuleAccessRightsProps {
  title: string;
  currentAccess: "read" | "write" | "admin" | "none";
  onAccessChange: (value: "read" | "write" | "admin" | "none") => void;
  accessLevels: AccessLevel[];
  subItems?: {
    title: string;
    currentAccess: "read" | "write" | "admin" | "none";
    onAccessChange: (value: "read" | "write" | "admin" | "none") => void;
  }[];
}

export function ModuleAccessRights({
  title,
  currentAccess,
  onAccessChange,
  accessLevels,
  subItems,
}: ModuleAccessRightsProps) {
  return (
    <div className="p-4 border rounded-md space-y-4">
      <div className="font-medium border-b pb-2">{title}</div>
      
      <div>
        <RadioGroup 
          value={currentAccess} 
          onValueChange={(value) => onAccessChange(value as "read" | "write" | "admin" | "none")}
          className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4"
        >
          {accessLevels.map((level) => (
            <div key={level.value} className="flex items-center space-x-2">
              <RadioGroupItem value={level.value} id={`${title}-${level.value}`} />
              <Label htmlFor={`${title}-${level.value}`} className="text-sm">
                {level.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      
      {subItems && subItems.length > 0 && (
        <div className="pl-6 space-y-4 border-l-2 border-gray-200 mt-2">
          {subItems.map((subItem) => (
            <div key={subItem.title} className="p-2 bg-gray-50 rounded-md">
              <div className="text-sm font-medium mb-2">{subItem.title}</div>
              <RadioGroup 
                value={subItem.currentAccess} 
                onValueChange={(value) => subItem.onAccessChange(value as "read" | "write" | "admin" | "none")}
                className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4"
              >
                {accessLevels.map((level) => (
                  <div key={level.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={level.value} id={`${subItem.title}-${level.value}`} />
                    <Label htmlFor={`${subItem.title}-${level.value}`} className="text-xs">
                      {level.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
