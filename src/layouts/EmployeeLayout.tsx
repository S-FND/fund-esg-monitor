
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Outlet } from "react-router-dom";
import { UserRound } from "lucide-react";

export function EmployeeLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />
      <main className="pt-16 pl-64 min-h-screen">
        <div className="container mx-auto p-6">
          <div className="mb-4 flex items-center">
            <div className="rounded-md bg-green-100 p-2 mr-2">
              <UserRound className="h-4 w-4 text-green-800" />
            </div>
            <h2 className="text-lg font-medium">Employee Portal</h2>
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
