
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ModuleAccessRights } from "./ModuleAccessRights";

interface AccessRight {
  moduleName: string;
  level: "read" | "write" | "admin" | "none";
}

interface NavigationItem {
  title: string;
  href: string;
  isParent: boolean;
  subItems: {
    title: string;
    href: string;
  }[];
}

interface AccessRightsPanelProps {
  accessRights: AccessRight[];
  allNavItems: NavigationItem[];
  accessLevels: { value: string; label: string }[];
  onAccessChange: (moduleName: string, level: "read" | "write" | "admin" | "none") => void;
  onSave: () => void;
}

export function AccessRightsPanel({
  accessRights,
  allNavItems,
  accessLevels,
  onAccessChange,
  onSave,
}: AccessRightsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Access Rights</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {allNavItems.map((item) => {
            const currentAccess = accessRights.find(r => r.moduleName === item.title)?.level || "none";
            
            const subItemsProps = item.subItems && item.subItems.map(subItem => {
              const subItemAccess = accessRights.find(r => r.moduleName === subItem.title)?.level || "none";
              return {
                title: subItem.title,
                currentAccess: subItemAccess,
                onAccessChange: (value: "read" | "write" | "admin" | "none") => onAccessChange(subItem.title, value)
              };
            });
            
            return (
              <ModuleAccessRights
                key={item.title}
                title={item.title}
                currentAccess={currentAccess}
                onAccessChange={(level) => onAccessChange(item.title, level)}
                accessLevels={accessLevels}
                subItems={subItemsProps}
              />
            );
          })}

          <div className="flex justify-end mt-6">
            <Button onClick={onSave}>Save Access Rights</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
