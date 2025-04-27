
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Outlet } from "react-router-dom";
import { Building } from "lucide-react";

export function InvestorLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />
      <main className="pt-16 pl-64 min-h-screen">
        <div className="container mx-auto p-6">
          <div className="mb-4 flex items-center">
            <div className="rounded-md bg-blue-100 p-2 mr-2">
              <Building className="h-4 w-4 text-blue-800" />
            </div>
            <h2 className="text-lg font-medium">Investor Portal</h2>
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
