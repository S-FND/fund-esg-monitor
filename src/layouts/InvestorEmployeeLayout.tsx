
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Outlet } from "react-router-dom";

export function InvestorEmployeeLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />
      <main className="pt-16 pl-64 min-h-screen">
        <div className="container mx-auto p-6">
          <div className="mb-4 p-2 bg-green-100 text-green-800 rounded-md">
            <p className="text-sm font-medium">Investor Employee View</p>
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
