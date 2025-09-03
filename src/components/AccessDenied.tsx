import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Shield } from "lucide-react";
import { useAccessControl } from "@/contexts/AccessControlContext";
import { useAuth } from "@/contexts/AuthContext";

export function AccessDenied() {
  const { accessStatus, requestAccess, isDemoMode, enableDemoMode } = useAccessControl();
  const { signOut } = useAuth();

  const renderContent = () => {
    switch (accessStatus) {
      case 'pending':
        return (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-6 w-6 text-orange-500" />
              <CardTitle>Access Request Pending</CardTitle>
            </div>
            <CardDescription className="mb-6">
              Your access request has been submitted and is currently under review. 
              You will be notified once your company has been approved.
            </CardDescription>
            <div className="space-y-3">
              <Button onClick={signOut} variant="outline" className="w-full">
                Sign Out
              </Button>
            </div>
          </>
        );
      
      case 'denied':
        return (
          <>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <CardTitle>Access Denied</CardTitle>
            </div>
            <CardDescription className="mb-6">
              Unfortunately, your company does not have access to this application. 
              Please contact your administrator for more information.
            </CardDescription>
            <div className="space-y-3">
              <Button onClick={signOut} variant="outline" className="w-full">
                Sign Out
              </Button>
            </div>
          </>
        );
      
      default:
        return (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-6 w-6 text-blue-500" />
              <CardTitle>Company Access Required</CardTitle>
            </div>
            <CardDescription className="mb-6">
              This application is restricted to registered companies only. 
              Please request access for your company to continue.
            </CardDescription>
            <div className="space-y-3">
              <Button onClick={requestAccess} className="w-full">
                Request Company Access
              </Button>
              <Button onClick={signOut} variant="outline" className="w-full">
                Sign Out
              </Button>
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {renderContent()}
        </CardHeader>
        
        {!isDemoMode && (
          <CardContent className="border-t pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">
                For demonstration purposes only:
              </p>
              <Button 
                onClick={enableDemoMode} 
                variant="secondary" 
                size="sm"
                className="w-full"
              >
                Enable Demo Mode
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}